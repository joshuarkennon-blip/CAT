// scripts/tools/discrepancy.js

// Coerce anything to a finite number; non-finite (NaN, null, undefined, '', 'oops') => 0.
function num(v) {
  const n = +v;
  return Number.isFinite(n) ? n : 0;
}

// Distinguish "user didn't fill it in" (null/undefined/'' / NaN-parsing) from "user typed 0".
function isProvided(v) {
  if (v === null || v === undefined || v === '') return false;
  if (typeof v === 'number' && !Number.isFinite(v)) return false; // NaN, +/-Infinity
  if (typeof v === 'string' && !Number.isFinite(+v)) return false; // 'oops'
  return true;
}

export function analyzeDiscrepancy(data = {}) {
  const issues = [];

  // Track whether CRM was provided BEFORE coercion so blank/NaN keeps "not tracked" semantics.
  const crmProvided = isProvided(data.crmLeads);

  // Raw (pre-sanitize) values for negative-input detection.
  const rawGa4Conv = num(data.ga4Conversions);
  const rawAdsConv = num(data.adsConversions);
  const rawCrm = crmProvided ? num(data.crmLeads) : 0;
  const rawGa4Sess = num(data.ga4Sessions);
  const rawAdsSess = num(data.adsSessions);

  const anyNegative =
    rawGa4Conv < 0 || rawAdsConv < 0 || rawCrm < 0 || rawGa4Sess < 0 || rawAdsSess < 0;

  // Sanitize to non-negative — negative counts are physically meaningless.
  const ga4Conversions = Math.abs(rawGa4Conv);
  const adsConversions = Math.abs(rawAdsConv);
  const crmLeads = Math.abs(rawCrm);
  const ga4Sessions = Math.abs(rawGa4Sess);
  const adsSessions = Math.abs(rawAdsSess);
  const autoTaggingEnabled = data.autoTaggingEnabled === true;

  if (anyNegative) {
    issues.push({
      severity: 'info',
      category: 'Input',
      title: 'Negative input values detected',
      detail: 'One or more inputs were negative. Conversion, session, and lead counts cannot be negative; absolute values were used for analysis.',
      fix: 'Re-check the source export. A negative count usually means a column was misaligned, a formula subtracted in the wrong direction, or a delta was pasted instead of a total.',
    });
  }

  // Pragmatic CRM "is this really tracked?" check:
  // - If user explicitly left it blank/NaN -> not tracked.
  // - If user typed 0 BUT GA4 and Ads both report non-zero conversions, treat 0 as
  //   "skipped/not tracked" rather than a true zero (a real outage would be flagged elsewhere).
  const crmTracked =
    crmProvided && !(crmLeads === 0 && ga4Conversions > 0 && adsConversions > 0);

  // All-zero short-circuit — first check, supersedes all later issues.
  const allZero =
    ga4Sessions === 0 &&
    adsSessions === 0 &&
    ga4Conversions === 0 &&
    adsConversions === 0 &&
    (!crmProvided || crmLeads === 0);

  if (allZero) {
    issues.push({
      severity: 'error',
      category: 'No Data',
      title: 'All inputs are zero — possible tracking failure',
      detail: 'Every metric is zero. This likely indicates a tracking outage, wrong date range, or misconfigured data pull.',
      fix: 'Verify tags are firing, check the date range, and confirm data exports are correctly configured.',
    });
  }

  // --- Conversion gap (GA4 vs Ads) ---
  const convDiff = Math.abs(ga4Conversions - adsConversions);
  // Use max as denominator so it works even when GA4 is 0 but Ads isn't.
  const convDenom = Math.max(ga4Conversions, adsConversions);
  const convPct = convDenom > 0 ? parseFloat(((convDiff / convDenom) * 100).toFixed(1)) : 0;

  if (!allZero && convPct > 10) {
    // Auto-tagging off + conversion gap = very likely root cause -> escalate.
    const severity = !autoTaggingEnabled ? 'error' : (convPct > 25 ? 'error' : 'warning');
    issues.push({
      severity,
      category: 'Conversion Mismatch',
      title: `GA4 vs Ads conversion gap: ${convPct}%`,
      detail: `GA4 reports ${ga4Conversions} conversions. Google Ads reports ${adsConversions}.${
        !autoTaggingEnabled ? ' Auto-tagging is disabled, which is a common root cause.' : ''
      }`,
      fix: 'Common causes: (1) Different attribution windows — confirm GA4 uses the same window as Ads. (2) Cross-device conversions counted differently. (3) Smart bidding using modeled conversions. (4) Auto-tagging disabled so GCLID is not passing through.',
    });
  }

  // --- CRM reconciliation (only if CRM tracking signal is present) ---
  if (!allZero && crmTracked) {
    if (crmLeads === 0 && ga4Conversions > 0) {
      issues.push({
        severity: 'error',
        category: 'CRM Mismatch',
        title: 'GA4 reports conversions but CRM shows 0 leads',
        detail: `GA4 reports ${ga4Conversions} conversions but CRM has no matching leads.`,
        fix: 'Verify form submissions are reaching the CRM. Check for integration failures, spam filtering, or webhook errors.',
      });
    } else if (ga4Conversions > 0) {
      const crmDiff = Math.abs(ga4Conversions - crmLeads);
      const crmDenom = Math.max(ga4Conversions, crmLeads);
      const crmPct = crmDenom > 0 ? parseFloat(((crmDiff / crmDenom) * 100).toFixed(1)) : 0;
      if (crmPct > 15) {
        issues.push({
          severity: 'warning',
          category: 'CRM Mismatch',
          title: `GA4 vs CRM lead gap: ${crmPct}%`,
          detail: `GA4 reports ${ga4Conversions} conversions. CRM shows ${crmLeads} leads.`,
          fix: 'Common causes: (1) Form submissions tracked but not all qualify as CRM leads. (2) Spam or bot submissions inflating GA4. (3) CRM deduplication removing duplicates GA4 counted. (4) Time-zone differences in reporting windows.',
        });
      }
    }
  }

  // --- Sessions vs clicks ---
  let sessPct = 0;
  if (!allZero && (adsSessions > 0 || ga4Sessions > 0)) {
    if (ga4Sessions === 0 && adsSessions > 0) {
      issues.push({
        severity: 'error',
        category: 'Session Mismatch',
        title: 'GA4 reports 0 sessions but Ads reports clicks',
        detail: `Ads reports ${adsSessions} clicks but GA4 has no matching sessions. Note: GA4 sessions and Ads clicks are not 1:1 — Ads counts every click, GA4 counts sessions which may merge multiple clicks or split a single click across visits — but zero sessions against positive clicks indicates a tracking failure rather than a definition gap.`,
        fix: 'Check that the GA4 tag is firing. Verify auto-tagging is enabled and that the GA4 property is linked to the Ads account.',
      });
    } else {
      const sessDiff = Math.abs(ga4Sessions - adsSessions);
      const sessDenom = Math.max(ga4Sessions, adsSessions);
      sessPct = sessDenom > 0 ? parseFloat(((sessDiff / sessDenom) * 100).toFixed(1)) : 0;
      if (sessPct > 10) {
        const severity = !autoTaggingEnabled ? 'error' : 'warning';
        issues.push({
          severity,
          category: 'Session Mismatch',
          title: `Session vs click gap: ${sessPct}%`,
          detail: `GA4 reports ${ga4Sessions} sessions. Ads reports ${adsSessions} clicks. Sessions and clicks are not the same metric by definition — Ads counts every click while GA4 groups activity into sessions (multiple clicks can collapse into one session, and a single click can span sessions across a 30-minute timeout). Some gap is expected; large gaps usually indicate a tracking or auto-tagging problem.${
            !autoTaggingEnabled ? ' Auto-tagging is disabled, which is the most common cause.' : ''
          }`,
          fix: 'Check attribution windows, ad-click deduplication, and confirm auto-tagging is enabled. Also verify the landing pages have the GA4 tag installed.',
        });
      }
    }
  }

  // --- Auto-tagging configuration ---
  if (!autoTaggingEnabled) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Auto-tagging disabled',
      detail: 'Without auto-tagging, GA4 cannot import Google Ads data correctly. This is a frequent root cause of conversion and session discrepancies.',
      fix: 'Enable auto-tagging in Google Ads: Settings → Account Settings → Auto-tagging → Yes.',
    });
  }

  // --- Status: all-zeros must NOT be 'pass'. ---
  const hasError = issues.some(i => i.severity === 'error');
  const hasWarning = issues.some(i => i.severity === 'warning');
  let status;
  if (allZero) status = hasError ? 'error' : 'warning';
  else if (hasError) status = 'error';
  else if (hasWarning) status = 'warning';
  else status = 'pass';

  const summary = {
    'GA4 Conversions': ga4Conversions,
    'Ads Conversions': adsConversions,
    'CRM Leads': crmTracked ? crmLeads : 'N/A',
    'Conversion Δ': `${convPct}%`,
    'Session Δ': `${sessPct}%`,
    'Auto-tagging': autoTaggingEnabled ? 'Enabled' : 'Disabled',
  };

  return {
    tool: 'discrepancy',
    status,
    summary,
    issues: issues.sort(bySeverity),
    recommendations: buildDiscrepancyRecs(issues),
  };
}

