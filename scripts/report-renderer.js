// scripts/report-renderer.js
// Renders tool output into a results container in the main composer view.

const SEVERITY_COLORS = {
  critical: 'var(--status-bad)',
  error:    'var(--status-bad)',
  warning:  'var(--status-warn)',
  info:     'var(--status-info)',
  pass:     'var(--status-good)',
};

const SEVERITY_LABELS = {
  critical: '● Critical',
  error:    '● Error',
  warning:  '◐ Warning',
  info:     '○ Info',
  pass:     '✓ Pass',
};

export function renderReport(result, container) {
  container.innerHTML = '';
  container.classList.add('tool-result--visible');

  const banner = el('div', 'tool-result__banner');
  banner.style.borderColor = SEVERITY_COLORS[result.status] ?? SEVERITY_COLORS.info;
  banner.innerHTML = `
    <span class="tool-result__status" style="color:${SEVERITY_COLORS[result.status]}">${SEVERITY_LABELS[result.status] ?? result.status}</span>
    <span class="tool-result__tool-name">${toolLabel(result.tool)}</span>
    <div class="tool-result__actions">
      <button class="icon-button" id="tr-copy-all">Copy all</button>
      <button class="icon-button" id="tr-export">Export .md</button>
    </div>
  `;
  container.appendChild(banner);

  if (result.summary && Object.keys(result.summary).length) {
    container.appendChild(summaryCard(result.summary));
  }

  if (result.issues?.length) {
    const section = el('section', 'tool-result__section');
    section.innerHTML = `<h3 class="tool-result__heading">Issues <span class="tool-result__count">${result.issues.length}</span></h3>`;
    result.issues.forEach(issue => section.appendChild(issueCard(issue)));
    container.appendChild(section);
  } else {
    const pass = el('div', 'tool-result__pass');
    pass.textContent = 'No issues detected.';
    container.appendChild(pass);
  }

  if (result.recommendations?.length) {
    const section = el('section', 'tool-result__section');
    section.innerHTML = `<h3 class="tool-result__heading">Recommendations</h3>`;
    const list = el('ul', 'tool-result__rec-list');
    result.recommendations.forEach(r => {
      const li = el('li', 'tool-result__rec-item');
      li.textContent = r;
      list.appendChild(li);
    });
    section.appendChild(list);
    container.appendChild(section);
  }

  if (result.architecture) {
    container.appendChild(architectureCard(result.architecture));
  }

  if (result.sequenceMap?.length) {
    container.appendChild(sequenceCard(result.sequenceMap));
  }

  wireCopyAll(container, result);
  wireExport(container, result);
}

function summaryCard(summary) {
  const card = el('div', 'tool-result__card');
  card.innerHTML = `<h3 class="tool-result__card-title">Summary</h3>`;
  const grid = el('div', 'tool-result__summary-grid');
  for (const [key, val] of Object.entries(summary)) {
    if (val === null || val === undefined || (Array.isArray(val) && !val.length)) continue;
    const item = el('div', 'tool-result__summary-item');
    item.innerHTML = `<span class="tool-result__summary-label">${formatKey(key)}</span><span class="tool-result__summary-value">${formatVal(val)}</span>`;
    grid.appendChild(item);
  }
  card.appendChild(grid);
  return card;
}

function issueCard(issue) {
  const card = el('div', `tool-result__issue tool-result__issue--${issue.severity}`);
  card.style.borderLeftColor = SEVERITY_COLORS[issue.severity] ?? 'var(--border-default)';
  card.innerHTML = `
    <div class="tool-result__issue-header">
      <span class="tool-result__issue-severity" style="color:${SEVERITY_COLORS[issue.severity]}">${SEVERITY_LABELS[issue.severity]}</span>
      <span class="tool-result__issue-category">${issue.category}</span>
      <button class="tool-result__copy-btn" title="Copy this issue">⎘</button>
    </div>
    <p class="tool-result__issue-title">${issue.title}</p>
    ${issue.detail ? `<p class="tool-result__issue-detail">${issue.detail}</p>` : ''}
    ${issue.fix ? `<div class="tool-result__issue-fix"><span class="tool-result__fix-label">Fix:</span> ${issue.fix}</div>` : ''}
  `;
  card.querySelector('.tool-result__copy-btn').addEventListener('click', e => {
    copyToClipboard(issueToText(issue));
    flashCopied(e.currentTarget);
  });
  return card;
}

