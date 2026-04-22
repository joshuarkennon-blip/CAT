/* CAT debug panel
 * Dev-only runtime controls for cat provider, source URLs, and state playback.
 * Enabled with ?catDebug=1 (or true/on/yes).
 */

import { CAT_STATES } from "./cat.js";

const DEBUG_TOGGLE_VALUES = new Set(["1", "true", "yes", "on"]);
const PROVIDERS = [
  { value: "inline-svg", label: "Inline SVG" },
  { value: "svg-url", label: "SVG URL" },
  { value: "video", label: "Video (Pika)" },
  { value: "spline", label: "Spline" },
];

export function isCatDebugEnabled(search = window.location.search) {
  const params = new URLSearchParams(search);
  const raw = params.get("catDebug");
  if (!raw) return false;
  return DEBUG_TOGGLE_VALUES.has(raw.trim().toLowerCase());
}

export function mountCatDebugPanel({
  cat,
  stage,
  title = "CAT Debug",
  initialAsset = {},
  initialState = "idle",
  onAssetChange,
  onStateChange,
} = {}) {
  if (!cat || !stage) return null;

  const panel = document.createElement("aside");
  panel.className = "cat-debug-panel";
  panel.setAttribute("aria-label", "CAT debug panel");

  const heading = document.createElement("h2");
  heading.className = "cat-debug-panel__title";
  heading.textContent = title;
  panel.append(heading);

  const note = document.createElement("p");
  note.className = "cat-debug-panel__note";
  note.textContent = "Dev-only controls. Values apply instantly.";
  panel.append(note);

  const form = document.createElement("form");
  form.className = "cat-debug-panel__form";
  form.setAttribute("autocomplete", "off");
  panel.append(form);

  const providerField = createField("Provider");
  const providerSelect = document.createElement("select");
  providerSelect.className = "cat-debug-panel__select";
  PROVIDERS.forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider.value;
    option.textContent = provider.label;
    providerSelect.append(option);
  });
  providerField.body.append(providerSelect);
  form.append(providerField.wrapper);

  const sourceField = createField("Primary source URL");
  const sourceInput = createInput("url", "https://...");
  sourceField.body.append(sourceInput);
  form.append(sourceField.wrapper);

  const posterField = createField("Poster URL (video)");
  const posterInput = createInput("url", "https://...");
  posterField.body.append(posterInput);
  form.append(posterField.wrapper);

  const titleField = createField("Title / label");
  const titleInput = createInput("text", "CAT companion");
  titleField.body.append(titleInput);
  form.append(titleField.wrapper);

  const stateSourcesField = createField("Per-state source URLs");
  stateSourcesField.wrapper.classList.add("cat-debug-panel__field--stacked");
  const stateSourceInputs = {};
  CAT_STATES.forEach((state) => {
    const row = document.createElement("label");
    row.className = "cat-debug-panel__state-row";
    const stateTag = document.createElement("span");
    stateTag.className = "cat-debug-panel__state-tag";
    stateTag.textContent = state;
    const stateInput = createInput("url", `source for ${state} (optional)`);
    stateSourceInputs[state] = stateInput;
    row.append(stateTag, stateInput);
    stateSourcesField.body.append(row);
  });
  form.append(stateSourcesField.wrapper);

  const stateField = createField("Preview state");
  const stateSelect = document.createElement("select");
  stateSelect.className = "cat-debug-panel__select";
  CAT_STATES.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.append(option);
  });
  stateField.body.append(stateSelect);
  form.append(stateField.wrapper);

  const actions = document.createElement("div");
  actions.className = "cat-debug-panel__actions";
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "cat-debug-panel__button";
  resetButton.textContent = "Reset panel";
  actions.append(resetButton);
  form.append(actions);

  document.body.append(panel);

  const defaultAsset = normalizeAsset(initialAsset);
  const defaultState = CAT_STATES.includes(initialState) ? initialState : "idle";
  setFormFromAsset(defaultAsset);
  stateSelect.value = defaultState;

  const emitAsset = () => {
    const nextAsset = readAssetFromForm();
    onAssetChange?.(nextAsset);
  };

  providerSelect.addEventListener("change", emitAsset);
  sourceInput.addEventListener("input", emitAsset);
  posterInput.addEventListener("input", emitAsset);
  titleInput.addEventListener("input", emitAsset);
  CAT_STATES.forEach((state) => {
    stateSourceInputs[state].addEventListener("input", emitAsset);
  });

  stateSelect.addEventListener("change", () => {
    const nextState = stateSelect.value;
    cat.setState(nextState);
    onStateChange?.(nextState);
  });

  resetButton.addEventListener("click", () => {
    setFormFromAsset(defaultAsset);
    stateSelect.value = defaultState;
    cat.setAsset(defaultAsset);
    cat.setState(defaultState);
    onAssetChange?.(defaultAsset);
    onStateChange?.(defaultState);
  });

  return {
    panel,
    applyAsset(assetConfig) {
      const normalized = normalizeAsset(assetConfig);
      setFormFromAsset(normalized);
      cat.setAsset(normalized);
      onAssetChange?.(normalized);
    },
    applyState(nextState) {
      if (!CAT_STATES.includes(nextState)) return;
      stateSelect.value = nextState;
      cat.setState(nextState);
      onStateChange?.(nextState);
    },
    destroy() {
      panel.remove();
    },
  };

  function setFormFromAsset(assetConfig) {
    providerSelect.value = assetConfig.type;
    sourceInput.value = assetConfig.src || "";
    posterInput.value = assetConfig.poster || "";
    titleInput.value = assetConfig.title || assetConfig.alt || "";
    CAT_STATES.forEach((state) => {
      stateSourceInputs[state].value = assetConfig.stateSources?.[state] || "";
    });
  }

  function readAssetFromForm() {
    const stateSources = {};
    CAT_STATES.forEach((state) => {
      const value = sanitizeValue(stateSourceInputs[state].value);
      if (value) {
        stateSources[state] = value;
      }
    });
    return normalizeAsset({
      type: providerSelect.value,
      src: sanitizeValue(sourceInput.value),
      poster: sanitizeValue(posterInput.value),
      title: sanitizeValue(titleInput.value),
      alt: sanitizeValue(titleInput.value),
      stateSources,
    });
  }
}

