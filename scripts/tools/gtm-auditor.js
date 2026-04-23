// scripts/tools/gtm-auditor.js

export function auditGtm(json) {
  let container;
  try {
    container = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    return errorReport('Invalid JSON. Paste or upload a valid GTM container export.');
  }

  // A HAR export is .json too — catch that before silently returning an
  // empty audit (no tags/triggers/variables) so the user gets a real hint.
  if (container && typeof container === 'object' && container.log?.entries && !container.containerVersion && !container.tag) {
    return errorReport('This looks like a HAR file, not a GTM container. Switch to the HAR File Auditor, or upload a GTM container export instead.');
  }

  // Fix #1: ROOT EXTRACTION — always use containerVersion for tags/triggers/variables
  const cv = container?.containerVersion ?? container;
  const tags      = cv?.tag      ?? [];
  const triggers  = cv?.trigger  ?? [];
  const variables = cv?.variable ?? [];

  // An otherwise-unrecognized JSON still makes it to here. If nothing looks
  // like a container, don't return an all-zeros "audit" — tell the user.
  const hasAnySignal = tags.length || triggers.length || variables.length || container?.exportFormatVersion;
  if (!hasAnySignal) {
    return errorReport('No GTM container structure found. Export your container from GTM Admin → Export Container and upload that JSON.');
  }

  const issues = [];
  const summary = {
    tagCount: tags.length,
    triggerCount: triggers.length,
    variableCount: variables.length,
    orphanedTags: [],
    orphanedTriggers: [],
    duplicateTags: [],
    pausedTags: [],
    missingVariables: [],
  };

  const triggerIds = new Set(triggers.map(t => t.triggerId));
  const referencedTriggerIds = new Set();

  const tagNameCounts = {};
  for (const tag of tags) {
    const name = tag.name ?? 'Unnamed Tag';
    tagNameCounts[name] = (tagNameCounts[name] ?? 0) + 1;

    if (tag.paused) {
      summary.pausedTags.push(name);
      // Fix #5: PAUSED UA SEVERITY — use warning for UA tags
      const pausedSeverity = tag.type === 'ua' ? 'warning' : 'info';
      const pausedDetail = tag.type === 'ua'
        ? `"${name}" is paused and not firing. Note: UA was shut down July 2023 and no longer processes data.`
        : `"${name}" is paused and not firing.`;
      issues.push({
        severity: pausedSeverity,
        category: 'Tags',
        title: 'Paused tag',
        detail: pausedDetail,
        fix: 'If this tag should be active, unpause it. If deprecated, consider removing it to keep the container clean.',
      });
    }

    const firingTriggers = tag.firingTriggerId ?? [];
    if (!firingTriggers.length) {
      summary.orphanedTags.push(name);
      issues.push({
        severity: 'error',
        category: 'Tags',
        title: 'Tag has no firing triggers',
        detail: `"${name}" will never fire — no triggers assigned.`,
        fix: 'Assign at least one firing trigger to this tag, or remove it if unused.',
      });
    }

    firingTriggers.forEach(id => referencedTriggerIds.add(id));

    if (tagNameCounts[name] > 1) {
      // Fix #10: duplicateTags — also push to summary.duplicateTags if not already there
      if (!summary.duplicateTags.includes(name)) {
        summary.duplicateTags.push(name);
      }
      issues.push({
        severity: 'warning',
        category: 'Tags',
        title: 'Duplicate tag name',
        detail: `Multiple tags named "${name}" exist.`,
        fix: 'Rename tags uniquely to prevent confusion. Duplicate names often indicate accidental duplication.',
      });
    }

    // Fix #2: GA4 CHECK SCOPE — restrict to tag.type === 'googtag' only
    if (tag.type === 'googtag') {
      const measurementId = extractParam(tag, 'measurementId') ?? extractParam(tag, 'tagId');
      if (!measurementId) {
        issues.push({
          severity: 'error',
          category: 'GA4',
          title: 'GA4 tag missing Measurement ID',
          detail: `"${name}" has no measurement ID configured.`,
          fix: 'Add your GA4 Measurement ID (format: G-XXXXXXXXXX) to this tag.',
        });
      }
    }

    // Fix #3: UA SUNSET CHECK
    if (tag.type === 'ua') {
      issues.push({
        severity: 'warning',
        category: 'Tags',
        title: 'Universal Analytics tag detected',
        detail: 'UA was shut down July 2023 and no longer processes data.',
        fix: 'Migrate all tracking to GA4 and delete this tag.',
      });
    }

    // Fix #4: CONSENT STATUS CHECK — advertising/pixel tag types without consent
    const advertisingTypes = ['html', 'awct', 'sp', 'flc', 'fls'];
    if (
      tag.consentSettings?.consentStatus === 'NOT_SET' &&
      advertisingTypes.includes(tag.type)
    ) {
      issues.push({
        severity: 'warning',
        category: 'Tags',
        title: 'Tag has no consent configuration',
        detail: `"${name}" fires without a consent check. For EU/GDPR compliance, configure Consent Mode v2 or add a consent exception trigger.`,
        fix: 'In GTM, set consent settings on this tag or add a blocking trigger tied to your CMP.',
      });
    }
  }

  for (const trigger of triggers) {
    if (!referencedTriggerIds.has(trigger.triggerId)) {
      summary.orphanedTriggers.push(trigger.name ?? trigger.triggerId);
      issues.push({
        severity: 'info',
        category: 'Triggers',
        title: 'Unused trigger',
        detail: `Trigger "${trigger.name ?? trigger.triggerId}" is not used by any tag.`,
        fix: 'Remove unused triggers to keep your container clean and reduce cognitive overhead.',
      });
    }
  }

  for (const variable of variables) {
    if (variable.type === 'jsm') {
      // Fix #7: JS VARIABLE FALSE POSITIVE — skip if code already has try/catch
      const code = extractParam(variable, 'javascript') ?? '';
      if (!code.includes('try')) {
        issues.push({
          severity: 'info',
          category: 'Variables',
          title: 'Custom JavaScript variable detected',
          detail: `"${variable.name}" uses custom JavaScript. Ensure it handles undefined gracefully.`,
          fix: 'Wrap custom JS variables in try/catch and always return a default value to prevent undefined errors.',
        });
      }
    }
  }

  return {
    tool: 'gtm-auditor',
    status: issues.filter(i => ['error','critical'].includes(i.severity)).length > 0 ? 'error'
           : issues.length > 0 ? 'warning'
           : 'pass',
    summary,
    issues: issues.sort(bySeverity),
    architecture: buildArchitectureMap(tags, triggers, variables),
    recommendations: buildGtmRecommendations(issues, summary),
  };
}

