/* CAT — Report view
 * Mounts the sticky cat and wires copy/export buttons.
 */

import { mountCat } from "./cat.js";
import { resolveCatAssetOptions } from "./cat-assets.js";
import { maybeMountCatDebugPanel } from "./cat-debug-panel.js";
import { DEFAULT_CAT_ASSET_CONFIG } from "./cat-default-asset.js";

function init() {
  const catStage = document.querySelector("[data-cat]");
  const assetOptions = resolveCatAssetOptions(catStage, DEFAULT_CAT_ASSET_CONFIG);
  const cat = mountCat(catStage, {
    state: "idle",
    ...assetOptions,
    onClick: () => {
      cat?.setState("attentive");
      setTimeout(() => cat?.setState("idle"), 1400);
    },
  });
  maybeMountCatDebugPanel({
    cat,
    catStage,
    initialAsset: assetOptions.asset,
  });

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => handleCopy(btn));
  });

  document.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.dataset.state = "done";
      const original = btn.dataset.label || btn.textContent.trim();
      btn.dataset.label = original;
      btn.textContent = "Queued";
      setTimeout(() => {
        btn.textContent = original;
        delete btn.dataset.state;
      }, 1200);
    });
  });
}

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
