// scripts/tools/cookie-auditor.js

import { auditHar } from './har-auditor.js';

// Exact names that identify well-known tracking / marketing cookies.
const KNOWN_TRACKING_COOKIES = [
  '_ga', '_gid', '_fbp', '_fbc', 'fr', '_gcl_aw', '__utma', 'DSID', 'IDE', 'NID',
  '_pin_unauth', 'tt_appInfo', 'ttwid', '_omappvp',
  '__hssc', '__hstc', 'hubspotutk',
  '_clck', '_clsk',
];

// Prefix matches — any cookie whose name starts with one of these is tracking.
// Each entry maps the prefix to a vendor label.
const TRACKING_PREFIXES = [
  { prefix: '_ga_',     vendor: 'Google Analytics 4 (stream)' },
  { prefix: '_uet',     vendor: 'Microsoft UET' },        // covers _uetsid, _uetvid
  { prefix: 'mp_',      vendor: 'Mixpanel' },
  { prefix: 'intercom-',vendor: 'Intercom' },
  { prefix: '_pk_',     vendor: 'Matomo' },
];

// Exact-name vendor map. Prefix-based vendors are resolved via TRACKING_PREFIXES.
const VENDOR_MAP = {
  '_ga':         'Google Analytics 4',
  '_gid':        'Google Analytics 4',
  '_fbp':        'Meta (Facebook) Pixel',
  '_fbc':        'Meta (Facebook) Pixel',
  'fr':          'Meta (Facebook)',
  '_gcl_aw':     'Google Ads (click ID)',
  'IDE':         'Google Ads / DoubleClick',
  'DSID':        'Google Ads / DoubleClick',
  'NID':         'Google (identity)',
  '__utma':      'Google Analytics (Universal — deprecated)',
  '_pin_unauth': 'Pinterest Tag',
  'tt_appInfo':  'TikTok Pixel',
  'ttwid':       'TikTok Pixel',
  '__hssc':      'HubSpot',
  '__hstc':      'HubSpot',
  'hubspotutk':  'HubSpot',
  '_clck':       'Microsoft Clarity',
  '_clsk':       'Microsoft Clarity',
  '_omappvp':    'OptinMonster',
};

// Common consent-cookie / CMP markers. Presence in a request Cookie header (or as
// a Set-Cookie) is a strong signal that consent state has been recorded.
const CONSENT_COOKIE_MARKERS = [
  'OptanonConsent',
  'OptanonAlertBoxClosed',
  'cookieyes-consent',
  'consentmgr',
  'OneTrust',
  'CookieConsent',
  'euconsent-v2',
  '__cf_bm', // Cloudflare bot mgmt — often coincident with CMP; treated as a benign marker here.
];

// Names / patterns that legitimately need HttpOnly because they look like session / auth.
const SESSION_AUTH_PATTERNS = [
  /session/i,
  /\bsid\b/i,
  /auth/i,
  /token/i,
  /^JSESSIONID$/,
  /^PHPSESSID$/i,
  /^ASPSESSIONID/i,
  /^ASP\.NET_SessionId$/i,
  /^connect\.sid$/i,
];