function buildArchitectureMap(tags, triggers, variables) {
  return {
    tags: tags.map(t => ({
      name: t.name,
      type: t.type,
      paused: t.paused ?? false,
      firingTriggers: t.firingTriggerId ?? [],
      blockingTriggers: t.blockingTriggerId ?? [],
      // Fix #8: ARCHITECTURE MAP — normalize setupTag/teardownTag to arrays of tag names
      setupTag: (t.setupTag ?? []).map(s => s.tagName),
      teardownTag: (t.teardownTag ?? []).map(s => s.tagName),
    })),
    triggers: triggers.map(t => ({
      name: t.name,
      type: t.type,
      id: t.triggerId,
    })),
    variables: variables.map(v => ({
      name: v.name,
      type: v.type,
    })),
  };
}

function extractParam(tag, key) {
  const params = tag.parameter ?? [];
  return params.find(p => p.key === key)?.value ?? null;
}

function buildGtmRecommendations(issues, summary) {
  const recs = [];
  if (summary.orphanedTags.length > 0) recs.push(`${summary.orphanedTags.length} tag(s) have no firing triggers and will never execute. Assign triggers or remove them.`);
  // Fix #6: PAUSED THRESHOLD — changed from > 2 to > 0
  if (summary.pausedTags.length > 0) recs.push('Multiple paused tags found. Audit and remove deprecated tags to reduce container complexity.');
  if (summary.orphanedTriggers.length > 0) recs.push('Unused triggers detected. Clean up to simplify container auditing.');
  if (summary.tagCount > 50) recs.push('Large container (50+ tags). Consider consolidating tags using Google Tag (gtag.js) where possible.');
  return recs;
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

function errorReport(message) {
  return {
    tool: 'gtm-auditor',
    status: 'error',
    issues: [{ severity: 'error', category: 'Input', title: 'Invalid input', detail: message, fix: 'Export your GTM container from Admin → Export Container in GTM.' }],
    summary: {},
    recommendations: [],
    // Fix #9: errorReport — add architecture field
    architecture: { tags: [], triggers: [], variables: [] },
  };
}

export function run(data) { return auditGtm(data); }
