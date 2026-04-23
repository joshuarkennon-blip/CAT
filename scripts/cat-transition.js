/* CAT — Page transitions
 * Fade-to-black with cat animation, then navigate to report.
 * On the report page, fade in with cat runner entrance.
 */

const TRANSITION_VIDEO_SRC = "./new assets/cat-transition.mp4";
const RUNNER_VIDEO_SRC     = "./new assets/runner-right.mp4";
const STORAGE_KEY          = "cat-from-home";

const OVERLAY_FADE_IN_MS   = 650;  // how long the black fade-in takes
const NAV_DELAY_MS         = 1800; // navigate after this long (overlay fully black + brief hold)

export function transitionToReport() {
  const overlay = buildOverlay();
  const video   = buildTransitionVideo();
  overlay.appendChild(video);
  document.body.appendChild(overlay);

  sessionStorage.setItem(STORAGE_KEY, "1");

  // Fade to black on next frame so CSS transition fires
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add("cat-overlay--visible"));
  });

  // Navigate after the overlay is solid black + a brief cinematic hold
  setTimeout(() => { window.location.href = "./report.html"; }, NAV_DELAY_MS);
}

export function initReportEntrance(catStage) {
  if (sessionStorage.getItem(STORAGE_KEY) !== "1") return;
  sessionStorage.removeItem(STORAGE_KEY);

  // Page starts invisible behind black overlay
  const overlay = buildOverlay();
  overlay.classList.add("cat-overlay--visible");
  overlay.style.transition = "none"; // snap to black instantly on report load
  document.body.appendChild(overlay);

  // Build runner — sits off-screen left
  const runner = buildRunner();
  document.body.appendChild(runner);

  // Render report data from sessionStorage before reveal
  maybeRenderStoredReport();

  // Small delay so paint settles, then fade out overlay and run cat across
  setTimeout(() => {
    overlay.style.transition = ""; // restore CSS transition
    overlay.classList.add("cat-overlay--fading-out");
    overlay.classList.remove("cat-overlay--visible");

    // Cat runs across from left to right once overlay starts lifting
    requestAnimationFrame(() => {
      requestAnimationFrame(() => runner.classList.add("cat-runner--go"));
    });

    // Clean up after all animations finish
    setTimeout(() => {
      overlay.remove();
      runner.remove();
    }, 1600);
  }, 120);
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

function buildTransitionVideo() {
  const video = document.createElement("video");
  video.src = TRANSITION_VIDEO_SRC;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.className = "cat-overlay__video";
  video.play().catch(() => {});
  return video;
}

function buildRunner() {
  const div = document.createElement("div");
  div.className = "cat-runner";

  const video = document.createElement("video");
  video.src = RUNNER_VIDEO_SRC;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.style.cssText = "width:100%;height:100%;object-fit:contain;mix-blend-mode:screen;";
  video.play().catch(() => {});

  div.appendChild(video);
  return div;
}