export function auditCookies(har) {
  const base = auditHar(har);
  const cookies = Array.isArray(base?.summary?.cookiesSet) ? base.summary.cookiesSet : [];

  // Derive context from the source HAR (defensively — `har` may be a string).
  const ctx = extractContext(har);
  const firstUrl = ctx.firstUrl;
  const pageIsHttps = typeof firstUrl === 'string' && firstUrl.startsWith('https://');
  const pageRoot = stripSubdomain(safeHostname(firstUrl));
  const consentSetAtMs = ctx.consentSetAtMs; // null if no CMP marker was seen
  const trackerFirstSeenMs = ctx.trackerFirstSeenMs; // {name: firstMs}

  // Dedupe key per cookie name + domain so the same cookie surfaced by multiple
  // responses doesn't generate duplicate issues. Map<key, cookieRecord>.
  const uniqueCookies = new Map();
  for (const c of cookies) {
    if (!c || typeof c.name !== 'string') continue;
    const key = `${c.name}@${c.domain ?? ''}`;
    if (!uniqueCookies.has(key)) uniqueCookies.set(key, c);
  }

  const issues = [];
  const vendorBreakdown = {};
  let firstParty = 0;
  let thirdParty = 0;
  let longLivedCount = 0;
  let trackingCookieCount = 0;
  const cookieList = [];

  const now = Date.now();
  const thirteenMonthsMs = 13 * 30 * 24 * 60 * 60 * 1000;

  for (const cookie of uniqueCookies.values()) {
    const name = cookie.name;
    const domain = cookie.domain ?? '';
    const sameSite = cookie.sameSite ?? '';
    const secure = !!cookie.secure;
    const httpOnly = !!cookie.httpOnly;
    const expires = cookie.expires ?? null;
    const maxAge = Number.isFinite(cookie.maxAge) ? cookie.maxAge : null;

    const trackingMatch = matchTracking(name);
    const isTracking = !!trackingMatch;
    const vendor = trackingMatch?.vendor || null;
    const isFirstParty = pageRoot ? isFirstPartyCookie(domain, pageRoot) : true;

    if (isTracking) trackingCookieCount += 1;
    if (vendor) vendorBreakdown[vendor] = (vendorBreakdown[vendor] ?? 0) + 1;
    if (isFirstParty) firstParty += 1; else thirdParty += 1;

    // ---- Secure flag (only meaningful on HTTPS pages) ----
    if (!secure && pageIsHttps) {
      issues.push({
        severity: 'warning',
        category: 'Cookie Security',
        title: `Cookie "${name}" missing Secure flag`,
        detail: `Set by ${domain || '(unknown domain)'} on an HTTPS site without the Secure attribute.`,
        fix: 'Add the Secure attribute so the cookie cannot be transmitted over plaintext HTTP.',
        cookieName: name,
      });
    }

    // ---- SameSite ----
    // No SameSite at all → modern browsers default to Lax but it's still ambiguous.
    if (!sameSite) {
      issues.push({
        severity: 'info',
        category: 'Cookie Security',
        title: `Cookie "${name}" missing SameSite attribute`,
        detail: `Browsers default to SameSite=Lax when unset, but explicit declaration is required for predictable cross-site behavior.`,
        fix: 'Set SameSite explicitly (Strict, Lax, or None). Use None only with Secure for cross-site contexts.',
        cookieName: name,
      });
    } else if (sameSite === 'None' && !secure) {
      // Browsers reject SameSite=None without Secure outright.
      issues.push({
        severity: 'error',
        category: 'Cookie Security',
        title: `SameSite=None cookie missing Secure flag`,
        detail: `Cookie "${name}" is set with SameSite=None but without the Secure attribute. Browsers will reject this cookie entirely.`,
        fix: 'Add the Secure attribute to all SameSite=None cookies.',
        cookieName: name,
      });
    }

    // ---- HttpOnly: only enforce on cookies that look like session/auth ----
    const looksLikeSessionAuth = SESSION_AUTH_PATTERNS.some(re => re.test(name));
    if (!httpOnly && looksLikeSessionAuth && !isTracking) {
      issues.push({
        severity: 'warning',
        category: 'Cookie Security',
        title: `Session/auth cookie "${name}" missing HttpOnly flag`,
        detail: `Set by ${domain || '(unknown domain)'}. Without HttpOnly, this cookie is reachable from JavaScript and exposed to XSS.`,
        fix: 'Add the HttpOnly attribute to session/auth cookies so JavaScript cannot read them.',
        cookieName: name,
      });
    }

    // ---- Tracking / consent ----
    if (isTracking) {
      const firstMs = trackerFirstSeenMs[name];
      const preConsent =
        firstMs != null &&
        (consentSetAtMs == null || firstMs < consentSetAtMs);

      if (preConsent && consentSetAtMs != null) {
        issues.push({
          severity: 'critical',
          category: 'Consent',
          title: `Tracking cookie "${name}" set before consent`,
          detail: `${vendor || 'Third-party tracker'} cookie was set at ${new Date(firstMs).toISOString()}, before the CMP consent cookie appeared at ${new Date(consentSetAtMs).toISOString()}. Under GDPR this is a pre-consent tracking violation.`,
          fix: 'Gate this tag behind your CMP. Tracking cookies must only be set after the user grants consent (GDPR opt-in) or where opt-out is honored (CCPA).',
          cookieName: name,
        });
      } else if (consentSetAtMs == null) {
        // No CMP cookie observed at all.
        issues.push({
          severity: 'warning',
          category: 'Consent',
          title: `Tracking cookie detected: ${name}`,
          detail: `"${name}" is a ${vendor || 'third-party tracker'} cookie and no CMP consent cookie was observed in this HAR. Cannot confirm consent was obtained.`,
          fix: 'Verify a Consent Management Platform (CMP) is recording user choices, and that this tag is gated on consent. GDPR requires opt-in; CCPA requires honoring "Do Not Sell / Share".',
          vendor,
          cookieName: name,
        });
      } else {
        // Tracker was set after consent — informational only.
        issues.push({
          severity: 'info',
          category: 'Consent',
          title: `Tracking cookie detected: ${name}`,
          detail: `"${name}" is a ${vendor || 'third-party tracker'} cookie set after a CMP consent cookie was recorded.`,
          fix: 'Confirm the recorded consent matches the categories this vendor falls under (analytics, advertising, etc.).',
          vendor,
          cookieName: name,
        });
      }
    }

    // ---- Lifetime: > 13 months ----
    const lifetimeMs = computeLifetimeMs(expires, maxAge, now);
    if (lifetimeMs != null && lifetimeMs > thirteenMonthsMs) {
      longLivedCount += 1;
      issues.push({
        severity: 'warning',
        category: 'Consent',
        title: `Cookie "${name}" lifetime exceeds 13 months`,
        detail: `"${name}" is configured for ~${Math.round(lifetimeMs / (30 * 24 * 60 * 60 * 1000))} months. Many jurisdictions cap consented cookie lifetimes at 13 months.`,
        fix: 'Reduce max-age / expires to 13 months or less. Re-prompt for consent when the cookie expires.',
        cookieName: name,
      });
    }

    cookieList.push({
      name,
      domain,
      secure,
      httpOnly,
      sameSite,
      expires,
      persistence: cookie.persistence ?? (expires ? 'persistent' : 'session'),
      firstParty: isFirstParty,
      vendor,
    });
  }

  // ---- Empty cookies: surface as info, not silent pass ----
  if (uniqueCookies.size === 0) {
    issues.push({
      severity: 'info',
      category: 'Consent',
      title: 'No cookies set in this HAR',
      detail: 'No Set-Cookie responses were recorded. For a populated site this is unusual — analytics / session tracking may not be firing, or the HAR was captured before any cookie-setting requests ran.',
      fix: 'Re-capture the HAR with "Preserve log" enabled and confirm at least one page navigation occurs.',
    });
  }

  const uniqueDomains = [...new Set(cookieList.map(c => c.domain))].sort();

  const result = {
    tool: 'cookie-auditor',
    status: deriveStatus(issues),
    summary: {
      totalCookies: uniqueCookies.size,
      uniqueDomains,
      trackingCookieCount,
      cookieList,
      vendorBreakdown,
      firstPartyVsThirdParty: { firstParty, thirdParty },
      longLivedCount,
    },
    issues: issues.sort(bySeverityCategoryName),
    recommendations: buildRecommendations({
      trackingCookieCount,
      vendorBreakdown,
      consentSetAtMs,
      longLivedCount,
      thirdParty,
    }),
  };

  return result;
}

