/* CAT — Page transitions
 * Fast fade-to-black on submit, fast fade-in on report load.
 */

const STORAGE_KEY    = "cat-from-home";
const FADE_OUT_MS    = 250;
const NAV_DELAY_MS   = 320;
const FADE_IN_MS     = 300;

export function transitionToReport() {
  const overlay = buildOverlay();
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add("cat-overlay--visible"));
  });

  setTimeout(() => { window.location.href = "./report.html"; }, NAV_DELAY_MS);
  sessionStorage.setItem(STORAGE_KEY, "1");
}

export function initReportEntrance() {
  if (sessionStorage.getItem(STORAGE_KEY) !== "1") return;
  sessionStorage.removeItem(STORAGE_KEY);

  maybeRenderStoredReport();

  const overlay = buildOverlay();
  overlay.classList.add("cat-overlay--visible");
  overlay.style.transition = "none";
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition = `opacity ${FADE_IN_MS}ms ease`;
      overlay.classList.remove("cat-overlay--visible");
      setTimeout(() => overlay.remove(), FADE_IN_MS + 50);
    });
  });
}

function maybeRenderStoredReport() {
  const stored = sessionStorage.getItem("cat-report-data");
  if (!stored) return;
  sessionStorage.removeItem("cat-report-data");
  try {
    const result = JSON.parse(stored);
    import("./report-renderer.js").then(({ renderReport }) => {
      const container = document.getElementById("tool-result");
      if (container) renderReport(result, container);
    });
  } catch (e) {
    console.warn("[CAT] Could not parse report data", e);
  }
}

function buildOverlay() {
  const div = document.createElement("div");
  div.className = "cat-overlay";
  return div;
}
