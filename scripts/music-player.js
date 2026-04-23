/**
 * CAT Radio — iPod Classic–styled music player
 * Opens with a zoom animation from the SVG iPod's screen position.
 */

const TRACKS = [
  { title: "Purrfectly Chilled", artist: "", src: "./new%20assets/Purrfectly%20Chilled.mp3" },
  { title: "Catnip",            artist: "", src: "./new%20assets/Catnip.mp3" },
  { title: "I Love Lamp",       artist: "", src: "./new%20assets/I%20love%20lamp.mp3" },
  { title: "Tabby Two Step",    artist: "", src: "./new%20assets/Tabby%20Two%20Step.mp3" },
  { title: "Sinky Drinkies",    artist: "", src: "./new%20assets/SInky%20Drinkies.mp3" },
];

export function mountMusicPlayer(scene) {
  // --- State ---
  let currentIndex = 0;
  let isPlaying = false;
  let trackLoaded = false;

  // --- Audio element ---
  const audio = new Audio();
  audio.volume = 0.15;
  audio.preload = "auto";

  // --- Build iPod element ---
  const ipodEl = document.createElement("div");
  ipodEl.id = "ipod-player";
  ipodEl.className = "ipod";

  ipodEl.innerHTML = `
    <div class="ipod__body">
      <div class="ipod__top-bar">
        <span class="ipod__brand">CAT Radio</span>
        <button class="ipod__close" aria-label="Close">✕</button>
      </div>
      <div class="ipod__screen-bezel">
        <div class="ipod__screen">
          <div class="ipod__now-playing">NOW PLAYING</div>
          <div class="ipod__track-name">—</div>
          <div class="ipod__artist"></div>
          <div class="ipod__progress-row">
            <div class="ipod__progress-bar"><div class="ipod__progress-fill"></div></div>
            <span class="ipod__time">0:00</span>
          </div>
        </div>
      </div>
      <div class="ipod__wheel-outer">
        <div class="ipod__wheel-ring">
          <button class="ipod__btn ipod__btn--vol-up"   aria-label="Volume up">＋</button>
          <button class="ipod__btn ipod__btn--next"     aria-label="Next track">⏭</button>
          <button class="ipod__btn ipod__btn--vol-down" aria-label="Volume down">－</button>
          <button class="ipod__btn ipod__btn--prev"     aria-label="Previous track">⏮</button>
        </div>
        <button class="ipod__center" aria-label="Play / Pause">▶</button>
      </div>
      <div class="ipod__credit">CAT Radio · local tracks</div>
    </div>
  `;

  document.body.appendChild(ipodEl);

  // --- Element refs ---
  const trackNameEl  = ipodEl.querySelector(".ipod__track-name");
  const artistEl     = ipodEl.querySelector(".ipod__artist");
  const progressFill = ipodEl.querySelector(".ipod__progress-fill");
  const timeEl       = ipodEl.querySelector(".ipod__time");
  const centerBtn    = ipodEl.querySelector(".ipod__center");
  const closeBtn     = ipodEl.querySelector(".ipod__close");
  const btnPrev      = ipodEl.querySelector(".ipod__btn--prev");
  const btnNext      = ipodEl.querySelector(".ipod__btn--next");
  const btnVolUp     = ipodEl.querySelector(".ipod__btn--vol-up");
  const btnVolDown   = ipodEl.querySelector(".ipod__btn--vol-down");
  const body         = ipodEl.querySelector(".ipod__body");

  // --- Helpers ---
  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function updateCenterButton() {
    centerBtn.textContent = isPlaying ? "⏸" : "▶";
    centerBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  }

  // --- Core audio functions ---
  function loadTrack(index) {
    currentIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
    const track = TRACKS[currentIndex];
    audio.src = track.src;
    trackNameEl.textContent = track.title;
    artistEl.textContent = track.artist;
    progressFill.style.width = "0%";
    timeEl.textContent = "0:00";
    trackLoaded = true;
  }

  function play() {
    audio.play().catch(() => {});
    isPlaying = true;
    updateCenterButton();
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    updateCenterButton();
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      if (!trackLoaded) loadTrack(currentIndex);
      play();
    }
  }

  function skip(delta) {
    const wasPlaying = isPlaying;
    loadTrack(currentIndex + delta);
    if (wasPlaying) play();
  }

  // --- Audio events ---
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${pct}%`;
    timeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("ended", () => {
    // isPlaying stays true so skip() sees wasPlaying=true and auto-plays next track
    skip(+1);
  });

  // --- Open / close ---
  function openPlayer() {
    // Get live screen position of SVG iPod zone
    const svg = document.querySelector(".scene-wrapper svg");
    const zone = svg?.getElementById("s-ipod-zone") || scene?.ipodZone;
    const r = zone
      ? zone.getBoundingClientRect()
      : { left: 100, top: 400, width: 44, height: 54 };

    const iCenterX = r.left + r.width  / 2;
    const iCenterY = r.top  + r.height / 2;

    const bodyW = 210; // matches CSS .ipod__body width
    const bodyH = 360; // approx full iPod height

    // Position so iPod center aligns with SVG iPod center
    ipodEl.style.left   = (iCenterX - bodyW / 2) + "px";
    ipodEl.style.top    = (iCenterY - bodyH / 2) + "px";
    ipodEl.style.bottom = "auto";
    ipodEl.style.right  = "auto";

    // Hide the little SVG iPod on the desk
    const svgIpod = svg?.getElementById("s-ipod");
    if (svgIpod) svgIpod.style.opacity = "0";

    // Animate from tiny (SVG iPod size) to full
    ipodEl.style.transition      = "none";
    ipodEl.style.transformOrigin = "center center";
    ipodEl.style.transform       = "scale(0.08)";
    ipodEl.style.opacity         = "0";
    ipodEl.style.display         = "block";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ipodEl.style.transition = "transform 0.38s cubic-bezier(0.34, 1.04, 0.64, 1), opacity 0.2s ease";
        ipodEl.style.transform  = "scale(1)";
        ipodEl.style.opacity    = "1";
      });
    });

    if (!audio.src) loadTrack(0);
  }

  function closePlayer() {
    ipodEl.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease";
    ipodEl.style.transform  = "scale(0.08)";
    ipodEl.style.opacity    = "0";
    setTimeout(() => {
      ipodEl.style.display = "none";
      // Restore the little SVG iPod
      const svg = document.querySelector(".scene-wrapper svg");
      const svgIpod = svg?.getElementById("s-ipod");
      if (svgIpod) svgIpod.style.opacity = "1";
    }, 260);
  }

  // --- Button controls ---
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closePlayer();
  });

  centerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    skip(-1);
  });

  btnNext.addEventListener("click", (e) => {
    e.stopPropagation();
    skip(+1);
  });

  btnVolUp.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.volume = Math.min(1, audio.volume + 0.1);
  });

  btnVolDown.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.volume = Math.max(0, audio.volume - 0.1);
  });

  // --- Dragging ---
  let dragging    = false;
  let dragStartX  = 0;
  let dragStartY  = 0;
  let elemStartLeft = 0;
  let elemStartTop  = 0;

  function onDragStart(clientX, clientY, target) {
    // Only drag when visible; ignore button/input clicks
    if (ipodEl.style.display === "none") return;
    if (target.closest("button, input, select")) return;

    dragging = true;
    dragStartX = clientX;
    dragStartY = clientY;

    const rect = ipodEl.getBoundingClientRect();
    elemStartLeft = rect.left;
    elemStartTop  = rect.top;

    ipodEl.style.bottom = "auto";
    ipodEl.style.left   = `${elemStartLeft}px`;
    ipodEl.style.top    = `${elemStartTop}px`;
  }

  function onDragMove(clientX, clientY) {
    if (!dragging) return;
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    ipodEl.style.left = `${elemStartLeft + dx}px`;
    ipodEl.style.top  = `${elemStartTop  + dy}px`;
  }

  function onDragEnd() {
    dragging = false;
  }

  // Mouse
  body.addEventListener("mousedown", (e) => {
    onDragStart(e.clientX, e.clientY, e.target);
  });
  document.addEventListener("mousemove", (e) => {
    if (dragging) onDragMove(e.clientX, e.clientY);
  });
  document.addEventListener("mouseup", onDragEnd);

  // Touch
  body.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    onDragStart(t.clientX, t.clientY, e.target);
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener("touchend", onDragEnd);

  // --- Attach click listeners to iPod SVG elements ---
  function attachIpodListeners() {
    const svg = document.querySelector(".scene-wrapper svg");
    if (!svg) return false;

    const targets = [
      svg.getElementById("s-ipod"),
      svg.getElementById("s-ipod-zone"),
    ].filter(Boolean);

    if (scene && scene.ipodZone) {
      targets.push(scene.ipodZone);
    }

    const uniqueTargets = [...new Set(targets)];
    uniqueTargets.forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", openPlayer);
    });

    return uniqueTargets.length > 0;
  }

  // Try attaching immediately; if SVG not ready yet, poll briefly
  if (!attachIpodListeners()) {
    const retry = () => attachIpodListeners();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", retry);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        if (attachIpodListeners() || ++attempts > 20) clearInterval(interval);
      }, 150);
    }
  }

  return {
    open: openPlayer,
    close: closePlayer,
    play,
    pause,
    skip,
    loadTrack,
  };
}