// ---- helpers ------------------------------------------------------------

function matchTracking(name) {
  if (typeof name !== 'string' || !name) return null;
  if (VENDOR_MAP[name]) return { vendor: VENDOR_MAP[name] };
  if (KNOWN_TRACKING_COOKIES.includes(name)) {
    return { vendor: VENDOR_MAP[name] || 'Third-party tracker' };
  }
  for (const { prefix, vendor } of TRACKING_PREFIXES) {
    if (name.startsWith(prefix)) return { vendor };
  }
  // Any exact-match in VENDOR_MAP already handled above; check legacy startsWith
  // for the few KNOWN_TRACKING_COOKIES entries that are themselves prefixes (e.g. __utma → __utm).
  for (const k of KNOWN_TRACKING_COOKIES) {
    if (k.length >= 4 && name.startsWith(k)) {
      return { vendor: VENDOR_MAP[k] || 'Third-party tracker' };
    }
  }
  return null;
}

function isFirstPartyCookie(cookieDomain, pageRoot) {
  if (!cookieDomain) return true; // host-only cookies are first-party by definition
  const cleaned = stripSubdomain(stripLeadingDot(cookieDomain));
  return cleaned === pageRoot;
}

function computeLifetimeMs(expires, maxAge, now) {
  if (typeof maxAge === 'number' && maxAge > 0) return maxAge * 1000;
  if (!expires) return null;
  const t = Date.parse(expires);
  if (!Number.isFinite(t)) return null;
  return t - now;
}

function deriveStatus(issues) {
  if (issues.some(i => i.severity === 'critical')) return 'critical';
  if (issues.some(i => i.severity === 'error')) return 'error';
  if (issues.some(i => i.severity === 'warning')) return 'warning';
  if (issues.length > 0) return 'info';
  return 'pass';
}

function bySeverityCategoryName(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  const sa = order[a.severity] ?? 9;
  const sb = order[b.severity] ?? 9;
  if (sa !== sb) return sa - sb;
  const ca = (a.category || '').localeCompare(b.category || '');
  if (ca !== 0) return ca;
  return (a.cookieName || a.title || '').localeCompare(b.cookieName || b.title || '');
}

