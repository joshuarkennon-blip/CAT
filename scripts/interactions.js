/* CAT — Interactions
 * Purring, hearts, mouse drag, easter eggs, and maximum cozy.
 */

// ─── Web Audio Purr Synth ──────────────────────────────────────────────────
// Real cat purr = filtered noise (breath texture) + amplitude modulated at
// ~25 Hz (the flutter rate) + low sine rumble for body. NOT a tone oscillator.

let _purrCtx = null;
let _purrMaster = null;
let _purrTremolo = null;
let _purrLfo = null;

function initPurr() {
  if (_purrCtx) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // ── White noise source (breath/air texture) ──
  const bufLen = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;

  // ── Bandpass: center the noise around ~120 Hz (warm purr range) ──
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 120;
  bp.Q.value = 0.3;

  // ── Lowpass: remove remaining highs ──
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 220;

  // ── Low sine rumble: ~100 Hz for body/chest feel ──
  const rumble = ctx.createOscillator();
  rumble.type = 'sine';
  rumble.frequency.value = 100;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.08;

  // ── Tremolo node: amplitude modulated at ~26 Hz = the purr flutter rate ──
  const tremolo = ctx.createGain();
  tremolo.gain.value = 0.5; // base (DC offset)

  // LFO oscillates gain between 0 and 1 (0.5 ± 0.5)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 26;
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = 0.5; // depth
  lfo.connect(lfoAmt);
  lfoAmt.connect(tremolo.gain);

  // ── Master gain (starts silent) ──
  const master = ctx.createGain();
  master.gain.value = 0;

  // Signal chain: noise → bp → lp → tremolo
  //               rumble → rumbleGain → tremolo
  //               tremolo → master → destination
  noise.connect(bp);
  bp.connect(lp);
  lp.connect(tremolo);
  rumble.connect(rumbleGain);
  rumbleGain.connect(tremolo);
  tremolo.connect(master);
  master.connect(ctx.destination);

  noise.start();
  rumble.start();
  lfo.start();

  _purrCtx = ctx;
  _purrMaster = master;
  _purrTremolo = tremolo;
  _purrLfo = lfo;
}

function startPurr(intensity = 1) {
  initPurr();
  const vol = Math.min(0.055, 0.015 + intensity * 0.008);
  _purrLfo.frequency.linearRampToValueAtTime(24 + intensity * 1.5, _purrCtx.currentTime + 0.2);
  _purrMaster.gain.cancelScheduledValues(_purrCtx.currentTime);
  _purrMaster.gain.linearRampToValueAtTime(vol, _purrCtx.currentTime + 0.3);
}

function stopPurr() {
  if (!_purrMaster) return;
  _purrMaster.gain.cancelScheduledValues(_purrCtx.currentTime);
  _purrMaster.gain.linearRampToValueAtTime(0, _purrCtx.currentTime + 0.8);
}

// ─── Heart Particles ───────────────────────────────────────────────────────

const HEART_EMOJIS = ['❤️', '🧡', '💛', '💕', '💖', '🐱', '✨'];

function spawnHearts(x, y, count = 1) {
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
    const size = 14 + Math.random() * 20;
    const dx = (Math.random() - 0.5) * 100;
    const dy = -(40 + Math.random() * 60);
    const dur = 700 + Math.random() * 300;
    const rot = (Math.random() - 0.5) * 25;

    h.textContent = emoji;
    h.style.cssText = `
      position:fixed;
      left:${x + (Math.random() - 0.5) * 50}px;
      top:${y}px;
      font-size:${size}px;
      pointer-events:none;
      z-index:10000;
      transform:translate(0,0) scale(0.2) rotate(${rot}deg);
      opacity:0;
      transition:transform ${dur}ms ease-out, opacity ${dur * 0.7}ms ease-out;
      will-change:transform,opacity;
    `;
    document.body.appendChild(h);

    setTimeout(() => {
      requestAnimationFrame(() => {
        h.style.transform = `translate(${dx}px,${dy}px) scale(1) rotate(${rot}deg)`;
        h.style.opacity = '1';
        setTimeout(() => {
          h.style.opacity = '0';
          h.style.transform = `translate(${dx + (Math.random()-0.5)*20}px,${dy - 30}px) scale(0.5)`;
        }, dur * 0.55);
        setTimeout(() => h.remove(), dur + 100);
      });
    }, i * 55);
  }
}

