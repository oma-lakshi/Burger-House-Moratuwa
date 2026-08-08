/* ============================================================
   BURGER HOUSE — cinematic.js
   Scene 0: ring-progress loading + crack/light-burst reveal (automatic)
   Scenes 1–4: single scroll-driven hero built from a preloaded JPG frame
   sequence drawn to a 2D canvas (no <video> element scrubbing — that's
   what caused the lag — and no 3D model anymore either).
   ============================================================ */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const isMobile = window.matchMedia('(max-width: 760px)').matches;

/* ============================================================
   FRAME SEQUENCE SOURCE
   120 frames extracted from the source video (854×480, same 16:9
   as the original 1280×720 footage — the fraction below only cares
   about aspect, not pixel size).
   ============================================================ */
const FRAME_COUNT = 120;
const FRAME_PAD = 4;
const FRAME_SRC = (i) => `assets/frames/frame_${String(i + 1).padStart(FRAME_PAD, '0')}.jpg`;
const VIDEO_ASPECT_W = 1280, VIDEO_ASPECT_H = 720;

// Exact center of the source video's watermark, as a fraction of the frame
// (measured once from the raw footage) — used to lock the WhatsApp button
// over it later, however the frame ends up scaled/cropped on screen.
const WATERMARK_FX = 1160 / VIDEO_ASPECT_W;
const WATERMARK_FY = 600 / VIDEO_ASPECT_H;

const frames = new Array(FRAME_COUNT);

function preloadFrames(onProgress) {
  return new Promise((resolve) => {
    let settled = 0;
    const total = FRAME_COUNT;
    const mark = () => {
      settled++;
      if (onProgress) onProgress(settled / total);
      if (settled >= total) resolve();
    };
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = mark;
      img.onerror = mark;
      img.src = FRAME_SRC(i);
      frames[i] = img;
    }
    // safety net — never let a stalled/broken image request hang the gate forever
    setTimeout(resolve, 8000);
  });
}

/* ============================================================
   SCENE 0 — ring progress + automatic crack/light-burst reveal
   ============================================================ */
const gate = document.getElementById('entry-gate');
const ring = document.getElementById('frost-ring');
const pct = document.getElementById('frost-pct');
const enterHint = document.getElementById('enter-hint');
const RING_CIRC = 2 * Math.PI * 54;
ring.style.strokeDasharray = `${RING_CIRC}`;
ring.style.strokeDashoffset = `${RING_CIRC}`;

function setProgress(p) {
  const progress = Math.min(100, Math.max(0, p));
  ring.style.strokeDashoffset = `${RING_CIRC * (1 - progress / 100)}`;
  pct.textContent = Math.round(progress) + '%';
  if (progress >= 100) {
    gate.classList.add('ready');
    enterHint.classList.add('show');
  }
}

const MIN_GATE_TIME = 1000; // keep the loading screen up at least ~1s even on a fast load
const minDelay = new Promise((res) => setTimeout(res, MIN_GATE_TIME));
const framesReady = preloadFrames((frac) => setProgress(frac * 100));

Promise.all([framesReady, minDelay]).then(() => {
  setProgress(100);
  // a short dramatic beat at 100% before it ignites, then it's automatic —
  // no click/scroll/tap needed from here on
  setTimeout(playCrackAndEnter, 320);
});

/* ============================================================
   CRACK + LIGHT-BURST TRANSITION
   ============================================================ */
function buildShards() {
  const layer = document.getElementById('shatter-layer');
  const cols = 8, rows = 6;
  let html = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const w = 100 / cols, h = 100 / rows;
      html += `<div class="shard" style="left:${c * w}%;top:${r * h}%;width:${w}%;height:${h}%;"></div>`;
    }
  }
  layer.innerHTML = html;
  return Array.from(layer.querySelectorAll('.shard'));
}
const shards = buildShards();

const crackPaths = Array.from(document.querySelectorAll('.crack-path'));
crackPaths.forEach((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = `${len}`;
  p.style.strokeDashoffset = `${len}`;
});

let entered = false;
function playCrackAndEnter() {
  if (entered || !gate.classList.contains('ready')) return;
  entered = true;

  const tl = gsap.timeline({
    onComplete() {
      gate.style.display = 'none';
      document.body.classList.remove('gate-lock');
      startHero();
    }
  });

  // the glass starts to give way — cracks race outward from center
  tl.to(crackPaths, {
      opacity: 1, strokeDashoffset: 0,
      duration: 0.22, ease: 'power2.out', stagger: { each: 0.012, from: 'center' }
    })
    // ...then it blows open: a bright flash bursts through while the loader dissolves
    .to('#light-burst', { opacity: 1, scale: 1, duration: 0.001 }, '-=0.04')
    .to('#frost-block', { scale: 1.08, opacity: 0, duration: 0.2, ease: 'power1.in' }, '<')
    .to('#light-burst', { scale: 64, opacity: 0, duration: 0.6, ease: 'power2.out' }, '<0.03')
    .set('#shatter-layer', { display: 'block' }, '<0.05')
    .to(shards, {
      x: () => gsap.utils.random(-window.innerWidth * 0.7, window.innerWidth * 0.7),
      y: () => gsap.utils.random(-window.innerHeight * 0.7, window.innerHeight * 0.7),
      z: () => gsap.utils.random(-400, 200),
      rotateX: () => gsap.utils.random(-180, 180),
      rotateY: () => gsap.utils.random(-180, 180),
      opacity: 0,
      duration: 0.75,
      ease: 'power2.in',
      stagger: { each: 0.005, from: 'center' }
    }, '<')
    .to('#entry-gate', { autoAlpha: 0, duration: 0.35 }, '-=0.3');
}

