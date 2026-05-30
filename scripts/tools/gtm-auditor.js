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

  // Root extraction — modern exports wrap in `containerVersion`, older/flat
  // exports keep tag/trigger/variable at the top level. Support both.
  const cv = container?.containerVersion ?? container ?? {};
  const tags      = cv?.tag      ?? [];
  const triggers  = cv?.trigger  ?? [];
  const variables = cv?.variable ?? [];

  // Abort early if this doesn't look like a GTM export at all. An export must
  // have either an exportFormatVersion (wrapped) OR a containerVersion node
  // OR at least one tag/trigger/variable array to be plausible.
  const hasAnySignal = tags.length || triggers.length || variables.length
    || container?.exportFormatVersion || container?.containerVersion;
  if (!hasAnySignal) {
    return errorReport("Doesn't look like a GTM container export. Use GTM Admin → Export Container and upload that JSON.");
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
    brokenTriggerRefs: [],
  };

  // Build lookup tables once.
  const triggerById = new Map(triggers.map(t => [String(t.triggerId), t]));
  const variableNames = new Set(variables.map(v => v.name).filter(Boolean));
  const referencedTriggerIds = new Set();

  // Count tag names up-front so duplicate detection fires once per name group
  // rather than N-1 times per occurrence.
  const tagNameCounts = {};
  for (const tag of tags) {
    const name = tag.name ?? 'Unnamed Tag';
    tagNameCounts[name] = (tagNameCounts[name] ?? 0) + 1;
  }
  for (const [name, count] of Object.entries(tagNameCounts)) {
    if (count > 1) {
      summary.duplicateTags.push(name);
      issues.push({
        severity: 'warning',
        category: 'Tags',
        title: 'Duplicate tag name',
        detail: `${count} tags share the name "${name}".`,
        fix: 'Rename tags uniquely to prevent confusion. Duplicate names often indicate accidental duplication.',
      });
    }
  }

  // GA4 config tag tracking for "no GA4 config firing" and dup-measurement-id checks.
  const ga4ConfigTags = [];
  const measurementIdToConfigTags = {};

  for (const tag of tags) {
    const name = tag.name ?? 'Unnamed Tag';

    if (tag.paused) {
      summary.pausedTags.push(name);
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
    if (!firingTriggers.length && !tag.paused) {
      summary.orphanedTags.push(name);
      issues.push({
        severity: 'error',
        category: 'Tags',
        title: 'Tag has no firing triggers',
        detail: `"${name}" will never fire — no triggers assigned.`,
        fix: 'Assign at least one firing trigger to this tag, or remove it if unused.',
      });
    }

    // Detect broken trigger references on tags (firing + blocking).
    const allTagTriggers = [...firingTriggers, ...(tag.blockingTriggerId ?? [])];
    for (const id of allTagTriggers) {
      const sid = String(id);
      referencedTriggerIds.add(sid);
      if (!triggerById.has(sid)) {
        summary.brokenTriggerRefs.push({ tag: name, triggerId: sid });
        issues.push({
          severity: 'error',
          category: 'Triggers',
          title: 'Tag references unknown trigger',
          detail: `"${name}" references trigger ID ${sid}, which does not exist in this container.`,
          fix: 'Re-export the container or edit the tag to remove the dangling trigger reference.',
        });
      }
    }

    // GA4 config (googtag): collect for downstream checks.
    if (tag.type === 'googtag') {
      // GA4 stores the measurement ID under `tagId` in newer exports and
      // sometimes still under `measurementId`. Capture either.
      const measurementId = extractParam(tag, 'tagId') ?? extractParam(tag, 'measurementId');
      if (!measurementId) {
        issues.push({
          severity: 'error',
          category: 'GA4',
          title: 'GA4 tag missing Measurement ID',
          detail: `"${name}" has no measurement ID configured.`,
          fix: 'Add your GA4 Measurement ID (format: G-XXXXXXXXXX) to this tag.',
        });
      } else {
        (measurementIdToConfigTags[measurementId] ??= []).push(name);
      }
      ga4ConfigTags.push({ tag, name, measurementId, firingTriggers });
    }

    // GA4 event tag (gaawe): if a measurement ID override is hardcoded
    // (not a tag-reference), surface it under the same map so duplicate
    // detection sees it too. TAG_REFERENCE params point at a config tag —
    // those aren't "duplicate IDs", they're shared config.
    if (tag.type === 'gaawe') {
      const overrideParam = (tag.parameter ?? []).find(p => p.key === 'measurementIdOverride');
      if (overrideParam && overrideParam.type !== 'TAG_REFERENCE' && overrideParam.value) {
        (measurementIdToConfigTags[overrideParam.value] ??= []).push(`${name} (event override)`);
      }
    }

    if (tag.type === 'ua') {
      issues.push({
        severity: 'warning',
        category: 'Tags',
        title: 'Universal Analytics tag detected',
        detail: `"${name}" is a Universal Analytics tag. UA was shut down July 2023 and no longer processes data.`,
        fix: 'Migrate all tracking to GA4 and delete this tag.',
      });
    }

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

    // Walk parameters for {{Variable}} references and flag missing ones.
    collectVariableRefs(tag.parameter).forEach(ref => {
      if (!isVariableResolvable(ref, variableNames)) {
        if (!summary.missingVariables.includes(ref)) summary.missingVariables.push(ref);
        issues.push({
          severity: 'error',
          category: 'Variables',
          title: 'Tag references undefined variable',
          detail: `"${name}" references {{${ref}}}, but no variable with that name exists.`,
          fix: `Create a "${ref}" variable in GTM, or correct the reference in this tag.`,
        });
      }
    });
  }

  // Duplicate GA4 measurement IDs across config tags.
  for (const [mid, names] of Object.entries(measurementIdToConfigTags)) {
    const configCount = names.filter(n => !n.endsWith('(event override)')).length;
    if (configCount > 1) {
      issues.push({
        severity: 'warning',
        category: 'GA4',
        title: 'Duplicate GA4 configuration',
        detail: `Multiple GA4 config tags share measurement ID ${mid}: ${names.join(', ')}.`,
        fix: 'Keep a single GA4 Configuration tag per property. Delete the extras or override the measurement ID on the event side.',
      });
    }
  }

  // "No GA4 config firing" — all GA4 config tags paused/orphaned counts as critical.
  if (ga4ConfigTags.length > 0) {
    const liveConfigs = ga4ConfigTags.filter(c => !c.tag.paused && c.firingTriggers.length > 0);
    if (liveConfigs.length === 0) {
      issues.push({
        severity: 'critical',
        category: 'GA4',
        title: 'No GA4 configuration is firing',
        detail: `All ${ga4ConfigTags.length} GA4 config tag(s) are paused or have no firing trigger. No GA4 hits will be sent.`,
        fix: 'Unpause a GA4 Configuration tag or assign the All Pages trigger so analytics can resume.',
      });
    }

    // GA4 config should fire on a PAGEVIEW-class trigger. Flag any live
    // config that doesn't. (Duplicates tag-sequencer's check on purpose —
    // both tools run independently per the spec.)
    for (const cfg of liveConfigs) {
      const hasPageview = cfg.firingTriggers.some(id => {
        const trig = triggerById.get(String(id));
        return trig && (trig.type === 'PAGEVIEW' || trig.type === 'PAGEVIEW_DOM_READY' || trig.type === 'PAGEVIEW_WINDOW_LOADED');
      });
      if (!hasPageview) {
        issues.push({
          severity: 'warning',
          category: 'GA4',
          title: 'GA4 config tag not on a Pageview trigger',
          detail: `"${cfg.name}" does not fire on any Pageview-class trigger. GA4 config should fire on every page load.`,
          fix: 'Add the built-in "All Pages" trigger (or another Pageview trigger) to this GA4 Configuration tag.',
        });
      }
    }
  }

  // Walk trigger filters/customEventFilter for {{Variable}} refs too.
  for (const trigger of triggers) {
    const refs = [
      ...collectVariableRefs(trigger.parameter),
      ...(trigger.filter ?? []).flatMap(f => collectVariableRefs(f.parameter)),
      ...(trigger.customEventFilter ?? []).flatMap(f => collectVariableRefs(f.parameter)),
      ...(trigger.autoEventFilter ?? []).flatMap(f => collectVariableRefs(f.parameter)),
    ];
    for (const ref of refs) {
      if (!isVariableResolvable(ref, variableNames)) {
        if (!summary.missingVariables.includes(ref)) summary.missingVariables.push(ref);
        issues.push({
          severity: 'error',
          category: 'Variables',
          title: 'Trigger references undefined variable',
          detail: `Trigger "${trigger.name ?? trigger.triggerId}" references {{${ref}}}, but no variable with that name exists.`,
          fix: `Create a "${ref}" variable in GTM, or correct the reference in this trigger.`,
        });
      }
    }

    if (!referencedTriggerIds.has(String(trigger.triggerId))) {
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
    // Variables can reference other variables in their parameters.
    collectVariableRefs(variable.parameter).forEach(ref => {
      // A variable referencing itself is a circular ref but still resolvable.
      if (!isVariableResolvable(ref, variableNames)) {
        if (!summary.missingVariables.includes(ref)) summary.missingVariables.push(ref);
        issues.push({
          severity: 'error',
          category: 'Variables',
          title: 'Variable references undefined variable',
          detail: `Variable "${variable.name}" references {{${ref}}}, but no variable with that name exists.`,
          fix: `Create a "${ref}" variable in GTM, or correct the reference.`,
        });
      }
    });

    if (variable.type === 'jsm') {
      const code = extractParam(variable, 'javascript') ?? '';
      // Code without try OR return is risky — an uncaught throw or implicit
      // undefined will silently break downstream tags. Escalate to warning.
      const hasTry = /\btry\b/.test(code);
      const hasReturn = /\breturn\b/.test(code);
      if (!hasTry && !hasReturn) {
        issues.push({
          severity: 'warning',
          category: 'Variables',
          title: 'Custom JavaScript variable lacks safety guards',
          detail: `"${variable.name}" custom JS has no try/catch and no return — it may throw or yield undefined at runtime.`,
          fix: 'Wrap the body in try/catch and ensure it always returns a default value.',
        });
      } else if (!hasTry) {
        issues.push({
          severity: 'info',
          category: 'Variables',
          title: 'Custom JavaScript variable detected',
          detail: `"${variable.name}" uses custom JavaScript without try/catch. Ensure it handles undefined gracefully.`,
          fix: 'Wrap custom JS variables in try/catch and always return a default value to prevent undefined errors.',
        });
      }
    }
  }

  const sortedIssues = issues.sort(bySeverityThenCategoryThenTitle);

  return {
    tool: 'gtm-auditor',
    status: sortedIssues.some(i => i.severity === 'critical' || i.severity === 'error') ? 'error'
           : sortedIssues.length > 0 ? 'warning'
           : 'pass',
    summary,
    issues: sortedIssues,
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
      // Normalize setupTag/teardownTag from `[{ tagName, ... }]` to plain
      // name arrays — tag-sequencer reads these directly.
      setupTag: (t.setupTag ?? []).map(s => s.tagName).filter(Boolean),
      teardownTag: (t.teardownTag ?? []).map(s => s.tagName).filter(Boolean),
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

// Recursively pull {{Variable Name}} refs out of a parameter array. Params
// can be nested via `list` (array of MAPs) and `map` (array of key/values),
// and the values themselves may contain multiple {{...}} expressions.
function collectVariableRefs(params) {
  const refs = [];
  const re = /\{\{([^}]+)\}\}/g;
  const walk = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue;
      if (typeof p.value === 'string') {
        let m;
        while ((m = re.exec(p.value)) !== null) refs.push(m[1].trim());
      }
      if (Array.isArray(p.list)) walk(p.list);
      if (Array.isArray(p.map)) walk(p.map);
    }
  };
  walk(params);
  return refs;
}

