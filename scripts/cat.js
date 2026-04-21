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

export function mountCat(container, { state = "idle", onClick } = {}) {
  if (!container) return null;
  container.classList.add("cat-stage");
  container.innerHTML = CAT_SVG;
  container.dataset.state = state;

  if (onClick) {
    container.style.cursor = "pointer";
    container.addEventListener("click", onClick);
    container.setAttribute("role", "button");
    container.setAttribute("tabindex", "0");
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    });
  }

  startBlinkLoop(container);
  startTailWag(container);

  return {
    setState(next) {
      if (!VALID_STATES.includes(next)) return;
      container.dataset.state = next;
    },
    element: container,
  };
}

/* Random natural blink — every 3-7 seconds. */
function startBlinkLoop(container) {
  const lidLeft = container.querySelector(".cat__lid--left");
  const lidRight = container.querySelector(".cat__lid--right");
  if (!lidLeft || !lidRight) return;

  const blink = () => {
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
  };

  const scheduleBlink = () => {
    const delay = 3000 + Math.random() * 4000;
    setTimeout(blink, delay);
  };

  scheduleBlink();
}

/* Tail wag — idle state only. */
function startTailWag(container) {
  const tail = container.querySelector(".cat__tail");
  if (!tail) return;
  tail.animate(
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
}