// ─── Speech Bubble ─────────────────────────────────────────────────────────

function showBubble(anchorEl, text, dur = 2200) {
  if (anchorEl._bubble) { anchorEl._bubble.remove(); anchorEl._bubble = null; }

  const r = anchorEl.getBoundingClientRect();
  const bubble = document.createElement('div');
  bubble.style.cssText = `
    position:fixed;
    left:${r.left + r.width / 2}px;
    top:${r.top - 8}px;
    transform:translate(-50%,-100%) scale(0.6);
    background:rgba(255,253,248,0.18);
    backdrop-filter:blur(12px);
    -webkit-backdrop-filter:blur(12px);
    border:1px solid rgba(255,253,248,0.35);
    color:#fff;
    text-shadow:0 1px 6px rgba(0,0,0,0.55);
    padding:12px 22px;
    border-radius:22px;
    font-family:'Inter',sans-serif;
    font-size:22px;
    font-weight:700;
    letter-spacing:-0.01em;
    box-shadow:0 6px 24px rgba(0,0,0,0.22);
    pointer-events:none;
    z-index:10001;
    white-space:nowrap;
    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s;
    opacity:0;
  `;
  bubble.textContent = text;
  const tail = document.createElement('div');
  tail.style.cssText = `
    position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);
    width:0;height:0;
    border-left:9px solid transparent;border-right:9px solid transparent;
    border-top:9px solid rgba(255,253,248,0.35);
  `;
  bubble.appendChild(tail);
  document.body.appendChild(bubble);
  anchorEl._bubble = bubble;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bubble.style.transform = 'translate(-50%,-100%) scale(1)';
      bubble.style.opacity = '1';
    });
  });

  setTimeout(() => {
    bubble.style.opacity = '0';
    bubble.style.transform = 'translate(-50%,-120%) scale(0.8)';
    setTimeout(() => { bubble.remove(); if (anchorEl._bubble === bubble) anchorEl._bubble = null; }, 220);
  }, dur);
}

// ─── Shooting Star ─────────────────────────────────────────────────────────

function shootingStar() {
  const s = document.createElement('div');
  const sx = 310 + Math.random() * 250;
  const sy = 65 + Math.random() * 70;
  s.style.cssText = `
    position:fixed;left:${sx}px;top:${sy}px;
    width:130px;height:2px;
    background:linear-gradient(90deg,#fff,transparent);
    border-radius:1px;pointer-events:none;z-index:10000;
    transform:rotate(-32deg) scaleX(0);transform-origin:left center;
    opacity:0.95;
    transition:transform 0.38s ease-out,left 0.38s ease-out,top 0.38s ease-out,opacity 0.15s ease-in 0.34s;
  `;
  document.body.appendChild(s);
  requestAnimationFrame(() => {
    s.style.transform = 'rotate(-32deg) scaleX(1)';
    s.style.left = (sx + 220) + 'px';
    s.style.top = (sy + 130) + 'px';
    setTimeout(() => { s.style.opacity = '0'; }, 340);
    setTimeout(() => s.remove(), 580);
  });
}

// ─── Animation Helpers ─────────────────────────────────────────────────────

function wobbleEl(el, ox = 'center', oy = 'bottom') {
  el.style.transformBox = 'fill-box';
  el.style.transformOrigin = `${ox} ${oy}`;
  el.animate([
    { transform: 'rotate(0deg) scale(1)' },
    { transform: 'rotate(-9deg) scale(1.05)' },
    { transform: 'rotate(7deg) scale(1.02)' },
    { transform: 'rotate(-5deg) scale(1.01)' },
    { transform: 'rotate(2deg) scale(1)' },
    { transform: 'rotate(0deg) scale(1)' },
  ], { duration: 480, easing: 'ease-in-out', composite: 'add' });
}

function bounceEl(el) {
  el.style.transformBox = 'fill-box';
  el.style.transformOrigin = 'center center';
  el.animate([
    { transform: 'scale(1) translateY(0px)' },
    { transform: 'scale(1.13) translateY(-5px)' },
    { transform: 'scale(0.96) translateY(0px)' },
    { transform: 'scale(1.06) translateY(-2px)' },
    { transform: 'scale(1) translateY(0px)' },
  ], { duration: 430, easing: 'ease-out', composite: 'add' });
}