// Built-in GTM variables are not declared in the variable list. The names
// here cover the common defaults shown in GTM's Variables → Configure panel,
// plus `_event` which GTM uses internally for event-name matching.
const BUILTIN_VARIABLES = new Set([
  'Event', '_event',
  'Page URL', 'Page Hostname', 'Page Path', 'Referrer',
  'Click Element', 'Click Classes', 'Click ID', 'Click Target', 'Click URL', 'Click Text',
  'Form Element', 'Form Classes', 'Form ID', 'Form Target', 'Form URL', 'Form Text',
  'History Source', 'New History Fragment', 'Old History Fragment',
  'New History State', 'Old History State', 'History Change Source',
  'Error Message', 'Error URL', 'Error Line', 'Debug Mode',
  'HTML ID',
  'Video Provider', 'Video Status', 'Video URL', 'Video Title', 'Video Duration',
  'Video Current Time', 'Video Percent', 'Video Visible',
  'Scroll Depth Threshold', 'Scroll Depth Units', 'Scroll Direction',
  'Percent Visible', 'On-Screen Duration', 'Visible Element',
  'Container ID', 'Container Version', 'Random Number', 'HTML ID', 'Environment Name',
  'Element Visibility First Time', 'Element Visibility Recent Time',
  'Element Visibility Time', 'Element Visibility Ratio',
  'Click Auto-Event Variable', 'Form Auto-Event Variable',
]);

