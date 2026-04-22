/* CAT companion
 * Illustrated orange cat. State machine drives posture and animation.
 * States: idle | attentive | active | celebratory
 */

const CAT_SVG = `
<svg class="cat" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="CAT companion" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- Fur: warm radial, brighter centre -->
    <radialGradient id="cat-fur" cx="45%" cy="38%" r="62%">
      <stop offset="0%"   stop-color="#ffb870"/>
      <stop offset="45%"  stop-color="#ff9848"/>
      <stop offset="100%" stop-color="#e06a20"/>
    </radialGradient>
    <!-- Body fur (slightly different angle) -->
    <radialGradient id="cat-body-fur" cx="50%" cy="30%" r="65%">
      <stop offset="0%"   stop-color="#ffaa58"/>
      <stop offset="55%"  stop-color="#ff8c42"/>
      <stop offset="100%" stop-color="#d86020"/>
    </radialGradient>
    <!-- Belly: warm cream -->
    <radialGradient id="cat-belly" cx="50%" cy="40%" r="60%">
      <stop offset="0%"   stop-color="#fce8c8"/>
      <stop offset="70%"  stop-color="#f0c898"/>
      <stop offset="100%" stop-color="#d8a870"/>
    </radialGradient>
    <!-- Eye iris: teal gradient -->
    <radialGradient id="cat-iris" cx="40%" cy="35%" r="60%">
      <stop offset="0%"   stop-color="#40e8ff"/>
      <stop offset="55%"  stop-color="#00c8ee"/>
      <stop offset="100%" stop-color="#0088bb"/>
    </radialGradient>
    <!-- Eye ambient glow -->
    <radialGradient id="cat-eye-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%"   stop-color="#00d9ff" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#00d9ff" stop-opacity="0"/>
    </radialGradient>
    <!-- Drop shadow filter -->
    <filter id="cat-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#6a2800" flood-opacity="0.3"/>
    </filter>
    <!-- Fur sheen filter -->
    <filter id="cat-sheen" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Tail (behind body — animates from base) -->
  <g class="cat__tail" style="transform-origin: 172px 178px;">
    <!-- Main tail shape -->
    <path d="M 172 178 Q 208 172 216 136 Q 220 100 196 90"
          stroke="url(#cat-body-fur)" stroke-width="18" stroke-linecap="round" fill="none"/>
    <!-- Stripe overlay -->
    <path d="M 172 178 Q 208 172 216 136 Q 220 100 196 90"
          stroke="#b06030" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.28"/>
    <!-- Fluffy tail tip -->
    <circle cx="196" cy="90" r="11" fill="#ffaa58" filter="url(#cat-sheen)"/>
    <circle cx="196" cy="90" r="7"  fill="#fce0b0"/>
  </g>

  <!-- Body -->
  <g class="cat__body" filter="url(#cat-shadow)">
    <!-- Main torso -->
    <ellipse cx="120" cy="170" rx="58" ry="52" fill="url(#cat-body-fur)"/>
    <!-- Belly patch -->
    <ellipse cx="120" cy="186" rx="34" ry="30" fill="url(#cat-belly)" opacity="0.88"/>
    <!-- Side stripes -->
    <path d="M 76 148 Q 68 162 76 180"  stroke="#b06030" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.38"/>
    <path d="M 68 158 Q 61 170 68 186"  stroke="#b06030" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.25"/>
    <path d="M 164 148 Q 172 162 164 180" stroke="#b06030" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.38"/>
    <path d="M 172 158 Q 179 170 172 186" stroke="#b06030" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.25"/>
    <!-- Chest tuft -->
    <ellipse cx="120" cy="152" rx="18" ry="12" fill="#fce8c8" opacity="0.55"/>
    <!-- Front paws -->
    <ellipse cx="98"  cy="214" rx="16" ry="11" fill="url(#cat-body-fur)"/>
    <ellipse cx="142" cy="214" rx="16" ry="11" fill="url(#cat-body-fur)"/>
    <!-- Toe beans -->
    <ellipse cx="93"  cy="217" rx="4"  ry="2.5" fill="#c87858" opacity="0.55"/>
    <ellipse cx="103" cy="218" rx="4"  ry="2.5" fill="#c87858" opacity="0.55"/>
    <ellipse cx="137" cy="218" rx="4"  ry="2.5" fill="#c87858" opacity="0.55"/>
    <ellipse cx="147" cy="217" rx="4"  ry="2.5" fill="#c87858" opacity="0.55"/>
    <!-- Paw highlights -->
    <ellipse cx="98"  cy="211" rx="9"  ry="4"   fill="#ffba68" opacity="0.35"/>
    <ellipse cx="142" cy="211" rx="9"  ry="4"   fill="#ffba68" opacity="0.35"/>
  </g>

  <!-- Head -->
  <g class="cat__head" style="transform-origin: 120px 94px;">
    <!-- Ears -->
    <g class="cat__ears">
      <!-- Left ear (outer) -->
      <path class="cat__ear cat__ear--left"
            d="M 80 68 L 68 28 L 110 56 Z"
            fill="url(#cat-fur)" style="transform-origin: 80px 68px;"/>
      <!-- Left ear inner -->
      <path d="M 84 62 L 78 40 L 104 58 Z" fill="#d05a30" opacity="0.7"/>
      <!-- Right ear (outer) -->
      <path class="cat__ear cat__ear--right"
            d="M 160 68 L 172 28 L 130 56 Z"
            fill="url(#cat-fur)" style="transform-origin: 160px 68px;"/>
      <!-- Right ear inner -->
      <path d="M 156 62 L 162 40 L 136 58 Z" fill="#d05a30" opacity="0.7"/>
    </g>

    <!-- Head -->
    <ellipse cx="120" cy="92" rx="52" ry="48" fill="url(#cat-fur)" filter="url(#cat-shadow)"/>

    <!-- Forehead stripes (tabby) -->
    <path d="M 120 50 Q 115 66 120 86" stroke="#b06030" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.42"/>
    <path d="M 112 52 Q 108 68 112 84" stroke="#b06030" stroke-width="2"   stroke-linecap="round" fill="none" opacity="0.22"/>
    <path d="M 128 52 Q 132 68 128 84" stroke="#b06030" stroke-width="2"   stroke-linecap="round" fill="none" opacity="0.22"/>

    <!-- Cheek tufts -->
    <ellipse cx="80"  cy="104" rx="12" ry="8" fill="#ffba68" opacity="0.4"  transform="rotate(-15 80 104)"/>
    <ellipse cx="160" cy="104" rx="12" ry="8" fill="#ffba68" opacity="0.4"  transform="rotate(15 160 104)"/>

    <!-- Muzzle -->
    <ellipse cx="120" cy="110" rx="28" ry="20" fill="url(#cat-belly)" opacity="0.7"/>

    <!-- Eyes -->
    <g class="cat__eyes">
      <!-- Eye sockets (dark surround) -->
      <ellipse class="cat__eye cat__eye--left"  cx="102" cy="87" rx="11" ry="13" fill="#181818"/>
      <ellipse class="cat__eye cat__eye--right" cx="138" cy="87" rx="11" ry="13" fill="#181818"/>
      <!-- Iris (teal) -->
      <ellipse cx="102" cy="87" rx="8"  ry="10" fill="url(#cat-iris)"/>
      <ellipse cx="138" cy="87" rx="8"  ry="10" fill="url(#cat-iris)"/>
      <!-- Pupil (vertical slit) -->
      <ellipse cx="102" cy="87" rx="3"  ry="8"  fill="#0a0a0a"/>
      <ellipse cx="138" cy="87" rx="3"  ry="8"  fill="#0a0a0a"/>
      <!-- Eye ambient glow halos -->
      <circle cx="102" cy="85" r="14" fill="url(#cat-eye-glow)" opacity="0.6"/>
      <circle cx="138" cy="85" r="14" fill="url(#cat-eye-glow)" opacity="0.6"/>
      <!-- Catchlights (Pixar-style: large + small) -->
      <circle cx="106" cy="82" r="3"   fill="#ffffff" opacity="0.95"/>
      <circle cx="98"  cy="90" r="1.4" fill="#ffffff" opacity="0.7"/>
      <circle cx="142" cy="82" r="3"   fill="#ffffff" opacity="0.95"/>
      <circle cx="134" cy="90" r="1.4" fill="#ffffff" opacity="0.7"/>
      <!-- Eyelids for blink (JS-animated) -->
      <rect class="cat__lid cat__lid--left"  x="90"  y="77" width="24" height="0" fill="url(#cat-fur)" rx="3"/>
      <rect class="cat__lid cat__lid--right" x="126" y="77" width="24" height="0" fill="url(#cat-fur)" rx="3"/>
    </g>

    <!-- Nose -->
    <path d="M 114 104 L 126 104 L 120 112 Z" fill="#d05050"/>
    <!-- Philtrum line -->
    <line x1="120" y1="112" x2="120" y2="116" stroke="#b04040" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <!-- Mouth -->
    <path d="M 120 116 Q 112 124 108 120" stroke="#904030" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M 120 116 Q 128 124 132 120" stroke="#904030" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- Whiskers (3 per side, slight angle variety) -->
    <g class="cat__whiskers" stroke="#e8e8d8" stroke-linecap="round" opacity="0.65">
      <!-- Left whiskers -->
      <line x1="92"  y1="106" x2="62"  y2="100" stroke-width="1.4"/>
      <line x1="92"  y1="110" x2="62"  y2="112" stroke-width="1.4"/>
      <line x1="92"  y1="114" x2="64"  y2="120" stroke-width="1.2"/>
      <!-- Right whiskers -->
      <line x1="148" y1="106" x2="178" y2="100" stroke-width="1.4"/>
      <line x1="148" y1="110" x2="178" y2="112" stroke-width="1.4"/>
      <line x1="148" y1="114" x2="176" y2="120" stroke-width="1.2"/>
    </g>
  </g>
</svg>
`;

