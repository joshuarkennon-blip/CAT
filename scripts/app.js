/* CAT — Homepage interactions
 * Composer submit, tool dropdown, cat state transitions, example chips.
 */

import { mountCat } from "./cat.js";

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
  const catStage = document.querySelector("[data-cat]");
  const cat = mountCat(catStage, { state: "idle" });

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

  menu.innerHTML = TOOLS.map(
    (t) => `
      <div class="tool-select__option" role="option" data-tool-id="${t.id}" aria-selected="${t.id === "none"}">
        <span class="tool-select__option-name">${t.name}</span>
        <span class="tool-select__option-desc">${t.desc}</span>
      </div>
    `
  ).join("");

  const setOpen = (open) => {
    trigger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("data-open", String(open));
  };

  trigger.addEventListener("click", () => {
    const open = trigger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target) && !menu.contains(e.target)) {
      setOpen(false);
    }
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".tool-select__option");
    if (!opt) return;
    const id = opt.dataset.toolId;
    const tool = TOOLS.find((t) => t.id === id);
    if (!tool) return;
    label.textContent = tool.name;
    menu
      .querySelectorAll(".tool-select__option")
      .forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
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
