// scripts/tools/tag-sequencer.js

import { auditGtm } from './gtm-auditor.js';

export function analyzeSequencing(json) {
  const base = auditGtm(json);
  if (base.status === 'error' && !base.architecture) return base;

  const { tags, triggers } = base.architecture;
  const issues = [];
  const sequenceMap = [];

  for (const tag of tags) {
    const setupTag = tag.setupTag ?? null;
    if (setupTag) {
      sequenceMap.push({ tag: tag.name, dependsOn: setupTag, type: 'setup' });
    }
    const teardownTag = tag.teardownTag ?? null;
    if (teardownTag) {
      sequenceMap.push({ tag: tag.name, followedBy: teardownTag, type: 'teardown' });
    }
  }

  const ga4Tags = tags.filter(t => t.type === 'googtag' || t.name?.toLowerCase().includes('ga4'));
  const eventTags = tags.filter(t => t.name?.toLowerCase().includes('event') && !t.name?.toLowerCase().includes('ga4 config'));

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
    summary: base.summary,
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