function spinEl(el, turns = 1) {
  el.style.transformBox = 'fill-box';
  el.style.transformOrigin = 'center center';
  el.animate([
    { transform: 'rotate(0deg)' },
    { transform: `rotate(${turns * 360}deg)` },
  ], { duration: 550 * turns, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', composite: 'add' });
}

function flickerEl(el) {
  el.animate([
    { opacity: 1 },
    { opacity: 0.35 },
    { opacity: 0.95 },
    { opacity: 0.25 },
    { opacity: 1 },
    { opacity: 0.5 },
    { opacity: 1 },
  ], { duration: 360, easing: 'ease-in-out' });
}

function makeInteractive(el, handler) {
  if (!el) return;
  el.style.cursor = 'pointer';
  el.style.setProperty('pointer-events', 'all');
  el.addEventListener('click', (e) => { e.stopPropagation(); handler(el, e); });
}

// ─── Generic Draggable SVG Element (no snap-back) ─────────────────────────

function mountSVGDrag(svg, elementId) {
  const el = svg.getElementById(elementId);
  if (!el) return;

  const baseTransform = el.getAttribute('transform') || '';
  let currentDx = 0, currentDy = 0;
  let dragging = false;
  let startSVGX = 0, startSVGY = 0;

  function getSVGPoint(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  el.style.cursor = 'grab';
  el.style.setProperty('pointer-events', 'all');

  el.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    dragging = true;
    const p = getSVGPoint(e.clientX, e.clientY);
    startSVGX = p.x - currentDx;
    startSVGY = p.y - currentDy;
    el.style.cursor = 'grabbing';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  el.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    dragging = true;
    const t = e.touches[0];
    const p = getSVGPoint(t.clientX, t.clientY);
    startSVGX = p.x - currentDx;
    startSVGY = p.y - currentDy;
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }, { passive: true });

  function onMove(e) {
    if (!dragging) return;
    const p = getSVGPoint(e.clientX, e.clientY);
    currentDx = p.x - startSVGX;
    currentDy = p.y - startSVGY;
    el.setAttribute('transform', `translate(${currentDx},${currentDy}) ${baseTransform}`);
  }

  function onTouchMove(e) {
    if (!dragging) return;
    const p = getSVGPoint(e.touches[0].clientX, e.touches[0].clientY);
    currentDx = p.x - startSVGX;
    currentDy = p.y - startSVGY;
    el.setAttribute('transform', `translate(${currentDx},${currentDy}) ${baseTransform}`);
  }

  function onUp() {
    dragging = false;
    el.style.cursor = 'grab';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onUp);
  }
}

// ─── Mouse Drag with Snap-back ─────────────────────────────────────────────

function mountMouseDrag(svg) {
  const mouseDrag = svg.getElementById('s-mouse-drag');
  if (!mouseDrag) return;

  let dragging = false;
  let startSVGX = 0, startSVGY = 0;
  let currentDx = 0, currentDy = 0;

  function getSVGPoint(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  mouseDrag.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    dragging = true;
    const p = getSVGPoint(e);
    startSVGX = p.x - currentDx;
    startSVGY = p.y - currentDy;
    mouseDrag.style.cursor = 'grabbing';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  mouseDrag.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    dragging = true;
    const t = e.touches[0];
    const p = getSVGPoint(t);
    startSVGX = p.x - currentDx;
    startSVGY = p.y - currentDy;
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }, { passive: true });

  function onMove(e) {
    if (!dragging) return;
    const p = getSVGPoint(e);
    currentDx = p.x - startSVGX;
    currentDy = p.y - startSVGY;
    mouseDrag.setAttribute('transform', `translate(${currentDx},${currentDy})`);
  }

  function onTouchMove(e) {
    if (!dragging) return;
    const p = getSVGPoint(e.touches[0]);
    currentDx = p.x - startSVGX;
    currentDy = p.y - startSVGY;
    mouseDrag.setAttribute('transform', `translate(${currentDx},${currentDy})`);
  }

  function onUp() {
    dragging = false;
    mouseDrag.style.cursor = 'grab';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onUp);

    // Spring snap-back
    const fromDx = currentDx;
    const fromDy = currentDy;
    const start = performance.now();
    const duration = 420;

    function snap(now) {
      const t = Math.min((now - start) / duration, 1);
      // Overshoot spring: ease out elastic-ish
      const ease = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 3.5);
      const dx = fromDx * (1 - ease);
      const dy = fromDy * (1 - ease);
      mouseDrag.setAttribute('transform', `translate(${dx},${dy})`);
      if (t < 1) {
        requestAnimationFrame(snap);
      } else {
        mouseDrag.setAttribute('transform', 'translate(0,0)');
        currentDx = 0;
        currentDy = 0;
      }
    }
    requestAnimationFrame(snap);
  }
}

