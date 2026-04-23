/* CAT — Report view
 * Mounts the sticky cat and wires copy/export buttons.
 */

import { mountCat } from "./cat.js";
import { resolveCatAssetOptions } from "./cat-assets.js";
import { maybeMountCatDebugPanel } from "./cat-debug-panel.js";
import { DEFAULT_CAT_ASSET_CONFIG } from "./cat-default-asset.js";
import { initReportEntrance } from "./cat-transition.js";
import { mountReportChat } from "./report-chat.js";

function init() {
  const catStage = document.querySelector("[data-cat]");
  const assetOptions = resolveCatAssetOptions(catStage, DEFAULT_CAT_ASSET_CONFIG);

  // Mount chat panel before cat so the onClick below can reference it
  const chatVideoSrc = assetOptions.asset?.src ?? window.CAT_ASSET_CONFIG?.src ?? "";
  const chat = mountReportChat(chatVideoSrc);

  const cat = mountCat(catStage, {
    state: "idle",
    ...assetOptions,
    onClick: () => {
      cat?.setState("attentive");
      chat.open();
      setTimeout(() => cat?.setState("idle"), 1400);
    },
  });
  maybeMountCatDebugPanel({
    cat,
    catStage,
    initialAsset: assetOptions.asset,
  });

  initReportEntrance();

  // Rename "Export .md" buttons to "Export notes"
  document.querySelectorAll("[data-export='markdown']").forEach((btn) => {
    btn.textContent = "Export notes";
  });

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => handleCopy(btn));
  });

  document.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => handleExport(btn));
  });
}

function handleExport(btn) {
  const type = btn.dataset.export;
  if (type === "pdf") {
    printReport(btn);
  } else if (type === "markdown") {
    generateTechnicalNotes(btn);
  } else {
    // Other export types (share, etc.) — original flash stub
    flash(btn, "Queued");
  }
}

/* ─── PDF Export ──────────────────────────────────────────────────────────── */

function printReport(btn) {
  flash(btn, "Printing…");
  document.body.classList.add("printing");
  // Small delay so the class settles before the print dialog opens
  setTimeout(() => {
    window.print();
    document.body.classList.remove("printing");
  }, 80);
}

/* ─── Technical Notes Export ─────────────────────────────────────────────── */

function generateTechnicalNotes(btn) {
  flash(btn, "Building…");

  // Try sessionStorage first; fall back to scraping the static DOM
  let reportData = null;
  try {
    const raw = sessionStorage.getItem("cat-report-data");
    if (raw) reportData = JSON.parse(raw);
  } catch (_) {
    // ignore
  }

  const text = reportData
    ? buildNotesFromData(reportData)
    : buildNotesFromDOM();

  const now = new Date();
  const dateSlug = now.toISOString().slice(0, 10);

  // Derive container ID from the meta row for the filename
  const metaEls = document.querySelectorAll(".report-header__meta span");
  let containerId = "audit";
  metaEls.forEach((el) => {
    const t = el.textContent.trim().toLowerCase();
    if (t.startsWith("container")) {
      containerId = t.replace(/^container\s*[·•\-:]\s*/i, "").replace(/\s+/g, "-");
    }
  });

  const filename = `cat-${containerId}-${dateSlug}.txt`;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  setTimeout(() => flash(btn, "Saved"), 400);
}