const VALID_STATES = ["idle", "attentive", "active", "celebratory"];
const PROVIDER_CLASS_NAMES = [
  "cat-stage--provider-inline-svg",
  "cat-stage--provider-svg-url",
  "cat-stage--provider-video",
  "cat-stage--provider-spline",
];

export const CAT_STATES = [...VALID_STATES];

export function mountCat(container, { state = "idle", onClick, asset } = {}) {
  if (!container) return null;
  const initialState = normalizeState(state) || "idle";
  container.classList.add("cat-stage");
  container.dataset.state = initialState;

  let catAsset = normalizeAssetConfig(asset);
  let mountedAsset = mountAssetProvider(container, catAsset, initialState);

  bindContainerInteractivity(container, onClick);

  return {
    setState(next) {
      const normalizedState = normalizeState(next);
      if (!normalizedState) return;
      container.dataset.state = normalizedState;
      mountedAsset.setState(normalizedState);
    },
    setAsset(nextAsset) {
      const nextState = normalizeState(container.dataset.state) || "idle";
      catAsset = normalizeAssetConfig(nextAsset);
      mountedAsset = mountAssetProvider(container, catAsset, nextState);
      return catAsset;
    },
    getState() {
      return normalizeState(container.dataset.state) || "idle";
    },
    getAsset() {
      return { ...catAsset, stateSources: { ...catAsset.stateSources } };
    },
    element: container,
    asset: catAsset,
  };
}

