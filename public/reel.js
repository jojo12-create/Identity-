/* Identity — cinematic reel behind the hero.
   The four sites Identity built float in a warm 3D space, each a glass screen playing its real
   navigation recording. A camera holds on one site while it plays, then flies to the next
   (pull back, glide, slight bank, push in); after the last, a fade cuts back to the first.
   Progressive: without WebGL the recordings cross-fade full-bleed in CSS; with reduced motion
   the camera rests on one site and nothing plays until asked. */
import * as THREE from './vendor/three/three.module.min.js';

const section = document.querySelector('.hero--reel');
const stage = section && section.querySelector('.reel-stage');

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch (e) { return false; }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function start() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const videos = [...stage.querySelectorAll('video')];
  const count = videos.length;
  if (!count) return;

  const controls = section.querySelector('.reel-controls');
  const nameEl = controls?.querySelector('.reel-name');
  const kindEl = controls?.querySelector('.reel-kind');
  const counterEl = controls?.querySelector('.reel-count');
  const pauseBtn = controls?.querySelector('.reel-pause');
  const fade = section.querySelector('.reel-fade');
  const RATE = 1.6; // the recordings run faster: more of each site in less time
  videos.forEach(v => { v.defaultPlaybackRate = RATE; v.playbackRate = RATE; });

  let index = 0, paused = false, visible = true;

  /* ---------- shared: labels, playback ---------- */
  function label() {
    const v = videos[index];
    if (nameEl) nameEl.textContent = v.dataset.name || '';
    if (kindEl) kindEl.textContent = v.dataset.kind || '';
    if (counterEl) counterEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(count).padStart(2, '0');
    videos.forEach((el, i) => el.classList.toggle('is-active', i === index));
  }
  function playActive() {
    videos.forEach((v, i) => {
      if (i === index && visible && !paused && !document.hidden && !reduce) {
        if (v.readyState === 0) { v.preload = 'auto'; v.load(); }
        v.playbackRate = RATE;
        const p = v.play(); if (p && p.catch) p.catch(() => {});
      } else if (!v.paused) v.pause();
    });
    const next = videos[(index + 1) % count];
    if (next && next.preload !== 'auto') { next.preload = 'auto'; next.load(); }
  }
  function setPaused(on) {
    paused = on;
    if (pauseBtn) {
      pauseBtn.textContent = on ? '▶' : 'Ⅱ';
      pauseBtn.setAttribute('aria-label', on ? 'Reprendre le défilement des sites' : 'Mettre en pause le défilement des sites');
      pauseBtn.setAttribute('aria-pressed', String(on));
    }
    playActive();
  }
  if (reduce && pauseBtn) pauseBtn.hidden = true;

  const webgl = hasWebGL();
  const api = webgl ? webglReel() : cssReel();
  if (!api) return;

  controls?.querySelector('.reel-prev')?.addEventListener('click', () => api.go(index - 1, true));
  controls?.querySelector('.reel-next')?.addEventListener('click', () => api.go(index + 1, true));
  pauseBtn?.addEventListener('click', () => setPaused(!paused));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => { visible = e[0].isIntersecting; playActive(); api.wake(); }, { threshold: 0 }).observe(section);
  }
  document.addEventListener('visibilitychange', () => { playActive(); api.wake(); });
  label();
  playActive();

  /* ---------- fallback: full-bleed cross-fade ---------- */
  function cssReel() {
    section.classList.add('reel-css');
    let timer = null;
    function schedule() {
      clearTimeout(timer);
      if (reduce) return;
      timer = setTimeout(() => { if (!paused && visible && !document.hidden) go(index + 1); else schedule(); }, 8000);
    }
    function go(i) {
      index = (i + count) % count;
      label(); playActive(); schedule();
    }
    schedule();
    return { go, wake() {} };
  }

  /* ---------- WebGL reel ---------- */
  function webglReel() {
    const canvas = document.createElement('canvas');
    canvas.className = 'reel-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { canvas.remove(); return cssReel(); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const BG = new THREE.Color(0xeee5d9);
    const scene = new THREE.Scene();
    scene.background = BG;
    scene.fog = new THREE.Fog(BG, 7, 24);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

    // rounded-corner mask and soft drop shadow, drawn once
    function canvasTex(draw, w, h) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
    }
    const roundRect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
    const maskTex = canvasTex((g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; roundRect(g, 0, 0, w, h, 26); }, 1024, 624);
    const shadowTex = canvasTex((g, w, h) => {
      g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
      g.filter = 'blur(38px)'; g.fillStyle = 'rgba(70,42,20,.55)'; roundRect(g, 110, 120, w - 220, h - 200, 40);
    }, 1024, 760);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    const PW = 3.2, PH = PW / (900 / 548);
    const layout = [
      { p: [0, 0, 0], r: 0.22 },
      { p: [3.9, 0.4, -1.5], r: -0.26 },
      { p: [7.7, -0.2, -0.3], r: 0.22 },
      { p: [11.6, 0.34, -1.7], r: -0.22 },
    ];
    const loader = new THREE.TextureLoader();
    const planes = videos.map((v, i) => {
      const L = layout[i % layout.length];
      const g = new THREE.Group();
      g.position.set(L.p[0] + Math.floor(i / layout.length) * 15.5, L.p[1], L.p[2]);
      g.rotation.y = L.r;
      scene.add(g);
      const poster = v.poster ? loader.load(v.poster) : null;
      if (poster) poster.colorSpace = THREE.SRGBColorSpace;
      const vt = new THREE.VideoTexture(v);
      vt.colorSpace = THREE.SRGBColorSpace; vt.minFilter = THREE.LinearFilter; vt.generateMipmaps = false;
      const mat = new THREE.MeshBasicMaterial({ map: poster || vt, alphaMap: maskTex, transparent: true, toneMapped: false });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat);
      g.add(screen);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.3, PH * 1.45),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
      shadow.position.set(0.05, -0.16, -0.12);
      g.add(shadow);
      // thin glass rim
      const rim = new THREE.Mesh(new THREE.PlaneGeometry(PW + 0.05, PH + 0.05),
        new THREE.MeshBasicMaterial({ color: 0xffffff, alphaMap: maskTex, transparent: true, opacity: 0.55, depthWrite: false }));
      rim.position.z = -0.01;
      g.add(rim);
      return { g, mat, poster, vt, video: v, level: i === 0 ? 1 : 0.7 };
    });

    /* camera poses */
    const tmp = new THREE.Vector3();
    let dist = 4, shift = 0;
    function poseFor(i, push = 0) {
      const P = planes[i];
      const n = new THREE.Vector3(Math.sin(P.g.rotation.y - 0.14), 0, Math.cos(P.g.rotation.y - 0.14));
      const look = P.g.position.clone();
      const pos = look.clone().addScaledVector(n, dist * (1 - push));
      pos.y += 0.18;
      return { pos, look };
    }

    /* each stay on a site is cut into shots: wide, close on a detail with a pan, a second detail, pull out */
    const HOLD = 5.8;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function makeShots() {
      const r1 = [rnd(-0.2, 0.3), rnd(0.2, 0.5)];      // upper half: the headline, the menu
      const r2 = [rnd(0.05, 0.5), rnd(-0.5, -0.1)];      // lower half: the buttons, the cards
      return [
        { at: 0, o: [0, 0], z: 1 },
        { at: 1.0, o: [0.02, 0], z: 1.03 },
        { at: 1.65, o: r1, z: rnd(1.6, 1.85) },
        { at: 3.0, o: [r1[0] + rnd(0.1, 0.2), r1[1] - 0.05], z: rnd(1.75, 2.0) },
        { at: 3.6, o: r2, z: rnd(1.5, 1.7) },
        { at: 5.0, o: [r2[0] - rnd(0.06, 0.12), r2[1] + 0.04], z: rnd(1.6, 1.8) },
        { at: HOLD, o: [0, 0], z: 1.064 },
      ];
    }
    let shots = makeShots();
    const v3 = new THREE.Vector3();
    function shotPose(i, t) {
      let k = 0;
      while (k < shots.length - 2 && t >= shots[k + 1].at) k++;
      const A = shots[k], B = shots[k + 1];
      const e = ease(clamp((t - A.at) / (B.at - A.at), 0, 1));
      const ox = lerp(A.o[0], B.o[0], e), oy = lerp(A.o[1], B.o[1], e);
      const z = Math.exp(lerp(Math.log(A.z), Math.log(B.z), e));
      const P = planes[i];
      const ang = P.g.rotation.y - 0.14 / z;            // closer shots face the screen more squarely
      const n = v3.set(Math.sin(ang), 0, Math.cos(ang));
      const look = P.g.localToWorld(new THREE.Vector3(ox * PW / 2, oy * PH / 2, 0));
      const pos = look.clone().addScaledVector(n, dist / z);
      pos.y += 0.18 / z;
      return { pos, look };
    }

    function layoutCam() {
      const w = section.clientWidth, h = stage.clientHeight || section.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const wide = w > 760;
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const share = wide ? 0.45 : 0.8;                         // share of the width the held site fills
      dist = Math.max(PW / (share * 2 * Math.tan(hfov / 2)), PH / (0.72 * 2 * Math.tan(vfov / 2)));
      shift = wide ? w * 0.25 : 0;                             // centre of interest right of the words
      camera.setViewOffset(w + 2 * shift, h, 0, 0, w, h);
      camera.updateProjectionMatrix();
      draw();
    }
    new ResizeObserver(layoutCam).observe(section);

    /* timeline */
    let mode = 'hold', from = 0, to = 0, t0 = performance.now(), holdFor = 8.5, last = performance.now();
    let pauseAt = 0;
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    if (!coarse && !reduce) {
      section.addEventListener('pointermove', e => {
        const r = section.getBoundingClientRect();
        pointer.x = (e.clientX - r.left) / r.width - 0.5;
        pointer.y = (e.clientY - r.top) / r.height - 0.5;
      }, { passive: true });
    }
    const holdTime = i => {
      const d = planes[i].video.duration;
      return reduce ? 8.5 : HOLD;
    };

    function go(i, manual) {
      const target = (i + count) % count;
      if (mode !== 'hold' || target === index) return;
      const wrap = (manual && Math.abs(target - index) !== 1) || (!manual && target === 0 && index === count - 1);
      if (reduce || wrap) return cut(target);
      from = index; to = target; mode = 'travel'; t0 = performance.now();
      index = target; label(); playActive();
      if (manual && paused) setPaused(false);
    }
    function cut(target) {
      mode = 'cut'; t0 = performance.now();
      if (fade) fade.classList.add('is-on');
      setTimeout(() => {
        index = target; from = to = target; label(); playActive();
        mode = 'hold'; t0 = performance.now(); holdFor = holdTime(index); shots = makeShots();
        if (fade) fade.classList.remove('is-on');
        draw();
      }, reduce ? 0 : 520);
    }

    const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (paused) { t0 += dt * 1000; }
      const t = (now - t0) / 1000;
      pointer.sx = lerp(pointer.sx, pointer.x, 0.04); pointer.sy = lerp(pointer.sy, pointer.y, 0.04);

      if (mode === 'travel') {
        const dur = 1.9, u = clamp(t / dur, 0, 1), e = ease(u);
        const A = poseFor(from, 0.06), B = poseFor(to, 0);
        cam.pos.lerpVectors(A.pos, B.pos, e);
        cam.look.lerpVectors(A.look, B.look, ease(clamp(u * 1.08 - 0.04, 0, 1)));
        const arc = Math.sin(Math.PI * e);
        cam.pos.z += arc * dist * 0.42; cam.pos.y += arc * 0.35;
        camera.position.copy(cam.pos); camera.lookAt(cam.look);
        camera.rotateZ(Math.sin(Math.PI * e) * (to > from ? -0.06 : 0.06));
        planes.forEach((P, i) => { P.level = lerp(P.level, i === to ? 1 : 0.68, 0.06); });
        if (u >= 1) { mode = 'hold'; t0 = now; holdFor = holdTime(index); shots = makeShots(); }
      } else {
        const P = reduce ? poseFor(index, 0) : shotPose(index, Math.min(t, HOLD));
        camera.position.copy(P.pos);
        camera.position.x += pointer.sx * 0.35; camera.position.y -= pointer.sy * 0.2;
        camera.lookAt(P.look);
        planes.forEach((Q, i) => { Q.level = lerp(Q.level, i === index ? 1 : 0.68, 0.06); });
        if (mode === 'hold' && !reduce && !paused && t > holdFor) go(index + 1, false);
      }

      planes.forEach(P => {
        const v = P.video, live = v.readyState >= 2 && !v.paused;
        const map = live ? P.vt : (P.poster || P.vt);
        if (P.mat.map !== map) { P.mat.map = map; P.mat.needsUpdate = true; }
        P.mat.color.setScalar(P.level);
      });
      renderer.render(scene, camera);
      if (!section.classList.contains('reel-ready')) section.classList.add('reel-ready');
    }
    function draw() { frame(performance.now()); }

    let running = false;
    function wake() {
      const want = visible && !document.hidden && !reduce;
      if (want !== running) { running = want; renderer.setAnimationLoop(want ? frame : null); }
      if (!want) draw();
    }
    if (reduce) {
      planes.forEach(P => P.poster && (P.poster.onUpdate = draw));
      setInterval(() => visible && draw(), 700);
    }
    layoutCam();
    holdFor = holdTime(0);
    wake();
    return { go, wake };
  }
}

if (section && stage) start();
