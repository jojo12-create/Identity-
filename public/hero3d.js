/* Identity — hero 3D.
   A real-time laptop that opens on load and plays the real project recordings on its screen,
   next to the "I." brand sculpture. Progressive: the CSS laptop stays until the scene is ready,
   and stays for good when WebGL is missing. The DOM carousel (site.js) keeps driving playback;
   this scene only reads which video is active and draws it. */
import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';

const host = document.querySelector('.hero-right');
const carousel = host && host.querySelector('.laptop-carousel');

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context'); // release the probe at once
    if (lose) lose.loseContext();
    return true;
  } catch (e) { return false; }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function bounce(t) { // ease-out bounce, 0..1
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
  return n * (t -= 2.625 / d) * t + .984375;
}
const phase = (t, start, dur) => clamp((t - start) / dur, 0, 1);

if (host && carousel && hasWebGL()) start();

function start() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  /* ---------- renderer ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'hero3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);

  /* ---------- light ---------- */
  const key = new THREE.DirectionalLight(0xfff4e6, 2.1);
  key.position.set(-2.5, 9, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 1; key.shadow.camera.far = 25;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0xb89a80, 0.55));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: 0x5a3b24, opacity: 0.26 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- materials ---------- */
  const aluminium = new THREE.MeshPhysicalMaterial({
    color: 0xc4c7cc, metalness: 1, roughness: 0.34, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 1.1
  });
  const aluminiumDark = new THREE.MeshPhysicalMaterial({ color: 0x8d9197, metalness: 1, roughness: 0.42 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.55, metalness: 0.1 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.4 });
  const padMat = new THREE.MeshPhysicalMaterial({ color: 0xb4b8be, metalness: 0.9, roughness: 0.22, clearcoat: 0.6 });
  const bezelMat = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.2, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 0.06, metalness: 0, envMapIntensity: 2.2,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const inkMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.16, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
  const redMat = new THREE.MeshPhysicalMaterial({
    color: 0xe11924, roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.3, sheenColor: new THREE.Color(0xff8a8f)
  });

  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  /* ---------- laptop ---------- */
  const W = 3.3, D = 2.25, H = 0.11, LID_H = 2.12, LID_T = 0.06;
  const SCREEN_W = 2.95, SCREEN_H = SCREEN_W / 1.64;
  const laptop = new THREE.Group();
  scene.add(laptop);

  const base = shadowed(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, 0.05), aluminium));
  base.position.y = H / 2;
  laptop.add(base);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.004, 1.08), deckMat);
  deck.position.set(0, H + 0.001, -0.42);
  deck.receiveShadow = true;
  laptop.add(deck);

  const cols = 14, rows = 5, kw = 0.172, kd = 0.165, gap = 0.032;
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(kw, 0.03, kd, 2, 0.012), keyMat, cols * rows);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * (kw + gap * 0.6);
      const z = -0.86 + r * (kd + gap);
      m4.makeTranslation(x, H + 0.012, z);
      keys.setMatrixAt(k++, m4);
    }
  }
  keys.castShadow = true; keys.receiveShadow = true;
  laptop.add(keys);

  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.008, 0.7, 2, 0.003), padMat);
  pad.position.set(0, H + 0.001, 0.62);
  pad.receiveShadow = true;
  laptop.add(pad);

  const hinge = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, W * 0.86, 24), aluminiumDark));
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, H, -D / 2 + 0.05);
  laptop.add(hinge);

  const lid = new THREE.Group();
  lid.position.set(0, H + 0.01, -D / 2 + 0.05);
  laptop.add(lid);

  const shell = shadowed(new THREE.Mesh(new RoundedBoxGeometry(W, LID_H, LID_T, 4, 0.028), aluminium));
  shell.position.set(0, LID_H / 2, 0);
  lid.add(shell);

  const bezel = new THREE.Mesh(new RoundedBoxGeometry(W - 0.06, LID_H - 0.06, 0.006, 2, 0.003), bezelMat);
  bezel.position.set(0, LID_H / 2, LID_T / 2 + 0.002);
  lid.add(bezel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.set(0, LID_H / 2 + 0.01, LID_T / 2 + 0.0062);
  lid.add(screen);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.08, LID_H - 0.08), glassMat);
  glass.position.set(0, LID_H / 2, LID_T / 2 + 0.008);
  lid.add(glass);

  // brand mark on the back of the lid: a small red dot, as on the logo
  const backDot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 40), redMat);
  backDot.position.set(0.12, LID_H / 2, -LID_T / 2 - 0.002);
  backDot.rotation.y = Math.PI;
  lid.add(backDot);
  const backI = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.34), inkMat);
  backI.position.set(-0.04, LID_H / 2 + 0.12, -LID_T / 2 - 0.002);
  backI.rotation.y = Math.PI;
  lid.add(backI);

  /* ---------- "I." sculpture ---------- */
  const mark = new THREE.Group();
  scene.add(mark);
  const BAR_W = 0.5, BAR_H = 2.5;
  const bar = shadowed(new THREE.Mesh(new RoundedBoxGeometry(BAR_W, BAR_H, BAR_W, 5, 0.07), inkMat));
  bar.position.y = BAR_H / 2;
  mark.add(bar);
  const R = 0.27;
  const ball = shadowed(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), redMat));
  mark.add(ball);
  const BALL_X = BAR_W / 2 + R + 0.07;

  /* ---------- video and poster textures ---------- */
  const slides = [...carousel.querySelectorAll('.laptop-slide')];
  const videos = slides.map(s => s.querySelector('video'));
  const loader = new THREE.TextureLoader();
  const posterTex = videos.map(v => {
    if (!v || !v.poster) return null;
    const t = loader.load(v.poster);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  });
  const videoTex = videos.map(v => {
    if (!v) return null;
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  });
  const activeIndex = () => Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));

  /* ---------- controls: move the pill out of the hidden CSS laptop, name the project ---------- */
  const controls = carousel.querySelector('.laptop-carousel-controls');
  let nowLabel = null;
  if (controls) {
    nowLabel = document.createElement('span');
    nowLabel.className = 'laptop-now';
    controls.insertBefore(nowLabel, controls.querySelector('.laptop-progress'));
  }
  const projectName = i => slides[i]?.querySelector('.laptop-project-label span')?.textContent?.trim() || '';

  /* ---------- layout ---------- */
  let wide = true;
  const camDir = new THREE.Vector3(-0.2, 0.46, 1).normalize();
  const target = new THREE.Vector3();
  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w / h > 1.25;
    // laptop slightly left of centre, sculpture behind on the right
    laptop.position.set(wide ? 0.05 : 0, 0, wide ? 0.3 : 0.4);
    mark.position.set(wide ? 1.95 : 1.85, 0, -1.7);
    target.set(wide ? 0.5 : 0.62, 0.82, -0.25);
    const needW = wide ? 5.1 : 5.9;          // world width the frame must hold
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const dist = Math.max((needW / 2) / Math.tan(hfov / 2), (3.6 / 2) / Math.tan(vfov / 2)) * 1.08;
    camera.position.copy(target).addScaledVector(camDir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    if (reduce) render();
  }
  new ResizeObserver(layout).observe(host);

  /* ---------- pointer ---------- */
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!reduce && !coarse) {
    window.addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect();
      pointer.x = clamp(((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)), -1, 1);
      pointer.y = clamp(((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)), -1, 1);
    }, { passive: true });
  }

  /* ---------- timeline ---------- */
  const LID_CLOSED = Math.PI / 2 - 0.035, LID_OPEN = -0.3;
  let t0 = -1, last = -1, shown = activeIndex(), flash = 1, flashFrom = -10;
  let visible = true, running = false, readyMarked = false;

  function pose(t, time) {
    // intro (seconds since start)
    const rise = easeOutCubic(phase(t, 0, 1.5));
    const open = easeInOutCubic(phase(t, 0.45, 1.6));
    const power = easeOutCubic(phase(t, 1.55, 0.7));
    const drop = phase(t, 1.2, 1.15);
    const barIn = easeOutBack(phase(t, 0.15, 1.1));

    const idle = reduce ? 0 : 1;
    pointer.sx = lerp(pointer.sx, pointer.x, 0.05);
    pointer.sy = lerp(pointer.sy, pointer.y, 0.05);
    const sway = coarse && !reduce ? Math.sin(time * 0.45) * 0.08 : 0;

    laptop.rotation.y = lerp(-0.95, 0.1, rise) + idle * (pointer.sx * 0.22 + sway + Math.sin(time * 0.35) * 0.025);
    laptop.rotation.x = idle * pointer.sy * 0.05;
    laptop.position.y = lerp(-0.9, 0, rise);
    lid.rotation.x = lerp(LID_CLOSED, LID_OPEN, open) + idle * Math.sin(time * 0.6) * 0.006;

    // screen: powers on, dips briefly when the project changes
    const sinceFlash = time - flashFrom;
    const dip = sinceFlash < 0.55 ? 1 - Math.sin(Math.PI * clamp(sinceFlash / 0.55, 0, 1)) * 0.85 : 1;
    const level = power * dip;
    screenMat.color.setRGB(level, level, level);

    // sculpture rises, ball drops in and bounces, then breathes
    bar.scale.y = Math.max(0.001, barIn);
    bar.position.y = (BAR_H * bar.scale.y) / 2;
    mark.rotation.y = -0.35 + idle * pointer.sx * 0.12;
    const fall = 1 - bounce(drop);
    const hop = idle * Math.max(0, Math.sin(time * 1.6)) * 0.06 * phase(t, 2.6, 1);
    ball.position.set(BALL_X + idle * pointer.sx * 0.12, R + fall * 4.2 + hop, 0.05);
    // squash on contact
    const contact = drop > 0 && drop < 1 && fall < 0.02 ? 1 : 0;
    const sq = 1 - contact * 0.12;
    ball.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    ball.rotation.z = -(ball.position.x - BALL_X) / R;
  }

  function pickScreen(time) {
    const i = activeIndex();
    if (i !== shown) { shown = i; flashFrom = time; }
    const v = videos[i];
    const tex = v && v.readyState >= 2 && !v.paused ? videoTex[i] : (posterTex[i] || videoTex[i]);
    if (screenMat.map !== tex) { screenMat.map = tex; screenMat.needsUpdate = true; }
    if (nowLabel) {
      const name = projectName(i);
      if (nowLabel.textContent !== name) nowLabel.textContent = name;
    }
  }

  function render() {
    renderer.render(scene, camera);
  }

  function frame(now) {
    const time = now / 1000;
    if (t0 < 0) t0 = time;
    const t = reduce ? 99 : time - t0;
    pickScreen(time);
    pose(t, time);
    render();
    if (!readyMarked) {
      readyMarked = true;
      host.classList.add('is-3d-ready');
      if (controls) host.appendChild(controls);
    }
    last = time;
  }

  function loop(on) {
    if (on === running) return;
    running = on;
    renderer.setAnimationLoop(on ? frame : null);
  }

  // reduced motion: draw the final pose, refresh slowly for the poster or a manual change
  function update() {
    const want = visible && !document.hidden;
    if (reduce) {
      loop(false);
      if (want) frame(performance.now());
      return;
    }
    loop(want);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(host);
  }
  document.addEventListener('visibilitychange', update);
  if (reduce) {
    setInterval(() => { if (visible && !document.hidden) frame(performance.now()); }, 600);
    posterTex.forEach(t => t && (t.onUpdate = () => frame(performance.now())));
  }

  layout();
  update();
}
