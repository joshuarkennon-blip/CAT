// scripts/tools/har-auditor.js

export function auditHar(har) {
  // Accept either a parsed object or a raw JSON string (from paste/picker).
  if (typeof har === 'string') {
    try { har = JSON.parse(har); }
    catch { return errorReport('Invalid JSON. Upload a valid HAR file exported from Chrome DevTools.'); }
  }

  if (har && typeof har === 'object' && !Array.isArray(har)) {
    // A GTM container export is .json too and can slip into the HAR slot.
    // Catch that before the empty-entries check so the user gets a real hint.
    if (!har.log && (har.containerVersion || Array.isArray(har.tag) || Array.isArray(har.trigger))) {
      return errorReport('This looks like a GTM container export, not a HAR file. Switch to the GTM Container Auditor, or upload a HAR file instead.');
    }
  }

  // `har.log` should be an object; reject arrays/strings/null defensively.
  const log = (har && typeof har === 'object' && har.log && typeof har.log === 'object' && !Array.isArray(har.log))
    ? har.log
    : null;
  const entries = Array.isArray(log?.entries) ? log.entries : [];
  if (!entries.length) return errorReport('No entries found in HAR file. Make sure you exported the HAR with network activity captured.');

  // Detect first-party hostname (root-domain match) from the first navigation-like entry.
  // Strip common subdomain prefixes so www.acme.com and m.acme.com both compare equal.
  let firstPartyRoot = null;
  for (const e of entries) {
    const h = safeHostname(e?.request?.url);
    if (h) { firstPartyRoot = stripSubdomain(h); break; }
  }

  const issues = [];
  const summary = {
    totalRequests: entries.length,
    totalSizeKB: 0,
    slowRequests: [],          // overall slow (transfer time)
    slowServerRequests: [],    // server-side slow (TTFB / wait)
    failedRequests: [],
    blockedRequests: [],
    trackingScripts: [],
    duplicateRequests: [],
    largePayloads: [],
    redirectChains: [],
    cookiesSet: [],
    longLivedFirstPartyCookies: [],
    thirdPartyDomains: new Set(),
    serverIPs: new Set(),
    httpVersions: {},
    ga4HitCount: 0,
    ga4ConfigLoaded: false,
    gtmContainerIds: new Set(),
  };

  // Key URLs by canonical form (cache-busters stripped, params sorted) for duplicate detection.
  const canonCounts = new Map(); // canonUrl -> { count, sample, methods:Set, statuses:Set, isPreflight, isNavigation, mimeType }
  const ga4CollectUrls = [];
  // Redirect adjacency: from URL -> destination URL, so we can fold chains.
  const redirectMap = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const req = entry.request ?? null;
    if (!req || typeof req.url !== 'string' || !req.url) {
      // Malformed entry — record once, do not let it crash anything else.
      issues.push({
        severity: 'info',
        category: 'Network',
        title: 'Malformed HAR entry skipped',
        detail: 'An entry was missing its request URL and was ignored.',
        fix: 'Re-export the HAR file from a clean DevTools session.',
      });
      continue;
    }

    const url = req.url;
    const method = (req.method || 'GET').toUpperCase();
    const time = Number.isFinite(entry.time) ? entry.time : 0;
    const timings = entry.timings || {};
    // Treat negative timing values as "unknown" per HAR spec (-1).
    const wait = Number.isFinite(timings.wait) && timings.wait > 0 ? timings.wait : 0;

    // size — content.size is decompressed and often -1; prefer wire size signals.
    const sizeBytes = pickSize(entry);
    const sizeKB = sizeBytes / 1024;
    const domain = safeHostname(url);
    const scheme = safeScheme(url);
    const resp = entry.response ?? null;
    const mimeType = resp?.content?.mimeType ?? '';
    const isHttpUrl = scheme === 'http' || scheme === 'https';

    summary.totalSizeKB += sizeKB;

    // HTTP version distribution — useful waterfall context.
    const httpVer = resp?.httpVersion || req.httpVersion;
    if (httpVer) summary.httpVersions[httpVer] = (summary.httpVersions[httpVer] ?? 0) + 1;
    if (entry.serverIPAddress) summary.serverIPs.add(entry.serverIPAddress);

    // Canonicalize the URL for duplicate detection (strip cache-busters, sort params).
    // Skip preflight and same-page navigations from "duplicate" rollup.
    const canon = canonicalizeUrl(url);
    if (canon && isHttpUrl && method !== 'OPTIONS') {
      let bucket = canonCounts.get(canon);
      if (!bucket) {
        bucket = { count: 0, sample: url, methods: new Set(), statuses: new Set(), mimeType };
        canonCounts.set(canon, bucket);
      }
      bucket.count += 1;
      bucket.methods.add(method);
      if (resp?.status != null) bucket.statuses.add(resp.status);
    }

    // ---- Performance: slow transfer vs slow server ----------------------
    // entry.time is total (queue + dns + connect + ssl + wait + receive).
    // Use TTFB (timings.wait) to distinguish server slowness from waterfall.
    if (wait > 1500) {
      summary.slowServerRequests.push({ url, ttfbMs: Math.round(wait) });
      issues.push({
        severity: wait > 3000 ? 'error' : 'warning',
        category: 'Performance',
        title: 'Slow server response (TTFB)',
        detail: `${truncateUrl(url)} — server took ${Math.round(wait)}ms to start responding.`,
        fix: 'Profile the backend handler, add caching, or move work off the request path. TTFB is the server, not the network.',
      });
    } else if (time > 2000) {
      // Slow overall but not server-slow → likely large body or contended waterfall.
      summary.slowRequests.push({ url, time: Math.round(time) });
      const isJs = mimeType.includes('javascript');
      issues.push({
        severity: isJs ? 'error' : 'warning',
        category: 'Performance',
        title: 'Slow request (transfer time)',
        detail: `${truncateUrl(url)} took ${Math.round(time)}ms end-to-end (TTFB was fast — likely large body or download).`,
        fix: 'Compress, split, or defer this asset. If it blocks rendering, consider loading it async.',
      });
    }

    // ---- Network: status handling ---------------------------------------
    if (!resp || resp.status == null) {
      issues.push({
        severity: 'info',
        category: 'Network',
        title: 'Incomplete HAR entry',
        detail: truncateUrl(url),
        fix: 'This entry has no recorded response — it may have been cancelled or the HAR export was incomplete.',
      });
    } else {
      const status = resp.status;

      if (status === 0) {
        // Status 0 is a grab-bag: blocked by extension, CORS preflight failure, aborted navigation, network error.
        summary.blockedRequests.push({ url });
        const looksLikeTracker = detectTrackers(url).length > 0;
        const looksLikePreflight = method === 'OPTIONS';
        issues.push({
          severity: looksLikeTracker ? 'warning' : 'info',
          category: 'Network',
          title: looksLikePreflight ? 'CORS preflight failed or blocked'
               : looksLikeTracker  ? 'Tracking request blocked or aborted'
                                   : 'Request did not complete',
          detail: truncateUrl(url),
          fix: looksLikePreflight
            ? 'Check the server\'s Access-Control-Allow-* headers on the OPTIONS response.'
            : looksLikeTracker
            ? 'Likely an ad blocker, tracking protection, or content-blocker. Verify with browser shields disabled.'
            : 'Request was cancelled, blocked, or the connection dropped. Cross-check the browser console for the underlying reason.',
        });
      } else if (status >= 400) {
        summary.failedRequests.push({ url, status });
        issues.push({
          severity: status >= 500 ? 'critical' : 'error',
          category: 'Network',
          title: `Request failed (${status})`,
          detail: truncateUrl(url),
          fix: status >= 500
            ? `Server returned ${status}. Check backend logs and error-tracking for this endpoint.`
            : `Client error ${status}. Verify URL, auth, and request shape.`,
        });
      } else if (status >= 300 && status < 400) {
        // Track adjacency; we'll fold chains after the loop instead of emitting one issue per hop.
        const dest = resp.redirectURL || '';
        if (dest) redirectMap.set(url, { status, dest });
        summary.redirectChains.push({ url, status, redirectURL: dest });
      }
    }

    // ---- Large payloads -------------------------------------------------
    if (sizeKB > 500) {
      summary.largePayloads.push({ url, sizeKB: Math.round(sizeKB) });
      issues.push({
        severity: sizeKB > 1024 ? 'error' : 'warning',
        category: 'Performance',
        title: 'Large payload',
        detail: `${truncateUrl(url)} is ${Math.round(sizeKB)}KB`,
        fix: 'Compress, code-split, or lazy-load. Large payloads delay page load and can affect tracking accuracy.',
      });
    }

    // ---- Tracker fingerprinting ----------------------------------------
    if (isHttpUrl) {
      const trackers = detectTrackers(url);
      if (trackers.length) {
        summary.trackingScripts.push(...trackers.map(t => ({ name: t, url })));
      }
    }

    // ---- GA4 / gtag detection ------------------------------------------
    // GA4 measurement protocol is /g/collect?v=2 (the v=2 query param is the GA4 marker).
    if (/\/g\/collect\b|\/collect\?.*\bv=2\b/.test(url)) {
      summary.ga4HitCount += 1;
      ga4CollectUrls.push(url);
    }
    if (/googletagmanager\.com\/gtag\/js\?id=/.test(url)) {
      summary.ga4ConfigLoaded = true;
    }
    const gtmMatch = url.match(/googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/);
    if (gtmMatch) summary.gtmContainerIds.add(gtmMatch[1]);

    // ---- Third-party domains -------------------------------------------
    if (domain) {
      const root = stripSubdomain(domain);
      if (firstPartyRoot && root !== firstPartyRoot) {
        summary.thirdPartyDomains.add(domain);
      }
    }

    // ---- Cookies set by response ---------------------------------------
    const responseCookies = Array.isArray(resp?.cookies) ? resp.cookies : [];
    for (const c of responseCookies) {
      if (!c || typeof c.name !== 'string') continue;
      const expires = c.expires ?? null;
      const cookieRecord = {
        name: c.name,
        domain: c.domain ?? domain,
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: c.sameSite ?? '',
        expires,
        // session = no explicit expiration; persistent = has one.
        persistence: expires ? 'persistent' : 'session',
      };
      summary.cookiesSet.push(cookieRecord);

      // Surface long-lived first-party cookies that look like tracking IDs.
      // (cookie-auditor handles consent/lifetime checks — we just expose them here.)
      if (expires && firstPartyRoot && stripSubdomain(stripLeadingDot(cookieRecord.domain)) === firstPartyRoot) {
        const isTrackerName = /^(_ga|_gid|_gcl|_fbp|_fbc|__hssc|__hssrc|__hstc|hubspotutk|_hjSession)/.test(c.name);
        const expMs = Date.parse(expires);
        if (isTrackerName && Number.isFinite(expMs)) {
          summary.longLivedFirstPartyCookies.push({ name: c.name, domain: cookieRecord.domain, expires });
        }
      }

      if (!cookieRecord.secure && scheme === 'https') {
        issues.push({
          severity: 'warning',
          category: 'Security',
          title: 'Insecure cookie set over HTTPS response',
          detail: `Cookie "${c.name}" set by ${cookieRecord.domain} lacks the Secure flag.`,
          fix: 'Add the Secure attribute so the cookie cannot be sent over plaintext HTTP.',
        });
      }
    }
  }

  // ---- Duplicate detection (post-canonicalization) -----------------------
  for (const [canon, info] of canonCounts) {
    if (info.count <= 1) continue;
    // Skip pure 3xx (those are already in redirect chain reporting) and trivial GETs of the same HTML page.
    const onlyRedirects = [...info.statuses].every(s => s >= 300 && s < 400);
    if (onlyRedirects) continue;

    summary.duplicateRequests.push({ url: info.sample, count: info.count, canonical: canon });
    const isAnalytics = detectTrackers(info.sample).length > 0 || /\/collect\b|\/tr\b|\/pixel\b/.test(info.sample);
    issues.push({
      severity: isAnalytics ? 'error' : 'warning',
      category: 'Tracking',
      title: `Duplicate request (${info.count}x)`,
      detail: truncateUrl(info.sample),
      fix: isAnalytics
        ? 'Analytics endpoint fired more than once — likely double-counting. Check GTM trigger conditions and dataLayer pushes.'
        : 'Duplicate request detected (cache-busters and param order ignored). Verify the call site is not running twice.',
    });
  }

  // ---- GA4 duplicate conversion events -----------------------------------
  const ga4EventCounts = {};
  for (const u of ga4CollectUrls) {
    try {
      const params = new URL(u).searchParams;
      const en = params.get('en');
      if (en) ga4EventCounts[en] = (ga4EventCounts[en] ?? 0) + 1;
    } catch { /* ignore malformed URLs */ }
  }
  const conversionEvents = new Set(['purchase', 'conversion', 'generate_lead', 'begin_checkout', 'sign_up']);
  for (const [en, count] of Object.entries(ga4EventCounts)) {
    if (count > 1 && conversionEvents.has(en)) {
      issues.push({
        severity: 'error',
        category: 'Tracking',
        title: 'GA4 conversion event fired multiple times',
        detail: `The \`${en}\` event was sent ${count} times in this session — revenue may be double-counted.`,
        fix: 'Check for duplicate trigger configurations or pageview-based firing on the confirmation page.',
      });
    }
  }

  // GA4 hits without a gtag/js config call is a real misconfiguration.
  if (summary.ga4HitCount > 0 && !summary.ga4ConfigLoaded && summary.gtmContainerIds.size === 0) {
    issues.push({
      severity: 'critical',
      category: 'Tracking',
      title: 'GA4 hits firing without config',
      detail: `Detected ${summary.ga4HitCount} GA4 measurement-protocol hits but no \`gtag/js?id=\` config load and no GTM container.`,
      fix: 'Ensure the GA4 config tag (or gtag.js bootstrap) loads before any event tags. Without it, hits may be unattributed or rejected.',
    });
  }

  // ---- Redirect-chain folding -------------------------------------------
  // Build chains by walking forward from heads (URLs that nothing redirects to).
  const allDestinations = new Set([...redirectMap.values()].map(v => v.dest));
  const seenHeads = new Set();
  for (const [from] of redirectMap) {
    if (allDestinations.has(from)) continue; // not a chain head
    if (seenHeads.has(from)) continue;
    seenHeads.add(from);
    const chain = [from];
    let cursor = from;
    const guard = new Set([from]);
    while (redirectMap.has(cursor)) {
      const next = redirectMap.get(cursor).dest;
      if (!next || guard.has(next)) break; // cycle or terminal
      chain.push(next);
      guard.add(next);
      cursor = next;
    }
    if (chain.length < 2) continue;
    const hops = chain.length - 1; // number of redirects
    issues.push({
      severity: hops >= 3 ? 'warning' : 'info',
      category: 'Network',
      title: hops >= 3 ? `Long redirect chain (${hops} hops)` : `Redirect chain (${hops} hop${hops === 1 ? '' : 's'})`,
      detail: chain.map(u => truncateUrl(u)).join(' → '),
      fix: hops >= 3
        ? 'Long redirect chains add latency. Point requests at the final destination directly.'
        : 'Resolve to the final URL to save a round-trip. Important for pixels and tracking tags.',
    });
  }

  // Dedupe trackingScripts by name (the URLs that triggered them are still useful via summary).
  const seenTrackers = new Set();
  summary.trackingScripts = summary.trackingScripts.filter(t => {
    if (seenTrackers.has(t.name)) return false;
    seenTrackers.add(t.name);
    return true;
  });

  summary.thirdPartyDomains = [...summary.thirdPartyDomains].sort();
  summary.serverIPs = [...summary.serverIPs];
  summary.gtmContainerIds = [...summary.gtmContainerIds];
  summary.totalSizeKB = Math.round(summary.totalSizeKB);

  return {
    tool: 'har-auditor',
    status: issues.some(i => i.severity === 'critical') ? 'critical'
          : issues.some(i => i.severity === 'error')    ? 'error'
          : issues.some(i => i.severity === 'warning')  ? 'warning'
          : 'pass',
    summary,
    issues: issues.sort(byIssue),
    recommendations: buildHarRecommendations(issues, summary),
  };
}

