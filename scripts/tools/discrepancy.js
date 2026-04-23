// scripts/tools/discrepancy.js

export function analyzeDiscrepancy(data) {
  const issues = [];
  const { ga4Conversions, adsConversions, crmLeads, ga4Sessions, adsSessions, autoTaggingEnabled } = data;

  if (ga4Sessions === 0 && adsSessions === 0 && ga4Conversions === 0 && adsConversions === 0 && crmLeads === 0) {
    issues.push({
      severity: 'warning',
      category: 'No Data',
      title: 'All inputs are zero — possible tracking failure',
      detail: 'Every metric is zero. This likely indicates a tracking outage, wrong date range, or misconfigured data pull.',
      fix: 'Verify tags are firing, check the date range, and confirm data exports are correctly configured.',
    });
  }

  const convDiff = Math.abs((ga4Conversions ?? 0) - (adsConversions ?? 0));
  const convPct = ga4Conversions > 0 ? parseFloat(((convDiff / ga4Conversions) * 100).toFixed(1)) : 0;

  if (convPct > 10) {
    issues.push({
      severity: 'error',
      category: 'Conversion Mismatch',
      title: `GA4 vs Ads conversion gap: ${convPct}%`,
      detail: `GA4 reports ${ga4Conversions} conversions. Google Ads reports ${adsConversions}.`,
      fix: `Common causes: (1) Different attribution windows — check GA4 uses same window as Ads. (2) Cross-device conversions counted differently. (3) Smart bidding using modeled conversions.`,
    });
  }

  if (ga4Conversions > 0 || crmLeads > 0) {
    const denominator = ga4Conversions > 0 ? ga4Conversions : 1;
    if (crmLeads === 0 && ga4Conversions > 0) {
      issues.push({
        severity: 'error',
        category: 'CRM Mismatch',
        title: 'GA4 reports conversions but CRM shows 0 leads',
        detail: `GA4 reports ${ga4Conversions} conversions but CRM has no matching leads.`,
        fix: 'Verify form submissions are reaching the CRM. Check for integration failures, spam filtering, or webhook errors.',
      });
    } else {
      const crmDiff = Math.abs(ga4Conversions - crmLeads);
      const crmPct = ((crmDiff / denominator) * 100).toFixed(1);
      if (parseFloat(crmPct) > 15) {
        issues.push({
          severity: 'warning',
          category: 'CRM Mismatch',
          title: `GA4 vs CRM lead gap: ${crmPct}%`,
          detail: `GA4 reports ${ga4Conversions} conversions. CRM shows ${crmLeads} leads.`,
          fix: 'Common causes: (1) Form submissions tracked but not all qualify as CRM leads. (2) Spam or bot submissions inflating GA4. (3) CRM deduplication removing duplicates GA4 counted. (4) Time zone differences in reporting windows.',
        });
      }
    }
  }

  if (adsSessions > 0 || ga4Sessions > 0) {
    if (ga4Sessions === 0) {
      issues.push({
        severity: 'error',
        category: 'Session Mismatch',
        title: 'GA4 reports 0 sessions but Ads reports clicks',
        detail: `Ads reports ${adsSessions} clicks but GA4 has no matching sessions.`,
        fix: 'Check that the GA4 tag is firing correctly. Verify auto-tagging and tag implementation.',
      });
    } else {
      const sessDiff = Math.abs(ga4Sessions - adsSessions);
      const sessPct = parseFloat(((sessDiff / ga4Sessions) * 100).toFixed(1));
      if (sessPct > 10) {
        issues.push({
          severity: 'warning',
          category: 'Session Mismatch',
          title: `Session gap: ${sessPct}% difference`,
          detail: `GA4 reports ${ga4Sessions} sessions. Ads reports ${adsSessions} clicks. Note: sessions ≠ clicks by definition.`,
          fix: 'Check attribution windows, ad click deduplication, and whether auto-tagging is enabled.',
        });
      }
    }
  }

  if (!autoTaggingEnabled) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Auto-tagging disabled',
      detail: 'Without auto-tagging, GA4 cannot import Google Ads data correctly.',
      fix: 'Enable auto-tagging in Google Ads: Settings → Account Settings → Auto-tagging → Yes.',
    });
  }

  return {
    tool: 'discrepancy',
    status: issues.filter(i => i.severity === 'error').length > 0 ? 'error'
          : issues.length > 0 ? 'warning'
          : 'pass',
    issues: issues.sort(bySeverity),
    summary: { ga4Conversions, adsConversions, crmLeads, conversionGapPct: convPct },
    recommendations: buildDiscrepancyRecs(issues),
  };
}

function buildDiscrepancyRecs(issues) {
  const recs = [];
  if (issues.some(i => i.category === 'Conversion Mismatch')) recs.push('Establish a single source of truth: GA4 for web conversions, CRM for pipeline. Document the expected variance and alert when it exceeds 15%.');
  if (issues.some(i => i.category === 'CRM Mismatch')) recs.push('Consider adding a unique submission ID to form tracking events so you can reconcile GA4 events with CRM records individually.');
  if (issues.some(i => i.category === 'Configuration')) recs.push('Fix tracking configuration issues before interpreting discrepancy data — auto-tagging problems invalidate cross-platform comparisons.');
  return recs;
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return analyzeDiscrepancy(data); }
