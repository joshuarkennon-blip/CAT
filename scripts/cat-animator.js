/* CAT — In-scene jump animator
 * Chroma-extracts the cat from the transition video and composites it
 * at the correct size + position onto the existing SVG scene.
 *
 * Video (1280×720) timeline:
 *  0   – 2.8 s : cat on desk (wind-up) — skipped
 *  2.8 – 4.6 s : cat leaping → landing on monitor top
 *  4.6 – 8.0 s : cat lounging on monitor
 *
 * Cat center fractions measured via pixel centroid scan:
 *  Desk  (t=2.8): cx=0.278  cy=0.729
 *  Monitor (t=4.6): cx=0.589  cy=0.259
 */

const SRC              = "./new assets/cat-transition.mp4";
const VIDEO_JUMP_START = 2.8;   // skip desk wind-up
const JUMP_DURATION    = 1.8;   // leap to landing (4.6 - 2.8 s)
const PROCESS_SCALE    = 0.6;   // process at 60% for better edge quality

// Pixel-measured cat centers in video-space (0–1)
const VIDEO_DESK_CX    = 0.278;
const VIDEO_DESK_CY    = 0.729;
const VIDEO_MON_CX     = 0.589;
const VIDEO_MON_CY     = 0.259;

// Cat occupies this fraction of video width at desk pose
const CAT_VIDEO_W_FRAC = 0.42;

