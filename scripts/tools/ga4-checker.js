// scripts/tools/ga4-checker.js

export function checkGa4Config(config) {
  const issues = [];
  const {
    measurementId,
    keyEvents = [],
    internalTrafficFilterEnabled,
    googleSignalsEnabled,
    dataRetentionMonths,
    streams = [],
    debugModeActive,
  } = config;

  const normalizedId = (measurementId ?? '').trim().toUpperCase();

  if (!normalizedId) {
    issues.push({
      severity: 'critical',
      category: 'Configuration',
      title: 'No Measurement ID provided',
      detail: 'A Measurement ID is required for GA4 to collect data.',
      fix: 'Find your Measurement ID in GA4 Admin → Data Streams → select stream → Measurement ID (format: G-XXXXXXXXXX).',
    });
  } else if (!/^G-[A-Z0-9]{6,}$/.test(normalizedId)) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Measurement ID format looks wrong',
      detail: `Got: ${normalizedId}. Expected format: G-XXXXXXXXXX`,
      fix: 'Double-check the Measurement ID in GA4. Ensure no spaces or extra characters.',
    });
  }

  if (!keyEvents.length) {
    issues.push({
      severity: 'warning',
      category: 'Events',
      title: 'No key events configured',
      detail: 'No key events listed.',
      fix: 'Mark your most important events as Key Events in GA4 Admin → Events → toggle Key Event.',
    });
  }

  if (internalTrafficFilterEnabled === false) {
    issues.push({
      severity: 'warning',
      category: 'Data Quality',
      title: 'Internal traffic filter not enabled',
      detail: 'Internal traffic may be inflating your data.',
      fix: 'Set up an internal traffic filter in GA4 Admin → Data Streams → Configure tag settings → Define internal traffic.',
    });
  }

  if (dataRetentionMonths === '2' || dataRetentionMonths === 2) {
    issues.push({
      severity: 'warning',
      category: 'Data Retention',
      title: 'Data retention set to 2 months',
      detail: 'Default 2-month retention limits historical analysis.',
      fix: 'Extend to 14 months in GA4 Admin → Data Settings → Data Retention.',
    });
  }

  if (debugModeActive) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Debug mode is active',
      detail: 'Debug mode can exclude data from standard reports.',
      fix: 'Disable debug mode in production. Remove the debug_mode parameter from your GA4 configuration tag.',
    });
  }

  if (streams.length > 3) {
    issues.push({
      severity: 'info',
      category: 'Configuration',
      title: `${streams.length} data streams configured`,
      detail: 'Large number of streams can complicate data reconciliation.',
      fix: 'Ensure each stream serves a distinct purpose and has correct filters applied.',
    });
  }

  if (streams.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'Configuration',
      title: 'No data streams configured',
      detail: 'No data streams were provided. GA4 requires at least one web or app stream to collect data.',
      fix: 'Add your stream in GA4 Admin → Data Streams.',
    });
  }

  if (!googleSignalsEnabled) {
    issues.push({
      severity: 'info',
      category: 'Configuration',
      title: 'Google Signals not enabled',
      detail: 'Google Signals enables cross-device reporting and demographics.',
      fix: 'Enable in GA4 Admin → Data Settings → Data Collection → Google Signals if your consent policy allows.',
    });
  }

  return {
    tool: 'ga4-checker',
    status: issues.filter(i => i.severity === 'critical' || i.severity === 'error').length > 0 ? 'error'
          : issues.length > 0 ? 'warning'
          : 'pass',
    issues: issues.sort(bySeverity),
    summary: {
      'Measurement ID': normalizedId || '(not set)',
      'Key Events': keyEvents.length,
      'Data Streams': streams.length,
    },
    recommendations: buildGa4Recommendations(issues),
  };
}

function buildGa4Recommendations(issues) {
  const recs = [];
  if (issues.some(i => i.category === 'Data Quality')) recs.push('Data quality issues detected. Address internal traffic filtering before trusting report numbers.');
  if (issues.some(i => i.category === 'Data Retention')) recs.push('Extend data retention to 14 months to enable year-over-year analysis.');
  if (issues.some(i => i.category === 'Configuration' && (i.severity === 'critical' || i.severity === 'error'))) recs.push('Address critical configuration issues before using this GA4 property for reporting.');
  if (issues.some(i => i.title.includes('Debug mode'))) recs.push('Disable debug_mode in your GA4 configuration tag before production release.');
  if (issues.some(i => i.title.includes('stream'))) recs.push('Configure at least one data stream in GA4 Admin to begin collecting data.');
  return recs;
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return checkGa4Config(data); }
