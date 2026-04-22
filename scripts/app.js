/* CAT — Homepage interactions
 * Composer submit, tool dropdown, cat state transitions, example chips.
 */

import { mountCat } from "./cat.js";
import { resolveCatAssetOptions } from "./cat-assets.js";
import { maybeMountCatDebugPanel } from "./cat-debug-panel.js";
import { DEFAULT_CAT_ASSET_CONFIG } from "./cat-default-asset.js";
import { mountScene } from "./scene.js";

const TOOLS = [
  {
    id: "none",
    name: "No tool selected",
    desc: "Let CAT route your request",
  },
  {
    id: "gtm-audit",
    name: "GTM audit",
    desc: "Tag Manager container review",
  },
  {
    id: "har-check",
    name: "HAR file check",
    desc: "Network capture analysis",
  },
  {
    id: "ga4-review",
    name: "GA4 configuration review",
    desc: "Property, events, conversions",
  },
  {
    id: "consent-check",
    name: "Consent mode audit",
    desc: "CMP + consent state verification",
  },
];

const EXAMPLES = [
  "Audit my GTM container",
  "Check my HAR file for tracking errors",
  "Review my GA4 configuration",
  "Why aren't my conversions firing?",
];

function init() {
  const hero         = document.querySelector("[data-hero]");
  const sceneWrapper = document.querySelector("[data-scene]");
  const catStage     = document.querySelector("[data-cat]");
  const monitorUI    = document.querySelector("[data-monitor-ui]");

  const scene = mountScene(sceneWrapper, hero);
  scene.positionCat(catStage);
  scene.positionUI(monitorUI);

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

  bindComposer(cat);
  bindToolSelect();
  bindExamples();
}

function bindComposer(cat) {
  const form = document.querySelector("[data-composer]");
  const input = document.querySelector("[data-composer-input]");
  const submit = document.querySelector("[data-composer-submit]");

  if (!form || !input) return;

  const updateSubmitState = () => {
    submit.disabled = input.value.trim().length === 0;
  };
  updateSubmitState();

  input.addEventListener("input", () => {
    updateSubmitState();
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 240) + "px";

    // Cat becomes attentive while the user composes.
    cat?.setState(input.value.trim().length > 0 ? "attentive" : "idle");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value.trim().length === 0) return;
    runDemoTransition(cat);
  });
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

  menu.innerHTML = TOOLS.map(
    (t, index) => `
      <div
        class="tool-select__option"
        id="tool-select-option-${t.id}"
        role="option"
        data-tool-id="${t.id}"
        data-tool-index="${index}"
        aria-selected="${t.id === "none"}"
        tabindex="-1"
      >
        <span class="tool-select__option-name">${t.name}</span>
        <span class="tool-select__option-desc">${t.desc}</span>
      </div>
    `
  ).join("");

  let selectedId = "none";
  let activeIndex = TOOLS.findIndex((tool) => tool.id === selectedId);

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
    const tool = TOOLS.find((t) => t.id === toolId);
    if (!tool) return;
    selectedId = tool.id;
    activeIndex = TOOLS.findIndex((t) => t.id === tool.id);
    label.textContent = tool.name;
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
      const selectedIndex = TOOLS.findIndex((tool) => tool.id === selectedId);
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
  });

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
      focusOption(TOOLS.length - 1);
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

/* Demo: transition cat through states to preview animation vocabulary.
 * In a real build this would be wired to the tool execution stream. */
function runDemoTransition(cat) {
  if (!cat) return;
  cat.setState("active");
  setTimeout(() => cat.setState("celebratory"), 2200);
  setTimeout(() => cat.setState("idle"), 3600);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