/* Build plain-text notes from structured sessionStorage data */
function buildNotesFromData(data) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 16);
  const tool = data.tool ?? "GTM Container Audit";
  const runDate = data.runDate ?? "—";
  const containerId = data.containerId ?? "—";

  const lines = [];

  lines.push("CAT — TECHNICAL ANALYSIS REPORT");
  lines.push("================================");
  lines.push(`Tool:      ${tool}`);
  lines.push(`Run:       ${runDate}`);
  lines.push(`Container: ${containerId}`);
  lines.push(`Generated: ${now} UTC`);
  lines.push("");

  lines.push("EXECUTIVE SUMMARY");
  lines.push("-----------------");
  if (data.summary) {
    lines.push(data.summary);
  } else {
    const highCount = (data.issues ?? []).filter(
      (i) => i.severity === "high" || i.severity === "critical"
    ).length;
    const total = (data.issues ?? []).length;
    lines.push(
      `This audit reviewed ${tool.toLowerCase()} and identified ${total} issue${total !== 1 ? "s" : ""}, ` +
        `${highCount} of which ${highCount !== 1 ? "are" : "is"} high severity and require immediate attention. ` +
        `Review the findings below and apply the recommended fixes before the next container publish.`
    );
  }
  lines.push("");

  if (data.issues?.length) {
    lines.push("FINDINGS");
    lines.push("========");
    lines.push("");
    data.issues.forEach((issue, idx) => {
      const sev = (issue.severity ?? "info").toUpperCase();
      const title = (issue.title ?? "Untitled").toUpperCase();
      lines.push(`[${idx + 1}] ${title} — ${sev} SEVERITY`);
      lines.push("-".repeat(Math.min(60, `[${idx + 1}] ${title} — ${sev} SEVERITY`.length)));
      lines.push("");
      lines.push("What was found:");
      lines.push(`  ${issue.detail ?? issue.title ?? ""}`);
      lines.push("");
      if (issue.impact) {
        lines.push("Why this matters:");
        lines.push(`  ${issue.impact}`);
        lines.push("");
      }
      if (issue.fix) {
        lines.push("How to fix it:");
        lines.push(`  ${issue.fix}`);
        lines.push("");
      }
      if (issue.category || issue.tag || issue.trigger) {
        lines.push("Technical context:");
        if (issue.category) lines.push(`  Category: ${issue.category}`);
        if (issue.tag) lines.push(`  Tag: ${issue.tag}`);
        if (issue.trigger) lines.push(`  Trigger: ${issue.trigger}`);
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    });
  }

  if (data.recommendations?.length) {
    lines.push("RECOMMENDATIONS");
    lines.push("===============");
    lines.push("");
    data.recommendations.forEach((rec, idx) => {
      lines.push(`${idx + 1}. ${rec}`);
      lines.push("");
    });
  }

  if (data.nextSteps?.length) {
    lines.push("NEXT STEPS");
    lines.push("==========");
    lines.push("");
    data.nextSteps.forEach((step) => {
      lines.push(`[ ] ${step}`);
    });
    lines.push("");
  }

  lines.push("---");
  lines.push("Generated by CAT — Companion Analytics Toolkit");

  return lines.join("\n");
}

