/* CAT — Scene
 * Lofi night NYC apartment. Moonlit window, warm desk lamp, cat on mousepad.
 * Mount this before mountCat() so the cat stage gets positioned over the desk.
 */

/* ─── SVG ─────────────────────────────────────────────────────────────────── */

const SCENE_SVG = /* html */`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 720"
  preserveAspectRatio="xMinYMid slice"
  role="presentation" aria-hidden="true"
  style="display:block;width:100%;height:100%;user-select:none;">
  <defs>

    <!-- Sky: lofi late-night — deep midnight blue with purple-indigo glow -->
    <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#010308"/>
      <stop offset="18%"  stop-color="#040a1c"/>
      <stop offset="28%"  stop-color="#0a0828"/><!-- deep purple-indigo band -->
      <stop offset="36%"  stop-color="#0d0c3a"/><!-- subtle indigo shift -->
      <stop offset="52%"  stop-color="#080e38"/>
      <stop offset="68%"  stop-color="#0e1654"/>
      <stop offset="80%"  stop-color="#1a2468"/>
      <stop offset="88%"  stop-color="#1c2c72"/><!-- violet warmth near horizon -->
      <stop offset="94%"  stop-color="#1e3070"/>
      <stop offset="100%" stop-color="#243a80"/>
    </linearGradient>

    <!-- Room walls: deep charcoal, lofi night interior -->
    <linearGradient id="s-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#0a0808"/>
      <stop offset="38%"  stop-color="#140c09"/>
      <stop offset="52%"  stop-color="#1a1009"/><!-- subtle warm-brown texture -->
      <stop offset="65%"  stop-color="#160e0a"/>
      <stop offset="100%" stop-color="#221408"/>
    </linearGradient>

    <!-- Cool blue tint from moonlit window (left / top) -->
    <radialGradient id="s-wall-light" cx="38%" cy="38%" r="58%">
      <stop offset="0%"   stop-color="#4060c8" stop-opacity="0.16"/>
      <stop offset="55%"  stop-color="#2840a0" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Warm lamp glow (right side, desk level) -->
    <radialGradient id="s-lamp-wall" cx="66%" cy="72%" r="44%">
      <stop offset="0%"   stop-color="#ffcc70" stop-opacity="0.52"/><!-- incandescent amber core -->
      <stop offset="20%"  stop-color="#ffaa48" stop-opacity="0.36"/>
      <stop offset="48%"  stop-color="#e06010" stop-opacity="0.16"/>
      <stop offset="75%"  stop-color="#a03800" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Floor: dark hardwood -->
    <linearGradient id="s-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#482c12"/>
      <stop offset="32%"  stop-color="#3e2410"/><!-- midtone grain band -->
      <stop offset="58%"  stop-color="#361e0c"/>
      <stop offset="100%" stop-color="#2c1608"/>
    </linearGradient>

    <!-- Desk surface: rich mahogany -->
    <linearGradient id="s-desk-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#9a6840"/>
      <stop offset="35%"  stop-color="#7a5028"/>
      <stop offset="100%" stop-color="#583818"/>
    </linearGradient>

    <!-- Desk front face -->
    <linearGradient id="s-desk-face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#3a2008"/>
      <stop offset="100%" stop-color="#1e0e04"/>
    </linearGradient>

    <!-- Window cool moonlight glow spilling into room -->
    <radialGradient id="s-win-glow" cx="50%" cy="48%" r="60%">
      <stop offset="0%"   stop-color="#e8f0ff" stop-opacity="0.42"/><!-- silvery moonlight core -->
      <stop offset="14%"  stop-color="#c0d4ff" stop-opacity="0.30"/>
      <stop offset="36%"  stop-color="#8ab0ff" stop-opacity="0.14"/>
      <stop offset="62%"  stop-color="#4870e0" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#1030a0" stop-opacity="0"/>
    </radialGradient>

    <!-- Lamp glow — warm amber hero light in lofi night scene -->
    <radialGradient id="s-lamp-glow" cx="50%" cy="15%" r="88%">
      <stop offset="0%"   stop-color="#fff4c0" stop-opacity="1.0"/>
      <stop offset="18%"  stop-color="#ffd060" stop-opacity="0.82"/>
      <stop offset="38%"  stop-color="#ffb040" stop-opacity="0.52"/>
      <stop offset="62%"  stop-color="#ff7010" stop-opacity="0.22"/>
      <stop offset="82%"  stop-color="#e04000" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#c03000" stop-opacity="0"/>
    </radialGradient>

    <!-- Monitor cool blue glow -->
    <radialGradient id="s-monitor-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#00d9ff" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0060ff" stop-opacity="0"/>
    </radialGradient>

    <!-- Floor: cool moonlight pool from window -->
    <radialGradient id="s-floor-light" cx="36%" cy="0%" r="72%">
      <stop offset="0%"   stop-color="#6080e0" stop-opacity="0.22"/>
      <stop offset="55%"  stop-color="#3050c0" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Floor: warm lamp pool (separate gradient, applied at desk area) -->
    <radialGradient id="s-floor-lamp" cx="60%" cy="0%" r="55%">
      <stop offset="0%"   stop-color="#ffaa40" stop-opacity="0.35"/>
      <stop offset="55%"  stop-color="#ff6810" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Vignette: cinema look -->
    <radialGradient id="s-vignette" cx="50%" cy="50%" r="68%">
      <stop offset="55%"  stop-color="transparent"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.68"/>
    </radialGradient>

    <!-- Cat bed cushion gradient — warm tan/cream fill -->
    <radialGradient id="s-cat-bed-cushion" cx="38%" cy="30%" r="65%">
      <stop offset="0%"   stop-color="#e8c48a"/>
      <stop offset="40%"  stop-color="#c89050"/>
      <stop offset="100%" stop-color="#9a6828"/>
    </radialGradient>

    <!-- Desk glass-top sheen: subtle diagonal highlight catches ambient light -->
    <linearGradient id="s-desk-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="28%"  stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="44%"  stop-color="#ffe8c0" stop-opacity="0.12"/><!-- warm specular peak -->
      <stop offset="56%"  stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Monitor screen vignette: center bright, corners dimmed for CRT feel -->
    <radialGradient id="s-monitor-screen-gradient" cx="50%" cy="46%" r="62%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="55%"  stop-color="#000080" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.38"/>
    </radialGradient>

    <!-- Curtain fold depth: fabric shadow between folds -->
    <linearGradient id="s-curtain-fold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.28"/>
      <stop offset="18%"  stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="42%"  stop-color="#000000" stop-opacity="0"/>
      <stop offset="68%"  stop-color="#000000" stop-opacity="0.08"/>
      <stop offset="88%"  stop-color="#000000" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
    </linearGradient>

    <!-- Filters -->
    <filter id="s-blur-xxs" x="-8%" y="-8%" width="116%" height="116%">
      <feGaussianBlur stdDeviation="0.5"/>
    </filter>
    <filter id="s-blur-xs" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
    <filter id="s-blur-sm" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <filter id="s-blur-md" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
    <filter id="s-blur-lg" x="-55%" y="-55%" width="210%" height="210%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <filter id="s-blur-xl" x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur stdDeviation="40"/>
    </filter>

    <!-- Light bloom: soft glow halo using blur + screen composite -->
    <filter id="s-glow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
      <feComposite in="blur" in2="SourceGraphic" operator="over" result="glow"/>
      <feBlend in="glow" in2="SourceGraphic" mode="screen"/>
    </filter>

    <!-- ── Pointer-event clip zones ───────────────────────────────────────────
         These clip paths restrict where SVG interactive elements receive clicks.
         Any SVG interactive group whose bounding box overlaps the monitor screen
         area (SVG x=418–808, y=310–538) must be clipped so it cannot absorb
         pointer events in that region — otherwise some browsers allow the SVG
         hit zone to fire even when an HTML element at a higher z-index sits on
         top of it.
    ────────────────────────────────────────────────────────────────────────── -->

    <!-- ESB: only hittable above the monitor bezel top (y < 296).
         The building base extends down to y=534 which fully overlaps the monitor
         screen.  Restrict clicks to the spire/upper floors only. -->
    <clipPath id="s-esb-click-clip">
      <rect x="0" y="0" width="1440" height="296"/>
    </clipPath>

    <!-- Plant-left: sits at translate(420,494).  The leaf canopy (SVG y≈494–537)
         overlaps the bottom edge of the monitor screen (SVG y=310–538).  Only
         the pot area (SVG y≥538, below the monitor screen) should be hittable.
         clipPathUnits=userSpaceOnUse so coords are in root SVG space. -->
    <clipPath id="s-plant-left-click-clip" clipPathUnits="userSpaceOnUse">
      <rect x="400" y="538" width="100" height="60"/>
    </clipPath>

    <!-- Moon surface: radial limb-darkening for realistic sphere feel -->
    <radialGradient id="s-moon-surface" cx="42%" cy="38%" r="58%">
      <stop offset="0%"   stop-color="#f8fcff" stop-opacity="1"/>
      <stop offset="42%"  stop-color="#e8f2ff" stop-opacity="1"/>
      <stop offset="72%"  stop-color="#ccdaff" stop-opacity="1"/>
      <stop offset="88%"  stop-color="#a8c0f0" stop-opacity="1"/>
      <stop offset="100%" stop-color="#7898d8" stop-opacity="1"/>
    </radialGradient>

    <!-- Moonbeam shaft: fades to transparent toward room -->
    <linearGradient id="s-shaft-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#8090d8" stop-opacity="0.12"/>
      <stop offset="55%"  stop-color="#6070c0" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#4050a0" stop-opacity="0"/>
    </linearGradient>

    <!-- Clip: window glass area -->
    <clipPath id="s-win-clip">
      <rect x="300" y="54" width="548" height="482"/>
    </clipPath>

  </defs>

  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 1 · ROOM SHELL
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Wall base -->
  <rect width="1440" height="590" fill="url(#s-wall)"/>
  <!-- Cool moonlight wash from window -->
  <rect width="1440" height="590" fill="url(#s-wall-light)"/>
  <!-- Warm lamp glow on right wall / ceiling -->
  <rect width="1440" height="590" fill="url(#s-lamp-wall)"/>

  <!-- Floor -->
  <rect y="582" width="1440" height="138" fill="url(#s-floor)"/>

  <!-- Floorboard horizontals -->
  <g stroke="#281408" stroke-width="1" opacity="0.45">
    <line x1="0" y1="602" x2="1440" y2="602"/>
    <line x1="0" y1="630" x2="1440" y2="630"/>
    <line x1="0" y1="658" x2="1440" y2="658"/>
    <line x1="0" y1="686" x2="1440" y2="686"/>
    <line x1="0" y1="714" x2="1440" y2="714"/>
  </g>
  <!-- Floorboard verticals (perspective) -->
  <g stroke="#281408" stroke-width="1" opacity="0.22">
    <line x1="130"  y1="582" x2="84"   y2="720"/>
    <line x1="310"  y1="582" x2="254"  y2="720"/>
    <line x1="490"  y1="582" x2="424"  y2="720"/>
    <line x1="670"  y1="582" x2="594"  y2="720"/>
    <line x1="850"  y1="582" x2="764"  y2="720"/>
    <line x1="1030" y1="582" x2="934"  y2="720"/>
    <line x1="1210" y1="582" x2="1104" y2="720"/>
    <line x1="1390" y1="582" x2="1274" y2="720"/>
  </g>

  <!-- Floorboard plank seams (vertical) -->
  <g stroke="#241008" stroke-width="0.8" opacity="0.20">
    <line x1="198"  y1="582" x2="190"  y2="720"/>
    <line x1="388"  y1="582" x2="376"  y2="720"/>
    <line x1="578"  y1="582" x2="562"  y2="720"/>
    <line x1="768"  y1="582" x2="748"  y2="720"/>
    <line x1="958"  y1="582" x2="934"  y2="720"/>
    <line x1="1148" y1="582" x2="1120" y2="720"/>
    <line x1="1338" y1="582" x2="1306" y2="720"/>
  </g>
  <!-- Baseboard — 3-piece molding: cap + body + shoe -->
  <rect y="572" width="1440" height="3"  fill="#7a5030" opacity="0.55"/><!-- cap rail -->
  <rect y="575" width="1440" height="10" fill="#5a381e" opacity="0.65"/><!-- body -->
  <rect y="585" width="1440" height="2"  fill="#3a2010" opacity="0.70"/><!-- shoe rail -->

  <!-- Wall-to-ceiling fade at very top (depth hint) -->
  <rect width="1440" height="3" fill="#100806" opacity="0.6"/>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 2 · WINDOW  (sky + NYC skyline)
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Outer wood frame -->
  <rect x="288" y="40" width="576" height="508" rx="6" fill="#2c1808"/>

  <!-- Sky fill -->
  <rect x="300" y="54" width="548" height="482" fill="url(#s-sky)"/>

  <!-- All skyline content clipped to glass area -->
  <g clip-path="url(#s-win-clip)">

    <!-- Stars: cool blue-white (far, dim) -->
    <g fill="#c8daff" opacity="0.50">
      <circle cx="318" cy="68"  r="1"/>
      <circle cx="352" cy="79"  r="0.8"/>
      <circle cx="388" cy="64"  r="1.2"/>
      <circle cx="424" cy="71"  r="0.8"/>
      <circle cx="462" cy="66"  r="1"/>
      <circle cx="498" cy="80"  r="0.7"/>
      <circle cx="536" cy="73"  r="0.9"/>
      <circle cx="584" cy="68"  r="1.1"/>
      <circle cx="622" cy="77"  r="0.8"/>
      <circle cx="668" cy="65"  r="1"/>
      <circle cx="714" cy="79"  r="0.7"/>
      <circle cx="754" cy="70"  r="1.2"/>
      <circle cx="798" cy="67"  r="0.8"/>
      <circle cx="830" cy="76"  r="1"/>
    </g>
    <!-- Stars: warm yellow (slightly closer, brighter) -->
    <g fill="#ffe8a0" opacity="0.60">
      <circle cx="340" cy="88"  r="0.8"/>
      <circle cx="405" cy="76"  r="0.7"/>
      <circle cx="472" cy="89"  r="1.0"/>
      <circle cx="528" cy="80"  r="0.7"/>
      <circle cx="598" cy="91"  r="0.8"/>
      <circle cx="648" cy="78"  r="0.9"/>
      <circle cx="705" cy="88"  r="0.7"/>
      <circle cx="762" cy="81"  r="1.0"/>
      <circle cx="820" cy="87"  r="0.8"/>
    </g>
    <!-- Stars: tight clusters -->
    <g fill="#e8f0ff" opacity="0.45">
      <circle cx="368" cy="72"  r="0.6"/>
      <circle cx="371" cy="69"  r="0.5"/>
      <circle cx="370" cy="75"  r="0.4"/>
      <circle cx="720" cy="65"  r="0.6"/>
      <circle cx="724" cy="62"  r="0.5"/>
      <circle cx="718" cy="68"  r="0.4"/>
    </g>

    <!-- Twinkling stars: cool blue-white with color variation -->
    <circle cx="334" cy="72" r="1.6" fill="#d8e8ff">
      <animate attributeName="opacity" values="0.25;1;0.3;0.9;0.25" dur="3.4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="556" cy="67" r="1.5" fill="#ffe4a0">
      <animate attributeName="opacity" values="0.5;1;0.3;0.8;0.5" dur="4.2s" repeatCount="indefinite" begin="-1.6s"/>
    </circle>
    <circle cx="742" cy="74" r="1.5" fill="#d0e4ff">
      <animate attributeName="opacity" values="0.35;0.95;0.35" dur="2.9s" repeatCount="indefinite" begin="-0.9s"/>
    </circle>
    <circle cx="810" cy="64" r="1.3" fill="#ffd888">
      <animate attributeName="opacity" values="0.6;1;0.4;0.85;0.6" dur="5.1s" repeatCount="indefinite" begin="-2.4s"/>
    </circle>
    <!-- Extra twinkling stars: dimmer, slower -->
    <circle cx="450" cy="85" r="1.2" fill="#c8d8ff">
      <animate attributeName="opacity" values="0.2;0.85;0.2" dur="6.8s" repeatCount="indefinite" begin="-3.1s"/>
    </circle>
    <circle cx="686" cy="76" r="1.4" fill="#ffe090">
      <animate attributeName="opacity" values="0.4;0.9;0.35;0.8;0.4" dur="4.6s" repeatCount="indefinite" begin="-5.4s"/>
    </circle>

    <!-- Moon: silver-white, bright lofi night moon -->
    <g id="s-moon" style="cursor:pointer;pointer-events:all">
    <!-- Wide corona halo -->
    <ellipse cx="428" cy="188" rx="90" ry="90" fill="#c0d8ff" opacity="0.15" filter="url(#s-blur-xl)"/>
    <!-- Mid-range soft halo -->
    <ellipse cx="428" cy="188" rx="50" ry="50" fill="#d8eaff" opacity="0.35" filter="url(#s-blur-lg)"/>
    <!-- Close halo ring for atmospheric glow -->
    <ellipse cx="428" cy="188" rx="32" ry="32" fill="#e8f4ff" opacity="0.22" filter="url(#s-blur-sm)"/>
    <!-- Moon disc with limb-darkening surface gradient -->
    <ellipse cx="428" cy="188" rx="26" ry="26" fill="url(#s-moon-surface)"/>
    <!-- Rim light: cool blue-white arc on upper-right limb -->
    <path d="M 416 163 A 26 26 0 0 1 454 192" fill="none" stroke="#dce8ff" stroke-width="2.5" opacity="0.55" stroke-linecap="round"/>
    <!-- Crater 1: large with shadow depth -->
    <ellipse cx="421" cy="182" rx="8" ry="7"  fill="#b8cce8" opacity="0.50"/>
    <ellipse cx="420" cy="181" rx="4" ry="3.5" fill="#d0e2f8" opacity="0.30"/>
    <!-- Crater 2: small -->
    <ellipse cx="436" cy="197" rx="5" ry="4"  fill="#b8cce8" opacity="0.35"/>
    <!-- Crater 3: tiny highlight -->
    <ellipse cx="432" cy="175" rx="3" ry="2.5" fill="#c8daf8" opacity="0.25"/>
    </g>

    <!-- Distant buildings (atmospheric haze, barely visible) -->
    <g fill="#12082a" opacity="0.4">
      <rect x="302" y="368" width="32"  height="166"/>
      <rect x="337" y="345" width="24"  height="189"/>
      <rect x="364" y="375" width="38"  height="159"/>
      <rect x="404" y="352" width="30"  height="182"/>
      <rect x="436" y="368" width="44"  height="166"/>
      <rect x="482" y="348" width="34"  height="186"/>
      <rect x="518" y="378" width="50"  height="156"/>
      <rect x="570" y="360" width="40"  height="174"/>
      <rect x="612" y="372" width="54"  height="162"/>
      <rect x="668" y="350" width="30"  height="184"/>
      <rect x="700" y="364" width="42"  height="170"/>
      <rect x="744" y="357" width="52"  height="177"/>
      <rect x="798" y="370" width="38"  height="164"/>
    </g>

    <g id="s-esb" style="cursor:pointer;pointer-events:all" clip-path="url(#s-esb-click-clip)">
    <!-- EMPIRE STATE BUILDING -->
    <g fill="#0e051c" opacity="0.9">
      <rect x="487" y="230" width="106" height="304"/>
      <rect x="493" y="210" width="94"  height="24"/>
      <rect x="501" y="188" width="78"  height="26"/>
      <rect x="509" y="168" width="62"  height="24"/>
      <rect x="517" y="150" width="46"  height="22"/>
      <rect x="525" y="132" width="30"  height="22"/>
      <rect x="531" y="112" width="18"  height="24"/>
      <rect x="534" y="96"  width="12"  height="20"/>
      <!-- Spire -->
      <rect x="537" y="58"  width="6"   height="42"/>
      <rect x="539" y="45"  width="2"   height="18"/>
    </g>
    <!-- ESB lit windows -->
    <g opacity="0.5">
      <rect x="493" y="238" width="12" height="8" fill="#ffd868" rx="1" opacity="0.7"/>
      <rect x="509" y="238" width="12" height="8" fill="#ffd060" rx="1" opacity="0.5"/>
      <rect x="525" y="238" width="12" height="8" fill="#ffd868" rx="1" opacity="0.65"/>
      <rect x="541" y="238" width="12" height="8" fill="#ffc858" rx="1" opacity="0.45"/>
      <rect x="557" y="238" width="12" height="8" fill="#ffd060" rx="1" opacity="0.7"/>
      <rect x="573" y="238" width="12" height="8" fill="#ffd868" rx="1" opacity="0.5"/>
      <rect x="493" y="255" width="12" height="8" fill="#ffd060" rx="1" opacity="0.35"/>
      <rect x="517" y="255" width="12" height="8" fill="#ffd868" rx="1" opacity="0.6"/>
      <rect x="541" y="255" width="12" height="8" fill="#ffd060" rx="1" opacity="0.55"/>
      <rect x="565" y="255" width="12" height="8" fill="#ffd868" rx="1" opacity="0.4"/>
      <rect x="493" y="272" width="12" height="8" fill="#ffd868" rx="1" opacity="0.5"/>
      <rect x="509" y="272" width="12" height="8" fill="#ffc858" rx="1" opacity="0.3"/>
      <rect x="533" y="272" width="12" height="8" fill="#ffd868" rx="1" opacity="0.7"/>
      <rect x="557" y="272" width="12" height="8" fill="#ffd060" rx="1" opacity="0.5"/>
      <rect x="493" y="290" width="12" height="8" fill="#ffd868" rx="1" opacity="0.6"/>
      <rect x="517" y="290" width="12" height="8" fill="#ffd060" rx="1" opacity="0.4"/>
      <rect x="541" y="290" width="12" height="8" fill="#ffd868" rx="1" opacity="0.55"/>
    </g>
    </g><!-- end s-esb -->

    <!-- CHRYSLER BUILDING -->
    <g fill="#0e0520" opacity="0.9">
      <rect x="684" y="274" width="74" height="260"/>
      <!-- Crown arches -->
      <path d="M 684 274 C 684 240 697 218 721 208 C 745 218 758 240 758 274 Z"/>
      <path d="M 690 270 C 690 242 700 224 721 216 C 742 224 752 242 752 270 Z" fill="#160828" opacity="0.7"/>
      <!-- Eagle gargoyles -->
      <ellipse cx="684" cy="280" rx="9"  ry="5" transform="rotate(-28 684 280)"/>
      <ellipse cx="758" cy="280" rx="9"  ry="5" transform="rotate(28 758 280)"/>
      <!-- Spire -->
      <rect x="716" y="196" width="10" height="18"/>
      <rect x="718" y="182" width="6"  height="17"/>
      <rect x="720" y="166" width="2"  height="20"/>
    </g>
    <!-- Chrysler lit windows -->
    <g opacity="0.5">
      <rect x="690" y="282" width="10" height="7" fill="#ffd070" rx="1" opacity="0.6"/>
      <rect x="706" y="282" width="10" height="7" fill="#ffc860" rx="1" opacity="0.4"/>
      <rect x="722" y="282" width="10" height="7" fill="#ffd070" rx="1" opacity="0.7"/>
      <rect x="738" y="282" width="10" height="7" fill="#ffc860" rx="1" opacity="0.5"/>
      <rect x="690" y="298" width="10" height="7" fill="#ffd070" rx="1" opacity="0.4"/>
      <rect x="714" y="298" width="10" height="7" fill="#ffd070" rx="1" opacity="0.65"/>
      <rect x="738" y="298" width="10" height="7" fill="#ffc860" rx="1" opacity="0.4"/>
      <rect x="690" y="314" width="10" height="7" fill="#ffd070" rx="1" opacity="0.5"/>
      <rect x="714" y="314" width="10" height="7" fill="#ffc860" rx="1" opacity="0.35"/>
      <rect x="738" y="314" width="10" height="7" fill="#ffd070" rx="1" opacity="0.6"/>
    </g>

    <!-- Other mid-ground towers -->
    <g fill="#100620" opacity="0.82">
      <rect x="302" y="385" width="62"  height="149"/>
      <rect x="307" y="368" width="18"  height="20"/> <!-- water tower -->
      <rect x="372" y="402" width="46"  height="132"/>
      <rect x="420" y="392" width="56"  height="142"/>
      <rect x="426" y="372" width="10"  height="24"/> <!-- antenna -->
      <rect x="766" y="374" width="58"  height="160"/>
      <rect x="772" y="356" width="12"  height="20"/> <!-- antenna -->
      <rect x="826" y="392" width="22"  height="142"/>
    </g>

    <!-- City glow at horizon: cool blue-white urban night light -->
    <ellipse cx="574" cy="536" rx="320" ry="50" fill="#5070d0" opacity="0.38" filter="url(#s-blur-md)"/>
    <ellipse cx="574" cy="524" rx="190" ry="28" fill="#8098e8" opacity="0.22" filter="url(#s-blur-sm)"/>

    <!-- Atmospheric horizon haze — cooler, more muted night city -->
    <rect x="300" y="450" width="548" height="86" fill="#1c2c78" opacity="0.18"/>
    <rect x="300" y="494" width="548" height="42" fill="#2a3890" opacity="0.14"/>

    <!-- Warm amber building windows (city lights at night — more of them) -->
    <g fill="#ffd878" opacity="0.75">
      <rect x="304" y="390" width="4" height="3" rx="0.5" opacity="0.9"/>
      <rect x="312" y="398" width="3" height="3" rx="0.5" opacity="0.7"/>
      <rect x="318" y="382" width="4" height="3" rx="0.5" opacity="0.85"/>
      <rect x="330" y="395" width="3" height="2" rx="0.5" opacity="0.6"/>
      <rect x="340" y="388" width="4" height="3" rx="0.5" opacity="0.8"/>
      <rect x="352" y="375" width="3" height="3" rx="0.5" opacity="0.9"/>
      <rect x="362" y="396" width="4" height="2" rx="0.5" opacity="0.65"/>
      <rect x="374" y="384" width="3" height="3" rx="0.5" opacity="0.75"/>
      <rect x="388" y="370" width="4" height="3" rx="0.5" opacity="0.85"/>
      <rect x="400" y="390" width="3" height="2" rx="0.5" opacity="0.55"/>
      <rect x="414" y="380" width="3" height="3" rx="0.5" opacity="0.9"/>
      <rect x="428" y="395" width="4" height="2" rx="0.5" opacity="0.7"/>
      <rect x="444" y="385" width="3" height="3" rx="0.5" opacity="0.8"/>
      <rect x="460" y="372" width="4" height="3" rx="0.5" opacity="0.85"/>
      <rect x="476" y="392" width="3" height="2" rx="0.5" opacity="0.6"/>
      <rect x="492" y="382" width="4" height="3" rx="0.5" opacity="0.75"/>
      <rect x="510" y="396" width="3" height="3" rx="0.5" opacity="0.9"/>
      <rect x="528" y="374" width="4" height="2" rx="0.5" opacity="0.65"/>
      <rect x="546" y="388" width="3" height="3" rx="0.5" opacity="0.8"/>
      <rect x="564" y="378" width="4" height="3" rx="0.5" opacity="0.85"/>
      <rect x="582" y="394" width="3" height="2" rx="0.5" opacity="0.55"/>
      <rect x="600" y="383" width="4" height="3" rx="0.5" opacity="0.9"/>
      <rect x="622" y="396" width="3" height="3" rx="0.5" opacity="0.7"/>
      <rect x="642" y="372" width="4" height="2" rx="0.5" opacity="0.8"/>
      <rect x="664" y="390" width="3" height="3" rx="0.5" opacity="0.85"/>
      <rect x="686" y="380" width="4" height="2" rx="0.5" opacity="0.65"/>
      <rect x="710" y="393" width="3" height="3" rx="0.5" opacity="0.9"/>
      <rect x="736" y="376" width="4" height="3" rx="0.5" opacity="0.75"/>
      <rect x="762" y="388" width="3" height="2" rx="0.5" opacity="0.55"/>
      <rect x="790" y="382" width="4" height="3" rx="0.5" opacity="0.8"/>
      <rect x="818" y="395" width="3" height="3" rx="0.5" opacity="0.7"/>
    </g>

    <!-- Rain on the glass — lofi signature -->
    <g id="s-rain" opacity="0.38">
      <line x1="318" y1="60"  x2="308" y2="180" stroke="#b0c8ff" stroke-width="1.2" opacity="0">
        <animate attributeName="opacity" values="0;0.5;0.5;0" dur="1.1s" repeatCount="indefinite" begin="0s"/>
      </line>
      <line x1="346" y1="80"  x2="334" y2="220" stroke="#a8c0ff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.4;0.4;0" dur="0.9s" repeatCount="indefinite" begin="-0.3s"/>
      </line>
      <line x1="380" y1="60"  x2="368" y2="200" stroke="#b8d0ff" stroke-width="1.3" opacity="0">
        <animate attributeName="opacity" values="0;0.55;0.55;0" dur="1.3s" repeatCount="indefinite" begin="-0.7s"/>
      </line>
      <line x1="418" y1="70"  x2="406" y2="190" stroke="#a0beff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.35;0.35;0" dur="1.0s" repeatCount="indefinite" begin="-0.15s"/>
      </line>
      <line x1="460" y1="56"  x2="448" y2="186" stroke="#b0caff" stroke-width="1.1" opacity="0">
        <animate attributeName="opacity" values="0;0.45;0.45;0" dur="1.2s" repeatCount="indefinite" begin="-0.55s"/>
      </line>
      <line x1="502" y1="64"  x2="490" y2="210" stroke="#a8c4ff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.4;0.4;0" dur="0.85s" repeatCount="indefinite" begin="-0.4s"/>
      </line>
      <line x1="538" y1="72"  x2="526" y2="200" stroke="#b4ccff" stroke-width="1.2" opacity="0">
        <animate attributeName="opacity" values="0;0.5;0.5;0" dur="1.15s" repeatCount="indefinite" begin="-0.9s"/>
      </line>
      <line x1="578" y1="58"  x2="566" y2="192" stroke="#a8c0ff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.35;0.35;0" dur="0.95s" repeatCount="indefinite" begin="-0.2s"/>
      </line>
      <line x1="616" y1="68"  x2="604" y2="208" stroke="#b0c8ff" stroke-width="1.1" opacity="0">
        <animate attributeName="opacity" values="0;0.45;0.45;0" dur="1.25s" repeatCount="indefinite" begin="-0.65s"/>
      </line>
      <line x1="654" y1="60"  x2="642" y2="195" stroke="#a4beff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.38;0.38;0" dur="1.0s" repeatCount="indefinite" begin="-0.35s"/>
      </line>
      <line x1="696" y1="74"  x2="684" y2="220" stroke="#b8d0ff" stroke-width="1.3" opacity="0">
        <animate attributeName="opacity" values="0;0.52;0.52;0" dur="1.1s" repeatCount="indefinite" begin="-0.8s"/>
      </line>
      <line x1="736" y1="62"  x2="724" y2="200" stroke="#a8c4ff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.4;0.4;0" dur="0.9s" repeatCount="indefinite" begin="-0.1s"/>
      </line>
      <line x1="778" y1="56"  x2="766" y2="188" stroke="#b0caff" stroke-width="1.1" opacity="0">
        <animate attributeName="opacity" values="0;0.42;0.42;0" dur="1.2s" repeatCount="indefinite" begin="-0.5s"/>
      </line>
      <line x1="820" y1="70"  x2="808" y2="215" stroke="#a4bcff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.36;0.36;0" dur="1.05s" repeatCount="indefinite" begin="-0.72s"/>
      </line>
      <!-- Lower half rain (window continues below crossbar) -->
      <line x1="322" y1="302" x2="310" y2="430" stroke="#a8c0ff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.38;0.38;0" dur="1.0s" repeatCount="indefinite" begin="-0.4s"/>
      </line>
      <line x1="430" y1="308" x2="418" y2="440" stroke="#b0c8ff" stroke-width="1.1" opacity="0">
        <animate attributeName="opacity" values="0;0.44;0.44;0" dur="1.1s" repeatCount="indefinite" begin="-0.6s"/>
      </line>
      <line x1="590" y1="304" x2="578" y2="436" stroke="#a8c4ff" stroke-width="1.0" opacity="0">
        <animate attributeName="opacity" values="0;0.40;0.40;0" dur="0.95s" repeatCount="indefinite" begin="-0.25s"/>
      </line>
      <line x1="740" y1="310" x2="728" y2="445" stroke="#b4ccff" stroke-width="1.2" opacity="0">
        <animate attributeName="opacity" values="0;0.48;0.48;0" dur="1.15s" repeatCount="indefinite" begin="-0.85s"/>
      </line>
    </g>

    <!-- Window cross-bars -->
    <rect x="300" y="288" width="548" height="14" fill="#2c1808"/>
    <rect x="570" y="54"  width="14"  height="482" fill="#2c1808"/>

    <!-- Subtle glass reflection -->
    <rect x="300" y="54"  width="270" height="3"  fill="#ffffff" opacity="0.07"/>
    <rect x="584" y="54"  width="264" height="3"  fill="#ffffff" opacity="0.05"/>
    <rect x="300" y="54"  width="3"   height="234" fill="#ffffff" opacity="0.06"/>

  </g><!-- /clip -->

  <!-- Window frame bevels (depth) -->
  <rect x="288" y="40"  width="576" height="17" fill="#3a2010" rx="4"/> <!-- top bead -->
  <rect x="278" y="536" width="596" height="26" fill="#4a2a14" rx="2"/> <!-- sill -->
  <rect x="288" y="40"  width="17"  height="508" fill="#3a2010"/>       <!-- left jamb -->
  <rect x="859" y="40"  width="17"  height="508" fill="#281408"/>       <!-- right jamb -->
  <!-- Sill shadow -->
  <rect x="278" y="558" width="596" height="10" fill="#160808" opacity="0.38"/>

  <!-- Window moonlight bloom — cool blue key light from outside -->
  <rect x="260" y="30" width="640" height="540" fill="url(#s-win-glow)" filter="url(#s-blur-xl)" opacity="1.0"/>
  <!-- Moon core bloom: silvery blue -->
  <ellipse cx="574" cy="298" rx="180" ry="160" fill="#3858c8" opacity="0.09" filter="url(#s-blur-xl)"/>
  <!-- Moonlight rim on window frame edges -->
  <rect x="288" y="40"  width="6"   height="508" fill="#6888e0" opacity="0.18" filter="url(#s-blur-xs)"/>
  <rect x="858" y="40"  width="6"   height="508" fill="#4060c0" opacity="0.10" filter="url(#s-blur-xs)"/>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 3 · CURTAIN ROD + CURTAINS
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Rod -->
  <rect x="116" y="18" width="1208" height="16" fill="#5a3010" rx="8"/>
  <ellipse cx="116"  cy="26" rx="15" ry="15" fill="#481e08"/>
  <ellipse cx="1324" cy="26" rx="15" ry="15" fill="#481e08"/>

  <!-- Left curtain (animate: gentle sway) -->
  <g id="s-curtain-l">
    <path d="M 132 26 Q 198 124 172 234 Q 148 344 186 454 Q 214 544 194 592 L 288 592 L 288 26 Z"
          fill="#5a2008"/>
    <!-- Fold shadows -->
    <path d="M 158 26 Q 194 124 178 234 Q 160 344 190 454 Q 212 544 194 592 L 202 592
             Q 218 544 194 454 Q 152 344 176 234 Q 196 124 162 26 Z"
          fill="#3e1404" opacity="0.6"/>
    <path d="M 194 26 Q 216 124 210 234 Q 200 340 218 452 Q 236 542 228 592 L 240 592
             Q 234 542 214 452 Q 194 340 200 234 Q 208 124 198 26 Z"
          fill="#7a3418" opacity="0.25"/>
    <!-- Inner edge catches moonlight -->
    <path d="M 272 26 L 288 26 L 288 592 L 272 592 Q 274 544 268 454 Q 264 344 276 234 Q 284 124 272 26 Z"
          fill="#6080d8" opacity="0.14" filter="url(#s-blur-xs)"/>
    <!-- Curtain rings -->
    <circle cx="162" cy="26" r="6" fill="#2c1004"/>
    <circle cx="202" cy="26" r="6" fill="#2c1004"/>
    <circle cx="242" cy="26" r="6" fill="#2c1004"/>
  </g>

  <!-- Right curtain -->
  <g id="s-curtain-r">
    <path d="M 876 26 L 876 592 L 1148 592 Q 1128 544 1144 454 Q 1170 344 1148 234
             Q 1128 124 1152 26 Z"
          fill="#5a2008"/>
    <path d="M 1118 26 Q 1094 124 1104 234 Q 1116 344 1092 452 Q 1072 544 1086 592 L 1094 592
             Q 1076 544 1098 452 Q 1122 344 1110 234 Q 1098 124 1128 26 Z"
          fill="#3e1404" opacity="0.6"/>
    <!-- Inner edge catches moonlight -->
    <path d="M 876 26 L 892 26 Q 892 124 884 234 Q 878 344 890 454 Q 900 544 892 592 L 876 592 Z"
          fill="#5070c8" opacity="0.12" filter="url(#s-blur-xs)"/>
    <!-- Rings -->
    <circle cx="922"  cy="26" r="6" fill="#2c1004"/>
    <circle cx="962"  cy="26" r="6" fill="#2c1004"/>
    <circle cx="1002" cy="26" r="6" fill="#2c1004"/>
    <circle cx="1042" cy="26" r="6" fill="#2c1004"/>
    <circle cx="1082" cy="26" r="6" fill="#2c1004"/>
    <circle cx="1122" cy="26" r="6" fill="#2c1004"/>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 3.5 · STRING LIGHTS (lofi fairy lights along ceiling)
       ══════════════════════════════════════════════════════════════════════ -->

  <g id="s-string-lights">
    <!-- Wire in gentle catenary -->
    <path d="M 140 38 Q 300 50 460 38 Q 620 26 780 38 Q 940 50 1100 38 Q 1220 30 1320 38"
          fill="none" stroke="#3a1c08" stroke-width="1.3" opacity="0.5"/>
    <!-- Bulb drop strings -->
    <g stroke="#2a1406" stroke-width="0.8" opacity="0.38">
      <line x1="170" y1="40" x2="170" y2="50"/>
      <line x1="250" y1="45" x2="250" y2="55"/>
      <line x1="330" y1="40" x2="330" y2="50"/>
      <line x1="420" y1="36" x2="420" y2="46"/>
      <line x1="510" y1="32" x2="510" y2="42"/>
      <line x1="600" y1="30" x2="600" y2="40"/>
      <line x1="690" y1="32" x2="690" y2="42"/>
      <line x1="780" y1="38" x2="780" y2="48"/>
      <line x1="870" y1="44" x2="870" y2="54"/>
      <line x1="960" y1="42" x2="960" y2="52"/>
      <line x1="1050" y1="38" x2="1050" y2="48"/>
      <line x1="1140" y1="35" x2="1140" y2="45"/>
      <line x1="1240" y1="32" x2="1240" y2="42"/>
    </g>
    <!-- Bulbs — 4-element structure: outer glow + mid halo + body + filament glint -->
    <!-- Bulb 1 -->
    <g><circle cx="170" cy="54" r="8"   fill="#ffa820" opacity="0.14" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.20;0.12;0.18;0.10" dur="3.1s" repeatCount="indefinite" begin="0s"/></circle>
    <circle cx="170" cy="54" r="5"   fill="#ffe080" opacity="0.28" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.22;0.38;0.25;0.35;0.22" dur="3.1s" repeatCount="indefinite" begin="0s"/></circle>
    <circle cx="170" cy="54" r="3.2" fill="#ffe880"><animate attributeName="opacity" values="0.70;1;0.75;0.95;0.70" dur="3.1s" repeatCount="indefinite" begin="0s"/></circle>
    <circle cx="170" cy="52" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 2 -->
    <g><circle cx="250" cy="59" r="8"   fill="#ffa020" opacity="0.12" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.18;0.12;0.16;0.10" dur="2.7s" repeatCount="indefinite" begin="-0.8s"/></circle>
    <circle cx="250" cy="59" r="5"   fill="#ffd060" opacity="0.25" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.35;0.22;0.32;0.20" dur="2.7s" repeatCount="indefinite" begin="-0.8s"/></circle>
    <circle cx="250" cy="59" r="3.2" fill="#ffd870"><animate attributeName="opacity" values="0.65;0.92;0.70;0.90;0.65" dur="2.7s" repeatCount="indefinite" begin="-0.8s"/></circle>
    <circle cx="250" cy="57" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 3 -->
    <g><circle cx="330" cy="54" r="8"   fill="#ffaa30" opacity="0.13" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.19;0.12;0.17;0.10" dur="3.4s" repeatCount="indefinite" begin="-1.5s"/></circle>
    <circle cx="330" cy="54" r="5"   fill="#ffe090" opacity="0.26" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.38;0.24;0.34;0.20" dur="3.4s" repeatCount="indefinite" begin="-1.5s"/></circle>
    <circle cx="330" cy="54" r="3.2" fill="#fff0a0"><animate attributeName="opacity" values="0.60;0.98;0.68;0.92;0.60" dur="3.4s" repeatCount="indefinite" begin="-1.5s"/></circle>
    <circle cx="330" cy="52" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 4 -->
    <g><circle cx="420" cy="50" r="8"   fill="#ffa820" opacity="0.14" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.12;0.22;0.14;0.20;0.12" dur="2.9s" repeatCount="indefinite" begin="-0.4s"/></circle>
    <circle cx="420" cy="50" r="5"   fill="#ffd870" opacity="0.28" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.22;0.40;0.26;0.36;0.22" dur="2.9s" repeatCount="indefinite" begin="-0.4s"/></circle>
    <circle cx="420" cy="50" r="3.2" fill="#ffe880"><animate attributeName="opacity" values="0.72;1;0.76;0.96;0.72" dur="2.9s" repeatCount="indefinite" begin="-0.4s"/></circle>
    <circle cx="420" cy="48" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 5 -->
    <g><circle cx="510" cy="46" r="8"   fill="#ffa020" opacity="0.11" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.08;0.18;0.10;0.15;0.08" dur="3.6s" repeatCount="indefinite" begin="-2.1s"/></circle>
    <circle cx="510" cy="46" r="5"   fill="#ffe080" opacity="0.23" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.18;0.35;0.22;0.30;0.18" dur="3.6s" repeatCount="indefinite" begin="-2.1s"/></circle>
    <circle cx="510" cy="46" r="3.2" fill="#ffea90"><animate attributeName="opacity" values="0.58;0.96;0.66;0.90;0.58" dur="3.6s" repeatCount="indefinite" begin="-2.1s"/></circle>
    <circle cx="510" cy="44" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 6 -->
    <g><circle cx="600" cy="44" r="8"   fill="#ff9820" opacity="0.12" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.19;0.12;0.16;0.10" dur="3.0s" repeatCount="indefinite" begin="-1.0s"/></circle>
    <circle cx="600" cy="44" r="5"   fill="#ffc860" opacity="0.24" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.36;0.22;0.30;0.20" dur="3.0s" repeatCount="indefinite" begin="-1.0s"/></circle>
    <circle cx="600" cy="44" r="3.2" fill="#ffd870"><animate attributeName="opacity" values="0.68;1;0.72;0.92;0.68" dur="3.0s" repeatCount="indefinite" begin="-1.0s"/></circle>
    <circle cx="600" cy="42" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 7 -->
    <g><circle cx="690" cy="46" r="8"   fill="#ffaa30" opacity="0.13" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.20;0.12;0.17;0.10" dur="2.8s" repeatCount="indefinite" begin="-1.7s"/></circle>
    <circle cx="690" cy="46" r="5"   fill="#ffe090" opacity="0.26" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.38;0.24;0.34;0.20" dur="2.8s" repeatCount="indefinite" begin="-1.7s"/></circle>
    <circle cx="690" cy="46" r="3.2" fill="#fff0a0"><animate attributeName="opacity" values="0.62;0.97;0.70;0.93;0.62" dur="2.8s" repeatCount="indefinite" begin="-1.7s"/></circle>
    <circle cx="690" cy="44" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 8 -->
    <g><circle cx="780" cy="52" r="8"   fill="#ffa820" opacity="0.14" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.12;0.22;0.14;0.19;0.12" dur="3.3s" repeatCount="indefinite" begin="-0.6s"/></circle>
    <circle cx="780" cy="52" r="5"   fill="#ffd870" opacity="0.28" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.22;0.40;0.26;0.36;0.22" dur="3.3s" repeatCount="indefinite" begin="-0.6s"/></circle>
    <circle cx="780" cy="52" r="3.2" fill="#ffe880"><animate attributeName="opacity" values="0.70;1;0.75;0.95;0.70" dur="3.3s" repeatCount="indefinite" begin="-0.6s"/></circle>
    <circle cx="780" cy="50" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 9 -->
    <g><circle cx="870" cy="58" r="8"   fill="#ffa020" opacity="0.11" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.08;0.17;0.10;0.15;0.08" dur="2.6s" repeatCount="indefinite" begin="-2.4s"/></circle>
    <circle cx="870" cy="58" r="5"   fill="#ffe080" opacity="0.23" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.18;0.34;0.22;0.30;0.18" dur="2.6s" repeatCount="indefinite" begin="-2.4s"/></circle>
    <circle cx="870" cy="58" r="3.2" fill="#ffea90"><animate attributeName="opacity" values="0.58;0.94;0.65;0.90;0.58" dur="2.6s" repeatCount="indefinite" begin="-2.4s"/></circle>
    <circle cx="870" cy="56" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 10 -->
    <g><circle cx="960" cy="56" r="8"   fill="#ffaa30" opacity="0.13" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.20;0.12;0.17;0.10" dur="3.5s" repeatCount="indefinite" begin="-1.2s"/></circle>
    <circle cx="960" cy="56" r="5"   fill="#ffd060" opacity="0.26" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.38;0.24;0.34;0.20" dur="3.5s" repeatCount="indefinite" begin="-1.2s"/></circle>
    <circle cx="960" cy="56" r="3.2" fill="#ffd878"><animate attributeName="opacity" values="0.65;0.96;0.70;0.92;0.65" dur="3.5s" repeatCount="indefinite" begin="-1.2s"/></circle>
    <circle cx="960" cy="54" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 11 -->
    <g><circle cx="1050" cy="52" r="8"   fill="#ffa820" opacity="0.12" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.19;0.12;0.16;0.10" dur="3.0s" repeatCount="indefinite" begin="-0.9s"/></circle>
    <circle cx="1050" cy="52" r="5"   fill="#ffe090" opacity="0.25" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.36;0.22;0.32;0.20" dur="3.0s" repeatCount="indefinite" begin="-0.9s"/></circle>
    <circle cx="1050" cy="52" r="3.2" fill="#fff0a0"><animate attributeName="opacity" values="0.62;0.98;0.68;0.92;0.62" dur="3.0s" repeatCount="indefinite" begin="-0.9s"/></circle>
    <circle cx="1050" cy="50" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 12 -->
    <g><circle cx="1140" cy="49" r="8"   fill="#ffa020" opacity="0.13" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.11;0.21;0.13;0.18;0.11" dur="2.8s" repeatCount="indefinite" begin="-1.8s"/></circle>
    <circle cx="1140" cy="49" r="5"   fill="#ffd870" opacity="0.26" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.21;0.38;0.24;0.34;0.21" dur="2.8s" repeatCount="indefinite" begin="-1.8s"/></circle>
    <circle cx="1140" cy="49" r="3.2" fill="#ffe888"><animate attributeName="opacity" values="0.70;1;0.75;0.94;0.70" dur="2.8s" repeatCount="indefinite" begin="-1.8s"/></circle>
    <circle cx="1140" cy="47" r="0.9" fill="#ffffff" opacity="0.5"/></g>
    <!-- Bulb 13 -->
    <g><circle cx="1240" cy="46" r="8"   fill="#ffaa30" opacity="0.12" filter="url(#s-blur-sm)"><animate attributeName="opacity" values="0.10;0.18;0.12;0.16;0.10" dur="3.2s" repeatCount="indefinite" begin="-0.3s"/></circle>
    <circle cx="1240" cy="46" r="5"   fill="#ffe080" opacity="0.24" filter="url(#s-blur-xs)"><animate attributeName="opacity" values="0.20;0.36;0.22;0.32;0.20" dur="3.2s" repeatCount="indefinite" begin="-0.3s"/></circle>
    <circle cx="1240" cy="46" r="3.2" fill="#ffea90"><animate attributeName="opacity" values="0.62;0.96;0.68;0.92;0.62" dur="3.2s" repeatCount="indefinite" begin="-0.3s"/></circle>
    <circle cx="1240" cy="44" r="0.9" fill="#ffffff" opacity="0.5"/></g>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 4 · WINDOWSILL PLANTS
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Left plant (leafy, potted) -->
  <g id="s-plant-left" transform="translate(420,494)" clip-path="url(#s-plant-left-click-clip)">
    <path d="M 8 44 L 4 72 L 56 72 L 52 44 Z"      fill="#b84820"/>
    <rect x="2" y="40" width="56" height="8"         fill="#ce5a2c" rx="3"/>
    <ellipse cx="30" cy="46" rx="25" ry="6"          fill="#28100a"/>
    <!-- Stems -->
    <path d="M 30 44 Q 10 22 8 2"   fill="none" stroke="#3a5e18" stroke-width="3" stroke-linecap="round"/>
    <path d="M 30 44 Q 30 18 28 -2" fill="none" stroke="#3a5e18" stroke-width="3" stroke-linecap="round"/>
    <path d="M 30 44 Q 50 22 52 2"  fill="none" stroke="#3a5e18" stroke-width="3" stroke-linecap="round"/>
    <path d="M 30 44 Q 18 28 6 18"  fill="none" stroke="#3a5e18" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 30 44 Q 42 28 54 18" fill="none" stroke="#3a5e18" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Leaves -->
    <ellipse cx="8"  cy="4"  rx="14" ry="6" fill="#4a8020" transform="rotate(-35 8 4)"/>
    <ellipse cx="28" cy="-4" rx="12" ry="5" fill="#5a9828" transform="rotate(-5 28 -4)"/>
    <ellipse cx="52" cy="4"  rx="14" ry="6" fill="#4a8020" transform="rotate(35 52 4)"/>
    <ellipse cx="7"  cy="20" rx="10" ry="5" fill="#3a7018" transform="rotate(-20 7 20)"/>
    <ellipse cx="53" cy="20" rx="10" ry="5" fill="#3a7018" transform="rotate(20 53 20)"/>
    <ellipse cx="30" cy="18" rx="8"  ry="4" fill="#5a9828"/>
  </g>

  <!-- Right plant (small cactus) -->
  <g id="s-cactus" transform="translate(808,504)">
    <path d="M 6 34 L 3 62 L 37 62 L 34 34 Z"      fill="#b84820"/>
    <rect x="1" y="30" width="38" height="7"         fill="#ce5a2c" rx="2"/>
    <ellipse cx="20" cy="35" rx="16" ry="4"          fill="#28100a"/>
    <!-- Body -->
    <rect x="12" y="-16" width="16" height="50"      fill="#4a8c1e" rx="8"/>
    <!-- Arms -->
    <path d="M 12 8 Q 0 6 0 -4 Q 2 -10 7 -4 Q 9 4 12 8"      fill="#4a8c1e"/>
    <path d="M 28 4 Q 40 2 40 -8 Q 38 -14 33 -8 Q 31 0 28 4"  fill="#4a8c1e"/>
    <!-- Spines -->
    <line x1="20" y1="-14" x2="20" y2="-22" stroke="#d8b848" stroke-width="1.2"/>
    <line x1="14" y1="2"   x2="7"  y2="-1"  stroke="#d8b848" stroke-width="1.2"/>
    <line x1="26" y1="2"   x2="33" y2="-1"  stroke="#d8b848" stroke-width="1.2"/>
    <!-- Flower -->
    <circle cx="20" cy="-18" r="5"   fill="#ff4878"/>
    <circle cx="20" cy="-18" r="2.5" fill="#ffd040"/>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 5 · LIGHT RAYS (emanate from window)
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Soft cool moonlight wash into room -->
  <polygon points="288,40 876,40 660,720 52,720" fill="#4060c0" opacity="0.06" filter="url(#s-blur-md)"/>

  <!-- Moonbeam shafts with gradient fill — soft, atmospheric -->
  <g id="s-rays" opacity="0.8">
    <polygon points="380,54 460,54 230,720 144,720" fill="url(#s-shaft-fade)" opacity="1">
      <animate attributeName="opacity" values="0.6;1.0;0.6" dur="7s" repeatCount="indefinite" begin="0s"/>
    </polygon>
    <polygon points="500,54 600,54 360,720 252,720" fill="url(#s-shaft-fade)" opacity="1">
      <animate attributeName="opacity" values="0.7;1.0;0.7" dur="9s" repeatCount="indefinite" begin="-3s"/>
    </polygon>
    <polygon points="640,54 740,54 494,720 386,720" fill="url(#s-shaft-fade)" opacity="0.85">
      <animate attributeName="opacity" values="0.55;0.85;0.55" dur="11s" repeatCount="indefinite" begin="-5s"/>
    </polygon>
    <!-- Floating dust motes in the moonbeam -->
    <circle cx="420" cy="280" r="1.5" fill="#a0b8ff" opacity="0">
      <animate attributeName="cy" values="580;180" dur="14s" repeatCount="indefinite" begin="-2s"/>
      <animate attributeName="opacity" values="0;0.5;0.5;0" dur="14s" repeatCount="indefinite" begin="-2s"/>
    </circle>
    <circle cx="560" cy="450" r="1.2" fill="#a0b8ff" opacity="0">
      <animate attributeName="cy" values="620;220" dur="11s" repeatCount="indefinite" begin="-5s"/>
      <animate attributeName="opacity" values="0;0.4;0.4;0" dur="11s" repeatCount="indefinite" begin="-5s"/>
    </circle>
    <circle cx="680" cy="380" r="1.0" fill="#b0c4ff" opacity="0">
      <animate attributeName="cy" values="600;200" dur="13s" repeatCount="indefinite" begin="-8s"/>
      <animate attributeName="opacity" values="0;0.35;0.35;0" dur="13s" repeatCount="indefinite" begin="-8s"/>
    </circle>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 6 · BOOKSHELF (right wall)
       ══════════════════════════════════════════════════════════════════════ -->

  <g id="s-bookshelf">
    <!-- Shadow on left edge of shelf -->
    <rect x="1040" y="80" width="12" height="502" fill="black" opacity="0.35"/>

    <!-- Back panel -->
    <rect x="1052" y="84" width="354" height="496" fill="#1c0e08"/>
    <!-- Sides -->
    <rect x="1040" y="80"  width="18"  height="506" fill="#3a2010"/>
    <rect x="1394" y="80"  width="18"  height="506" fill="#261208"/>
    <!-- Top + bottom rails -->
    <rect x="1040" y="80"  width="372" height="14"  fill="#4a2814"/>
    <rect x="1040" y="568" width="372" height="14"  fill="#2c1808"/>

    <!-- Shelves (4) -->
    <rect x="1052" y="196" width="354" height="10" fill="#3a2010"/>
    <rect x="1052" y="196" width="354" height="3"  fill="#5a3818" opacity="0.5"/>
    <rect x="1052" y="308" width="354" height="10" fill="#3a2010"/>
    <rect x="1052" y="308" width="354" height="3"  fill="#5a3818" opacity="0.5"/>
    <rect x="1052" y="420" width="354" height="10" fill="#3a2010"/>
    <rect x="1052" y="420" width="354" height="3"  fill="#5a3818" opacity="0.5"/>
    <rect x="1052" y="530" width="354" height="10" fill="#3a2010"/>
    <rect x="1052" y="530" width="354" height="3"  fill="#5a3818" opacity="0.5"/>

    <!-- Shelf 1: books + cat figurine -->
    <rect x="1060" y="98"  width="22" height="98" fill="#c03428" rx="1"/>
    <rect x="1084" y="106" width="17" height="90" fill="#1a4a8c" rx="1"/>
    <rect x="1103" y="100" width="24" height="96" fill="#d08020" rx="1"/>
    <rect x="1129" y="107" width="15" height="89" fill="#2a7a3a" rx="1"/>
    <rect x="1146" y="101" width="20" height="95" fill="#801ea0" rx="1"/>
    <rect x="1168" y="98"  width="28" height="98" fill="#c87820" rx="1"/>
    <rect x="1198" y="106" width="14" height="90" fill="#1a7a6a" rx="1"/>
    <!-- Mini cat figurine on shelf 1 -->
    <g id="s-cat-figurine" transform="translate(1224,132)">
      <ellipse cx="14" cy="36" rx="14" ry="18" fill="#e07830" opacity="0.96"/>
      <circle  cx="14" cy="14" r="13"          fill="#e07830" opacity="0.96"/>
      <ellipse cx="8"  cy="4"  rx="5" ry="7"   fill="#e07830" opacity="0.96"/>
      <ellipse cx="20" cy="4"  rx="5" ry="7"   fill="#e07830" opacity="0.96"/>
      <ellipse cx="8"  cy="4"  rx="2.5" ry="4" fill="#c04820" opacity="0.7"/>
      <ellipse cx="20" cy="4"  rx="2.5" ry="4" fill="#c04820" opacity="0.7"/>
      <circle  cx="10" cy="14" r="2.5"          fill="#18100a"/>
      <circle  cx="18" cy="14" r="2.5"          fill="#18100a"/>
      <circle  cx="14" cy="18" r="2"            fill="#c04820"/>
      <path d="M 28 30 Q 36 24 34 16" fill="none" stroke="#e07830" stroke-width="5" stroke-linecap="round"/>
    </g>
    <rect x="1262" y="100" width="18" height="96" fill="#3a5a8c" rx="1"/>
    <rect x="1282" y="107" width="22" height="89" fill="#b83040" rx="1"/>
    <rect x="1306" y="99"  width="16" height="97" fill="#6a3a1a" rx="1"/>
    <rect x="1324" y="106" width="26" height="90" fill="#1a5a2a" rx="1"/>
    <rect x="1352" y="99"  width="20" height="97" fill="#8c6020" rx="1"/>
    <rect x="1374" y="107" width="18" height="89" fill="#c02820" rx="1"/>

    <!-- Shelf 2: books + small plant -->
    <rect x="1060" y="216" width="30" height="92" fill="#c06820" rx="1"/>
    <rect x="1092" y="223" width="16" height="85" fill="#3030a0" rx="1"/>
    <rect x="1110" y="217" width="20" height="91" fill="#804a1a" rx="1"/>
    <g transform="translate(1138,218)"> <!-- potted plant -->
      <path d="M 7 60 L 4 82 L 32 82 L 29 60 Z"   fill="#a04020"/>
      <rect x="2" y="56" width="32" height="7"      fill="#be5030" rx="2"/>
      <ellipse cx="18" cy="62" rx="13" ry="4"       fill="#1e0c08"/>
      <path d="M 18 60 Q 4 38 7 20 Q 12 12 16 22 Q 17 38 18 55" fill="none" stroke="#3a5e10" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 18 60 Q 32 38 29 20 Q 24 12 20 22 Q 19 38 18 55" fill="none" stroke="#3a5e10" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="8"  cy="22" rx="11" ry="5" fill="#4a8018" transform="rotate(-28 8 22)"/>
      <ellipse cx="28" cy="22" rx="11" ry="5" fill="#4a8018" transform="rotate(28 28 22)"/>
      <ellipse cx="18" cy="14" rx="9"  ry="4" fill="#5a9820"/>
    </g>
    <rect x="1180" y="219" width="24" height="89" fill="#c02840" rx="1"/>
    <rect x="1206" y="214" width="18" height="94" fill="#1a5a8c" rx="1"/>
    <rect x="1226" y="221" width="26" height="87" fill="#5a3a1a" rx="1"/>
    <rect x="1254" y="217" width="14" height="91" fill="#8c6a20" rx="1"/>
    <rect x="1270" y="214" width="22" height="94" fill="#1a3a1a" rx="1"/>
    <rect x="1294" y="221" width="16" height="87" fill="#b07820" rx="1"/>
    <rect x="1312" y="214" width="28" height="94" fill="#4a2080" rx="1"/>
    <rect x="1342" y="219" width="20" height="89" fill="#2a5a40" rx="1"/>
    <rect x="1364" y="214" width="18" height="94" fill="#8c2820" rx="1"/>
    <rect x="1384" y="221" width="14" height="87" fill="#405c3a" rx="1"/>
    <!-- Vinyl record leaning on shelf 2 -->
    <g id="s-vinyl" transform="translate(1390,214)">
      <circle cx="16" cy="16" r="16" fill="#181018"/>
      <circle cx="16" cy="16" r="12" fill="#1e141e" stroke="#2a1a2a" stroke-width="0.8"/>
      <circle cx="16" cy="16" r="8"  fill="#201620"/>
      <circle cx="16" cy="16" r="4"  fill="#c84030"/>
      <circle cx="16" cy="16" r="1.5" fill="#f0d0c0"/>
      <!-- Groove shimmer -->
      <circle cx="16" cy="16" r="10" fill="none" stroke="#382838" stroke-width="0.6" opacity="0.5"/>
      <circle cx="16" cy="16" r="6"  fill="none" stroke="#302030" stroke-width="0.5" opacity="0.4"/>
    </g>

    <!-- Shelf 3: books + globe -->
    <rect x="1060" y="328" width="22" height="92" fill="#1a4a8c" rx="1"/>
    <rect x="1084" y="323" width="18" height="97" fill="#b03030" rx="1"/>
    <rect x="1104" y="330" width="22" height="90" fill="#488a2a" rx="1"/>
    <rect x="1128" y="323" width="16" height="97" fill="#806020" rx="1"/>
    <!-- Globe -->
    <g id="s-globe" transform="translate(1152,322)">
      <circle cx="22" cy="34" r="24" fill="#1a4a8a" stroke="#3a2010" stroke-width="2.5"/>
      <ellipse cx="22" cy="34" rx="24" ry="8"  fill="none" stroke="#2a6aaa" stroke-width="1.5" opacity="0.6"/>
      <ellipse cx="22" cy="34" rx="8"  ry="24" fill="none" stroke="#2a6aaa" stroke-width="1.5" opacity="0.6"/>
      <path d="M 22 12 Q 12 22 22 32 Q 32 22 22 12"          fill="#3a8a48" opacity="0.8"/>
      <path d="M 8 26 Q 14 30 24 26 Q 20 40 12 40 Q 6 38 8 26" fill="#3a8a48" opacity="0.8"/>
      <rect x="20" y="58" width="4" height="10"              fill="#5a3010"/>
      <ellipse cx="22" cy="69" rx="14" ry="3.5"             fill="#4a2808"/>
    </g>
    <rect x="1212" y="327" width="22" height="93" fill="#8c2820" rx="1"/>
    <rect x="1236" y="321" width="26" height="99" fill="#1a2e5a" rx="1"/>
    <rect x="1264" y="329" width="14" height="91" fill="#b07820" rx="1"/>
    <rect x="1280" y="323" width="22" height="97" fill="#4a2078" rx="1"/>
    <rect x="1304" y="327" width="18" height="93" fill="#1a5a3a" rx="1"/>
    <rect x="1324" y="321" width="24" height="99" fill="#b02828" rx="1"/>
    <rect x="1350" y="329" width="30" height="91" fill="#786018" rx="1"/>
    <rect x="1382" y="323" width="16" height="97" fill="#203860" rx="1"/>

    <!-- Shelf 4: books + NYC photo + mug -->
    <rect x="1060" y="438" width="20" height="92" fill="#8c4a20" rx="1"/>
    <!-- NYC photo frame -->
    <rect x="1083" y="432" width="58" height="78" fill="#4a2c10" rx="2.5"/>
    <rect x="1087" y="436" width="50" height="70" fill="#c8a880"/>
    <rect x="1089" y="438" width="46" height="66" fill="#1a1a2e"/>
    <!-- Tiny NYC skyline in photo -->
    <rect x="1095" y="458" width="8"  height="28" fill="#1e1830"/>
    <rect x="1106" y="448" width="7"  height="38" fill="#1e1830"/>
    <rect x="1116" y="454" width="5"  height="32" fill="#1e1830"/>
    <rect x="1124" y="450" width="4"  height="36" fill="#1e1830"/>
    <circle cx="1097" cy="460" r="1"   fill="#ffd880" opacity="0.7"/>
    <circle cx="1109" cy="454" r="0.8" fill="#ffb840" opacity="0.6"/>
    <circle cx="1118" cy="458" r="1"   fill="#ffd060" opacity="0.7"/>
    <rect x="1143" y="437" width="17" height="93" fill="#503c28" rx="1"/>
    <!-- Shelf mug -->
    <g transform="translate(1166,460)">
      <rect x="0" y="0" width="32" height="38" fill="#c84020" rx="5"/>
      <path d="M 32 9 Q 44 13 44 21 Q 44 29 32 31" fill="none" stroke="#c84020" stroke-width="5" stroke-linecap="round"/>
      <rect x="3" y="2" width="26" height="5" fill="#f0e0d0" opacity="0.3" rx="2"/>
    </g>
    <rect x="1210" y="437" width="22" height="93" fill="#1a5a36" rx="1"/>
    <rect x="1234" y="431" width="16" height="99" fill="#8c2820" rx="1"/>
    <rect x="1252" y="437" width="28" height="93" fill="#4040a8" rx="1"/>
    <rect x="1282" y="432" width="20" height="98" fill="#786018" rx="1"/>
    <rect x="1304" y="437" width="24" height="93" fill="#1a4a6a" rx="1"/>
    <rect x="1330" y="431" width="18" height="99" fill="#b84a20" rx="1"/>
    <rect x="1350" y="437" width="26" height="93" fill="#244a28" rx="1"/>
    <rect x="1378" y="432" width="14" height="98" fill="#7a1a38" rx="1"/>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 7 · SIDE TABLE + WALL ART (left side)
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Picture frame on wall above side table -->
  <g id="s-picture-frame" transform="translate(22,368)">
    <!-- Hanging wire -->
    <line x1="28" y1="-1" x2="10" y2="-7" stroke="#c0bdb8" stroke-width="0.7" stroke-linecap="round"/>
    <line x1="28" y1="-1" x2="46" y2="-7" stroke="#c0bdb8" stroke-width="0.7" stroke-linecap="round"/>
    <circle cx="28" cy="-8" r="1.4" fill="#c0bdb8"/>
    <!-- Outer frame — slim dark walnut -->
    <rect x="0" y="0" width="56" height="44" fill="#1c0f06" rx="3"/>
    <!-- Frame face — lighter walnut band -->
    <rect x="2" y="2" width="52" height="40" fill="#2c1a0c" rx="2"/>
    <!-- Top-left light edge -->
    <rect x="2" y="2" width="52" height="1.5" fill="#5a3018" opacity="0.5"/>
    <rect x="2" y="2" width="1.5" height="40" fill="#5a3018" opacity="0.4"/>
    <!-- Bottom-right shadow edge -->
    <rect x="52.5" y="2" width="1.5" height="40" fill="#060302" opacity="0.7"/>
    <rect x="2" y="40.5" width="52" height="1.5" fill="#060302" opacity="0.6"/>
    <!-- Canvas — white -->
    <rect x="4" y="4" width="48" height="36" fill="#f7f5f0"/>

    <!-- ── Pixel heart ─────────────────────────────────────────────────────
         8 × 6 grid · each pixel 3 × 3 SVG units · heart 24 × 18
         centered horizontally in 48-wide canvas → start x = 4 + 12 = 16
         start y = 7 (a touch below inner top)
         Heart color: #e03060
    ─────────────────────────────────────────────────────────────────────── -->
    <!-- row 0 · y=7 -->
    <rect x="19" y="7"  width="3" height="3" fill="#e03060"/><!-- col 1 -->
    <rect x="22" y="7"  width="3" height="3" fill="#e03060"/><!-- col 2 -->
    <rect x="31" y="7"  width="3" height="3" fill="#e03060"/><!-- col 5 -->
    <rect x="34" y="7"  width="3" height="3" fill="#e03060"/><!-- col 6 -->
    <!-- row 1 · y=10 · full width -->
    <rect x="16" y="10" width="24" height="3" fill="#e03060"/>
    <!-- row 2 · y=13 · full width -->
    <rect x="16" y="13" width="24" height="3" fill="#e03060"/>
    <!-- row 3 · y=16 · cols 1-6 -->
    <rect x="19" y="16" width="18" height="3" fill="#e03060"/>
    <!-- row 4 · y=19 · cols 2-5 -->
    <rect x="22" y="19" width="12" height="3" fill="#e03060"/>
    <!-- row 5 · y=22 · cols 3-4 -->
    <rect x="25" y="22" width="6"  height="3" fill="#e03060"/>

    <!-- "For RK" label -->
    <text x="28" y="35"
          font-family="'Inter', 'Helvetica Neue', Arial, sans-serif"
          font-size="7" font-weight="700" text-anchor="middle" letter-spacing="0.8"
          fill="#2a1a0e">For RK</text>
  </g>

  <!-- Elegant side table -->
  <g id="s-side-table">
    <!-- Floor shadow -->
    <ellipse cx="71" cy="680" rx="50" ry="5" fill="#000" opacity="0.18" filter="url(#s-blur-xs)"/>
    <!-- Left leg (tapered, dark walnut) -->
    <path d="M 34 564 L 30 680 L 38 680 L 40 564 Z" fill="#3a2008" rx="2"/>
    <rect x="34" y="564" width="2" height="116" fill="#5a3010" opacity="0.35"/>
    <!-- Right leg -->
    <path d="M 103 564 L 107 680 L 115 680 L 109 564 Z" fill="#3a2008" rx="2"/>
    <rect x="109" y="564" width="2" height="116" fill="#5a3010" opacity="0.25"/>
    <!-- Lower cross-brace -->
    <rect x="32" y="644" width="82" height="6" fill="#2e1808" rx="2"/>
    <rect x="32" y="644" width="82" height="1.5" fill="#5a3010" opacity="0.4"/>
    <!-- Apron (front face under tabletop) -->
    <rect x="22" y="554" width="99" height="14" fill="#4a2a0e" rx="2"/>
    <rect x="22" y="554" width="99" height="2" fill="#7a4a20" opacity="0.3"/>
    <!-- Tabletop surface -->
    <rect x="14" y="540" width="115" height="16" fill="url(#s-desk-top)" rx="6"/>
    <!-- Tabletop front highlight edge -->
    <rect x="14" y="540" width="115" height="3" fill="#b07c48" opacity="0.42" rx="3"/>
    <!-- Tabletop sheen -->
    <rect x="14" y="540" width="115" height="16" fill="url(#s-desk-sheen)" opacity="0.22" rx="6"/>
    <!-- Cast shadow from tabletop -->
    <ellipse cx="71" cy="556" rx="58" ry="3" fill="#000" opacity="0.14" filter="url(#s-blur-xs)"/>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 8 · DESK + ITEMS
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Desk surface -->
  <rect x="140" y="542" width="900" height="44" fill="url(#s-desk-top)" rx="4"/>
  <!-- Desk top highlight edge -->
  <rect x="140" y="542" width="900" height="3"  fill="#b07c48" opacity="0.38" rx="2"/>
  <!-- Subtle desk-top sheen: very low opacity so it doesn't create a panel look -->
  <rect x="140" y="542" width="900" height="44" fill="url(#s-desk-sheen)" rx="4" opacity="0.25"/>
  <!-- Lip shadow: very thin dark seam between top and face -->
  <rect x="140" y="584" width="900" height="2" fill="#1a0c04" opacity="0.40"/>
  <!-- Desk front face -->
  <rect x="140" y="586" width="900" height="94" fill="url(#s-desk-face)"/>
  <!-- Bottom rail -->
  <rect x="140" y="676" width="900" height="6"  fill="#24100a" rx="2"/>
  <!-- Wood grain on face -->
  <g stroke="#381808" stroke-width="0.8" opacity="0.28">
    <line x1="140" y1="604" x2="1040" y2="604"/>
    <line x1="140" y1="624" x2="1040" y2="624"/>
    <line x1="140" y1="648" x2="1040" y2="648"/>
    <line x1="140" y1="664" x2="1040" y2="664"/>
  </g>
  <!-- Desk pedestal panels — left and right solid side panels, no legs -->
  <!-- Left panel: deep side visible in slight perspective -->
  <rect x="140" y="586" width="52" height="94" fill="#7a4e28" rx="2"/>
  <rect x="140" y="586" width="6"  height="94" fill="#a06838" opacity="0.5"/><!-- near-edge lighter face -->
  <rect x="140" y="586" width="52" height="3"  fill="#c07848" opacity="0.3"/><!-- top rim -->
  <!-- Right panel -->
  <rect x="1008" y="586" width="52" height="94" fill="#5a3818" rx="2"/>
  <rect x="1054" y="586" width="6"  height="94" fill="#3a2010" opacity="0.7"/><!-- far-edge shadow -->
  <rect x="1008" y="586" width="52" height="3"  fill="#8a5828" opacity="0.3"/>
  <!-- Toe kick: recessed strip at bottom, full width between panels -->
  <rect x="192" y="664" width="816" height="16" fill="#1e0e06" opacity="0.75"/>
  <rect x="192" y="664" width="816" height="2"  fill="#3a1c0a" opacity="0.4"/><!-- top edge of toe kick -->
  <!-- Ground shadow under whole desk -->
  <ellipse cx="580" cy="682" rx="460" ry="6" fill="#000" opacity="0.28" filter="url(#s-blur-xs)"/>


  <!-- Cat bed — oval bolster cushion, flush on desk, warm lamp-lit tones -->
  <!-- Ground contact shadow — very soft, hugs the desk -->
  <ellipse cx="278" cy="544" rx="104" ry="7" fill="#000" opacity="0.30" filter="url(#s-blur-xs)"/>
  <!-- Outer rim body — the raised wall of the bed -->
  <ellipse cx="278" cy="526" rx="106" ry="20" fill="#4e2208"/>
  <!-- Rim top catchlight — warm lamp hitting the near edge -->
  <ellipse cx="278" cy="519" rx="104" ry="14" fill="#6c3418" opacity="0.85"/>
  <!-- Cushion surface — radial tan, sits inside the rim -->
  <ellipse cx="278" cy="514" rx="88" ry="14" fill="url(#s-cat-bed-cushion)"/>
  <!-- Cushion warm highlight — lamp spill from right -->
  <ellipse cx="288" cy="511" rx="60" ry="10" fill="#ddaf68" opacity="0.50"/>
  <ellipse cx="294" cy="509" rx="34" ry="6" fill="#eecb84" opacity="0.36"/>
  <!-- Front rim face — depth below the cat, slightly darker -->
  <ellipse cx="278" cy="537" rx="106" ry="10" fill="#3a1806" opacity="0.90"/>
  <!-- Rim stitching — dashed seam line -->
  <ellipse cx="278" cy="518" rx="96" ry="17" fill="none" stroke="#7a3e16" stroke-width="1.2" stroke-dasharray="6,4" opacity="0.45"/>
  <!-- Cushion wrinkle shadows — soft fabric compression marks -->
  <ellipse cx="248" cy="512" rx="18" ry="4" fill="#8a5822" opacity="0.18" transform="rotate(-12 248 512)"/>
  <ellipse cx="308" cy="516" rx="14" ry="3" fill="#8a5822" opacity="0.14" transform="rotate(8 308 516)"/>

  <!-- Keyboard — top-down view, shifted right -->
  <g id="s-keyboard">
  <!-- Drop shadow on desk surface -->
  <rect x="472" y="555" width="228" height="26" fill="#000" opacity="0.26" rx="6" filter="url(#s-blur-xs)"/>
  <!-- Chassis body — slight trapezoid for depth -->
  <polygon points="480,549 690,549 696,578 474,578" fill="#1a1a1a"/>
  <!-- Near-edge thickness (the front face of the keyboard) -->
  <polygon points="474,578 696,578 696,582 474,582" fill="#111111"/>
  <!-- Key deck surface -->
  <polygon points="484,551 686,551 692,576 478,576" fill="#242424"/>
  <!-- RGB backlight bleed -->
  <polygon points="486,553 684,553 690,575 480,575" fill="#3828c0" opacity="0.06"/>
  <!-- Key row bands (far → near) -->
  <polygon points="488,554 682,554 686,558 484,558" fill="#2e2e2e"/><!-- Fn row -->
  <polygon points="484,560 686,560 690,565 480,565" fill="#2e2e2e"/><!-- Num row -->
  <polygon points="480,567 690,567 694,572 476,572" fill="#2e2e2e"/><!-- Alpha row 1 -->
  <polygon points="476,574 694,574 696,577 474,577" fill="#2e2e2e"/><!-- Alpha row 2 + space -->
  <!-- ESC key orange accent -->
  <rect x="486" y="554" width="9" height="4" fill="#ff8c42" rx="1"/>
  <!-- Spacebar -->
  <polygon points="528,574 654,574 656,577 526,577" fill="#3a3a3a"/>
  <!-- Top highlight (far edge catch-light) -->
  <line x1="480" y1="549" x2="690" y2="549" stroke="#ffffff" stroke-width="1" opacity="0.07"/>
  <!-- Warm lamp spill on near edge -->
  <polygon points="474,578 696,578 696,582 474,582" fill="#ffa030" opacity="0.04"/>
  </g><!-- end keyboard -->

  <!-- Mouse — top-down view, shifted right -->
  <g id="s-mouse-drag" style="cursor:grab;pointer-events:all">
  <!-- Cast shadow on desk -->
  <ellipse cx="718" cy="567" rx="22" ry="10" fill="#000" opacity="0.28" filter="url(#s-blur-xs)"/>
  <!-- Body shell — matte dark, wider at near end -->
  <ellipse cx="718" cy="558" rx="18" ry="13" fill="#202020"/>
  <!-- Top surface — very subtle center lightness -->
  <ellipse cx="716" cy="554" rx="13" ry="9" fill="#2a2a2a" opacity="0.85"/>
  <!-- Left/right button seam line -->
  <line x1="718" y1="546" x2="718" y2="558" stroke="#151515" stroke-width="1.2"/>
  <!-- Scroll wheel -->
  <rect x="715" y="549" width="5" height="7" fill="#363636" rx="2"/>
  <rect x="716" y="550" width="3" height="5" fill="#444" rx="1.5"/>
  <!-- Subtle top-left glint (lamp reflection) -->
  <ellipse cx="710" cy="550" rx="3.5" ry="2" fill="#fff" opacity="0.05" transform="rotate(-15 710 550)"/>
  <!-- Near-edge depth shadow -->
  <ellipse cx="718" cy="570" rx="17" ry="3.5" fill="#0a0a0a" opacity="0.55"/>
  <!-- Orange brand accent -->
  <circle cx="718" cy="563" r="1.6" fill="#ff8c42" opacity="0.35"/>
  </g><!-- end mouse -->

  <!-- Headphones on stand — right side of desk, past the lamp -->
  <g id="s-headphones" transform="translate(948,480)">
    <!-- Stand base shadow -->
    <ellipse cx="16" cy="80" rx="20" ry="5" fill="#000" opacity="0.22" filter="url(#s-blur-xs)"/>
    <!-- Stand base plate -->
    <ellipse cx="16" cy="78" rx="18" ry="4.5" fill="#1e1e1e"/>
    <ellipse cx="16" cy="77" rx="16" ry="3.5" fill="#2a2a2a"/>
    <!-- Stand pole -->
    <rect x="13" y="22" width="6" height="56" fill="#262626" rx="3"/>
    <!-- Curved hook at top of pole -->
    <path d="M 14 24 Q 14 12 20 10 Q 26 8 27 20" fill="none" stroke="#323232" stroke-width="5" stroke-linecap="round"/>
    <!-- Headphone headband draped over hook -->
    <path d="M 2 22 Q 2 -2 16 -2 Q 30 -2 30 22" fill="none" stroke="#252525" stroke-width="7" stroke-linecap="round"/>
    <!-- Band highlight -->
    <path d="M 5 20 Q 5 2 16 2 Q 27 2 27 20" fill="none" stroke="#363636" stroke-width="3" stroke-linecap="round"/>
    <!-- Left ear cup -->
    <rect x="-6" y="13" width="18" height="24" fill="#222222" rx="7"/>
    <rect x="-4" y="15" width="14" height="20" fill="#2e2e2e" rx="6"/>
    <rect x="-2" y="17" width="10" height="16" fill="#1c1c1c" rx="5"/>
    <rect x="-6" y="22" width="18" height="3" fill="#ff8c42" opacity="0.75" rx="1"/>
    <rect x="-2" y="17" width="4" height="2" fill="#fff" opacity="0.06" rx="1"/>
    <!-- Right ear cup -->
    <rect x="20" y="13" width="18" height="24" fill="#222222" rx="7"/>
    <rect x="22" y="15" width="14" height="20" fill="#2e2e2e" rx="6"/>
    <rect x="24" y="17" width="10" height="16" fill="#1c1c1c" rx="5"/>
    <rect x="20" y="22" width="18" height="3" fill="#ff8c42" opacity="0.75" rx="1"/>
    <rect x="24" y="17" width="4" height="2" fill="#fff" opacity="0.06" rx="1"/>
    <!-- Cable draping down from right cup -->
    <path d="M 28 37 Q 34 54 24 68" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- Mini iPod music player — left side of desk, near cat -->
  <!-- Outer wrapper bobs gently to invite clicks -->
  <g id="s-ipod" transform="translate(144,500)" style="cursor:pointer;pointer-events:all">
    <animateTransform attributeName="transform" type="translate"
      values="144,500; 144,500; 144,497; 144,500; 144,498; 144,500"
      keyTimes="0; 0.78; 0.84; 0.89; 0.94; 1"
      dur="20s" repeatCount="indefinite" calcMode="spline"
      keySplines="0 0 1 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"/>
    <!-- Soft orange glow behind device — pulses to draw attention -->
    <ellipse cx="22" cy="30" rx="28" ry="34" fill="#ff8c42" opacity="0">
      <animate attributeName="opacity" values="0;0;0.18;0;0.12;0" keyTimes="0;0.78;0.84;0.89;0.94;1" dur="20s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Device shadow -->
    <rect x="1" y="3" width="44" height="56" fill="#000" opacity="0.22" rx="9" filter="url(#s-blur-xs)"/>
    <!-- Device body — brushed silver -->
    <rect x="0" y="0" width="44" height="54" fill="#dcdcdc" rx="9"/>
    <!-- Body sheen — top half lighter -->
    <rect x="0" y="0" width="44" height="27" fill="#ffffff" opacity="0.45" rx="9"/>
    <rect x="0" y="0" width="3" height="54" fill="#ffffff" opacity="0.25" rx="2"/>
    <!-- Screen bezel -->
    <rect x="5" y="5" width="34" height="22" fill="#111" rx="4"/>
    <!-- Screen glass -->
    <rect x="6" y="6" width="32" height="20" fill="#0d1a3a" rx="3"/>
    <!-- Screen content -->
    <text x="10" y="19" font-size="10" fill="#ff8c42" opacity="0.9" font-family="serif">♪</text>
    <rect x="20" y="11" width="15" height="2" fill="#4a8aff" rx="1" opacity="0.5"/>
    <rect x="20" y="15" width="10" height="1.5" fill="#4a8aff" rx="1" opacity="0.3"/>
    <!-- Playing indicator dot -->
    <circle cx="35" cy="9" r="2" fill="#ff8c42" opacity="0.9" id="s-ipod-dot">
      <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <!-- Click wheel -->
    <circle cx="22" cy="41" r="10" fill="#c8c8c8"/>
    <circle cx="22" cy="41" r="8"  fill="#bcbcbc"/>
    <circle cx="22" cy="41" r="3"  fill="#d4d4d4"/>
    <!-- Wheel glint -->
    <ellipse cx="18" cy="37" rx="4" ry="2.5" fill="#fff" opacity="0.25" transform="rotate(-30 18 37)"/>
    <!-- Floating music note above — fades in and drifts up -->
    <text x="44" y="-4" font-size="9" fill="#ff8c42" font-family="serif" text-anchor="middle" opacity="0">♫
      <animate attributeName="opacity" values="0;0;0.85;0.85;0" keyTimes="0;0.81;0.87;0.93;1" dur="20s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="0,0; 0,0; 0,-5; 0,-7; 0,-7" keyTimes="0;0.81;0.87;0.93;1" dur="20s" repeatCount="indefinite" additive="sum"/>
    </text>
  </g>

  <!-- iPod invisible zone for JS click detection / positioning -->
  <rect id="s-ipod-zone" x="144" y="470" width="54" height="84" fill="transparent" style="cursor:pointer;pointer-events:all"/>

  <!-- Desk candle with animated flame — sits on side table -->
  <g id="s-candle" transform="translate(57,486)">
    <!-- Brass holder base: 3 ellipses for depth -->
    <ellipse cx="10" cy="54" rx="14" ry="3.5" fill="#c8a030"/>
    <ellipse cx="10" cy="53" rx="12" ry="2.8" fill="#dab840"/>
    <ellipse cx="10" cy="52" rx="10" ry="2.2" fill="#e8c850" opacity="0.8"/>
    <!-- Candle glow on desk -->
    <ellipse cx="10" cy="52" rx="28" ry="8" fill="#ffaa40" opacity="0.18" filter="url(#s-blur-sm)">
      <animate attributeName="opacity" values="0.12;0.22;0.14;0.20;0.12" dur="1.1s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Candle body (cream/ivory) -->
    <rect x="2" y="18" width="16" height="34" fill="#f0e8d4" rx="2"/>
    <!-- Wax drips -->
    <path d="M 4 18 Q 2 22 3 26" stroke="#e8dcc0" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
    <path d="M 14 18 Q 16 24 15 28" stroke="#e8dcc0" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
    <!-- Body shading -->
    <rect x="2" y="18" width="5" height="34" fill="#d8c8a0" rx="2" opacity="0.35"/>
    <!-- Highlight -->
    <rect x="13" y="20" width="3" height="20" fill="#ffffff" rx="1.5" opacity="0.18"/>
    <!-- Wick -->
    <line x1="10" y1="12" x2="10" y2="18" stroke="#1a0c08" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Flame outer (orange) -->
    <ellipse cx="10" cy="9" rx="5" ry="7" fill="#ff9020" opacity="0.85">
      <animate attributeName="ry" values="7;8;6;7.5;7" dur="0.55s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="10;10.6;9.4;10.3;10" dur="0.7s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.8;0.9;0.75;0.88;0.8" dur="0.55s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Flame inner (bright yellow) -->
    <ellipse cx="10" cy="10" rx="3" ry="5" fill="#ffe060" opacity="0.95">
      <animate attributeName="ry" values="5;6;4;5.5;5" dur="0.55s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="10;10.4;9.6;10.2;10" dur="0.7s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Flame core (white-hot) -->
    <ellipse cx="10" cy="11" rx="1.5" ry="2.5" fill="#ffffff" opacity="0.7">
      <animate attributeName="opacity" values="0.6;0.8;0.55;0.75;0.6" dur="0.55s" repeatCount="indefinite"/>
    </ellipse>
  </g>

  <!-- Big Hug Mug — in front of cat, left desk area. Tan body, BIG/HUG/MUG stacked in red+teal -->
  <!-- Shifted down 24px so text clears cat-zone HTML overlay (y>522) -->
  <g id="s-mug" transform="translate(-489,24) translate(814,524) scale(0.72) translate(-814,-524)">
    <!-- Handle drawn FIRST (behind body) — outer wall -->
    <path d="M 843 506 Q 864 508 864 524 Q 864 540 843 542"
          fill="none" stroke="#a88038" stroke-width="10" stroke-linecap="butt"/>
    <!-- Handle inner lighter band (creates depth/curvature) -->
    <path d="M 843 506 Q 862 508 862 524 Q 862 540 843 542"
          fill="none" stroke="#c8a050" stroke-width="5" stroke-linecap="butt"/>
    <!-- Handle hole: cut out the center using mug-body color -->
    <path d="M 843 509 Q 856 511 856 524 Q 856 537 843 539"
          fill="none" stroke="#c8a660" stroke-width="4" stroke-linecap="butt"/>
    <!-- Mug body — clean rect, tan/beige ceramic -->
    <rect x="784" y="490" width="60" height="66" fill="#c8a660" rx="7"/>
    <!-- Subtle left-side lighter gradient band (cylindrical shading) -->
    <rect x="784" y="494" width="10" height="58" fill="#ddb870" opacity="0.5" rx="4"/>
    <!-- Subtle right-side darker edge -->
    <rect x="834" y="494" width="10" height="58" fill="#7a5018" opacity="0.22" rx="4"/>
    <!-- Bottom base ring — slightly wider, slightly darker -->
    <rect x="782" y="548" width="64" height="8" fill="#b09040" rx="4"/>
    <!-- Top rim — clean ceramic edge -->
    <rect x="784" y="490" width="60" height="6" fill="#d4b068" rx="7"/>
    <!-- Rim inner shadow (gives depth to opening) -->
    <rect x="788" y="494" width="52" height="3" fill="#8a6820" opacity="0.35" rx="2"/>
    <!-- Rim highlight catchlight -->
    <rect x="787" y="490" width="54" height="2" fill="#f0d888" opacity="0.65" rx="3"/>
    <!-- "BIG" — red fill, teal outline via paint-order -->
    <text x="814" y="514"
          font-family="'Arial Black','Impact',sans-serif" font-size="10" font-weight="900"
          text-anchor="middle" letter-spacing="1"
          stroke="#1a6a5a" stroke-width="2.5" fill="#e01818" paint-order="stroke">BIG</text>
    <!-- "HUG" -->
    <text x="814" y="526"
          font-family="'Arial Black','Impact',sans-serif" font-size="10" font-weight="900"
          text-anchor="middle" letter-spacing="1"
          stroke="#1a6a5a" stroke-width="2.5" fill="#e01818" paint-order="stroke">HUG</text>
    <!-- "MUG" -->
    <text x="814" y="538"
          font-family="'Arial Black','Impact',sans-serif" font-size="10" font-weight="900"
          text-anchor="middle" letter-spacing="1"
          stroke="#1a6a5a" stroke-width="2.5" fill="#e01818" paint-order="stroke">MUG</text>
    <!-- Drop shadow -->
    <ellipse cx="814" cy="560" rx="32" ry="6" fill="#000" opacity="0.25" filter="url(#s-blur-xs)"/>
    <!-- Steam wisps -->
    <path d="M 800 490 Q 796 478 800 468" fill="none" stroke="#c8b880" stroke-width="2"
          stroke-linecap="round" opacity="0">
      <animate attributeName="opacity" values="0;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0s"/>
      <animate attributeName="d" values="M 800 490 Q 796 478 800 468;M 800 490 Q 804 478 800 468;M 800 490 Q 796 478 800 468" dur="2.4s" repeatCount="indefinite" begin="0s"/>
    </path>
    <path d="M 814 488 Q 810 476 814 466" fill="none" stroke="#c8b880" stroke-width="2"
          stroke-linecap="round" opacity="0">
      <animate attributeName="opacity" values="0;0.42;0" dur="3.0s" repeatCount="indefinite" begin="-1.0s"/>
      <animate attributeName="d" values="M 814 488 Q 810 476 814 466;M 814 488 Q 818 476 814 466;M 814 488 Q 810 476 814 466" dur="3.0s" repeatCount="indefinite" begin="-1.0s"/>
    </path>
    <path d="M 826 490 Q 822 478 826 468" fill="none" stroke="#c8b880" stroke-width="1.8"
          stroke-linecap="round" opacity="0">
      <animate attributeName="opacity" values="0;0.35;0" dur="2.7s" repeatCount="indefinite" begin="-1.6s"/>
      <animate attributeName="d" values="M 826 490 Q 822 478 826 468;M 826 490 Q 830 478 826 468;M 826 490 Q 822 478 826 468" dur="2.7s" repeatCount="indefinite" begin="-1.6s"/>
    </path>
  </g>

  <!-- Monitor stand — prominent T-shaped foot -->
  <!-- Vertical neck -->
  <rect x="605" y="446" width="17" height="96" fill="#1c1c22" rx="8"/>
  <rect x="607" y="446" width="4" height="96" fill="#2e2e38" opacity="0.55" rx="4"/>
  <!-- T-base foot -->
  <rect x="543" y="534" width="141" height="12" fill="#191920" rx="6"/>
  <rect x="543" y="534" width="141" height="3" fill="#2a2a34" opacity="0.7" rx="4"/>
  <!-- Foot shadow on desk -->
  <ellipse cx="613" cy="546" rx="72" ry="5" fill="#000" opacity="0.32" filter="url(#s-blur-xs)"/>

  <!-- Monitor body — slim single-layer bezel, modern form -->
  <rect x="412" y="296" width="402" height="248" fill="#13131a" rx="20"/>
  <!-- Left bevel (lighter edge for depth) -->
  <rect x="412" y="296" width="6" height="248" fill="#242430" opacity="0.9" rx="3"/>
  <!-- Right bevel (shadow side) -->
  <rect x="808" y="296" width="6" height="248" fill="#0a0a12" opacity="0.9" rx="3"/>
  <!-- Bottom bevel (thickness illusion) -->
  <rect x="412" y="536" width="402" height="8" fill="#0e0e18" opacity="0.85"/>
  <!-- Thin top-edge glint -->
  <rect x="413" y="297" width="400" height="2" fill="#ffffff" opacity="0.07" rx="10"/>
  <!-- Subtle side-edge depth -->
  <rect x="412" y="296" width="4" height="248" fill="#1e1e28" opacity="0.6" rx="2"/>

  <!-- Screen: dark — real HTML UI is overlaid here by JS -->
  <rect id="s-monitor-screen" x="418" y="310" width="390" height="228" fill="#0a0a0f" rx="8"/>
  <!-- Screen vignette: CRT-feel center-bright, corners dark -->
  <rect x="418" y="310" width="390" height="228" fill="url(#s-monitor-screen-gradient)" rx="8" opacity="0.7"/>
  <!-- Subtle screen glow — visible around the HTML UI overlay -->
  <rect x="418" y="310" width="390" height="228" fill="url(#s-monitor-glow)" rx="8" opacity="0.3"/>
  <!-- Glass glare: diagonal highlight across upper-left of screen -->
  <polygon points="420,312 540,312 430,380 420,380" fill="#ffffff" opacity="0.04"/>
  <line x1="422" y1="310" x2="540" y2="314" stroke="#ffffff" stroke-width="1" opacity="0.06"/>
  <!-- LED spill: teal-blue glow on monitor bottom -->
  <ellipse cx="613" cy="544" rx="80" ry="6" fill="#6ee7a8" opacity="0.05" filter="url(#s-blur-xs)"/>
  <!-- UI zone marker — JS reads this rect to position the HTML overlay -->
  <rect id="s-ui-zone" x="418" y="310" width="390" height="228" fill="transparent"/>
  <!-- Monitor body zone — JS positions the solid face overlay here to mask the cat -->
  <rect id="s-monitor-body-zone" x="412" y="296" width="402" height="250" fill="transparent"/>
  <!-- Power LED — embedded in bottom bezel, not floating below stand -->
  <circle cx="613" cy="540" r="2" fill="#6ee7a8" opacity="0.65">
    <animate attributeName="opacity" values="0.35;0.85;0.35" dur="3.2s" repeatCount="indefinite"/>
  </circle>

  <!-- Desk lamp -->
  <g id="s-lamp">
    <ellipse cx="900" cy="560" rx="38" ry="9" fill="#2c2c2c"/>
    <rect x="896" y="552" width="8" height="10" fill="#363636"/>
    <!-- Arm lower segment -->
    <line x1="900" y1="556" x2="888" y2="484" stroke="#383838" stroke-width="7" stroke-linecap="round"/>
    <!-- Arm highlight (lighter edge) -->
    <line x1="901" y1="556" x2="890" y2="484" stroke="#4a4a4a" stroke-width="2" stroke-linecap="round"/>
    <!-- Arm upper segment -->
    <line x1="888" y1="484" x2="858" y2="418" stroke="#383838" stroke-width="7" stroke-linecap="round"/>
    <!-- Arm upper highlight -->
    <line x1="890" y1="484" x2="860" y2="418" stroke="#4a4a4a" stroke-width="2" stroke-linecap="round"/>
    <!-- Knuckle joint ring -->
    <circle cx="888" cy="484" r="8" fill="#2c2c2c"/>
    <circle cx="888" cy="484" r="8" fill="none" stroke="#3a3a3a" stroke-width="1.5" opacity="0.6"/>
    <!-- Shade outer -->
    <path d="M 836 408 L 888 396 L 898 432 L 842 446 Z" fill="#424242"/>
    <!-- Shade inner face (lamp-lit interior) -->
    <path d="M 838 409 L 885 398 L 894 430 L 843 444 Z" fill="#383838"/>
    <!-- Shade interior warm glow -->
    <path d="M 841 411 L 882 401 L 890 428 L 846 441 Z" fill="#ffcc60" opacity="0.12"/>
    <!-- Shade highlight along top edge -->
    <line x1="836" y1="408" x2="888" y2="396" stroke="#555555" stroke-width="1.2" opacity="0.7"/>
    <!-- Bulb -->
    <circle cx="864" cy="422" r="6" fill="#ffe080" opacity="0.92">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="4.2s" repeatCount="indefinite"/>
    </circle>
    <!-- Bulb halo -->
    <circle cx="864" cy="422" r="10" fill="#ffcc40" opacity="0.30" filter="url(#s-blur-xs)"/>
    <!-- Lamp pool on desk — warm amber hero light source -->
    <ellipse id="s-lamp-pool" cx="830" cy="544" rx="150" ry="28"
             fill="url(#s-lamp-glow)" filter="url(#s-blur-md)" opacity="0.80"/>
    <!-- Cone of light — angled down toward scrap paper on desk -->
    <polygon points="836,408 842,446 876,544 840,548"
             fill="#ffe080" opacity="0.06" filter="url(#s-blur-xs)">
      <animate attributeName="opacity" values="0.04;0.08;0.04" dur="4.2s" repeatCount="indefinite"/>
    </polygon>
  </g>

  <!-- Scrap paper — lit by lamp, under light cone -->
  <g id="s-scrap-paper" transform="translate(862,528) rotate(-5)">
    <!-- Paper shadow -->
    <rect x="2" y="2" width="70" height="46" fill="#000" opacity="0.18" rx="1" filter="url(#s-blur-xs)"/>
    <!-- Paper body — slightly warm from lamp -->
    <rect x="0" y="0" width="70" height="46" fill="#f0ebd8" rx="1.5"/>
    <!-- Torn top edge (irregular polyline) -->
    <polyline points="0,0 6,2 11,0 17,3 23,1 29,2 35,0 41,2 47,1 53,3 59,1 65,2 70,0" stroke="#d0c8b0" stroke-width="0.9" fill="none"/>
    <!-- Red margin line -->
    <line x1="14" y1="0" x2="14" y2="46" stroke="#d04040" stroke-width="0.8" opacity="0.55"/>
    <!-- Ruled lines -->
    <line x1="5" y1="12" x2="65" y2="12" stroke="#c4bea8" stroke-width="0.7"/>
    <line x1="5" y1="20" x2="65" y2="20" stroke="#c4bea8" stroke-width="0.7"/>
    <line x1="5" y1="28" x2="65" y2="28" stroke="#c4bea8" stroke-width="0.7"/>
    <line x1="5" y1="36" x2="65" y2="36" stroke="#c4bea8" stroke-width="0.7"/>
    <!-- Note text (after margin) -->
    <text x="17" y="10" font-family="'Courier New',monospace" font-size="6.5" fill="#2a1e0a" opacity="0.88">buy more</text>
    <text x="17" y="18" font-family="'Courier New',monospace" font-size="6.5" fill="#2a1e0a" opacity="0.88">cat treats</text>
    <!-- Corner curl (bottom-right lifted corner) -->
    <path d="M 70 46 Q 64 46 62 40 Q 70 40 70 46 Z" fill="#d8d0b8"/>
    <path d="M 62 40 Q 68 42 70 46" fill="none" stroke="#b8b0a0" stroke-width="0.8"/>
    <!-- Warm lamp overlay -->
    <rect x="0" y="0" width="70" height="46" fill="#ffa820" opacity="0.10" rx="1.5"/>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 9 · AMBIENT GLOW EFFECTS
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Floor: cool moonlight pool from window -->
  <ellipse cx="500" cy="640" rx="440" ry="72" fill="url(#s-floor-light)" filter="url(#s-blur-md)"/>
  <!-- Floor: warm lamp spill near desk -->
  <ellipse cx="860" cy="660" rx="220" ry="36" fill="url(#s-floor-lamp)" filter="url(#s-blur-sm)"/>

  <!-- Monitor blue bounce on desk -->
  <ellipse cx="613" cy="544" rx="200" ry="16" fill="#00d9ff" opacity="0.07" filter="url(#s-blur-xs)"/>

  <!-- Lamp warm pool on desk surface -->
  <ellipse cx="828" cy="544" rx="180" ry="22" fill="#ffe080" opacity="0.22" filter="url(#s-blur-xs)"/>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 10 · DUST MOTES (golden, floating in light beams)
       ══════════════════════════════════════════════════════════════════════ -->

  <!-- Dust: cool moonlight side (left / window zone) -->
  <g id="s-dust" opacity="1.0">
    <circle cx="350" cy="580" r="1.6" fill="#a0c0ff">
      <animate attributeName="cy"      values="580;80"                             dur="9s"   repeatCount="indefinite" begin="0s"/>
      <animate attributeName="opacity" values="0;0.55;0.55;0"                      dur="9s"   repeatCount="indefinite" begin="0s"/>
      <animate attributeName="cx"      values="350;355;347;352;350"                dur="9s"   repeatCount="indefinite" begin="0s"/>
    </circle>
    <circle cx="420" cy="400" r="1.2" fill="#b0c8ff">
      <animate attributeName="cy"      values="400;-100"                            dur="11s"  repeatCount="indefinite" begin="-2s"/>
      <animate attributeName="opacity" values="0;0.45;0.45;0"                       dur="11s"  repeatCount="indefinite" begin="-2s"/>
      <animate attributeName="cx"      values="420;414;422;417;420"                 dur="11s"  repeatCount="indefinite" begin="-2s"/>
    </circle>
    <circle cx="500" cy="520" r="1.7" fill="#98b8ff">
      <animate attributeName="cy"      values="520;20"                              dur="10s"  repeatCount="indefinite" begin="-4.5s"/>
      <animate attributeName="opacity" values="0;0.60;0.60;0"                       dur="10s"  repeatCount="indefinite" begin="-4.5s"/>
      <animate attributeName="cx"      values="500;506;497;502;500"                 dur="10s"  repeatCount="indefinite" begin="-4.5s"/>
    </circle>
    <circle cx="324" cy="300" r="1.0" fill="#a8c4ff">
      <animate attributeName="cy"      values="300;-200"                            dur="12s"  repeatCount="indefinite" begin="-1.5s"/>
      <animate attributeName="opacity" values="0;0.40;0.40;0"                       dur="12s"  repeatCount="indefinite" begin="-1.5s"/>
    </circle>
    <circle cx="376" cy="200" r="1.3" fill="#b0c8ff">
      <animate attributeName="cy"      values="200;-300"                            dur="13s"  repeatCount="indefinite" begin="-6s"/>
      <animate attributeName="opacity" values="0;0.42;0.42;0"                       dur="13s"  repeatCount="indefinite" begin="-6s"/>
    </circle>
    <circle cx="468" cy="342" r="1.5" fill="#a0c0ff">
      <animate attributeName="cy"      values="342;-158"                            dur="9.6s" repeatCount="indefinite" begin="-7.6s"/>
      <animate attributeName="opacity" values="0;0.50;0.50;0"                       dur="9.6s" repeatCount="indefinite" begin="-7.6s"/>
      <animate attributeName="cx"      values="468;463;470;466;468"                 dur="9.6s" repeatCount="indefinite" begin="-7.6s"/>
    </circle>
    <circle cx="286" cy="452" r="1.8" fill="#98b8ff">
      <animate attributeName="cy"      values="452;-48"                             dur="10.6s" repeatCount="indefinite" begin="-8.3s"/>
      <animate attributeName="opacity" values="0;0.45;0.45;0"                       dur="10.6s" repeatCount="indefinite" begin="-8.3s"/>
    </circle>
    <circle cx="314" cy="522" r="1.1" fill="#a8c4ff">
      <animate attributeName="cy"      values="522;22"                              dur="12.6s" repeatCount="indefinite" begin="-4.3s"/>
      <animate attributeName="opacity" values="0;0.35;0.35;0"                       dur="12.6s" repeatCount="indefinite" begin="-4.3s"/>
    </circle>
    <!-- Dust: warm lamp side (right / desk zone) -->
    <circle cx="612" cy="462" r="1.4" fill="#ffd090">
      <animate attributeName="cy"      values="462;-38"                             dur="8.6s" repeatCount="indefinite" begin="-3.2s"/>
      <animate attributeName="opacity" values="0;0.58;0.58;0"                       dur="8.6s" repeatCount="indefinite" begin="-3.2s"/>
      <animate attributeName="cx"      values="612;618;609;614;612"                 dur="8.6s" repeatCount="indefinite" begin="-3.2s"/>
    </circle>
    <circle cx="732" cy="382" r="1.3" fill="#ffc870">
      <animate attributeName="cy"      values="382;-118"                            dur="9.1s" repeatCount="indefinite" begin="-1.3s"/>
      <animate attributeName="opacity" values="0;0.48;0.48;0"                       dur="9.1s" repeatCount="indefinite" begin="-1.3s"/>
      <animate attributeName="cx"      values="732;737;729;733;732"                 dur="9.1s" repeatCount="indefinite" begin="-1.3s"/>
    </circle>
    <circle cx="662" cy="282" r="1.4" fill="#ffd090">
      <animate attributeName="cy"      values="282;-218"                            dur="11.6s" repeatCount="indefinite" begin="-5.1s"/>
      <animate attributeName="opacity" values="0;0.40;0.40;0"                       dur="11.6s" repeatCount="indefinite" begin="-5.1s"/>
    </circle>
    <circle cx="828" cy="502" r="1.9" fill="#ffc870">
      <animate attributeName="cy"      values="502;2"                               dur="10.1s" repeatCount="indefinite" begin="-9.6s"/>
      <animate attributeName="opacity" values="0;0.62;0.62;0"                       dur="10.1s" repeatCount="indefinite" begin="-9.6s"/>
      <animate attributeName="cx"      values="828;822;831;826;828"                 dur="10.1s" repeatCount="indefinite" begin="-9.6s"/>
    </circle>
    <circle cx="774" cy="602" r="1.4" fill="#ffd090">
      <animate attributeName="cy"      values="602;102"                             dur="8.1s" repeatCount="indefinite" begin="-2.9s"/>
      <animate attributeName="opacity" values="0;0.50;0.50;0"                       dur="8.1s" repeatCount="indefinite" begin="-2.9s"/>
    </circle>
    <circle cx="546" cy="162" r="1.1" fill="#a0c0ff">
      <animate attributeName="cy"      values="162;-338"                            dur="14s"  repeatCount="indefinite" begin="-3.9s"/>
      <animate attributeName="opacity" values="0;0.38;0.38;0"                       dur="14s"  repeatCount="indefinite" begin="-3.9s"/>
    </circle>
    <circle cx="694" cy="502" r="1.5" fill="#ffc870">
      <animate attributeName="cy"      values="502;2"                               dur="9.6s" repeatCount="indefinite" begin="-6.9s"/>
      <animate attributeName="opacity" values="0;0.52;0.52;0"                       dur="9.6s" repeatCount="indefinite" begin="-6.9s"/>
      <animate attributeName="cx"      values="694;699;691;695;694"                 dur="9.6s" repeatCount="indefinite" begin="-6.9s"/>
    </circle>
  </g>


  <!-- ══════════════════════════════════════════════════════════════════════
       LAYER 11 · VIGNETTE
       ══════════════════════════════════════════════════════════════════════ -->

  <rect width="1440" height="720" fill="url(#s-vignette)"/>


  <!-- ══════════════════════════════════════════════════════════════════════
       CAT ZONE (invisible — JS reads its position to overlay cat-stage)
       ══════════════════════════════════════════════════════════════════════ -->
  <!--
    Cat sits on the mousepad, to the left of the monitor.
    SVG coords: x=162 y=378 w=232 h=164
    (bottom of zone = y 542 = top of desk surface — cat sits ON desk)
  -->
  <rect id="s-cat-zone" x="202" y="378" width="192" height="144" fill="transparent"/>

  <!--
    Monitor-top zone — raised so left paw naturally clears monitor top (SVG y=296) with -18deg tilt.
    Zone y=140 → cat top at canvas y≈228. Paw at cat SVG y≈160 → scene y≈280 → above monitor ✓
  -->
  <rect id="s-monitor-top-zone" x="670" y="200" width="115" height="115" fill="transparent"/>

</svg>`;

