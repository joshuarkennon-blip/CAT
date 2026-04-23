// scripts/tools/tag-sequencer.js

import { auditGtm } from './gtm-auditor.js';

export function analyzeSequencing(json) {
  const base = auditGtm(json);
  // Fix #3: GUARD CONDITION — guard on missing architecture only, not on error status
  if (!base.architecture) return base;

  const { tags, triggers } = base.architecture;
  const issues = [];
  const sequenceMap = [];

  // Fix #1: SETUP/TEARDOWN STRUCTURE — extract .tagName from array objects
  for (const tag of tags) {
    const setupTags = tag.setupTag ?? [];
    for (const s of setupTags) {
      sequenceMap.push({ tag: tag.name, dependsOn: s, type: 'setup' });
    }
    const teardownTags = tag.teardownTag ?? [];
    for (const td of teardownTags) {
      sequenceMap.push({ tag: tag.name, followedBy: td, type: 'teardown' });
    }
  }

  // Fix #5: ACTIVE TAGS ONLY — filter out paused/trigger-less tags
  const activeTags = tags.filter(t => !t.paused && (t.firingTriggers?.length ?? 0) > 0);

  // Fix #2: GA4 EVENT TAG DETECTION — include gaawe type
  const ga4Tags = activeTags.filter(t => t.type === 'googtag' || t.name?.toLowerCase().includes('ga4'));
  const eventTags = activeTags.filter(t =>
    (t.name?.toLowerCase().includes('event') || t.type === 'gaawe') &&
    !t.name?.toLowerCase().includes('ga4 config')
  );

  for (const eventTag of eventTags) {
    const hasDependency = sequenceMap.some(s => s.tag === eventTag.name && s.type === 'setup');
    if (!hasDependency && ga4Tags.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'Sequencing',
        title: 'GA4 event tag may fire before config tag',
        detail: `"${eventTag.name}" has no explicit setup tag dependency on a GA4 config tag.`,
        fix: 'In GTM, edit this event tag → Advanced Settings → Tag Sequencing → "Fire a tag before [this tag] fires" and select your GA4 Configuration tag.',
      });
    }
  }

  for (const ga4Tag of ga4Tags) {
    const tagTriggers = ga4Tag.firingTriggers ?? [];
    const hasAllPages = triggers
      .filter(t => tagTriggers.includes(t.id))
      .some(t => t.type === 'PAGEVIEW' || t.name?.toLowerCase().includes('all pages'));

    if (!hasAllPages) {
      issues.push({
        severity: 'error',
        category: 'Sequencing',
        title: 'GA4 config tag not firing on All Pages',
        detail: `"${ga4Tag.name}" should fire on every page load but no All Pages trigger detected.`,
        fix: 'Add the built-in "All Pages" trigger to your GA4 Configuration tag.',
      });
    }
  }

  return {
    tool: 'tag-sequencer',
    status: issues.filter(i => i.severity === 'error').length > 0 ? 'error'
          : issues.length > 0 ? 'warning'
          : 'pass',
    issues: [...base.issues, ...issues].sort(bySeverity),
    sequenceMap,
    architecture: base.architecture ?? null,
    // Fix #4: SUMMARY — add sequencing-specific fields
    summary: {
      ...base.summary,
      sequenceMapEntries: sequenceMap.length,
      tagsWithSetupDeps: sequenceMap.filter(s => s.type === 'setup').length,
      tagsWithTeardownDeps: sequenceMap.filter(s => s.type === 'teardown').length,
    },
    recommendations: [
      ...base.recommendations,
      'Always set GA4 Configuration tag as a setup dependency for all GA4 event tags.',
      'Use GTM Preview mode to verify firing order before publishing.',
    ],
  };
}

function bySeverity(a, b) {
  const order = { critical: 0, error: 1, warning: 2, info: 3 };
  return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
}

export function run(data) { return analyzeSequencing(data); }
