// scripts/tools/cookie-auditor.js

import { auditHar } from './har-auditor.js';

const KNOWN_TRACKING_COOKIES = ['_ga', '_gid', '_fbp', '_fbc', 'fr', '_gcl_aw', '__utma', 'DSID', 'IDE', 'NID'];

const VENDOR_MAP = {
  '_ga':    'Google Analytics 4',
  '_gid':   'Google Analytics 4',
  '_fbp':   'Meta (Facebook) Pixel',
  '_fbc':   'Meta (Facebook) Pixel',
  'fr':     'Meta (Facebook)',
  '_gcl_aw':'Google Ads (click ID)',
  'IDE':    'Google Ads / DoubleClick',
  'DSID':   'Google Ads / DoubleClick',
  'NID':    'Google (identity)',
  '__utma': 'Google Analytics (Universal — deprecated)',
};

export function auditCookies(har) {
  const base = auditHar(har);
  const cookies = base.summary?.cookiesSet ?? [];
  const issues = [];

  for (const cookie of cookies) {
    if (!cookie.secure) {
      issues.push({
        severity: 'warning',
        category: 'Cookie Security',
        title: `Cookie "${cookie.name}" missing Secure flag`,
        detail: `Set by ${cookie.domain}`,
        fix: 'Ensure all cookies are set with the Secure flag to prevent transmission over HTTP.',
      });
    }

    // Fix 5: SameSite=None without Secure
    if (cookie.sameSite === 'None' && !cookie.secure) {
      issues.push({
        severity: 'error',
        category: 'Cookie Security',
        title: `SameSite=None cookie missing Secure flag`,
        detail: `Cookie "${cookie.name}" is set with SameSite=None but without the Secure attribute. Browsers will reject this cookie entirely.`,
        fix: 'Add the Secure attribute to all SameSite=None cookies.',
      });
    }

    // Fix 4: vendor-specific tracking cookie issues
    if (KNOWN_TRACKING_COOKIES.some(k => cookie.name.startsWith(k))) {
      const match = KNOWN_TRACKING_COOKIES.find(k => cookie.name.startsWith(k));
      const vendor = VENDOR_MAP[match] || 'Third-party tracker';
      issues.push({
        severity: 'warning',
        category: 'Consent',
        title: `Tracking cookie detected: ${cookie.name}`,
        vendor,
        detail: `"${cookie.name}" is a ${vendor} cookie. It requires user consent under GDPR/CCPA before being set.`,
        fix: 'Verify this cookie is only set after user consent is granted. If using GTM, implement Consent Mode v2.',
      });
    }

    // Fix 2: HTTP-only carve-out for all known tracking cookies
    if (!cookie.httpOnly && !KNOWN_TRACKING_COOKIES.some(k => cookie.name.startsWith(k))) {
      issues.push({
        severity: 'info',
        category: 'Cookie Security',
        title: `Cookie "${cookie.name}" missing HttpOnly flag`,
        detail: `Set by ${cookie.domain}`,
        fix: 'Add HttpOnly flag to cookies that do not need JavaScript access to reduce XSS exposure.',
      });
    }
  }

  // Fix 7: cookie lifetime check
  const now = Date.now();
  const thirteenMonthsMs = 13 * 30 * 24 * 60 * 60 * 1000;
  for (const cookie of cookies) {
    if (cookie.expires && (new Date(cookie.expires).getTime() - now) > thirteenMonthsMs) {
      issues.push({
        severity: 'warning',
        category: 'Consent',
        title: `Cookie lifetime exceeds 13 months`,
        detail: `"${cookie.name}" is set to expire on ${new Date(cookie.expires).toLocaleDateString()}, exceeding the 13-month maximum recommended by GDPR guidance.`,
        fix: 'Configure the cookie max-age or expires to 13 months or less.',
      });
    }
  }

  // Fix 6: consent timing info note
  issues.push({
    severity: 'info',
    category: 'Consent',
    title: 'Consent timing cannot be verified from HAR alone',
    detail: 'A HAR file captures network state but cannot confirm whether cookies were set before or after user consent was obtained. Manual verification is required.',
    fix: 'Use your CMP\'s audit log or a consent testing tool to verify pre/post-consent cookie behavior.',
  });

  const uniqueDomains = [...new Set(cookies.map(c => c.domain))];
  const trackingCookieCount = cookies.filter(c => KNOWN_TRACKING_COOKIES.some(k => c.name.startsWith(k))).length;

  // Fix 1: strip cookie values from cookieList
  const cookieList = cookies.map(({ name, domain, secure, httpOnly, sameSite, expires }) =>
    ({ name, domain, secure, httpOnly, sameSite, expires })
  );

  return {
    tool: 'cookie-auditor',
    status: issues.filter(i => i.severity === 'error' || i.severity === 'critical').length > 0 ? 'error'
          : issues.length > 0 ? 'warning'
          : 'pass',
    issues: issues.sort(bySeverity),
    summary: { totalCookies: cookies.length, uniqueDomains, trackingCookieCount, cookieList },
    // Fix 3: tracking threshold lowered to >= 4
    recommendations: [
      'Implement Google Consent Mode v2 to manage analytics consent properly.',
      'Audit all third-party cookies annually as regulations evolve.',
      trackingCookieCount >= 4 ? 'High number of tracking cookies detected. Review with legal/privacy team.' : null,
    ].filter(Boolean),
  };
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return auditCookies(data); }
