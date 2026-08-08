/* ============================================================
   BURGER HOUSE — cinematic.js
   Scene 0: frosted-glass loading + shatter reveal
   Scenes 1–4: single scroll-driven camera flight through the burger
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = 'assets/models/burger.glb';
const isMobile = window.matchMedia('(max-width: 760px)').matches;

/* ============================================================
   SCENE 0 — frosted block loading + progress
   ============================================================ */
const gate = document.getElementById('entry-gate');
const ring = document.getElementById('frost-ring');
const pct = document.getElementById('frost-pct');
const enterHint = document.getElementById('enter-hint');
const RING_CIRC = 2 * Math.PI * 54;
ring.style.strokeDasharray = `${RING_CIRC}`;
ring.style.strokeDashoffset = `${RING_CIRC}`;

let progress = 0;
let modelLoaded = false;
let entered = false;

function setProgress(p){
  progress = Math.min(100, p);
  ring.style.strokeDashoffset = `${RING_CIRC * (1 - progress / 100)}`;
  pct.textContent = Math.round(progress) + '%';
  if (progress >= 100) {
    gate.classList.add('ready');
    enterHint.classList.add('show');
  }
}

// Fake-smooth progress while the real model streams in, so the bar never stalls
let fakeP = 0;
const fakeTimer = setInterval(() => {
  if (modelLoaded) { clearInterval(fakeTimer); return; }
  fakeP = Math.min(92, fakeP + Math.random() * 9);
  setProgress(fakeP);
}, 260);

/* ============================================================
   LOAD MODEL (shared instance used by the whole cinematic scene)
   ============================================================ */
let cachedGltf = null;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelPromise = new Promise((resolve, reject) => {
  loader.load(MODEL_URL, (gltf) => {
    cachedGltf = gltf; modelLoaded = true; setProgress(100); resolve(gltf);
  }, (xhr) => {
    if (xhr.lengthComputable) setProgress((xhr.loaded / xhr.total) * 100);
  }, reject);
});

/* ============================================================
   SHATTER TRANSITION
   ============================================================ */
function buildShards(){
  const layer = document.getElementById('shatter-layer');
  const cols = 8, rows = 6;
  let html = '';
  for (let r = 0; r < rows; r++){
    for (let c = 0; c < cols; c++){
      const w = 100/cols, h = 100/rows;
      html += `<div class="shard" style="left:${c*w}%;top:${r*h}%;width:${w}%;height:${h}%;"></div>`;
    }
  }
  layer.innerHTML = html;
  return Array.from(layer.querySelectorAll('.shard'));
}
const shards = buildShards();

function playShatterAndEnter(){
  if (entered || !gate.classList.contains('ready')) return;
  entered = true;

  const tl = gsap.timeline({
    onComplete(){
      gate.style.display = 'none';
      document.body.classList.remove('gate-lock');
      startCinematic();
    }
  });
  tl.to('#frost-block', { scale: 1.08, duration: 0.18, ease: 'power1.in' })
    .to('#frost-block', { opacity: 0, duration: 0.12 }, '>-0.02')
    .set('#shatter-layer', { display: 'block' }, '<')
    .to(shards, {
      x: () => gsap.utils.random(-window.innerWidth*0.7, window.innerWidth*0.7),
      y: () => gsap.utils.random(-window.innerHeight*0.7, window.innerHeight*0.7),
      z: () => gsap.utils.random(-400, 200),
      rotateX: () => gsap.utils.random(-180, 180),
      rotateY: () => gsap.utils.random(-180, 180),
      opacity: 0,
      duration: 0.9,
      ease: 'power2.in',
      stagger: { each: 0.006, from: 'center' }
    }, '<')
    .to('#entry-gate', { autoAlpha: 0, duration: 0.4 }, '-=0.3');
}

document.getElementById('enter-hint').addEventListener('click', playShatterAndEnter);
window.addEventListener('wheel', playShatterAndEnter, { once: true, passive: true });
window.addEventListener('touchmove', playShatterAndEnter, { once: true, passive: true });
window.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'ArrowDown') playShatterAndEnter(); }, { once: true });

/* ============================================================
   CINEMATIC 3D SCENE (scenes 1–4)
   ============================================================ */
const canvas = document.getElementById('cine-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1d1611, 1.2, 4.2);
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 20);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0xfff2d8, 0x140d08, 0.9));
const spotA = new THREE.SpotLight(0xffb45c, 8, 6, Math.PI/5, 0.5, 1.4);
spotA.position.set(1.4, 1.6, 1.1);
scene.add(spotA);
const spotB = new THREE.SpotLight(0xff7a3d, 5, 6, Math.PI/5, 0.6, 1.6);
spotB.position.set(-1.3, 0.4, -1.1);
scene.add(spotB);
const rim = new THREE.DirectionalLight(0xffe6bf, 1.1);
rim.position.set(-0.6, 1.2, -1.4);
scene.add(rim);

let mixer = null, action = null, clipDuration = 1, root = null;

function resizeCine(){
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resizeCine).observe(canvas.parentElement);

/* ---- keyframes for the whole camera flight, p = 0..1 across scenes 1–4 ----
   Positions are defined RELATIVE to the model's own measured bounding radius
   (computed at load time below), not fixed numbers — this guarantees the
   camera can never end up inside the geometry no matter the model's real scale.
   dist = distance from center, in multiples of the model radius (kept >= 1.15
   so the camera always stays outside the bounding sphere).
   dir  = direction the camera sits in, from center (auto-normalized).
   look = look-at point, in multiples of the model radius. ---- */