/* ============================================================
   HERO FRAME-SEQUENCE (scenes 1–4)
   ============================================================ */
const canvas = document.getElementById('cine-canvas');
const ctx = canvas.getContext('2d');
const waFloat = document.getElementById('wa-float-shop');
const WA_HALF = 28; // half of the 56px WhatsApp button

let canvasCssW = 0, canvasCssH = 0;
let currentFrameIndex = 0;

function resizeCine() {
  const wrap = canvas.parentElement;
  canvasCssW = wrap.clientWidth;
  canvasCssH = wrap.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvasCssW * dpr);
  canvas.height = Math.round(canvasCssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(currentFrameIndex);
}
new ResizeObserver(resizeCine).observe(canvas.parentElement);

function drawFrame(idx) {
  idx = Math.max(0, Math.min(FRAME_COUNT - 1, idx));
  currentFrameIndex = idx;
  const img = frames[idx];
  if (!img || !img.complete || !img.naturalWidth || !canvasCssW || !canvasCssH) return;

  // "cover" fit — fill the viewport, cropping overflow, same math the
  // WhatsApp button uses below so it always lines up with the frame
  const scale = Math.max(canvasCssW / VIDEO_ASPECT_W, canvasCssH / VIDEO_ASPECT_H);
  const drawW = VIDEO_ASPECT_W * scale, drawH = VIDEO_ASPECT_H * scale;
  const offsetX = (canvasCssW - drawW) / 2, offsetY = (canvasCssH - drawH) / 2;

  ctx.clearRect(0, 0, canvasCssW, canvasCssH);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  positionWaFloat(offsetX, offsetY, drawW, drawH);
}

// Locks the WhatsApp float exactly on top of the video's watermark while the
// hero is visible — falls back to its normal corner spot if the current
// crop (e.g. tall mobile screens) pushes the watermark off-screen.
function positionWaFloat(offsetX, offsetY, drawW, drawH) {
  if (!waFloat) return;
  const sx = offsetX + WATERMARK_FX * drawW;
  const sy = offsetY + WATERMARK_FY * drawH;
  const onScreen = sx > WA_HALF && sx < canvasCssW - WA_HALF * 0.6 &&
                    sy > WA_HALF && sy < canvasCssH - WA_HALF * 0.6;
  if (onScreen) {
    waFloat.style.left = `${sx}px`;
    waFloat.style.top = `${sy}px`;
    waFloat.style.right = 'auto';
    waFloat.style.bottom = 'auto';
    waFloat.classList.add('wa-on-mark');
  } else {
    waFloat.style.left = '';
    waFloat.style.top = '';
    waFloat.style.right = '';
    waFloat.style.bottom = '';
    waFloat.classList.remove('wa-on-mark');
  }
}

/* ---- HTML overlay reveal ranges + end-of-scroll fade veil, tied to p (0..1) ---- */
const OVERLAYS = [
  ['.s1-left', 0.00, 0.22],
  ['.s1-right', 0.05, 0.24],
  ['.s1-details', 0.34, 0.66],
  ['.cine-finale', 0.88, 1.00],
];
function updateOverlays(p) {
  OVERLAYS.forEach(([sel, s, e]) => {
    document.querySelectorAll(sel).forEach((el) => el.classList.toggle('visible', p >= s && p <= e));
  });
}

const fadeVeil = document.getElementById('cine-fade-veil');
function updateScene(p) {
  drawFrame(Math.round(p * (FRAME_COUNT - 1)));
  updateOverlays(p);
  if (fadeVeil) {
    const t = p < 0.9 ? 0 : (p - 0.9) / 0.1;
    fadeVeil.style.opacity = Math.max(0, Math.min(1, t)) * 0.9;
  }
}

let heroStarted = false;
function startHero() {
  if (heroStarted) return;
  heroStarted = true;
  document.getElementById('cine-root').classList.add('active');
  document.getElementById('site-nav').classList.add('nav-in');
  resizeCine();
  updateScene(0);

  ScrollTrigger.create({
    trigger: '#cine-root',
    start: 'top top',
    end: 'bottom bottom',
    pin: '#cine-pin',
    scrub: isMobile ? 0.35 : 0.6,
    onUpdate(self) { updateScene(self.progress); }
  });
}

/* ---- skip intro ---- */
document.getElementById('cine-skip').addEventListener('click', () => {
  const cr = document.getElementById('cine-root');
  window.scrollTo({ top: cr.offsetTop + cr.offsetHeight, behavior: 'smooth' });
});