function isVariableResolvable(name, variableNames) {
  if (!name) return true;
  const trimmed = name.trim();
  if (BUILTIN_VARIABLES.has(trimmed)) return true;
  // Underscore-prefixed names are GTM internal variables (e.g. _event, _url).
  if (trimmed.startsWith('_')) return true;
  return variableNames.has(trimmed);
}

function buildGtmRecommendations(issues, summary) {
  const recs = [];
  if (summary.orphanedTags.length > 0) recs.push(`${summary.orphanedTags.length} tag(s) have no firing triggers and will never execute. Assign triggers or remove them.`);
  if (summary.pausedTags.length > 0) recs.push('Paused tags found. Audit and remove deprecated tags to reduce container complexity.');
  if (summary.orphanedTriggers.length > 0) recs.push('Unused triggers detected. Clean up to simplify container auditing.');
  if (summary.brokenTriggerRefs.length > 0) recs.push('Tags reference trigger IDs that do not exist. Re-export the container or repair the references.');
  if (summary.missingVariables.length > 0) recs.push(`${summary.missingVariables.length} undefined variable reference(s) detected. Create the missing variables or fix the references.`);
  if (summary.tagCount > 50) recs.push('Large container (50+ tags). Consider consolidating tags using Google Tag (gtag.js) where possible.');
  return recs;
}

function bySeverityThenCategoryThenTitle(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  const sa = order[a.severity] ?? 9;
  const sb = order[b.severity] ?? 9;
  if (sa !== sb) return sa - sb;
  const ca = (a.category ?? '').localeCompare(b.category ?? '');
  if (ca !== 0) return ca;
  return (a.title ?? '').localeCompare(b.title ?? '');
}

function errorReport(message) {
  return {
    tool: 'gtm-auditor',
    status: 'error',
    issues: [{ severity: 'error', category: 'Input', title: 'Invalid input', detail: message, fix: 'Export your GTM container from Admin → Export Container in GTM.' }],
    summary: {},
    recommendations: [],
    architecture: { tags: [], triggers: [], variables: [] },
  };
}

export function run(data) { return auditGtm(data); }
