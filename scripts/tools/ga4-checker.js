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

  if (!measurementId) {
    issues.push({
      severity: 'critical',
      category: 'Configuration',
      title: 'No Measurement ID provided',
      detail: 'A Measurement ID is required for GA4 to collect data.',
      fix: 'Find your Measurement ID in GA4 Admin → Data Streams → select stream → Measurement ID (format: G-XXXXXXXXXX).',
    });
  } else if (!/^G-[A-Z0-9]{6,}$/.test(measurementId.trim())) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Measurement ID format looks wrong',
      detail: `Got: ${measurementId}. Expected format: G-XXXXXXXXXX`,
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

  if (!internalTrafficFilterEnabled) {
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
      severity: 'warning',
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
    summary: { measurementId, keyEventCount: keyEvents.length, streamCount: streams.length },
    recommendations: buildGa4Recommendations(issues),
  };
}

function buildGa4Recommendations(issues) {
  const recs = [];
  if (issues.some(i => i.category === 'Data Quality')) recs.push('Data quality issues detected. Address internal traffic filtering before trusting report numbers.');
  if (issues.some(i => i.category === 'Data Retention')) recs.push('Extend data retention to 14 months to enable year-over-year analysis.');
  return recs;
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return checkGa4Config(data); }
