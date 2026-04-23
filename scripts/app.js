/* CAT — Homepage interactions
 * Composer submit, tool dropdown, cat state transitions, example chips.
 */

import { mountCat } from "./cat.js";
import { resolveCatAssetOptions } from "./cat-assets.js";
import { maybeMountCatDebugPanel } from "./cat-debug-panel.js";
import { DEFAULT_CAT_ASSET_CONFIG } from "./cat-default-asset.js";
import { mountScene } from "./scene.js";
import { mountMusicPlayer } from "./music-player.js";
import { mountInteractions } from "./interactions.js";
import { TOOLS } from "./tools-registry.js";
import { route } from "./router.js";
import { renderReport } from "./report-renderer.js";
import { transitionToReport } from "./cat-transition.js";

const EXAMPLES = [
  "Audit my GTM container",
  "Check my HAR file for tracking errors",
  "Review my GA4 configuration",
  "Why aren't my conversions firing?",
  "Find tag sequencing problems in my container",
  "Check cookie compliance on this HAR file",
];

let _selectedToolId = null;
let _toolResultEl = null;
let _attachments = [];
let _attachmentsEl = null;
let _fileInputEl = null;

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20MB

function init() {
  const hero         = document.querySelector("[data-hero]");
  const sceneWrapper = document.querySelector("[data-scene]");
  const catStage     = document.querySelector("[data-cat]");
  const monitorUI    = document.querySelector("[data-monitor-ui]");
  const monitorFace  = document.querySelector("[data-monitor-face]");

  const scene = mountScene(sceneWrapper, hero);
  scene.positionCat(catStage);
  scene.positionUI(monitorUI);
  if (monitorFace) scene.positionMonitorFace(monitorFace);

  const assetOptions = resolveCatAssetOptions(catStage, DEFAULT_CAT_ASSET_CONFIG);
  const cat = mountCat(catStage, {
    state: "idle",
    ...assetOptions,
  });
  maybeMountCatDebugPanel({
    cat,
    catStage,
    initialAsset: assetOptions.asset,
  });
  mountMusicPlayer(scene);
  mountInteractions(scene);

  _toolResultEl = getOrCreateToolResult();
  _attachmentsEl = document.querySelector("[data-attachments]");
  _fileInputEl = document.querySelector("[data-file-input]");

  bindComposer(cat, hero, scene, catStage);
  bindToolSelect();
  bindExamples(cat);
  bindAttachments(cat);
}

function getOrCreateToolResult() {
  let el = document.getElementById("tool-result");
  if (!el) {
    el = document.createElement("div");
    el.id = "tool-result";
    el.className = "tool-result";
    document.querySelector(".app-shell")?.appendChild(el);
  }
  return el;
}

function bindComposer(cat, hero, scene, catStage) {
  const form = document.querySelector("[data-composer]");
  const input = document.querySelector("[data-composer-input]");
  const submit = document.querySelector("[data-composer-submit]");

  if (!form || !input) return;

  const monitorUI = document.querySelector("[data-monitor-ui]");

  const engage = () => {
    hero?.classList.add("hero--engaged");
    scene?.moveCatToMonitor(catStage);
  };

  // force=true disengages even when there's text (ESC / click-outside)
  const disengage = (force = false) => {
    if (force || !input.value.trim()) {
      hero?.classList.remove("hero--engaged");
      scene?.moveCatToDesk(catStage);
      cat?.setState("idle");
    }
  };

  input.addEventListener("focus", engage);
  input.addEventListener("blur", (e) => {
    if (monitorUI?.contains(e.relatedTarget)) return;
    disengage();
  });

  // Click anywhere outside the monitor UI → disengage
  document.addEventListener("click", (e) => {
    if (hero?.classList.contains("hero--engaged") && !monitorUI?.contains(e.target)) {
      input.blur();
      disengage(true);
    }
  }, { capture: true });

  // ESC → always disengage and clear focus
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && hero?.classList.contains("hero--engaged")) {
      e.preventDefault();
      input.blur();
      disengage(true);
    }
  });

  const updateSubmitState = () => {
    submit.disabled = input.value.trim().length === 0;
  };
  updateSubmitState();

  input.addEventListener("input", () => {
    updateSubmitState();
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 240) + "px";
    cat?.setState(input.value.trim().length > 0 ? "attentive" : "idle");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text && !_selectedToolId && !_attachments.length) return;
    await runTool(text, cat);
  });
}

