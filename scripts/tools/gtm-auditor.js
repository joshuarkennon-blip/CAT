// scripts/tools/gtm-auditor.js

export function auditGtm(json) {
  let container;
  try {
    container = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    return errorReport('Invalid JSON. Paste or upload a valid GTM container export.');
  }

  const root = container?.exportFormatVersion ? container
             : container?.containerVersion ?? container;

  const tags      = root?.tag ?? root?.containerVersion?.tag ?? [];
  const triggers  = root?.trigger ?? root?.containerVersion?.trigger ?? [];
  const variables = root?.variable ?? root?.containerVersion?.variable ?? [];

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
      issues.push({
        severity: 'info',
        category: 'Tags',
        title: 'Paused tag',
        detail: `"${name}" is paused and not firing.`,
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
      issues.push({
        severity: 'warning',
        category: 'Tags',
        title: 'Duplicate tag name',
        detail: `Multiple tags named "${name}" exist.`,
        fix: 'Rename tags uniquely to prevent confusion. Duplicate names often indicate accidental duplication.',
      });
    }

    if (tag.type === 'googtag' || tag.name?.toLowerCase().includes('ga4')) {
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
      issues.push({
        severity: 'info',
        category: 'Variables',
        title: 'Custom JavaScript variable detected',
        detail: `"${variable.name}" uses custom JavaScript. Ensure it handles undefined gracefully.`,
        fix: 'Wrap custom JS variables in try/catch and always return a default value to prevent undefined errors.',
      });
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
      setupTag: t.setupTag ?? null,
      teardownTag: t.teardownTag ?? null,
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
  if (summary.pausedTags.length > 2) recs.push('Multiple paused tags found. Audit and remove deprecated tags to reduce container complexity.');
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
  };
}

export function run(data) { return auditGtm(data); }