function architectureCard(arch) {
  const card = el('div', 'tool-result__card');
  card.innerHTML = `
    <h3 class="tool-result__card-title">Container Architecture</h3>
    <div class="tool-result__arch">
      <div class="tool-result__arch-section">
        <h4>Tags (${arch.tags.length})</h4>
        <ul>${arch.tags.map(t => `<li class="${t.paused ? 'paused' : ''}">${t.name} <span class="tool-result__tag-type">${t.type}</span>${t.paused ? ' <em>(paused)</em>' : ''}</li>`).join('')}</ul>
      </div>
      <div class="tool-result__arch-section">
        <h4>Triggers (${arch.triggers.length})</h4>
        <ul>${arch.triggers.map(t => `<li>${t.name} <span class="tool-result__tag-type">${t.type}</span></li>`).join('')}</ul>
      </div>
      <div class="tool-result__arch-section">
        <h4>Variables (${arch.variables.length})</h4>
        <ul>${arch.variables.map(v => `<li>${v.name} <span class="tool-result__tag-type">${v.type}</span></li>`).join('')}</ul>
      </div>
    </div>
  `;
  return card;
}

function sequenceCard(seq) {
  const card = el('div', 'tool-result__card');
  card.innerHTML = `<h3 class="tool-result__card-title">Tag Sequence Map</h3>`;
  const list = el('ul', 'tool-result__seq-list');
  seq.forEach(s => {
    const li = el('li', 'tool-result__seq-item');
    li.textContent = s.type === 'setup'
      ? `${s.dependsOn} → ${s.tag}`
      : `${s.tag} → ${s.followedBy}`;
    list.appendChild(li);
  });
  card.appendChild(list);
  return card;
}

function wireCopyAll(container, result) {
  container.querySelector('#tr-copy-all')?.addEventListener('click', e => {
    copyToClipboard(resultToMarkdown(result));
    flashCopied(e.currentTarget);
  });
}

function wireExport(container, result) {
  container.querySelector('#tr-export')?.addEventListener('click', () => {
    const md = resultToMarkdown(result);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cat-report-${result.tool}-${Date.now()}.md`;
    a.click();
  });
}

function resultToMarkdown(result) {
  const lines = [`# CAT Report — ${toolLabel(result.tool)}`, `**Status:** ${result.status}`, ''];
  if (result.summary) {
    lines.push('## Summary');
    for (const [k, v] of Object.entries(result.summary)) {
      if (v !== null && v !== undefined) lines.push(`- **${formatKey(k)}:** ${formatVal(v)}`);
    }
    lines.push('');
  }
  if (result.issues?.length) {
    lines.push(`## Issues (${result.issues.length})`);
    result.issues.forEach(i => lines.push(issueToText(i), ''));
  }
  if (result.recommendations?.length) {
    lines.push('## Recommendations');
    result.recommendations.forEach(r => lines.push(`- ${r}`));
  }
  return lines.join('\n');
}

function issueToText(issue) {
  return [`[${issue.severity.toUpperCase()}] ${issue.title}`, issue.detail, `Fix: ${issue.fix}`].filter(Boolean).join('\n');
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function flashCopied(btn) {
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
}

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function toolLabel(id) {
  const map = {
    'har-auditor':   'HAR File Audit',
    'gtm-auditor':   'GTM Container Audit',
    'ga4-checker':   'GA4 Config Check',
    'discrepancy':   'Cross-Platform Reconciliation',
    'tag-sequencer': 'Tag Sequencing Analysis',
    'cookie-auditor': 'Cookie & Consent Audit',
  };
  return map[id] ?? id;
}

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function formatVal(val) {
  if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return val ?? '—';
}
