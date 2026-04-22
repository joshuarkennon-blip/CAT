// scripts/tools/cookie-auditor.js

import { auditHar } from './har-auditor.js';

export function auditCookies(har) {
  const base = auditHar(har);
  const cookies = base.summary?.cookiesSet ?? [];
  const issues = [];

  const KNOWN_TRACKING_COOKIES = ['_ga', '_gid', '_fbp', '_fbc', 'fr', '_gcl_aw', '__utma', 'DSID', 'IDE', 'NID'];

  for (const cookie of cookies) {
    if (!cookie.secure) {
      issues.push({
        severity: 'warning',
        category: 'Security',
        title: `Cookie "${cookie.name}" missing Secure flag`,
        detail: `Set by ${cookie.domain}`,
        fix: 'Ensure all cookies are set with the Secure flag to prevent transmission over HTTP.',
      });
    }

    if (KNOWN_TRACKING_COOKIES.some(k => cookie.name.startsWith(k))) {
      issues.push({
        severity: 'warning',
        category: 'Consent',
        title: `Tracking cookie detected: ${cookie.name}`,
        detail: `Set by ${cookie.domain}. This is a known analytics/advertising cookie.`,
        fix: 'Verify this cookie is only set after user consent is granted. If using GTM, implement Consent Mode v2.',
      });
    }

    if (!cookie.httpOnly && !cookie.name.startsWith('_ga')) {
      issues.push({
        severity: 'info',
        category: 'Security',
        title: `Cookie "${cookie.name}" missing HttpOnly flag`,
        detail: `Set by ${cookie.domain}`,
        fix: 'Add HttpOnly flag to cookies that do not need JavaScript access to reduce XSS exposure.',
      });
    }
  }

  const uniqueDomains = [...new Set(cookies.map(c => c.domain))];
  const trackingCookieCount = cookies.filter(c => KNOWN_TRACKING_COOKIES.some(k => c.name.startsWith(k))).length;

  return {
    tool: 'cookie-auditor',
    status: issues.filter(i => i.severity === 'error' || i.severity === 'critical').length > 0 ? 'error'
          : issues.length > 0 ? 'warning'
          : 'pass',
    issues: issues.sort(bySeverity),
    summary: { totalCookies: cookies.length, uniqueDomains, trackingCookieCount, cookieList: cookies },
    recommendations: [
      'Implement Google Consent Mode v2 to manage analytics consent properly.',
      'Audit all third-party cookies annually as regulations evolve.',
      trackingCookieCount > 5 ? 'High number of tracking cookies detected. Review with legal/privacy team.' : null,
    ].filter(Boolean),
  };
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return auditCookies(data); }