export function mountCatAnimator(hero, catStage, catZoneEl, monitorZoneEl) {

  /* ── hidden source video ───────────────────────────────── */
  const video = document.createElement("video");
  video.src = SRC;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.display = "none";
  hero.appendChild(video);
  video.load();

  /* ── full-hero transparent canvas overlay ──────────────── */
  const canvas = document.createElement("canvas");
  canvas.style.cssText = [
    "position:absolute", "inset:0",
    "width:100%", "height:100%",
    "opacity:0", "pointer-events:none", "z-index:5",
    "transition:opacity 0.2s ease",
  ].join(";");
  hero.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  /* ── off-screen canvas for pixel processing ─────────────── */
  const proc = document.createElement("canvas");
  const pctx = proc.getContext("2d", { willReadFrequently: true });

  let rafId    = null;
  let settling = null;
  let live     = false;
  let settled  = false;  // true once cat has landed on monitor
  let jumpStart = 0;

  let _deskCX = 0, _deskCY = 0;
  let _monCX  = 0, _monCY  = 0;
  let _stageW = 200;

  /* ── zone-centre helper (hero-relative layout px) ─────── */
  function zoneCentre(zoneEl) {
    const hr = hero.getBoundingClientRect();
    const zr = zoneEl.getBoundingClientRect();
    const scale = hr.width / hero.clientWidth;
    return {
      cx: (zr.left - hr.left + zr.width  / 2) / scale,
      cy: (zr.top  - hr.top  + zr.height / 2) / scale,
    };
  }

  /* ── core render loop ──────────────────────────────────── */
  function drawFrame() {
    if (!video.videoWidth) {
      if (live) rafId = requestAnimationFrame(drawFrame);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const pw = Math.round(vw * PROCESS_SCALE);
    const ph = Math.round(vh * PROCESS_SCALE);

    if (proc.width !== pw || proc.height !== ph) { proc.width = pw; proc.height = ph; }
    pctx.drawImage(video, 0, 0, pw, ph);
    const id = pctx.getImageData(0, 0, pw, ph);
    extractCat(id.data);
    pctx.putImageData(id, 0, 0);

    // Video renders at a size where cat portion == catStage width
    const rw = _stageW / CAT_VIDEO_W_FRAC;
    const rh = rw * (vh / vw);

    // Position interpolation: desk zone → monitor zone over JUMP_DURATION
    const elapsed = (Date.now() - jumpStart) / 1000;
    const t       = Math.min(elapsed / JUMP_DURATION, 1);
    // Ease out only — fast start, graceful landing
    const ease    = 1 - Math.pow(1 - t, 2.5);

    const targetCX = _deskCX + (_monCX - _deskCX) * ease;
    const targetCY = _deskCY + (_monCY - _deskCY) * ease;

    const catOffX  = VIDEO_DESK_CX + (VIDEO_MON_CX - VIDEO_DESK_CX) * ease;
    const catOffY  = VIDEO_DESK_CY + (VIDEO_MON_CY - VIDEO_DESK_CY) * ease;

    const dx = targetCX - catOffX * rw;
    const dy = targetCY - catOffY * rh;

    const cw = hero.clientWidth;
    const ch = hero.clientHeight;
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (settled) {
      // Locked to monitor zone — no interpolation drift
      const sdx = _monCX - VIDEO_MON_CX * rw;
      const sdy = _monCY - VIDEO_MON_CY * rh;
      ctx.drawImage(proc, sdx, sdy, rw, rh);
    } else {
      ctx.drawImage(proc, dx, dy, rw, rh);
    }

    if (live) rafId = requestAnimationFrame(drawFrame);
  }

  /* ── pixel classifier ──────────────────────────────────── */
  function extractCat(d) {
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = catAlpha(d[i], d[i + 1], d[i + 2]);
    }
  }

  function catAlpha(r, g, b) {
    // Hard exclude: blue-dominant = background sky/walls
    if (b > r) return 0;
    if (b >= g && b > 100) return 0;

    // Hard exclude: dark scene shadows (non-cat)
    if (r < 80 && g < 65 && b < 75) return 0;

    // Hard exclude: greenish (plants)
    if (g > r * 1.05 && g > 100) return 0;

    // Orange fur — primary cat color
    if (r > 185 && r > g * 1.25 && r - b > 95 && g > 55) return 255;

    // Amber / body mid-tones — r-g>50 & r-b>85 excludes desk/wood surface
    if (r > 145 && r - g > 50 && r - b > 85 && g > 50 && b < 120) return 255;

    // Cream belly / face — r-g>18 excludes neutral-white rain streaks
    if (r > 215 && g > 168 && b > 122 && r > g && g > b && r - g > 18 && r - b < 80) return 255;

    // Pink ears / nose
    if (r > 172 && g < 135 && b < 118 && r - g > 48) return 255;

    return 0;
  }

  /* ── show / hide ───────────────────────────────────────── */
  function showCanvas() {
    catStage.style.transition = "opacity 0.15s";
    catStage.style.opacity    = "0";
    canvas.style.opacity      = "1";
    live = true;
    settled = false;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(drawFrame);
  }

  function hideCanvas() {
    live    = false;
    settled = false;
    cancelAnimationFrame(rafId);
    rafId = null;
    canvas.style.opacity = "0";
    setTimeout(() => {
      catStage.style.opacity    = "";
      catStage.style.transition = "";
    }, 300);
  }

  function cancelSettle() {
    if (settling) { clearTimeout(settling); settling = null; }
  }

  /* ── public API ────────────────────────────────────────── */
  return {
    jumpUp() {
      cancelSettle();

      const desk = zoneCentre(catZoneEl);
      const mon  = zoneCentre(monitorZoneEl);
      _deskCX = desk.cx; _deskCY = desk.cy;
      _monCX  = mon.cx;  _monCY  = mon.cy;
      _stageW = catStage.offsetWidth || 200;

      jumpStart = Date.now();
      showCanvas();
      video.currentTime = VIDEO_JUMP_START;
      video.play().catch(() => {});

      // After jump lands: freeze on landing frame, hand off to catStage
      settling = setTimeout(() => {
        video.pause();
        live = false;
        settled = true;
        cancelAnimationFrame(rafId);
        rafId = null;
        drawFrame(); // one final static render at landing pose
        // Crossfade canvas out, catStage in (catStage already moved to monitor)
        setTimeout(() => {
          canvas.style.opacity = "0";
          catStage.style.transition = "opacity 0.4s";
          catStage.style.opacity = "1";
        }, 150);
        settling = null;
      }, JUMP_DURATION * 1000);
    },

    jumpDown() {
      cancelSettle();
      video.pause();
      hideCanvas();
      video.currentTime = 0;
    },
  };
}
