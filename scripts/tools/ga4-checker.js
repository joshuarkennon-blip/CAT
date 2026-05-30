// scripts/tools/ga4-checker.js

// GA4 Measurement ID: literal "G-" + exactly 10 alphanumeric chars (e.g. G-ABCDEFGHIJ).
const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{10}$/;
// Google Tag (gtag) IDs use the GT- prefix; not a valid GA4 measurement ID.
const GOOGLE_TAG_ID = /^GT-[A-Z0-9]+$/;
// GTM container IDs use the GTM- prefix; not a valid GA4 measurement ID.
const GTM_CONTAINER_ID = /^GTM-[A-Z0-9]+$/;
// Universal Analytics (sunset 1 Jul 2024).
const UA_PROPERTY_ID = /^UA-[0-9]+-[0-9]+$/;

export function checkGa4Config(config = {}) {
  const issues = [];
  const {
    measurementId,
    keyEvents,
    internalTrafficFilterEnabled,
    googleSignalsEnabled,
    dataRetentionMonths,
    streams,
    debugModeActive,
  } = config;

  // Destructuring defaults only apply on `undefined`, not `null` — normalize explicitly.
  const safeKeyEvents = Array.isArray(keyEvents) ? keyEvents : [];
  // `streams` is left as-is (including undefined) so we can distinguish "not provided" from "provided empty".
  const streamsProvided = Array.isArray(streams);
  const safeStreams = streamsProvided ? streams : [];

  const normalizedId = (measurementId ?? '').trim().toUpperCase();

  if (!normalizedId) {
    issues.push({
      severity: 'critical',
      category: 'Configuration',
      title: 'No Measurement ID provided',
      detail: 'A Measurement ID is required for GA4 to collect data.',
      fix: 'Find your Measurement ID in GA4 Admin → Data Streams → select stream → Measurement ID (format: G-XXXXXXXXXX).',
    });
  } else if (UA_PROPERTY_ID.test(normalizedId)) {
    issues.push({
      severity: 'critical',
      category: 'Configuration',
      title: 'Universal Analytics ID provided, not GA4',
      detail: `Got: ${normalizedId}. Universal Analytics was sunset on 1 July 2024 and no longer collects data.`,
      fix: 'Create a GA4 property and use its Measurement ID (format: G-XXXXXXXXXX) from GA4 Admin → Data Streams.',
    });
  } else if (GTM_CONTAINER_ID.test(normalizedId)) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'GTM container ID provided, not a GA4 Measurement ID',
      detail: `Got: ${normalizedId}. GTM- IDs identify a Google Tag Manager container, not a GA4 property.`,
      fix: 'In GA4 Admin → Data Streams → select your stream, copy the Measurement ID (format: G-XXXXXXXXXX) and use that here.',
    });
  } else if (GOOGLE_TAG_ID.test(normalizedId)) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Google Tag ID provided, not a GA4 Measurement ID',
      detail: `Got: ${normalizedId}. GT- IDs identify a Google Tag (gtag.js), which may route to GA4 but is not itself a Measurement ID.`,
      fix: 'In Google Tag → Admin → connected destinations (or GA4 Admin → Data Streams), find the linked GA4 Measurement ID (format: G-XXXXXXXXXX) and use that.',
    });
  } else if (!GA4_MEASUREMENT_ID.test(normalizedId)) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      title: 'Measurement ID format looks wrong',
      detail: `Got: ${normalizedId}. Expected format: G-XXXXXXXXXX (G- followed by exactly 10 alphanumeric characters).`,
      fix: 'Double-check the Measurement ID in GA4 Admin → Data Streams. Ensure no spaces or extra characters.',
    });
  }

  if (!safeKeyEvents.length) {
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
  } else if (internalTrafficFilterEnabled === undefined || internalTrafficFilterEnabled === null) {
    issues.push({
      severity: 'info',
      category: 'Data Quality',
      title: 'Internal traffic filter status unknown',
      detail: 'You did not indicate whether an internal traffic filter is configured.',
      fix: 'Check GA4 Admin → Data Streams → Configure tag settings → Define internal traffic. Then re-run this check with that answer.',
    });
  }

  // Data retention: 14 months is the recommended ceiling on the free tier. 2 months is the default and limits YoY analysis.
  if (dataRetentionMonths === '' || dataRetentionMonths === undefined || dataRetentionMonths === null) {
    issues.push({
      severity: 'warning',
      category: 'Data Retention',
      title: 'Data retention not configured',
      detail: 'No data retention setting was provided.',
      fix: 'Check GA4 Admin → Data Settings → Data Retention and set User and event data retention to 14 months.',
    });
  } else {
    const retentionMonths = Number(dataRetentionMonths);
    if (retentionMonths === 2) {
      issues.push({
        severity: 'warning',
        category: 'Data Retention',
        title: 'Data retention set to 2 months',
        detail: 'Default 2-month retention limits historical analysis.',
        fix: 'Extend to 14 months in GA4 Admin → Data Settings → Data Retention.',
      });
    } else if (retentionMonths !== 14 && Number.isFinite(retentionMonths)) {
      issues.push({
        severity: 'warning',
        category: 'Data Retention',
        title: `Unusual data retention value: ${dataRetentionMonths} months`,
        detail: 'GA4 free-tier retention is typically 2 or 14 months; 360 properties support longer windows.',
        fix: 'Confirm this is intentional in GA4 Admin → Data Settings → Data Retention. Most accounts should choose 14 months.',
      });
    } else if (!Number.isFinite(retentionMonths)) {
      issues.push({
        severity: 'warning',
        category: 'Data Retention',
        title: 'Data retention value not recognized',
        detail: `Got: ${dataRetentionMonths}. Expected a number of months (commonly 2 or 14).`,
        fix: 'Re-check GA4 Admin → Data Settings → Data Retention and re-run with the displayed value.',
      });
    }
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

  // Only run stream checks if the form actually provided streams data — the homepage form always sends []
  // which would otherwise produce a noisy false-positive warning on every submission.
  if (streamsProvided && safeStreams.length > 0) {
    if (safeStreams.length > 3) {
      issues.push({
        severity: 'info',
        category: 'Configuration',
        title: `${safeStreams.length} data streams configured`,
        detail: 'Large number of streams can complicate data reconciliation.',
        fix: 'Ensure each stream serves a distinct purpose and has correct filters applied.',
      });
    }
  }

  if (googleSignalsEnabled === false) {
    issues.push({
      severity: 'info',
      category: 'Configuration',
      title: 'Google Signals not enabled',
      detail: 'Google Signals enables cross-device reporting and demographics.',
      fix: 'Enable in GA4 Admin → Data Settings → Data Collection → Google Signals if your consent policy allows.',
    });
  } else if (googleSignalsEnabled === undefined || googleSignalsEnabled === null) {
    issues.push({
      severity: 'info',
      category: 'Configuration',
      title: 'Google Signals status unknown',
      detail: 'You did not indicate whether Google Signals is enabled.',
      fix: 'Check GA4 Admin → Data Settings → Data Collection → Google Signals.',
    });
  }

  return {
    tool: 'ga4-checker',
    status: computeStatus(issues),
    issues: issues.sort(bySeverity),
    summary: {
      'Measurement ID': normalizedId || '(not set)',
      'Key Events': safeKeyEvents.length,
      'Data Streams': streamsProvided ? safeStreams.length : '(not provided)',
    },
    recommendations: buildGa4Recommendations(issues),
  };
}

