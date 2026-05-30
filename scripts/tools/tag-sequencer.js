// scripts/tools/tag-sequencer.js

import { auditGtm } from './gtm-auditor.js';

// Trigger types that semantically fire on (or by) initial page load. GA4
// auto-loads its config tag on the same pageview, so events sharing a
// pageview-class trigger with config don't strictly need an explicit setup dep.
const PAGEVIEW_TRIGGER_TYPES = new Set([
  'PAGEVIEW',
  'PAGEVIEW_GTM',
  'DOM_READY',
  'WINDOW_LOADED',
]);

const SEVERITY_ORDER = { critical: 0, error: 1, warning: 2, info: 3 };

export function analyzeSequencing(json) {
  const base = auditGtm(json);
  // If the auditor bailed with an error (bad input, HAR, etc.), pass its
  // message through unchanged — it's more useful than running with empty arrays.
  if (base.status === 'error' && !base.architecture?.tags?.length) return base;
  if (!base.architecture) return base;

  const { tags, triggers } = base.architecture;
  const issues = [];
  const sequenceMap = [];

  // Normalize setup/teardown entries: gtm-auditor now hands us plain strings,
  // but tolerate raw {tagName} objects in case the upstream change hasn't landed.
  const normalizeRef = (ref) => {
    if (!ref) return null;
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'object' && typeof ref.tagName === 'string') return ref.tagName;
    return null;
  };

  for (const tag of tags) {
    for (const s of tag.setupTag ?? []) {
      const name = normalizeRef(s);
      if (name) sequenceMap.push({ tag: tag.name, dependsOn: name, type: 'setup' });
    }
    for (const td of tag.teardownTag ?? []) {
      const name = normalizeRef(td);
      if (name) sequenceMap.push({ tag: tag.name, followedBy: name, type: 'teardown' });
    }
  }

  const tagNames = new Set(tags.map(t => t.name));
  const triggerById = new Map(triggers.map(t => [t.id, t]));
  const isPageviewTrigger = (trg) =>
    trg && (PAGEVIEW_TRIGGER_TYPES.has(trg.type) || /\ball pages\b/i.test(trg.name ?? ''));

  // Orphan setup references: depends on a tag that doesn't exist.
  for (const entry of sequenceMap) {
    const ref = entry.dependsOn ?? entry.followedBy;
    if (ref && !tagNames.has(ref)) {
      issues.push({
        severity: 'error',
        category: 'Sequencing',
        title: 'Orphan setup/teardown reference',
        detail: `"${entry.tag}" references "${ref}" as a ${entry.type} tag, but no tag with that name exists.`,
        fix: 'Either restore the missing tag or remove this dangling sequencing reference in GTM → Advanced Settings → Tag Sequencing.',
      });
    }
  }

  // Circular dependency detection over the setup graph.
  const setupGraph = new Map();
  for (const entry of sequenceMap) {
    if (entry.type !== 'setup') continue;
    if (!setupGraph.has(entry.tag)) setupGraph.set(entry.tag, []);
    setupGraph.get(entry.tag).push(entry.dependsOn);
  }
  const cycles = findCycles(setupGraph);
  const reportedCycles = new Set();
  for (const cycle of cycles) {
    const key = canonicalCycleKey(cycle);
    if (reportedCycles.has(key)) continue;
    reportedCycles.add(key);
    issues.push({
      severity: 'critical',
      category: 'Sequencing',
      title: 'Circular setup dependency',
      detail: `Setup tags form a cycle: ${cycle.join(' → ')} → ${cycle[0]}. GTM cannot resolve firing order.`,
      fix: 'Break the cycle in GTM → Advanced Settings → Tag Sequencing by removing one of the setup-tag references.',
    });
  }

  const activeTags = tags.filter(t => !t.paused && (t.firingTriggers?.length ?? 0) > 0);

  // Type-first classification; only fall back to name heuristics when type is missing/unknown.
  const isGa4Config = (t) =>
    t.type === 'googtag' || (!t.type && /ga4\s*(configuration|config)/i.test(t.name ?? ''));
  const isGa4Event = (t) =>
    t.type === 'gaawe' || (!t.type && /ga4.*event/i.test(t.name ?? ''));

  const ga4ConfigTags = activeTags.filter(isGa4Config);
  const ga4EventTags = activeTags.filter(isGa4Event);

  const ga4ConfigTriggerIds = new Set();
  for (const cfg of ga4ConfigTags) {
    for (const id of cfg.firingTriggers ?? []) ga4ConfigTriggerIds.add(id);
  }

  let tagsFiringWithoutDep = 0;
  for (const eventTag of ga4EventTags) {
    const hasDependency = sequenceMap.some(
      s => s.tag === eventTag.name && s.type === 'setup' &&
        ga4ConfigTags.some(cfg => cfg.name === s.dependsOn),
    );
    if (hasDependency || ga4ConfigTags.length === 0) continue;

    tagsFiringWithoutDep++;

    const eventTriggers = (eventTag.firingTriggers ?? [])
      .map(id => triggerById.get(id))
      .filter(Boolean);
    const sharesConfigTrigger = (eventTag.firingTriggers ?? [])
      .some(id => ga4ConfigTriggerIds.has(id));
    const firesOnPageview = eventTriggers.some(isPageviewTrigger);

    // GTM auto-loads the config tag on the same pageview, so co-triggered or
    // pageview-class events don't strictly need an explicit setup dep — info only.
    const severity = (sharesConfigTrigger || firesOnPageview) ? 'info' : 'warning';
    const detail = severity === 'info'
      ? `"${eventTag.name}" has no explicit setup dependency, but fires on a pageview/shared trigger so GA4 config will load alongside it.`
      : `"${eventTag.name}" fires on a non-pageview trigger without an explicit setup dependency on a GA4 config tag. It may fire before gtag.js is initialized.`;

    issues.push({
      severity,
      category: 'Sequencing',
      title: 'GA4 event tag may fire before config tag',
      detail,
      fix: 'In GTM, edit this event tag → Advanced Settings → Tag Sequencing → "Fire a tag before [this tag] fires" and select your GA4 Configuration tag.',
    });
  }

  for (const ga4Tag of ga4ConfigTags) {
    const tagTriggerIds = ga4Tag.firingTriggers ?? [];
    const hasAllPages = tagTriggerIds
      .map(id => triggerById.get(id))
      .filter(Boolean)
      .some(isPageviewTrigger);

    if (!hasAllPages) {
      issues.push({
        severity: 'error',
        category: 'Sequencing',
        title: 'GA4 config tag not firing on All Pages',
        detail: `"${ga4Tag.name}" should fire on every page load but no pageview-class trigger (All Pages / DOM Ready / Window Loaded) is attached.`,
        fix: 'Add the built-in "All Pages" trigger (or a pageview-class equivalent) to your GA4 Configuration tag.',
      });
    }
  }

  const mergedIssues = [...base.issues, ...issues].sort(byIssue);

  return {
    tool: 'tag-sequencer',
    status: mergedIssues.some(i => i.severity === 'error' || i.severity === 'critical') ? 'error'
          : mergedIssues.some(i => i.severity === 'warning') ? 'warning'
          : 'pass',
    issues: mergedIssues,
    sequenceMap,
    architecture: base.architecture ?? null,
    summary: {
      ...base.summary,
      sequenceMapEntries: sequenceMap.length,
      tagsWithSetupDeps: sequenceMap.filter(s => s.type === 'setup').length,
      tagsWithTeardownDeps: sequenceMap.filter(s => s.type === 'teardown').length,
      ga4ConfigTagsCount: ga4ConfigTags.length,
      ga4EventTagsCount: ga4EventTags.length,
      tagsFiringWithoutDep,
    },
    recommendations: [
      ...base.recommendations,
      'Always set GA4 Configuration tag as a setup dependency for GA4 event tags that fire on non-pageview triggers.',
      'Use GTM Preview mode to verify firing order before publishing.',
    ],
  };
}

// DFS-based cycle finder over the setup-dependency graph. Returns the node
// sequence forming each cycle (cycle starts and ends on the same node).
function findCycles(graph) {
  const cycles = [];
  const stack = [];
  const onStack = new Set();
  const visited = new Set();

  function dfs(node) {
    if (onStack.has(node)) {
      const start = stack.indexOf(node);
      if (start !== -1) cycles.push(stack.slice(start));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    onStack.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) dfs(next);
    stack.pop();
    onStack.delete(node);
  }

  for (const node of graph.keys()) dfs(node);
  return cycles;
}

// Canonicalize a cycle so {A→B→A} and {B→A→B} dedupe to the same key.
function canonicalCycleKey(cycle) {
  if (!cycle.length) return '';
  let minIdx = 0;
  for (let i = 1; i < cycle.length; i++) {
    if (cycle[i] < cycle[minIdx]) minIdx = i;
  }
  return [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)].join('|');
}

function byIssue(a, b) {
  const sev = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
  if (sev !== 0) return sev;
  return (a.title ?? '').localeCompare(b.title ?? '');
}

export function run(data) { return analyzeSequencing(data); }
