/* CAT companion
 * Illustrated orange cat. State machine drives posture and animation.
 * States: idle | attentive | active | celebratory
 */

const CAT_SVG = `
<svg class="cat" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CAT companion" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="cat-body-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffa85c"/>
      <stop offset="100%" stop-color="#ff8c42"/>
    </linearGradient>
    <linearGradient id="cat-belly-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5d5ab"/>
      <stop offset="100%" stop-color="#e3b87f"/>
    </linearGradient>
    <radialGradient id="cat-eye-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#00d9ff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#00d9ff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Tail (renders behind body, animates from base) -->
  <g class="cat__tail" style="transform-origin: 175px 175px;">
    <path d="M 175 175 Q 210 170 218 135 Q 222 100 200 92"
          stroke="#ff8c42" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M 175 175 Q 210 170 218 135 Q 222 100 200 92"
          stroke="#8b6f47" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.35"/>
    <circle cx="200" cy="92" r="8" fill="#8b6f47"/>
  </g>

  <!-- Body -->
  <g class="cat__body">
    <ellipse cx="120" cy="168" rx="56" ry="50" fill="url(#cat-body-grad)"/>
    <ellipse cx="120" cy="182" rx="32" ry="28" fill="url(#cat-belly-grad)" opacity="0.92"/>
    <!-- Body stripes -->
    <path d="M 78 150 Q 72 162 80 178" stroke="#8b6f47" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.4"/>
    <path d="M 162 150 Q 168 162 160 178" stroke="#8b6f47" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.4"/>
    <!-- Front paws -->
    <ellipse cx="100" cy="212" rx="14" ry="10" fill="#ff8c42"/>
    <ellipse cx="140" cy="212" rx="14" ry="10" fill="#ff8c42"/>
    <ellipse cx="100" cy="214" rx="6" ry="3" fill="#5a4a35" opacity="0.5"/>
    <ellipse cx="140" cy="214" rx="6" ry="3" fill="#5a4a35" opacity="0.5"/>
  </g>

  <!-- Head -->
  <g class="cat__head" style="transform-origin: 120px 95px;">
    <!-- Ears -->
    <g class="cat__ears">
      <path class="cat__ear cat__ear--left" d="M 82 68 L 72 32 L 108 58 Z" fill="#ff8c42" style="transform-origin: 82px 68px;"/>
      <path d="M 86 62 L 82 44 L 100 58 Z" fill="#8b6f47" opacity="0.65"/>
      <path class="cat__ear cat__ear--right" d="M 158 68 L 168 32 L 132 58 Z" fill="#ff8c42" style="transform-origin: 158px 68px;"/>
      <path d="M 154 62 L 158 44 L 140 58 Z" fill="#8b6f47" opacity="0.65"/>
    </g>

    <!-- Face -->
    <ellipse cx="120" cy="92" rx="50" ry="45" fill="url(#cat-body-grad)"/>
    <!-- Head stripe -->
    <path d="M 120 52 Q 116 70 120 88" stroke="#8b6f47" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.45"/>
    <!-- Muzzle -->
    <ellipse cx="120" cy="108" rx="26" ry="18" fill="#f5d5ab" opacity="0.6"/>

    <!-- Eyes -->
    <g class="cat__eyes">
      <ellipse class="cat__eye cat__eye--left" cx="102" cy="88" rx="8" ry="10" fill="#1a1a1a"/>
      <ellipse class="cat__eye cat__eye--right" cx="138" cy="88" rx="8" ry="10" fill="#1a1a1a"/>
      <circle cx="102" cy="86" r="12" fill="url(#cat-eye-glow)" opacity="0.55"/>
      <circle cx="138" cy="86" r="12" fill="url(#cat-eye-glow)" opacity="0.55"/>
      <circle cx="102" cy="86" r="3" fill="#00d9ff"/>
      <circle cx="138" cy="86" r="3" fill="#00d9ff"/>
      <circle cx="103" cy="84" r="1.2" fill="#ffffff"/>
      <circle cx="139" cy="84" r="1.2" fill="#ffffff"/>
      <!-- Eyelid for blink -->
      <rect class="cat__lid cat__lid--left" x="92" y="78" width="20" height="0" fill="#ff8c42" rx="2"/>
      <rect class="cat__lid cat__lid--right" x="128" y="78" width="20" height="0" fill="#ff8c42" rx="2"/>
    </g>

    <!-- Nose -->
    <path d="M 116 102 L 124 102 L 120 108 Z" fill="#8b6f47"/>
    <!-- Mouth -->
    <path d="M 120 108 Q 114 116 110 112" stroke="#5a4a35" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M 120 108 Q 126 116 130 112" stroke="#5a4a35" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- Whiskers -->
    <g class="cat__whiskers" stroke="#c1c1c1" stroke-width="1.2" stroke-linecap="round" opacity="0.55">
      <line x1="90" y1="104" x2="68" y2="99"/>
      <line x1="90" y1="108" x2="68" y2="110"/>
      <line x1="150" y1="104" x2="172" y2="99"/>
      <line x1="150" y1="108" x2="172" y2="110"/>
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