// ─── Note Cycling ──────────────────────────────────────────────────────────

const NOTES = [
  ['buy more', 'cat treats'],
  ['fix bugs', 'later™'],
  ['★ pet cat', '★ drink tea'],
  ['todo:', '...zzzz'],
  ['water the', 'cactus!!'],
  ['note to', 'self: nap'],
  ['ship it', '🚀'],
];

// ─── Steam Particles ───────────────────────────────────────────────────────

function spawnSteam(el) {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width * 0.5;
  const topY = r.top + r.height * 0.1;

  const count = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const puff = document.createElement('div');
    const size = 7 + Math.random() * 9;
    const startX = cx + (Math.random() - 0.5) * r.width * 0.5;
    const driftX = (Math.random() - 0.5) * 28;
    const riseY  = 38 + Math.random() * 32;
    const dur    = 800 + Math.random() * 500;
    const delay  = i * 90;

    puff.style.cssText = `
      position:fixed;
      left:${startX - size / 2}px;
      top:${topY}px;
      width:${size}px;
      height:${size * 1.3}px;
      border-radius:50%;
      background:rgba(255,252,245,0.72);
      filter:blur(${2 + Math.random() * 2}px);
      pointer-events:none;
      z-index:10000;
      opacity:0;
      transform:translate(0,0) scale(0.4);
      transition:transform ${dur}ms ease-out, opacity ${dur * 0.9}ms ease-out;
      will-change:transform,opacity;
    `;
    document.body.appendChild(puff);

    setTimeout(() => {
      requestAnimationFrame(() => {
        puff.style.opacity = '0.8';
        puff.style.transform = `translate(${driftX}px,-${riseY}px) scale(1.6)`;
        setTimeout(() => {
          puff.style.opacity = '0';
          puff.style.transform = `translate(${driftX + (Math.random() - 0.5) * 16}px,-${riseY + 24}px) scale(2.2)`;
          setTimeout(() => puff.remove(), dur);
        }, dur * 0.45);
      });
    }, delay);
  }
}

// ─── Main Mount ────────────────────────────────────────────────────────────