function createField(label) {
  const wrapper = document.createElement("div");
  wrapper.className = "cat-debug-panel__field";
  const fieldLabel = document.createElement("label");
  fieldLabel.className = "cat-debug-panel__label";
  fieldLabel.textContent = label;
  const body = document.createElement("div");
  body.className = "cat-debug-panel__body";
  wrapper.append(fieldLabel, body);
  return { wrapper, body };
}

function createInput(type, placeholder) {
  const input = document.createElement("input");
  input.className = "cat-debug-panel__input";
  input.type = type;
  input.placeholder = placeholder;
  return input;
}

function sanitizeValue(value) {
  return String(value || "").trim();
}

function normalizeAsset(asset) {
  const type = PROVIDERS.some((provider) => provider.value === asset?.type)
    ? asset.type
    : "inline-svg";
  const stateSources = {};
  CAT_STATES.forEach((state) => {
    const src = sanitizeValue(asset?.stateSources?.[state]);
    if (src) {
      stateSources[state] = src;
    }
  });
  return {
    type,
    src: sanitizeValue(asset?.src),
    poster: sanitizeValue(asset?.poster),
    title: sanitizeValue(asset?.title),
    alt: sanitizeValue(asset?.alt),
    stateSources,
  };
}

/* Safe helper used by entry scripts.
 * Returns null unless debug mode is enabled and a mounted cat instance exists.
 */
export function maybeMountCatDebugPanel({
  cat,
  catStage,
  stage,
  title,
  initialAsset,
  initialState,
} = {}) {
  if (!isCatDebugEnabled()) {
    return null;
  }

  const resolvedStage = stage || catStage || cat?.element;
  if (!cat || !resolvedStage) {
    return null;
  }

  return mountCatDebugPanel({
    cat,
    stage: resolvedStage,
    title,
    initialAsset: initialAsset || cat.getAsset?.() || {},
    initialState: initialState || cat.getState?.() || "idle",
    onAssetChange(nextAsset) {
      cat.setAsset(nextAsset);
    },
    onStateChange(nextState) {
      cat.setState(nextState);
    },
  });
}