function bindContainerInteractivity(container, onClick) {
  if (container.__catClickHandler) {
    container.removeEventListener("click", container.__catClickHandler);
    delete container.__catClickHandler;
  }
  if (container.__catKeyHandler) {
    container.removeEventListener("keydown", container.__catKeyHandler);
    delete container.__catKeyHandler;
  }

  if (typeof onClick !== "function") {
    container.style.removeProperty("cursor");
    container.removeAttribute("role");
    container.removeAttribute("tabindex");
    return;
  }

  const clickHandler = (event) => onClick(event);
  const keyHandler = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };

  container.style.cursor = "pointer";
  container.setAttribute("role", "button");
  container.setAttribute("tabindex", "0");
  container.addEventListener("click", clickHandler);
  container.addEventListener("keydown", keyHandler);

  container.__catClickHandler = clickHandler;
  container.__catKeyHandler = keyHandler;
}

function mountAssetProvider(container, asset, initialState) {
  runAssetCleanup(container);

  let activeState = initialState;
  let activeProvider = null;

  const installProvider = (nextProvider) => {
    runAssetCleanup(container);
    container.innerHTML = "";
    container.classList.remove(...PROVIDER_CLASS_NAMES);
    container.classList.add(`cat-stage--provider-${nextProvider.type}`);
    container.dataset.assetProvider = nextProvider.type;
    container.append(nextProvider.element);

    const cleanupFns = [];
    if (typeof nextProvider.onMount === "function") {
      const cleanup = nextProvider.onMount();
      if (typeof cleanup === "function") {
        cleanupFns.push(cleanup);
      }
    }
    if (typeof nextProvider.bindError === "function") {
      const detachErrorHandler = nextProvider.bindError(() => {
        if (activeProvider?.type === "inline-svg") return;
        installProvider(createInlineSvgProvider());
      });
      if (typeof detachErrorHandler === "function") {
        cleanupFns.push(detachErrorHandler);
      }
    }
    container.__catAssetCleanupFns = cleanupFns;
    activeProvider = nextProvider;
    activeProvider.setState?.(activeState);
  };

  try {
    installProvider(createProvider(asset));
  } catch (error) {
    console.warn("[CAT] Falling back to inline cat asset.", error);
    installProvider(createInlineSvgProvider());
  }

  return {
    setState(nextState) {
      activeState = nextState;
      activeProvider?.setState?.(nextState);
    },
  };
}