/* Build plain-text notes by scraping the static report DOM */
function buildNotesFromDOM() {
  const now = new Date().toISOString().replace("T", " ").slice(0, 16);

  // Extract meta fields from the report header
  const metaEls = document.querySelectorAll(".report-header__meta span");
  let tool = "GTM Container Audit";
  let runDate = "—";
  let containerId = "—";
  metaEls.forEach((el) => {
    const raw = el.textContent.trim();
    const lower = raw.toLowerCase();
    if (lower.startsWith("tool")) {
      tool = raw.replace(/^tool\s*[·•\-:]\s*/i, "");
    } else if (lower.startsWith("run")) {
      runDate = raw.replace(/^run\s*[·•\-:]\s*/i, "");
    } else if (lower.startsWith("container")) {
      containerId = raw.replace(/^container\s*[·•\-:]\s*/i, "");
    }
  });

  const reportTitle = document.querySelector(".report-header__title")?.textContent?.trim() ?? tool;
  const reportSummary = document.querySelector(".report-header__summary")?.textContent?.trim() ?? "";

  const lines = [];

  lines.push("CAT — TECHNICAL ANALYSIS REPORT");
  lines.push("================================");
  lines.push(`Tool:      ${reportTitle}`);
  lines.push(`Run:       ${runDate}`);
  lines.push(`Container: ${containerId}`);
  lines.push(`Generated: ${now} UTC`);
  lines.push("");

  lines.push("EXECUTIVE SUMMARY");
  lines.push("-----------------");
  lines.push(reportSummary || `This report contains the findings from the ${tool} run on ${runDate}.`);
  lines.push("");

  // Findings
  const findings = document.querySelectorAll(".finding");
  if (findings.length) {
    lines.push("FINDINGS");
    lines.push("========");
    lines.push("");

    findings.forEach((el, idx) => {
      const severity = (el.dataset.severity ?? "info").toUpperCase();
      const titleEl = el.querySelector(".finding__title");
      const detailEl = el.querySelector(".finding__detail");
      const metaEl = el.querySelector(".finding__meta");

      const title = (titleEl?.textContent?.trim() ?? "Untitled").toUpperCase();
      const detail = detailEl?.textContent?.trim() ?? "";
      const meta = metaEl?.textContent?.trim() ?? "";

      const header = `[${idx + 1}] ${title} — ${severity} SEVERITY`;
      lines.push(header);
      lines.push("-".repeat(Math.min(72, header.length)));
      lines.push("");

      lines.push("What was found:");
      lines.push(`  ${detail}`);
      lines.push("");

      const impactMap = {
        HIGH: "This is a high-severity issue that directly affects data accuracy and business decisions. Revenue figures, attribution, or compliance may be materially impacted. Address this before the next container publish.",
        MEDIUM: "This issue introduces risk to data quality or compliance. It may cause intermittent inaccuracies or create a consent gap. Plan to fix within the current sprint.",
        LOW: "This is a low-severity housekeeping issue. It does not affect data accuracy today but adds unnecessary weight to the container and may cause confusion during future audits.",
        OK: "No action required. This area passed the audit check.",
      };
      const impact = impactMap[severity] ?? "Review this finding and determine the appropriate response based on your data governance requirements.";

      lines.push("Why this matters:");
      lines.push(`  ${impact}`);
      lines.push("");

      if (meta) {
        lines.push("Technical context:");
        meta.split("·").forEach((part) => {
          lines.push(`  ${part.trim()}`);
        });
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    });
  }

  // Recommendations
  const recs = document.querySelectorAll(".recommendation");
  if (recs.length) {
    lines.push("RECOMMENDATIONS");
    lines.push("===============");
    lines.push("");

    recs.forEach((el, idx) => {
      const h4 = el.querySelector("h4");
      const p = el.querySelector("p");
      const heading = h4?.textContent?.trim() ?? "";
      const body = p?.textContent?.trim() ?? "";

      lines.push(`${idx + 1}. ${heading}`);
      if (body) {
        lines.push("");
        lines.push(`   ${body}`);
      }
      lines.push("");
    });
  }

  // Next steps
  const steps = document.querySelectorAll(".next-step");
  if (steps.length) {
    lines.push("NEXT STEPS");
    lines.push("==========");
    lines.push("");

    steps.forEach((el) => {
      // Clone so we don't mutate the live DOM
      const clone = el.cloneNode(true);
      const check = clone.querySelector(".next-step__check");
      if (check) check.remove();
      const text = clone.textContent.trim();
      lines.push(`[ ] ${text}`);
    });
    lines.push("");
  }

  lines.push("---");
  lines.push("Generated by CAT — Companion Analytics Toolkit");

  return lines.join("\n");
}

/* ─── Shared utilities ───────────────────────────────────────────────────── */

async function handleCopy(btn) {
  const targetSelector = btn.getAttribute("data-copy");
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const text = target.innerText.trim();
  try {
    await navigator.clipboard.writeText(text);
    flash(btn, "Copied");
  } catch {
    flash(btn, "Failed");
  }
}

function flash(btn, label) {
  const original = btn.dataset.label || btn.textContent.trim();
  btn.dataset.label = original;
  btn.textContent = label;
  setTimeout(() => {
    btn.textContent = original;
  }, 1200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