export function mountInteractions(scene) {
  const tryMount = () => {
    const svg = document.querySelector('.scene-wrapper svg');
    if (!svg) { setTimeout(tryMount, 200); return; }

    // Mug — steam on click (drag handled separately by mountSVGDrag)
    // We wire this BEFORE mountSVGDrag so drag's stopPropagation wins on drag moves
    const mugEl = svg.getElementById('s-mug');
    if (mugEl) {
      let mugDragMoved = false;
      mugEl.addEventListener('mousedown', () => { mugDragMoved = false; });
      mugEl.addEventListener('mousemove', () => { mugDragMoved = true; });
      mugEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mugDragMoved) return;
        spawnSteam(mugEl);
        showBubble(mugEl, '☕ mmmm cozy...');
      });
    }

    // Candle — flicker, blow out / relight toggle
    let candleLit = true;
    const candleGroup = svg.getElementById('s-candle');
    const candleFlames = candleGroup ? candleGroup.querySelectorAll('ellipse') : [];
    const candleGlow  = candleGroup ? candleGroup.querySelector('ellipse:first-child') : null;
    makeInteractive(candleGroup, (el) => {
      flickerEl(el);
      wobbleEl(el, 'center', 'bottom');
      candleLit = !candleLit;
      candleFlames.forEach(f => {
        if (!f.hasAttribute('cx') || parseFloat(f.getAttribute('cy')) > 15) return;
        f.style.transition = 'opacity 0.3s';
        f.style.opacity = candleLit ? '' : '0';
      });
      showBubble(el, candleLit ? '🔥 relit!' : '💨 poof!');
    });

    // Scrap paper — cycle funny notes
    let noteIdx = 0;
    const paper = svg.getElementById('s-scrap-paper');
    const noteTexts = paper ? paper.querySelectorAll('text') : [];
    makeInteractive(paper, (el) => {
      wobbleEl(el, 'left', 'bottom');
      noteIdx = (noteIdx + 1) % NOTES.length;
      const [line1, line2] = NOTES[noteIdx];
      if (noteTexts[0]) noteTexts[0].textContent = line1;
      if (noteTexts[1]) noteTexts[1].textContent = line2;
    });

    // Bookshelf — bounce + random book title
    const BOOKS = ['"Clean Code"', '"The Cat\'s Hat"', '"Lofi & Chill"', '"CSS Secrets"', '"Nap Science"', '"Ship It!"'];
    makeInteractive(svg.getElementById('s-bookshelf'), (el) => {
      bounceEl(el);
      showBubble(el, `📖 ${BOOKS[Math.floor(Math.random() * BOOKS.length)]}`);
    });

    // Headphones — wobble + vibe
    makeInteractive(svg.getElementById('s-headphones'), (el) => {
      wobbleEl(el, 'center', 'bottom');
      showBubble(el, '🎧 vibing hard');
    });

    // Lamp — full on/off toggle (tight clickbox: pool has pointer-events:none in SVG)
    let lampBright = true;
    const lampPool      = svg.getElementById('s-lamp-pool');
    const lampBulb      = svg.getElementById('s-lamp-bulb');
    const lampHalo      = svg.getElementById('s-lamp-halo');
    const lampShadeGlow = svg.getElementById('s-lamp-shade-glow');
    const lampCone      = svg.getElementById('s-lamp-cone');
    const lampWallLight = svg.getElementById('s-lamp-wall-light');

    const lampEls = [lampPool, lampBulb, lampHalo, lampShadeGlow, lampCone, lampWallLight].filter(Boolean);
    lampEls.forEach(e => { e.style.transition = 'opacity 0.4s ease'; });

    makeInteractive(svg.getElementById('s-lamp'), (el) => {
      lampBright = !lampBright;
      lampPool?.style      && (lampPool.style.opacity      = lampBright ? '0.80' : '0');
      lampBulb?.style      && (lampBulb.style.opacity      = lampBright ? '0.92' : '0');
      lampHalo?.style      && (lampHalo.style.opacity      = lampBright ? '0.30' : '0');
      lampShadeGlow?.style && (lampShadeGlow.style.opacity = lampBright ? '0.12' : '0');
      lampCone?.style      && (lampCone.style.opacity      = lampBright ? '0.06' : '0');
      lampWallLight?.style && (lampWallLight.style.opacity = lampBright ? '1'    : '0');
      showBubble(el, lampBright ? '💡 lights on' : '🌙 lights out');
    });

    // Moon — shooting stars!
    makeInteractive(svg.getElementById('s-moon'), (el) => {
      showBubble(el, '🌕 wish!');
      shootingStar();
      setTimeout(shootingStar, 280);
      setTimeout(shootingStar, 640);
    });

    // Cactus — OW!
    makeInteractive(svg.getElementById('s-cactus'), (el) => {
      wobbleEl(el, 'center', 'bottom');
      showBubble(el, '🌵 OW!!');
    });

    // Left plant — happy growing
    makeInteractive(svg.getElementById('s-plant-left'), (el) => {
      wobbleEl(el, 'center', 'bottom');
      showBubble(el, '🌿 thriving!');
    });

    // Vinyl — spin + vibe
    makeInteractive(svg.getElementById('s-vinyl'), (el) => {
      spinEl(el, 3);
      showBubble(el, '🎵 spin it');
    });

    // Globe — spin + NYC pride
    makeInteractive(svg.getElementById('s-globe'), (el) => {
      spinEl(el, 1);
      showBubble(el, '🌍 NYC baby');
    });

    // Cat figurine on shelf — tiny meow
    makeInteractive(svg.getElementById('s-cat-figurine'), (el) => {
      bounceEl(el);
      showBubble(el, 'mrrrow! 🐱');
    });

    // Empire State Building — lightning flash
    makeInteractive(svg.getElementById('s-esb'), (el) => {
      showBubble(el, '⚡ NYC!');
      el.animate([
        { opacity: 0.9, filter: 'brightness(1)' },
        { opacity: 0.1, filter: 'brightness(6)' },
        { opacity: 0.9, filter: 'brightness(1)' },
        { opacity: 0.2, filter: 'brightness(4)' },
        { opacity: 0.9, filter: 'brightness(1)' },
      ], { duration: 400 });
    });

    // String lights — cascade flash
    const stringLights = svg.getElementById('s-string-lights');
    if (stringLights) {
      stringLights.style.cursor = 'pointer';
      stringLights.style.setProperty('pointer-events', 'all');
      stringLights.addEventListener('click', (e) => {
        e.stopPropagation();
        const bulbs = stringLights.querySelectorAll('circle[r="4"]');
        bulbs.forEach((b, i) => {
          setTimeout(() => {
            b.animate([
              { r: 4, opacity: 1 },
              { r: 7, opacity: 0.1 },
              { r: 5, opacity: 1 },
              { r: 6, opacity: 0.2 },
              { r: 4, opacity: 1 },
            ], { duration: 500, easing: 'ease-in-out' });
          }, i * 50);
        });
      });
    }

    // Mouse — drag + snap-back (no wobble)
    mountMouseDrag(svg);

    // Mug — drag around the desk (no snap-back, stays where dropped)
    mountSVGDrag(svg, 's-mug');

    // iPod desk item click already handled by music-player.js
  };

  tryMount();

  // ── Cat: purring + hearts + combo ─────────────────────────────────────

  const catStage = document.querySelector('[data-cat]');
  if (catStage) {
    catStage.style.cursor = 'pointer';

    let comboCount = 0;
    let comboTimer = null;
    let purrTimer = null;

    catStage.addEventListener('click', (e) => {
      // Bouncy cat
      catStage.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.09)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1.04)' },
        { transform: 'scale(1)' },
      ], { duration: 380, easing: 'ease-out' });

      comboCount++;
      const intensity = Math.min(comboCount, 6);
      startPurr(intensity);

      // Hearts — grow exponentially with combo
      const r = catStage.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.25;
      const heartCount = comboCount >= 3 ? Math.min(comboCount + 2, 10) : 1;
      spawnHearts(cx, cy, heartCount);

      // Reset combo after 1.3s gap
      clearTimeout(comboTimer);
      comboTimer = setTimeout(() => { comboCount = 0; }, 1300);

      // Stop purr after 2.2s of no clicks
      clearTimeout(purrTimer);
      purrTimer = setTimeout(stopPurr, 2200);
    });
  }

  // ── Konami Code easter egg ─────────────────────────────────────────────

  const KONAMI = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  let ki = 0;
  document.addEventListener('keydown', (e) => {
    if (e.keyCode === KONAMI[ki]) {
      ki++;
      if (ki === KONAMI.length) {
        ki = 0;
        // Mega party mode
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        for (let i = 0; i < 8; i++) {
          setTimeout(() => spawnHearts(
            cx + (Math.random() - 0.5) * 600,
            cy + (Math.random() - 0.5) * 300,
            8
          ), i * 120);
        }
        startPurr(6);
        setTimeout(stopPurr, 4000);
        for (let i = 0; i < 5; i++) setTimeout(shootingStar, i * 200);
        const svg = document.querySelector('.scene-wrapper svg');
        const lights = svg?.getElementById('s-string-lights');
        if (lights) {
          lights.querySelectorAll('circle[r="4"]').forEach((b, i) => {
            setTimeout(() => {
              b.animate([
                { opacity: 1 }, { opacity: 0.05 }, { opacity: 1 }, { opacity: 0.1 }, { opacity: 1 }
              ], { duration: 350, iterations: 3 });
            }, i * 25);
          });
        }
      }
    } else {
      ki = e.keyCode === KONAMI[0] ? 1 : 0;
    }
  });
}