function runAssetCleanup(container) {
  if (!Array.isArray(container.__catAssetCleanupFns)) return;
  container.__catAssetCleanupFns.forEach((cleanup) => {
    if (typeof cleanup === "function") {
      cleanup();
    }
  });
  container.__catAssetCleanupFns = [];
}

function createProvider(asset) {
  if (asset.type === "video") {
    return createVideoProvider(asset);
  }
  if (asset.type === "spline") {
    return createSplineProvider(asset);
  }
  if (asset.type === "svg-url") {
    return createSvgUrlProvider(asset);
  }
  return createInlineSvgProvider();
}

function createInlineSvgProvider() {
  const template = document.createElement("template");
  template.innerHTML = CAT_SVG.trim();
  const svg = template.content.firstElementChild;
  svg.classList.add("cat-stage__asset", "cat-stage__asset--svg");

  return {
    type: "inline-svg",
    element: svg,
    onMount() {
      const cleanupFns = [];
      const stopBlink = startBlinkLoop(svg);
      if (typeof stopBlink === "function") {
        cleanupFns.push(stopBlink);
      }
      const stopTailWag = startTailWag(svg);
      if (typeof stopTailWag === "function") {
        cleanupFns.push(stopTailWag);
      }
      return () => cleanupFns.forEach((cleanup) => cleanup());
    },
    setState() {},
  };
}

function createSvgUrlProvider(asset) {
  const source = resolveSourceForState(asset, "idle");
  if (!source) {
    throw new Error("svg-url cat asset requires `src` or `stateSources`.");
  }

  const image = document.createElement("img");
  image.className = "cat-stage__asset cat-stage__asset--svg-url";
  image.alt = asset.alt || "CAT companion";
  image.decoding = "async";
  image.referrerPolicy = asset.referrerPolicy || "no-referrer";

  const setSource = (state) => {
    const nextSource = resolveSourceForState(asset, state);
    if (!nextSource) return;
    if (image.dataset.activeSource === nextSource) return;
    image.src = nextSource;
    image.dataset.activeSource = nextSource;
  };
  setSource("idle");

  return {
    type: "svg-url",
    element: image,
    setState: setSource,
    bindError(onError) {
      image.addEventListener("error", onError, { once: true });
      return () => image.removeEventListener("error", onError);
    },
  };
}

function createVideoProvider(asset) {
  const source = resolveSourceForState(asset, "idle");
  if (!source) {
    throw new Error("video cat asset requires `src` or `stateSources`.");
  }

  const video = document.createElement("video");
  video.className = "cat-stage__asset cat-stage__asset--video";
  video.muted = asset.muted ?? true;
  video.loop = asset.loop ?? true;
  video.autoplay = asset.autoplay ?? true;
  video.playsInline = asset.playsInline ?? true;
  video.preload = asset.preload || "auto";
  video.setAttribute("aria-label", asset.alt || "CAT companion animation");
  if (asset.poster) {
    video.poster = asset.poster;
  }

  const syncPlayback = () => {
    if (!video.autoplay) return;
    const playback = video.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {});
    }
  };

  const setSource = (state) => {
    const nextSource = resolveSourceForState(asset, state);
    if (!nextSource) return;
    if (video.dataset.activeSource === nextSource) return;
    video.src = nextSource;
    video.dataset.activeSource = nextSource;
    video.load();
    syncPlayback();
  };
  setSource("idle");

  return {
    type: "video",
    element: video,
    onMount: syncPlayback,
    setState: setSource,
    bindError(onError) {
      video.addEventListener("error", onError, { once: true });
      return () => video.removeEventListener("error", onError);
    },
  };
}