function computeStatus(issues) {
  // Mirror the renderer's severity vocabulary: `critical` is a distinct top-level status.
  if (issues.some(i => i.severity === 'critical')) return 'critical';
  if (issues.some(i => i.severity === 'error')) return 'error';
  if (issues.length > 0) return 'warning';
  return 'pass';
}

function buildGa4Recommendations(issues) {
  const recs = [];
  if (issues.some(i => i.category === 'Data Quality' && i.severity === 'warning')) {
    recs.push('Data quality issues detected. Address internal traffic filtering before trusting report numbers.');
  }
  if (issues.some(i => i.category === 'Data Retention')) {
    recs.push('Extend data retention to 14 months to enable year-over-year analysis.');
  }
  if (issues.some(i => i.category === 'Configuration' && (i.severity === 'critical' || i.severity === 'error'))) {
    recs.push('Address critical configuration issues before using this GA4 property for reporting.');
  }
  if (issues.some(i => i.title.includes('Debug mode'))) {
    recs.push('Disable debug_mode in your GA4 configuration tag before production release.');
  }
  if (issues.some(i => i.title.toLowerCase().includes('no data streams'))) {
    recs.push('Configure at least one data stream in GA4 Admin to begin collecting data.');
  }
  // Dedupe by exact string while preserving order.
  return Array.from(new Set(recs));
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return checkGa4Config(data); }