async function runTool(text, cat, { useSample = false } = {}) {
  const { tool } = route(text, _selectedToolId);

  if (!tool) {
    // No tool matched — demo mode: still navigate to report with static content
    cat?.setState("active");
    setTimeout(() => {
      cat?.setState("celebratory");
      setTimeout(() => transitionToReport(), 500);
    }, 700);
    return;
  }

  cat?.setState("active");

  try {
    const { run } = await tool.module();
    const inputData = await collectInput(tool, useSample);
    if (inputData === null) {
      cat?.setState("idle");
      return;
    }
    const context = buildContext(text, tool);
    const result = await run(inputData, context);
    if (!result) {
      cat?.setState("idle");
      return;
    }
    result.context = summarizeContext(context);
    cat?.setState("celebratory");
    sessionStorage.setItem("cat-report-data", JSON.stringify(result));
    setTimeout(() => transitionToReport(), 600);
  } catch (err) {
    console.error(err);
    cat?.setState("idle");
  }
}

async function collectInput(tool, useSample = false) {
  if (tool.inputType === "file" || tool.inputType === "file-or-text") {
    if (useSample && tool.sampleFile) return loadSampleFile(tool.sampleFile);
    const primary = _attachments.find(a => a.role === "primary");
    if (primary) return parseAttachmentBody(primary);
    if (tool.inputType === "file-or-text") {
      const typed = document.querySelector("[data-composer-input]")?.value.trim() ?? "";
      if (typed) {
        try { return JSON.parse(typed); } catch { return typed; }
      }
    }
    return openFilePicker(tool.fileAccept);
  }
  if (tool.inputType === "form") {
    return promptForm(tool.id);
  }
  return document.querySelector("[data-composer-input]")?.value.trim() ?? "";
}