// ---- helpers -------------------------------------------------------------

function pickSize(entry) {
  const resp = entry?.response;
  if (!resp) return 0;
  // Prefer Chrome's `_transferSize` (wire bytes), then bodySize, then content.size.
  // -1 means "unknown" per HAR spec — never count it.
  const candidates = [resp._transferSize, resp.bodySize, resp.content?.size];
  for (const v of candidates) {
    if (typeof v === 'number' && v > 0) return v;
  }
  return 0;
}

// Strip cache-buster query params and sort the rest so equivalent calls collapse.
// Returns null for non-http(s) URLs.
const CACHE_BUSTER_PARAMS = new Set(['_', 'cb', 't', 'v', 'rnd', 'r', 'ts', '_t']);
function canonicalizeUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const kept = [];
    for (const [k, v] of u.searchParams) {
      if (CACHE_BUSTER_PARAMS.has(k)) continue;
      kept.push([k, v]);
    }
    kept.sort((a, b) => a[0].localeCompare(b[0]));
    const qs = kept.map(([k, v]) => `${k}=${v}`).join('&');
    return `${u.origin}${u.pathname}${qs ? '?' + qs : ''}`;
  } catch {
    return null;
  }
}

function stripLeadingDot(host) {
  return typeof host === 'string' && host.startsWith('.') ? host.slice(1) : host;
}