function createSplineProvider(asset) {
  const source = resolveSourceForState(asset, "idle");
  if (!source) {
    throw new Error("spline cat asset requires `src` or `stateSources`.");
  }

  const iframe = document.createElement("iframe");
  iframe.className = "cat-stage__asset cat-stage__asset--spline";
  iframe.title = asset.title || "CAT Spline scene";
  iframe.loading = asset.loading || "lazy";
  iframe.allow = asset.allow || "autoplay; fullscreen; xr-spatial-tracking";
  iframe.referrerPolicy = asset.referrerPolicy || "strict-origin-when-cross-origin";
  iframe.dataset.interactive = String(asset.interactive === true);
  if (asset.interactive !== true) {
    iframe.setAttribute("tabindex", "-1");
    iframe.setAttribute("aria-hidden", "true");
  }

  const setSource = (state) => {
    const nextSource = resolveSourceForState(asset, state);
    if (!nextSource) return;
    if (iframe.dataset.activeSource === nextSource) return;
    iframe.src = nextSource;
    iframe.dataset.activeSource = nextSource;
  };
  setSource("idle");

  return {
    type: "spline",
    element: iframe,
    setState: setSource,
  };
}

function resolveSourceForState(asset, state) {
  return asset.stateSources?.[state] || asset.src || "";
}

function normalizeAssetConfig(asset) {
  if (!asset || typeof asset !== "object") {
    return { type: "inline-svg", stateSources: {} };
  }

  const aliases = {
    svg: "inline-svg",
    image: "svg-url",
    pika: "video",
  };

  let type = String(asset.type || "").toLowerCase().trim();
  if (!type) {
    type = asset.src ? "svg-url" : "inline-svg";
  }
  type = aliases[type] || type;
  if (!["inline-svg", "svg-url", "video", "spline"].includes(type)) {
    type = "inline-svg";
  }

  const stateSources = {};
  if (asset.stateSources && typeof asset.stateSources === "object") {
    VALID_STATES.forEach((state) => {
      const source = asset.stateSources[state];
      if (typeof source === "string" && source.trim()) {
        stateSources[state] = source.trim();
      }
    });
  }

  return {
    ...asset,
    type,
    src: typeof asset.src === "string" ? asset.src.trim() : "",
    stateSources,
  };
}

function normalizeState(state) {
  return VALID_STATES.includes(state) ? state : null;
}

/* Random natural blink — every 3-7 seconds. */
function startBlinkLoop(root) {
  const lidLeft = root.querySelector(".cat__lid--left");
  const lidRight = root.querySelector(".cat__lid--right");
  if (!lidLeft || !lidRight) return null;

  let timerId = null;
  let cancelled = false;

  const scheduleBlink = () => {
    if (cancelled) return;
    const delay = 3000 + Math.random() * 4000;
    timerId = window.setTimeout(() => {
      const dur = 120;
      lidLeft.animate(
        [
          { height: "0px" },
          { height: "18px" },
          { height: "0px" },
        ],
        { duration: dur * 2, easing: "ease-in-out" }
      );
      lidRight.animate(
        [
          { height: "0px" },
          { height: "18px" },
          { height: "0px" },
        ],
        { duration: dur * 2, easing: "ease-in-out" }
      );
      scheduleBlink();
    }, delay);
  };

  scheduleBlink();
  return () => {
    cancelled = true;
    if (timerId !== null) {
      window.clearTimeout(timerId);
    }
  };
}

/* Tail wag — idle state only. */
function startTailWag(root) {
  const tail = root.querySelector(".cat__tail");
  if (!tail) return null;
  const animation = tail.animate(
    [
      { transform: "rotate(-4deg)" },
      { transform: "rotate(6deg)" },
      { transform: "rotate(-4deg)" },
    ],
    {
      duration: 1400,
      iterations: Infinity,
      easing: "ease-in-out",
    }
  );

  return () => animation.cancel();
}
