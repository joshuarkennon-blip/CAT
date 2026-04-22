// scripts/tools/discrepancy.js

export function analyzeDiscrepancy(data) {
  const issues = [];
  const { ga4Conversions, adsConversions, crmLeads, ga4Sessions, adsSessions, autoTaggingEnabled } = data;

  const convDiff = Math.abs((ga4Conversions ?? 0) - (adsConversions ?? 0));
  const convPct = ga4Conversions ? ((convDiff / ga4Conversions) * 100).toFixed(1) : null;

  if (convPct && parseFloat(convPct) > 10) {
    issues.push({
      severity: 'error',
      category: 'Conversion Mismatch',
      title: `GA4 vs Ads conversion gap: ${convPct}%`,
      detail: `GA4 reports ${ga4Conversions} conversions. Google Ads reports ${adsConversions}.`,
      fix: `Common causes: (1) Different attribution windows — check GA4 uses same window as Ads. (2) Auto-tagging ${autoTaggingEnabled ? 'enabled ✓' : 'disabled — enable this in Google Ads Settings'}. (3) Cross-device conversions counted differently. (4) Smart bidding using modeled conversions.`,
    });
  }

  if (crmLeads && ga4Conversions) {
    const crmDiff = Math.abs(ga4Conversions - crmLeads);
    const crmPct = ((crmDiff / ga4Conversions) * 100).toFixed(1);
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

  if (ga4Sessions && adsSessions) {
    const sessDiff = Math.abs(ga4Sessions - adsSessions);
    const sessPct = ((sessDiff / ga4Sessions) * 100).toFixed(1);
    if (parseFloat(sessPct) > 10) {
      issues.push({
        severity: 'warning',
        category: 'Session Mismatch',
        title: `GA4 vs Ads session gap: ${sessPct}%`,
        detail: `GA4 reports ${ga4Sessions} sessions. Ads reports ${adsSessions} clicks.`,
        fix: 'Clicks vs sessions will always differ. Common gaps: (1) Bots and invalid clicks filtered by Ads but counted by GA4. (2) Landing page redirects breaking session tracking. (3) Ad blockers preventing GA4 fire after click.',
      });
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
  return recs;
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return analyzeDiscrepancy(data); }