// Treat www./m./mobile. as the same site so they don't both look "third-party".
function stripSubdomain(host) {
  if (!host) return host;
  return host.replace(/^(?:www|m|mobile)\./i, '');
}

function detectTrackers(url) {
  if (typeof url !== 'string' || !url) return [];
  // Only attempt host-anchored matching for things that look like URLs;
  // data:, blob:, about: etc. legitimately won't match.
  const KNOWN = [
    ['Google Analytics / GA4',  ['google-analytics.com', 'googletagmanager.com/gtag', 'googletagmanager.com', 'analytics.js']],
    ['Google Ads',              ['googleadservices.com', 'doubleclick.net', 'googlesyndication.com']],
    ['Meta Pixel',              ['connect.facebook.net', 'facebook.com/tr', 'fbevents.js']],
    ['LinkedIn Insight',        ['snap.licdn.com', 'linkedin.com/px', 'px.ads.linkedin.com']],
    ['HotJar',                  ['static.hotjar.com', 'hotjar.com']],
    ['Segment',                 ['cdn.segment.com', 'api.segment.io']],
    ['Intercom',                ['widget.intercom.io', 'api-iam.intercom.io']],
    ['Drift',                   ['js.driftt.com', 'js.drift.com']],
    ['Heap',                    ['heapanalytics.com']],
    ['Mixpanel',                ['cdn.mxpnl.com', 'api.mixpanel.com', 'mixpanel.com']],
    ['TikTok Pixel',            ['analytics.tiktok.com']],
    ['Pinterest Tag',           ['s.pinimg.com/ct/', 'ct.pinterest.com']],
    ['Snapchat Pixel',          ['tr.snapchat.com', 'sc-static.net/scevent']],
    ['Reddit Pixel',            ['alb.reddit.com', 'redditstatic.com/ads']],
    ['Microsoft UET',           ['bat.bing.com']],
    ['Klaviyo',                 ['fast.a.klaviyo.com', 'static.klaviyo.com']],
    ['Twitter/X Pixel',         ['static.ads-twitter.com', 't.co/i/adsct']],
  ];
  const found = [];
  for (const [name, patterns] of KNOWN) {
    if (patterns.some(p => url.includes(p))) found.push(name);
  }
  return found;
}

