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

  bindComposer(cat, hero, scene, catStage);
  bindToolSelect();
  bindExamples();
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

  const engage = () => {
    hero?.classList.add("hero--engaged");
    scene?.moveCatToMonitor(catStage);
  };
  const disengage = () => {
    if (!input.value.trim()) {
      hero?.classList.remove("hero--engaged");
      scene?.moveCatToDesk(catStage);
    }
  };

  input.addEventListener("focus", engage);
  input.addEventListener("blur", (e) => {
    const monitorUI = document.querySelector("[data-monitor-ui]");
    if (monitorUI?.contains(e.relatedTarget)) return;
    disengage();
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
    if (!text && !_selectedToolId) return;
    await runTool(text, cat);
  });
}

async function runTool(text, cat) {
  const { tool, confidence } = route(text, _selectedToolId);

  if (!tool) {
    cat?.setState("attentive");
    setTimeout(() => cat?.setState("idle"), 1400);
    return;
  }

  cat?.setState("active");

  try {
    const { run } = await tool.module();
    const inputData = await collectInput(tool);
    const result = inputData !== null ? await run(inputData) : null;
    if (result === null) {
      cat?.setState("idle");
      return;
    }
    cat?.setState("celebratory");
    sessionStorage.setItem("cat-report-data", JSON.stringify(result));
    setTimeout(() => transitionToReport(), 600);
  } catch (err) {
    console.error(err);
    cat?.setState("idle");
  }
}

async function collectInput(tool) {
  if (tool.inputType === "file" || tool.inputType === "file-or-text") {
    return promptFile(tool.fileAccept);
  }
  if (tool.inputType === "form") {
    return promptForm(tool.id);
  }
  return document.querySelector("[data-composer-input]")?.value.trim() ?? "";
}

function promptFile(accept) {
  return new Promise(resolve => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = accept;
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return resolve(null);
      const text = await file.text();
      try { resolve(JSON.parse(text)); }
      catch { resolve(text); }
    });
    fileInput.click();
  });
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

function bindExamples() {
  const container = document.querySelector("[data-examples]");
  const input = document.querySelector("[data-composer-input]");
  if (!container || !input) return;

  container.innerHTML =
    `<div class="eyebrow suggestions__label">Try an example</div>` +
    EXAMPLES.map(
      (ex) => `<button type="button" class="chip" data-example>${ex}</button>`
    ).join("");

  container.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-example]");
    if (!chip) return;
    input.value = chip.textContent;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