async function loadSampleFile(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${res.status}`);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  } catch (err) {
    console.error("Failed to load sample file:", err);
    return null;
  }
}

function openFilePicker(accept) {
  return new Promise(resolve => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = accept ?? "";
    picker.addEventListener("change", async () => {
      const file = picker.files[0];
      if (!file) return resolve(null);
      const att = await readFileAsAttachment(file, "primary");
      if (att) {
        _attachments = [att, ..._attachments.filter(a => a.role !== "primary")];
        renderAttachments();
      }
      resolve(att ? parseAttachmentBody(att) : null);
    });
    picker.click();
  });
}

function parseAttachmentBody(att) {
  try { return JSON.parse(att.text); }
  catch { return att.text; }
}

function buildContext(text, tool) {
  const supporting = _attachments
    .filter(a => a.role !== "primary")
    .map(a => ({ name: a.name, size: a.size, text: a.text }));
  const primary = _attachments.find(a => a.role === "primary");

  return {
    toolId: tool.id,
    userPrompt: text,
    supportingFiles: supporting,
    primaryFile: primary ? { name: primary.name, size: primary.size } : null,
  };
}

function summarizeContext(context) {
  const hasContent =
    context.userPrompt ||
    context.supportingFiles?.length ||
    context.primaryFile;
  if (!hasContent) return null;
  return {
    userPrompt: context.userPrompt || null,
    primaryFile: context.primaryFile,
    supportingFiles: (context.supportingFiles ?? []).map(f => ({ name: f.name, size: f.size })),
  };
}

function promptForm(toolId) {
  if (toolId === "ga4-checker") return promptGa4Form();
  if (toolId === "discrepancy") return promptDiscrepancyForm();
  return null;
}

function promptGa4Form() {
  const measurementId = window.prompt("GA4 Measurement ID (e.g. G-XXXXXXXXXX):");
  if (!measurementId) return null;
  const keyEventsRaw = window.prompt("Key events (comma-separated, or leave blank):") ?? "";
  const keyEvents = keyEventsRaw.split(",").map(s => s.trim()).filter(Boolean);
  const internalTrafficFilterEnabled = confirm("Is an internal traffic filter enabled?");
  const dataRetentionMonths = confirm("Is data retention set to 14 months? (Cancel = 2 months)") ? "14" : "2";
  const debugModeActive = confirm("Is debug mode currently active?");
  const googleSignalsEnabled = confirm("Is Google Signals enabled?");
  return { measurementId, keyEvents, internalTrafficFilterEnabled, dataRetentionMonths, debugModeActive, googleSignalsEnabled, streams: [] };
}

function promptDiscrepancyForm() {
  const ga4Conversions = parseInt(window.prompt("GA4 conversions:") ?? "0", 10);
  const adsConversions = parseInt(window.prompt("Google Ads conversions:") ?? "0", 10);
  const crmLeads = parseInt(window.prompt("CRM leads (leave blank if N/A):") ?? "0", 10);
  const ga4Sessions = parseInt(window.prompt("GA4 sessions:") ?? "0", 10);
  const adsSessions = parseInt(window.prompt("Google Ads clicks:") ?? "0", 10);
  const autoTaggingEnabled = confirm("Is auto-tagging enabled in Google Ads?");
  return { ga4Conversions, adsConversions, crmLeads, ga4Sessions, adsSessions, autoTaggingEnabled };
}

function bindToolSelect() {
  const trigger = document.querySelector("[data-tool-trigger]");
  const menu = document.querySelector("[data-tool-menu]");
  const label = document.querySelector("[data-tool-label]");
  if (!trigger || !menu || !label) return;

  if (!menu.id) {
    menu.id = "tool-select-menu";
  }
  trigger.setAttribute("aria-controls", menu.id);

  const menuTools = [{ id: "", label: "No tool selected", description: "Let CAT route your request" }, ...TOOLS];

  menu.innerHTML = menuTools.map(
    (t, index) => `
      <div
        class="tool-select__option"
        id="tool-select-option-${t.id || 'none'}"
        role="option"
        data-tool-id="${t.id}"
        data-tool-index="${index}"
        aria-selected="${index === 0}"
        tabindex="-1"
      >
        <span class="tool-select__option-name">${t.label}</span>
        <span class="tool-select__option-desc">${t.description}</span>
      </div>
    `
  ).join("");

  let selectedId = "";
  let activeIndex = 0;

  const getOptions = () =>
    Array.from(menu.querySelectorAll(".tool-select__option"));
  const isOpen = () => trigger.getAttribute("aria-expanded") === "true";

  const focusOption = (index) => {
    const options = getOptions();
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options[activeIndex].focus();
  };

  const setSelected = (toolId) => {
    const tool = menuTools.find((t) => t.id === toolId);
    if (tool === undefined) return;
    selectedId = tool.id;
    _selectedToolId = tool.id || null;
    activeIndex = menuTools.findIndex((t) => t.id === tool.id);
    label.textContent = tool.label;
    getOptions().forEach((option) => {
      option.setAttribute(
        "aria-selected",
        String(option.dataset.toolId === selectedId)
      );
    });
    // Notify suggestions area so it can show/hide the sample chip
    document.dispatchEvent(new CustomEvent("cat:toolSelected", { detail: { toolId: tool.id || null } }));
  };

  const setOpen = (open, { focusSelected = false, returnFocus = false } = {}) => {
    trigger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("data-open", String(open));
    if (open && focusSelected) {
      const selectedIndex = menuTools.findIndex((tool) => tool.id === selectedId);
      focusOption(selectedIndex >= 0 ? selectedIndex : 0);
    }
    if (!open && returnFocus) {
      trigger.focus();
    }
  };

  trigger.addEventListener("click", () => {
    const open = !isOpen();
    setOpen(open);
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen()) {
        setOpen(true, { focusSelected: true });
        return;
      }
      focusOption(activeIndex + 1);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen()) {
        setOpen(true, { focusSelected: true });
        return;
      }
      focusOption(activeIndex - 1);
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen()) {
        setOpen(true, { focusSelected: true });
      } else {
        setOpen(false);
      }
      return;
    }

    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      setOpen(false);
    }
  });

  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target) && !menu.contains(e.target)) {
      setOpen(false);
    }
  }, { capture: true });

  menu.addEventListener("focusin", (e) => {
    const option = e.target.closest(".tool-select__option");
    if (!option) return;
    const index = Number(option.dataset.toolIndex);
    if (!Number.isNaN(index)) {
      activeIndex = index;
    }
  });

  menu.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(activeIndex + 1);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(activeIndex - 1);
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      focusOption(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      focusOption(menuTools.length - 1);
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      const focusedOption = e.target.closest(".tool-select__option");
      if (!focusedOption) return;
      e.preventDefault();
      setSelected(focusedOption.dataset.toolId);
      setOpen(false, { returnFocus: true });
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false, { returnFocus: true });
      return;
    }

    if (e.key === "Tab") {
      setOpen(false);
    }
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".tool-select__option");
    if (!opt) return;
    setSelected(opt.dataset.toolId);
    setOpen(false);
  });
}

function bindAttachments(cat) {
  const attachTrigger = document.querySelector("[data-attach-trigger]");
  if (!attachTrigger || !_fileInputEl || !_attachmentsEl) return;

  attachTrigger.addEventListener("click", () => {
    _fileInputEl.click();
  });

  _fileInputEl.addEventListener("change", async () => {
    const files = Array.from(_fileInputEl.files ?? []);
    if (!files.length) return;

    for (const file of files) {
      const hasPrimary = _attachments.some(a => a.role === "primary");
      const role = hasPrimary ? "context" : "primary";
      const att = await readFileAsAttachment(file, role);
      if (att) _attachments.push(att);
    }

    _fileInputEl.value = "";
    renderAttachments();
    cat?.setState("attentive");
  });

  _attachmentsEl.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove-attachment]");
    if (!removeBtn) return;
    const id = removeBtn.dataset.removeAttachment;
    const removed = _attachments.find(a => a.id === id);
    _attachments = _attachments.filter(a => a.id !== id);

    // If we removed the primary, promote the next one so tools can still run.
    if (removed?.role === "primary") {
      const next = _attachments.find(a => a.role === "context");
      if (next) next.role = "primary";
    }

    renderAttachments();
  });
}

async function readFileAsAttachment(file, role) {
  if (!file) return null;
  if (file.size > MAX_ATTACHMENT_BYTES) {
    console.warn(`Skipped ${file.name}: exceeds ${MAX_ATTACHMENT_BYTES} byte limit.`);
    return null;
  }
  const text = await file.text();
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || inferTypeFromName(file.name),
    role,
    text,
  };
}

function inferTypeFromName(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext ? `application/${ext}` : "application/octet-stream";
}

function renderAttachments() {
  if (!_attachmentsEl) return;
  if (!_attachments.length) {
    _attachmentsEl.hidden = true;
    _attachmentsEl.innerHTML = "";
    return;
  }

  _attachmentsEl.hidden = false;
  _attachmentsEl.innerHTML = _attachments
    .map(
      (a) => `
        <span class="composer__chip composer__chip--${a.role}" title="${escapeHtml(a.name)}">
          <span class="composer__chip-role">${a.role === "primary" ? "file" : "ctx"}</span>
          <span class="composer__chip-name">${escapeHtml(a.name)}</span>
          <span class="composer__chip-size">${formatBytes(a.size)}</span>
          <button
            type="button"
            class="composer__chip-remove"
            data-remove-attachment="${a.id}"
            aria-label="Remove ${escapeHtml(a.name)}"
          >×</button>
        </span>
      `
    )
    .join("");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[s]));
}

function bindExamples(cat) {
  const container = document.querySelector("[data-examples]");
  const input = document.querySelector("[data-composer-input]");
  if (!container || !input) return;

  const renderSuggestions = (selectedToolId) => {
    const tool = TOOLS.find(t => t.id === selectedToolId);
    const hasSample = tool?.sampleFile;

    const sampleChip = hasSample
      ? `<button type="button" class="chip chip--sample" data-sample-run>
           Try ${tool.sampleLabel} →
         </button>`
      : "";

    const exampleChips = EXAMPLES.map(
      (ex) => `<button type="button" class="chip" data-example>${ex}</button>`
    ).join("");

    container.innerHTML =
      (hasSample
        ? `<div class="eyebrow suggestions__label">Load a sample or try an example</div>`
        : `<div class="eyebrow suggestions__label">Try an example</div>`) +
      sampleChip +
      exampleChips;
  };

  renderSuggestions(_selectedToolId);

  // Re-render when tool selection changes
  document.addEventListener("cat:toolSelected", (e) => {
    renderSuggestions(e.detail.toolId);
  });

  container.addEventListener("click", async (e) => {
    // Example chip → fill textarea
    const exChip = e.target.closest("[data-example]");
    if (exChip) {
      input.value = exChip.textContent.trim();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      return;
    }
    // Sample chip → run directly with sample file
    const sampleBtn = e.target.closest("[data-sample-run]");
    if (sampleBtn) {
      await runTool("", cat, { useSample: true });
    }
  });
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