function buildDiscrepancyRecs(issues) {
  const recs = [];
  // Configuration first — fixing tracking invalidates everything else.
  if (issues.some(i => i.category === 'Configuration')) {
    recs.push('Fix tracking configuration issues before interpreting discrepancy data — auto-tagging problems invalidate cross-platform comparisons.');
  }
  if (issues.some(i => i.category === 'No Data')) {
    recs.push('Re-pull the data with a known-good date range (e.g. last 7 days) and confirm at least one channel reports non-zero before re-running this check.');
  }
  if (issues.some(i => i.category === 'Conversion Mismatch')) {
    recs.push('Establish a single source of truth: GA4 for web conversions, CRM for pipeline. Document the expected variance and alert when it exceeds 15%.');
  }
  if (issues.some(i => i.category === 'Session Mismatch')) {
    recs.push('Treat GA4 sessions and Ads clicks as related-but-distinct metrics; a 5–10% gap is normal. Only investigate gaps above ~15% or when auto-tagging is off.');
  }
  if (issues.some(i => i.category === 'CRM Mismatch')) {
    recs.push('Consider adding a unique submission ID to form-tracking events so you can reconcile GA4 events with CRM records individually.');
  }
  if (issues.some(i => i.category === 'Input')) {
    recs.push('Sanity-check the raw data export — negative or non-numeric inputs were detected and coerced for this run.');
  }
  // Dedupe while preserving order.
  return Array.from(new Set(recs));
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return analyzeDiscrepancy(data); }
