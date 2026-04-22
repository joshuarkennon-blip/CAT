// scripts/tools/har-auditor.js

export function auditHar(har) {
  const entries = har?.log?.entries ?? [];
  if (!entries.length) return errorReport('No entries found in HAR file.');

  const issues = [];
  const summary = {
    totalRequests: entries.length,
    totalSizeKB: 0,
    slowRequests: [],
    failedRequests: [],
    trackingScripts: [],
    duplicateRequests: [],
    largePayloads: [],
    redirectChains: [],
    cookiesSet: [],
    thirdPartyDomains: new Set(),
  };

  const urlCounts = {};

  for (const entry of entries) {
    const url = entry.request?.url ?? '';
    const status = entry.response?.status ?? 0;
    const time = entry.time ?? 0;
    const sizeBytes = entry.response?.content?.size ?? 0;
    const sizeKB = sizeBytes / 1024;
    const domain = safeHostname(url);

    summary.totalSizeKB += sizeKB;
    urlCounts[url] = (urlCounts[url] ?? 0) + 1;

    if (time > 2000) {
      summary.slowRequests.push({ url, time: Math.round(time), status });
      issues.push({
        severity: 'warning',
        category: 'Performance',
        title: 'Slow request detected',
        detail: `${truncateUrl(url)} took ${Math.round(time)}ms`,
        fix: 'Investigate server response time or asset size. Consider lazy loading or deferring this resource.',
      });
    }

    if (status >= 400 || status === 0) {
      summary.failedRequests.push({ url, status });
      issues.push({
        severity: status >= 500 ? 'critical' : 'error',
        category: 'Network',
        title: `Request failed (${status || 'blocked'})`,
        detail: truncateUrl(url),
        fix: status === 0
          ? 'Request was blocked — likely by an ad blocker or browser extension. Verify internal traffic filters.'
          : `Check server logs for ${status} error on this endpoint.`,
      });
    }

    if (sizeKB > 500) {
      summary.largePayloads.push({ url, sizeKB: Math.round(sizeKB) });
      issues.push({
        severity: 'warning',
        category: 'Performance',
        title: 'Large payload',
        detail: `${truncateUrl(url)} is ${Math.round(sizeKB)}KB`,
        fix: 'Consider compressing this asset or splitting it. Large payloads delay page load and can affect tracking accuracy.',
      });
    }

    if (status >= 300 && status < 400) {
      summary.redirectChains.push({ url, status });
      issues.push({
        severity: 'info',
        category: 'Network',
        title: `Redirect (${status})`,
        detail: truncateUrl(url),
        fix: 'Redirects add latency. If this is a tracking pixel or tag, ensure it resolves directly.',
      });
    }

    const trackers = detectTrackers(url);
    if (trackers.length) {
      summary.trackingScripts.push(...trackers.map(t => ({ name: t, url })));
    }

    summary.thirdPartyDomains.add(domain);

    const responseCookies = entry.response?.cookies ?? [];
    summary.cookiesSet.push(...responseCookies.map(c => ({
      name: c.name,
      domain: c.domain ?? domain,
      secure: c.secure,
      httpOnly: c.httpOnly,
    })));
  }

  for (const [url, count] of Object.entries(urlCounts)) {
    if (count > 1) {
      summary.duplicateRequests.push({ url, count });
      issues.push({
        severity: 'warning',
        category: 'Tracking',
        title: `Duplicate request (${count}x)`,
        detail: truncateUrl(url),
        fix: 'Duplicate requests can cause double-counting in analytics. Check tag firing triggers in GTM.',
      });
    }
  }

  summary.thirdPartyDomains = [...summary.thirdPartyDomains];
  summary.totalSizeKB = Math.round(summary.totalSizeKB);

  return {
    tool: 'har-auditor',
    status: issues.filter(i => i.severity === 'critical').length > 0 ? 'critical'
          : issues.filter(i => i.severity === 'error').length > 0 ? 'error'
          : issues.filter(i => i.severity === 'warning').length > 0 ? 'warning'
          : 'pass',
    summary,
    issues: issues.sort(bySeverity),
    recommendations: buildHarRecommendations(issues, summary),
  };
}

function detectTrackers(url) {
  const KNOWN = [
    ['Google Analytics / GA4', ['google-analytics.com', 'googletagmanager.com', 'gtm.js', 'analytics.js', 'gtag']],
    ['Google Ads', ['googleadservices.com', 'doubleclick.net', 'googlesyndication.com']],
    ['Meta Pixel', ['connect.facebook.net', 'fbevents.js']],
    ['LinkedIn Insight', ['snap.licdn.com', 'linkedin.com/px']],
    ['HotJar', ['hotjar.com', 'hj.js']],
    ['Segment', ['cdn.segment.com', 'analytics.min.js']],
    ['Intercom', ['widget.intercom.io']],
    ['Drift', ['js.driftt.com']],
    ['Heap', ['heapanalytics.com']],
    ['Mixpanel', ['cdn.mxpnl.com', 'mixpanel.com']],
  ];
  const found = [];
  for (const [name, patterns] of KNOWN) {
    if (patterns.some(p => url.includes(p))) found.push(name);
  }
  return found;
}

function buildHarRecommendations(issues, summary) {
  const recs = [];
  if (summary.slowRequests.length > 3) recs.push('Multiple slow requests detected. Audit third-party script load order and consider async/defer attributes.');
  if (summary.duplicateRequests.length > 0) recs.push('Duplicate requests present. Review GTM trigger conditions and ensure tags fire once per intended event.');
  if (summary.failedRequests.length > 0) recs.push('Failed requests detected. Verify no ad blockers are interfering and that all tag endpoints are correct.');
  if (summary.cookiesSet.filter(c => !c.secure).length > 0) recs.push('Some cookies are set without the Secure flag. Review cookie configuration for compliance.');
  if (summary.trackingScripts.length > 8) recs.push('High number of tracking scripts detected. Consolidate where possible to reduce page weight and load time.');
  return recs;
}

function safeHostname(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function truncateUrl(url, max = 80) {
  return url.length > max ? url.slice(0, max) + '…' : url;
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

function errorReport(message) {
  return {
    tool: 'har-auditor',
    status: 'error',
    issues: [{ severity: 'error', category: 'Input', title: 'Invalid input', detail: message, fix: 'Ensure you are exporting a valid HAR file from Chrome DevTools (Network tab → Export HAR).' }],
    summary: {},
    recommendations: [],
  };
}

export function run(data) { return auditHar(data); }