function buildRecommendations({ trackingCookieCount, vendorBreakdown, consentSetAtMs, longLivedCount, thirdParty }) {
  const recs = [];
  if (consentSetAtMs == null && trackingCookieCount > 0) {
    recs.push('No CMP consent cookie was observed alongside tracking cookies. Implement a Consent Management Platform to record user choices, and gate tags on consent (GDPR opt-in; CCPA opt-out / "Do Not Sell or Share").');
  }
  if (Object.keys(vendorBreakdown).length > 0) {
    recs.push('Map each tracking vendor to a consent category in your CMP (analytics, advertising, functional) and verify tags only fire when the matching category is granted.');
  }
  if (trackingCookieCount >= 4) {
    recs.push('High number of tracking cookies detected. Review with your privacy/legal team and document the lawful basis for each vendor in your processing record.');
  }
  if (longLivedCount > 0) {
    recs.push('Some cookies exceed a 13-month lifetime. Reduce max-age and re-prompt for consent on expiry to stay within typical regulatory guidance.');
  }
  if (thirdParty > 0) {
    recs.push('Third-party cookies are present. With phased third-party cookie deprecation, plan a migration to first-party data collection (server-side tagging, first-party identifiers).');
  }
  recs.push('Audit cookies annually as regulations and vendor cookie shapes change.');
  return recs;
}

function extractContext(har) {
  // Parse `har` if it came in as a string; tolerate failure since auditHar already validated.
  let parsed = har;
  if (typeof har === 'string') {
    try { parsed = JSON.parse(har); } catch { parsed = null; }
  }
  const entries = Array.isArray(parsed?.log?.entries) ? parsed.log.entries : [];
  if (!entries.length) {
    return { firstUrl: null, consentSetAtMs: null, trackerFirstSeenMs: {} };
  }

  const firstUrl = entries[0]?.request?.url ?? null;

  // Walk entries in chronological order. Record:
  //   - the earliest timestamp at which a CMP / consent cookie is observed
  //   - the earliest timestamp each tracking cookie name first appears
  let consentSetAtMs = null;
  const trackerFirstSeenMs = {};

  for (const entry of entries) {
    const ts = parseStartedDateTime(entry?.startedDateTime);

    // CMP markers in REQUEST cookie header or REQUEST.cookies — means the CMP cookie
    // already existed by the time of this request, so the user had consented earlier.
    const reqCookieHeaderVal = findHeader(entry?.request?.headers, 'cookie');
    if (ts != null && consentSetAtMs == null && hasConsentMarker(reqCookieHeaderVal, entry?.request?.cookies)) {
      consentSetAtMs = ts;
    }

    // CMP markers in RESPONSE Set-Cookie — the consent cookie is being created right now.
    const respCookies = Array.isArray(entry?.response?.cookies) ? entry.response.cookies : [];
    if (ts != null && consentSetAtMs == null) {
      for (const c of respCookies) {
        if (c && typeof c.name === 'string' && CONSENT_COOKIE_MARKERS.includes(c.name)) {
          consentSetAtMs = ts;
          break;
        }
      }
    }

    // Tracker first-seen timestamps (from response Set-Cookie).
    if (ts != null) {
      for (const c of respCookies) {
        if (!c || typeof c.name !== 'string') continue;
        if (!matchTracking(c.name)) continue;
        if (trackerFirstSeenMs[c.name] == null || ts < trackerFirstSeenMs[c.name]) {
          trackerFirstSeenMs[c.name] = ts;
        }
      }
    }
  }

  return { firstUrl, consentSetAtMs, trackerFirstSeenMs };
}

function hasConsentMarker(headerVal, reqCookies) {
  if (typeof headerVal === 'string' && headerVal.length > 0) {
    for (const m of CONSENT_COOKIE_MARKERS) {
      if (headerVal.includes(m)) return true;
    }
  }
  if (Array.isArray(reqCookies)) {
    for (const c of reqCookies) {
      if (c && typeof c.name === 'string' && CONSENT_COOKIE_MARKERS.includes(c.name)) return true;
    }
  }
  return false;
}

function findHeader(headers, targetName) {
  if (!Array.isArray(headers)) return '';
  const t = targetName.toLowerCase();
  for (const h of headers) {
    if (h && typeof h.name === 'string' && h.name.toLowerCase() === t) {
      return typeof h.value === 'string' ? h.value : '';
    }
  }
  return '';
}

function parseStartedDateTime(s) {
  if (typeof s !== 'string') return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function safeHostname(url) {
  if (typeof url !== 'string') return '';
  try { return new URL(url).hostname; } catch { return ''; }
}

function stripLeadingDot(host) {
  return typeof host === 'string' && host.startsWith('.') ? host.slice(1) : host;
}

function stripSubdomain(host) {
  if (!host) return host;
  return host.replace(/^(?:www|m|mobile)\./i, '');
}

export function run(data) { return auditCookies(data); }
