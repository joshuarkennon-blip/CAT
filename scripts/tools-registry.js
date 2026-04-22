// scripts/tools-registry.js

export const TOOLS = [
  {
    id: 'har-auditor',
    label: 'HAR File Auditor',
    description: 'Upload a HAR file and get a full breakdown of issues, slow resources, and tracking conflicts.',
    inputType: 'file',
    fileAccept: '.har,application/json',
    keywords: ['har', 'network', 'requests', 'http archive', 'slow', 'resources', 'tracking scripts'],
    module: () => import('./tools/har-auditor.js'),
  },
  {
    id: 'gtm-auditor',
    label: 'GTM Container Auditor',
    description: 'Paste or upload your GTM container JSON. Get full architecture map, tag references, and problem flags.',
    inputType: 'file-or-text',
    fileAccept: '.json,application/json',
    keywords: ['gtm', 'google tag manager', 'container', 'json', 'tags', 'triggers', 'variables', 'firing'],
    module: () => import('./tools/gtm-auditor.js'),
  },
  {
    id: 'ga4-checker',
    label: 'GA4 Config Checker',
    description: 'Paste your GA4 configuration details and get a health check: measurement ID, events, filters, data streams.',
    inputType: 'form',
    keywords: ['ga4', 'google analytics', 'measurement id', 'events', 'conversions', 'streams', 'config'],
    module: () => import('./tools/ga4-checker.js'),
  },
  {
    id: 'discrepancy',
    label: 'Cross-Platform Reconciliation',
    description: 'Enter numbers from GA4, Google Ads, and your CRM. Get a breakdown of mismatches and likely causes.',
    inputType: 'form',
    keywords: ['discrepancy', 'mismatch', 'reconcile', 'numbers', 'ads', 'crm', 'conversions', 'match'],
    module: () => import('./tools/discrepancy.js'),
  },
  {
    id: 'tag-sequencer',
    label: 'Tag Sequencing Debugger',
    description: 'Paste your GTM container JSON and get a firing order map with sequencing problems flagged.',
    inputType: 'file-or-text',
    fileAccept: '.json,application/json',
    keywords: ['sequencing', 'firing order', 'tag sequence', 'dependency', 'initialization', 'data layer timing'],
    module: () => import('./tools/tag-sequencer.js'),
  },
  {
    id: 'cookie-auditor',
    label: 'Cookie & Consent Auditor',
    description: 'Upload a HAR file and get a breakdown of cookies set, consent signals, and GDPR/CCPA compliance flags.',
    inputType: 'file',
    fileAccept: '.har,application/json',
    keywords: ['cookie', 'consent', 'gdpr', 'ccpa', 'privacy', 'compliance', 'tracking consent'],
    module: () => import('./tools/cookie-auditor.js'),
  },
];

export function getToolById(id) {
  return TOOLS.find(t => t.id === id) ?? null;
}

export function getToolByKeywords(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const tool of TOOLS) {
    const score = tool.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = tool;
    }
  }
  return bestScore > 0 ? best : null;
}