const MOBILE_PULLBACK = isMobile ? 1.25 : 1.0;
const KF = [
  { p: 0.00, dist: 2.4, dir: [0.10, 0.32, 0.95], look: [0, 0.18, 0], fog: 0x241708, burger: 1.00 },
  { p: 0.16, dist: 2.0, dir: [0.08, 0.40, 0.92], look: [0, 0.24, 0], fog: 0x241708, burger: 0.86 },
  { p: 0.34, dist: 1.7, dir: [0.02, 0.48, 0.88], look: [0, 0.30, 0], fog: 0x2a1c0a, burger: 0.66 },
  { p: 0.50, dist: 1.5, dir: [-0.04,0.52, 0.85], look: [0, 0.32, 0], fog: 0x2a1c0a, burger: 0.48 },
  { p: 0.65, dist: 1.35,dir: [-0.08,0.50, 0.86], look: [0, 0.28, 0], fog: 0x241708, burger: 0.30 },
  { p: 0.78, dist: 1.6, dir: [-0.18,0.18, 0.97], look: [0, 0.10, 0], fog: 0x1a1108, burger: 0.12 },
  { p: 0.90, dist: 4.2, dir: [-0.45,0.55, 0.71], look: [0, 0.15, 0], fog: 0x171109, burger: 0.02 },
  { p: 1.00, dist: 5.2, dir: [0.00, 0.32, 0.95], look: [0, 0.17, 0], fog: 0x0d0a08, burger: 0.00 },
];

let modelRadius = 0.3; // overwritten with the real measured value once the model loads
const _pos = new THREE.Vector3(), _look = new THREE.Vector3(), _fogA = new THREE.Color(), _fogB = new THREE.Color();
const _dirA = new THREE.Vector3(), _dirB = new THREE.Vector3(), _dir = new THREE.Vector3();

function updateScene(p){
  let a = KF[0], b = KF[KF.length - 1];
  for (let i = 0; i < KF.length - 1; i++){
    if (p >= KF[i].p && p <= KF[i+1].p){ a = KF[i]; b = KF[i+1]; break; }
  }
  const span = (b.p - a.p) || 1;
  const t = Math.max(0, Math.min(1, (p - a.p) / span));
  const te = gsap.parseEase('power1.inOut')(t);

  _dirA.set(a.dir[0], a.dir[1], a.dir[2]).normalize();
  _dirB.set(b.dir[0], b.dir[1], b.dir[2]).normalize();
  _dir.copy(_dirA).lerp(_dirB, te).normalize();
  const dist = THREE.MathUtils.lerp(a.dist, b.dist, te) * modelRadius * MOBILE_PULLBACK;
  _pos.copy(_dir).multiplyScalar(dist);

  _look.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], te),
    THREE.MathUtils.lerp(a.look[1], b.look[1], te),
    THREE.MathUtils.lerp(a.look[2], b.look[2], te)
  ).multiplyScalar(modelRadius);

  camera.position.copy(_pos);
  camera.lookAt(_look);

  _fogA.set(a.fog); _fogB.set(b.fog);
  scene.fog.color.copy(_fogA).lerp(_fogB, te);
  // fog stays a comfortable band beyond wherever the camera currently is
  scene.fog.near = dist * 0.35;
  scene.fog.far = dist * 2.2;

  const burgerP = THREE.MathUtils.lerp(a.burger, b.burger, te);
  if (action) { action.paused = true; action.time = burgerP * clipDuration; mixer.update(0); }

  updateOverlays(p);
}

/* ---- HTML overlay reveal ranges, tied to the same p ---- */
const OVERLAYS = [
  ['.s1-left',      0.00, 0.16],
  ['.s1-right',     0.03, 0.16],
  ['.cine-finale',  0.90, 1.00],
];
function updateOverlays(p){
  OVERLAYS.forEach(([sel, s, e]) => {
    document.querySelectorAll(sel).forEach(el => el.classList.toggle('visible', p >= s && p <= e));
  });
}

let cineStarted = false;
function startCinematic(){
  if (cineStarted) return;
  cineStarted = true;
  document.getElementById('cine-root').classList.add('active');
  document.getElementById('site-nav').classList.add('nav-in');
  resizeCine();

  root = cachedGltf.scene.clone(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  scene.add(root);

  // measure the model for real, rather than guessing — this is what makes
  // every camera keyframe above scale correctly no matter the model's units
  const size = box.getSize(new THREE.Vector3());
  modelRadius = Math.max(0.001, size.length() / 2);
  camera.near = modelRadius * 0.05;
  camera.far = modelRadius * 60;
  camera.updateProjectionMatrix();

  mixer = new THREE.AnimationMixer(root);
  const clip = THREE.AnimationClip.findByName(cachedGltf.animations, 'open') || cachedGltf.animations[0];
  if (clip) {
    clipDuration = clip.duration;
    action = mixer.clipAction(clip);
    action.play(); action.paused = true; action.time = 0;
  }

  ScrollTrigger.create({
    trigger: '#cine-root',
    start: 'top top',
    end: 'bottom bottom',
    pin: '#cine-pin',
    scrub: 0.6,
    onUpdate(self){ updateScene(self.progress); }
  });

  updateScene(0);
  renderLoop();
}

function renderLoop(){
  requestAnimationFrame(renderLoop);
  renderer.render(scene, camera);
}

/* ---- skip intro ---- */
document.getElementById('cine-skip').addEventListener('click', () => {
  const cr = document.getElementById('cine-root');
  window.scrollTo({ top: cr.offsetTop + cr.offsetHeight, behavior: 'smooth' });
});

export { modelPromise };
