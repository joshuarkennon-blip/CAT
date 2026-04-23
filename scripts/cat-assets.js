/* CAT companion asset resolver
 * Supports runtime swapping between inline SVG, hosted SVG, video, and Spline.
 *
 * Resolution order (highest to lowest):
 * 1) URL query params
 * 2) data attributes on the stage mount node
 * 3) global window.CAT_ASSET_CONFIG
 * 4) explicit fallback argument
 */

import { DEFAULT_CAT_ASSET_CONFIG } from "./cat-default-asset.js";

const VALID_TYPES = new Set(["inline-svg", "svg-url", "video", "spline"]);
const TYPE_ALIASES = {
  svg: "inline-svg",
  image: "svg-url",
  pika: "video",
};
const VALID_STATES = ["idle", "attentive", "active", "celebratory"];

export function resolveCatAssetOptions(stage, fallback = {}) {
  return {
    asset: resolveCatAssetConfig(stage, fallback),
  };
}

export function resolveCatAssetConfig(stage, fallback = {}) {
  const effectiveFallback = mergeAssetConfigs(DEFAULT_CAT_ASSET_CONFIG, fallback);
  const params = new URLSearchParams(window.location.search);
  const globalConfig = window.CAT_ASSET_CONFIG || {};
  const stageData = stage?.dataset || {};

  const type = firstDefined(
    normalizeType(params.get("catAsset")),
    normalizeType(stageData.catAsset),
    normalizeType(globalConfig.type),
    normalizeType(globalConfig.provider),
    normalizeType(effectiveFallback.type),
    normalizeType(effectiveFallback.provider),
    "inline-svg"
  );

  const stateSources = {};
  VALID_STATES.forEach((state) => {
    const stateKey = state[0].toUpperCase() + state.slice(1);
    const source = firstDefined(
      sanitizeUrl(params.get(`catSrc${stateKey}`)),
      sanitizeUrl(stageData[`catSrc${stateKey}`]),
      sanitizeUrl(globalConfig.stateSources?.[state]),
      sanitizeUrl(effectiveFallback.stateSources?.[state])
    );
    if (source) {
      stateSources[state] = source;
    }
  });

  const src = firstDefined(
    sanitizeUrl(params.get("catSrc")),
    sanitizeUrl(stageData.catSrc),
    sanitizeUrl(globalConfig.src),
    sanitizeUrl(effectiveFallback.src)
  );

  const title = firstDefined(
    sanitizeText(params.get("catTitle")),
    sanitizeText(stageData.catTitle),
    sanitizeText(globalConfig.title),
    sanitizeText(effectiveFallback.title)
  );
  const alt = firstDefined(
    sanitizeText(params.get("catLabel")),
    sanitizeText(stageData.catLabel),
    sanitizeText(globalConfig.label),
    sanitizeText(effectiveFallback.alt)
  );

  const interactive =
    firstDefined(
      parseBoolean(params.get("catInteractive")),
      parseBoolean(stageData.catInteractive),
      parseBoolean(globalConfig.interactive),
      parseBoolean(effectiveFallback.interactive)
    ) ?? false;

  return {
    type,
    src: src || "",
    title: title || "",
    alt: alt || "",
    interactive,
    stateSources,
  };
}

function normalizeType(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  const resolved = TYPE_ALIASES[normalized] || normalized;
  return VALID_TYPES.has(resolved) ? resolved : null;
}

function sanitizeUrl(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("/") ||
    raw.startsWith("./")
  ) {
    return raw;
  }
  return "";
}

function sanitizeText(value) {
  if (!value) return "";
  return String(value).trim();
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return null;
}

function mergeAssetConfigs(base = {}, override = {}) {
  const baseStateSources =
    base.stateSources && typeof base.stateSources === "object"
      ? base.stateSources
      : {};
  const overrideStateSources =
    override.stateSources && typeof override.stateSources === "object"
      ? override.stateSources
      : {};

  return {
    ...base,
    ...override,
    stateSources: {
      ...baseStateSources,
      ...overrideStateSources,
    },
  };
}