/* ─── Mount ───────────────────────────────────────────────────────────────── */

/**
 * Inject the scene SVG into `wrapper` as a full-bleed background.
 * Returns helpers to position HTML elements over SVG zone rects.
 * `anchor` is the element that HTML children are positioned inside
 * (must be `position:relative` and overlap the wrapper exactly — the hero).
 *
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} anchor  - positioning parent for overlaid elements
 * @returns {{ positionCat(el), positionUI(el), cleanup() }}
 */
export function mountScene(wrapper, anchor) {
  wrapper.insertAdjacentHTML("afterbegin", SCENE_SVG);
  const svg            = wrapper.querySelector("svg");
  const catZone         = svg.querySelector("#s-cat-zone");
  const monitorTopZone  = svg.querySelector("#s-monitor-top-zone");
  const uiZone          = svg.querySelector("#s-ui-zone");
  const monitorBodyZone = svg.querySelector("#s-monitor-body-zone");
  const ipodZone        = svg.querySelector("#s-ipod-zone");

  let catPosition = "desk"; // "desk" | "monitor"

  function showPoof(el, direction) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width  * 0.5;
    const cy = r.top  + r.height * 0.38;

    // Cloud poof
    const poof = document.createElement("div");
    poof.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:88px;height:88px;pointer-events:none;z-index:9999;animation:cat-poof-expand 380ms ease-out forwards`;
    poof.innerHTML = `<svg viewBox="0 0 88 88" style="width:100%;height:100%"><g fill="white" opacity="0.93"><ellipse cx="44" cy="54" rx="29" ry="20"/><ellipse cx="25" cy="49" rx="17" ry="15"/><ellipse cx="63" cy="49" rx="17" ry="15"/><ellipse cx="44" cy="36" rx="20" ry="18"/><ellipse cx="28" cy="33" rx="14" ry="12"/><ellipse cx="60" cy="33" rx="14" ry="12"/></g><g stroke="#ffd84d" stroke-width="2.5" stroke-linecap="round"><line x1="10" y1="14" x2="17" y2="21"/><line x1="7" y1="21" x2="17" y2="21"/><line x1="78" y1="14" x2="71" y2="21"/><line x1="81" y1="21" x2="71" y2="21"/><line x1="44" y1="6"  x2="44" y2="15"/></g></svg>`;
    document.body.appendChild(poof);
    setTimeout(() => poof.remove(), 420);

    // Speed dash lines
    const anim = direction > 0 ? "cat-dash-right" : "cat-dash-left";
    const offsetX = direction > 0 ? -90 : 10;
    const dash = document.createElement("div");
    dash.style.cssText = `position:fixed;left:${cx + offsetX}px;top:${cy - 28}px;pointer-events:none;z-index:9998;`;
    [[0,52],[14,70],[26,58],[38,46],[50,62]].forEach(([y, w], i) => {
      const ln = document.createElement("div");
      ln.style.cssText = `position:absolute;top:${y}px;left:0;width:${w}px;height:2px;background:rgba(255,255,255,0.6);border-radius:1px;animation:${anim} 280ms ${i * 38}ms ease-in forwards`;
      dash.appendChild(ln);
    });
    document.body.appendChild(dash);
    setTimeout(() => dash.remove(), 500);
  }

  function positionOver(el, zone, animate = false) {
    const aRect = anchor.getBoundingClientRect();
    const zRect = zone.getBoundingClientRect();
    // BCR coords are in viewport (post-scale) space; divide by scale to get layout px
    const scale = aRect.width / anchor.clientWidth;
    if (animate) {
      el.style.transition = "left 0.55s cubic-bezier(0.34,1.04,0.64,1), top 0.55s cubic-bezier(0.34,1.04,0.64,1), width 0.45s ease, height 0.45s ease";
    } else {
      el.style.transition = "";
    }
    el.style.position = "absolute";
    el.style.left   = `${(zRect.left - aRect.left) / scale}px`;
    el.style.top    = `${(zRect.top  - aRect.top)  / scale}px`;
    el.style.width  = `${zRect.width  / scale}px`;
    el.style.height = `${zRect.height / scale}px`;
  }

  const reposition = () => {
    const catEl  = document.querySelector("[data-cat]");
    const uiEl   = document.querySelector("[data-monitor-ui]");
    const faceEl = document.querySelector("[data-monitor-face]");
    if (catEl) {
      const zone = catPosition === "monitor" ? monitorTopZone : catZone;
      if (zone) positionOver(catEl, zone);
    }
    if (uiEl && uiZone) positionOver(uiEl, uiZone);
    if (faceEl && monitorBodyZone) positionOver(faceEl, monitorBodyZone);
  };

  const ro = new ResizeObserver(reposition);
  ro.observe(wrapper);

  function cleanup() {
    ro.disconnect();
    svg.remove();
  }

  return {
    catZone,
    monitorTopZone,
    ipodZone,
    positionCat:         (el) => positionOver(el, catZone),
    positionUI:          (el) => positionOver(el, uiZone),
    positionMonitorFace: (el) => monitorBodyZone && positionOver(el, monitorBodyZone),
    moveCatToMonitor(el) {
      showPoof(el, 1);
      catPosition = "monitor";
      el.classList.add("cat-stage--peeking");
      if (monitorTopZone) positionOver(el, monitorTopZone, true);
    },
    moveCatToDesk(el, animate = true) {
      showPoof(el, -1);
      catPosition = "desk";
      el.classList.remove("cat-stage--peeking");
      if (catZone) positionOver(el, catZone, animate);
    },
    cleanup,
  };
}