function buildHarRecommendations(issues, summary) {
  const recs = [];
  if (summary.slowServerRequests?.length > 0) {
    recs.push('Server-side slowness detected (high TTFB). Profile the backend, add caching, or move work off the request path.');
  }
  if (summary.slowRequests?.length > 3) {
    recs.push('Multiple slow transfers detected. Audit third-party script load order and consider async/defer attributes.');
  }
  if (summary.duplicateRequests?.length > 0) {
    recs.push('Duplicate requests present (cache-busters ignored). Review GTM trigger conditions and ensure tags fire once per intended event.');
  }
  if (summary.failedRequests?.length > 0) {
    recs.push('Failed requests detected. Verify no ad blockers are interfering and that all tag endpoints are correct.');
  }
  if (summary.blockedRequests?.length > 0) {
    recs.push('Some requests did not complete (status 0). Re-test with extensions disabled to isolate ad blockers vs server issues.');
  }
  if (summary.cookiesSet?.filter(c => !c.secure).length > 0) {
    recs.push('Some cookies are set without the Secure flag. Review cookie configuration for compliance.');
  }
  if (summary.trackingScripts?.length > 8) {
    recs.push('High number of tracking scripts detected. Consolidate where possible to reduce page weight and load time.');
  }
  if (summary.ga4HitCount > 0 && !summary.ga4ConfigLoaded && summary.gtmContainerIds.length === 0) {
    recs.push('GA4 hits were observed without a gtag config tag or GTM container — verify the measurement setup loads first.');
  }
  return recs;
}

function safeHostname(url) {
  if (typeof url !== 'string') return '';
  try { return new URL(url).hostname; } catch { return ''; }
}

function safeScheme(url) {
  if (typeof url !== 'string') return '';
  try { return new URL(url).protocol.replace(':', ''); } catch { return ''; }
}

function truncateUrl(url, max = 80) {
  if (typeof url !== 'string') return '';
  return url.length > max ? url.slice(0, max) + '…' : url;
}

// Deterministic ordering: severity first, then category, then title.
function byIssue(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  const sa = order[a.severity] ?? 9;
  const sb = order[b.severity] ?? 9;
  if (sa !== sb) return sa - sb;
  const ca = (a.category || '').localeCompare(b.category || '');
  if (ca !== 0) return ca;
  return (a.title || '').localeCompare(b.title || '');
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
