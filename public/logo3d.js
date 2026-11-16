/* Identity — the logo performs.
   At rest: "I." with the glossy red sphere as its dot.
   Open: the sphere winds up, then bounds along the word; each letter springs out of the baseline
   behind it (stretch, overshoot, settle). On the "i" it leaps high and lands as the i's own dot,
   squashing the letter; then it drops to its place as the full stop, bounces twice, and the impact
   sends an elastic shock back through the word.
   Close: the sphere rolls back to the left and flattens each letter it passes, then settles beside
   the "I", which gives a little bump.
   Plays on load, every 14 s while the tab is visible, and on hover or focus. The footer logo stays
   open and answers the pointer with a hop and a shock. Reduced motion: nothing moves.
   Also gives every big heading its relief, matching the lacquered sphere. */
(() => {
  const WORD = 'Identity';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const roomy = matchMedia('(min-width: 381px)');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const SPRING = 'cubic-bezier(.2,1.4,.35,1)';

  /* ---------- headings in relief ---------- */
  document.querySelectorAll('h1, h2, .page-end p').forEach(h => {
    const c = getComputedStyle(h).color.match(/\d+(\.\d+)?/g);
    if (!c) return;
    const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    h.classList.add('relief', lum > 0.6 ? 'relief--light' : 'relief--dark');
    // every full stop in a big heading becomes the sphere, not only the last one
    if (h.matches('h1, h2')) {
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('.identity-final-dot')) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const parts = node.nodeValue.split(/(\.)(?=\s|$)/);
        if (parts.length < 2) return;
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (part === '.') {
            const dot = document.createElement('span');
            dot.className = 'identity-final-dot';
            dot.textContent = '.';
            frag.appendChild(dot);
          } else if (part) frag.appendChild(document.createTextNode(part));
        });
        node.replaceWith(frag);
      });
    }
  });

  function build(logo) {
    logo.classList.add('logo3d');
    logo.classList.remove('animation2');
    logo.setAttribute('aria-label', 'Identity, accueil');
    logo.innerHTML = '<span class="l3d" aria-hidden="true">' +
      [...WORD].map((c, i) => `<span class="l3d-ch" data-i="${i}">${c}</span>`).join('') +
      '<span class="l3d-ball"></span></span>';
    return {
      logo,
      letters: [...logo.querySelectorAll('.l3d-ch')],
      ball: logo.querySelector('.l3d-ball'),
      open: false,
      busy: false,
      x: [],
      em: 16,
    };
  }

  // the sphere stays in flow after the "y"; we move it with transforms measured from the letters
  function measure(L) {
    const fs = parseFloat(getComputedStyle(L.logo).fontSize) || 16;
    L.em = fs;
    const home = L.ball.offsetLeft;
    const gap = fs * 0.045;
    L.x = L.letters.map(el => el.offsetLeft + el.offsetWidth + gap - home); // ball x after letter k
    const iEl = L.letters[5];
    L.iCenter = iEl.offsetLeft + iEl.offsetWidth / 2 - L.ball.offsetWidth / 2 - home;
  }

  const settle = a => a.finished.then(() => { try { a.commitStyles(); } catch (e) {} a.cancel(); }).catch(() => {});

  function restClosed(L) {
    L.letters.slice(1).forEach(el => { el.style.transform = 'scaleY(0)'; el.style.opacity = '0'; });
    L.ball.style.transform = `translate(${L.x[0]}px,0)`;
    L.open = false;
  }
  function restOpen(L) {
    L.letters.forEach(el => { el.style.transform = 'none'; el.style.opacity = '1'; });
    L.ball.style.transform = 'translate(0,0)';
    L.open = true;
  }

  /* ---------- open ---------- */
  async function open(L) {
    if (L.busy || L.open) return;
    L.busy = true;
    const em = L.em, X = L.x;
    const t = [];          // ball keyframes
    const STEP = 105;      // ms per letter
    const push = (ms, x, y, sx = 1, sy = 1) => t.push({ ms, transform: `translate(${x}px,${y}px) scale(${sx},${sy})` });

    // wind-up
    push(0, X[0], 0);
    push(110, X[0] - em * 0.03, 0, 1.28, 0.72);
    let ms = 110;
    // bound along d, e, n, t (small hops)
    for (let k = 1; k <= 4; k++) {
      push(ms + STEP * 0.5, (X[k - 1] + X[k]) / 2, -em * 0.2, 0.92, 1.1);
      ms += STEP;
      push(ms, X[k], 0, 1.12, 0.88);
    }
    // the leap onto the i: the sphere becomes its dot
    const iTop = -em * 0.565;
    push(ms + 150, (X[4] + L.iCenter) / 2, -em * 0.95, 0.9, 1.12);
    ms += 300;
    push(ms, L.iCenter, iTop, 1.25, 0.76);
    const iLand = ms;
    push(ms + 90, L.iCenter, iTop, 1, 1);
    // off the i, over t and y, down to its place
    push(ms + 260, (L.iCenter + 0) / 2 + em * 0.1, -em * 0.85, 0.92, 1.1);
    ms += 430;
    push(ms, 0, 0, 1.3, 0.72);
    const finalLand = ms;
    push(ms + 150, 0, -em * 0.34, 0.94, 1.08);
    ms += 300;
    push(ms, 0, 0, 1.14, 0.86);
    push(ms + 110, 0, -em * 0.09, 0.98, 1.02);
    ms += 220;
    push(ms, 0, 0, 1.05, 0.95);
    ms += 120;
    push(ms, 0, 0, 1, 1);

    const total = ms;
    const ballAnim = L.ball.animate(t.map(f => ({ transform: f.transform, offset: f.ms / total })),
      { duration: total, easing: 'linear', fill: 'forwards' });

    // letters spring out behind the sphere
    const popAt = k => (k <= 4 ? 110 + STEP * (k - 0.6) : k === 5 ? iLand - 220 : finalLand - (k === 6 ? 260 : 170));
    L.letters.slice(1).forEach((el, j) => {
      const k = j + 1;
      const tilt = (k % 2 ? 1 : -1) * (6 + (k * 7) % 6);
      settle(el.animate([
        { transform: `translateY(.12em) scaleY(0) scaleX(1.25) rotate(${tilt}deg)`, opacity: 0 },
        { transform: `translateY(-.1em) scaleY(1.32) scaleX(.84) rotate(${-tilt * 0.4}deg)`, opacity: 1, offset: 0.42 },
        { transform: 'translateY(0) scaleY(.88) scaleX(1.08) rotate(0deg)', offset: 0.7 },
        { transform: 'none', opacity: 1 },
      ], { duration: 560, delay: popAt(k), easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' }));
    });
    // the i takes the hit
    setTimeout(() => {
      L.letters[5].animate([
        { transform: 'none' },
        { transform: 'scaleY(.74) scaleX(1.2)', offset: 0.3 },
        { transform: 'scaleY(1.12) scaleX(.94)', offset: 0.65 },
        { transform: 'none' },
      ], { duration: 420, easing: 'ease-out' });
    }, iLand);
    // the shock wave on the final landing, right to left
    setTimeout(() => shock(L), finalLand);

    await ballAnim.finished.catch(() => {});
    try { ballAnim.commitStyles(); } catch (e) {}
    ballAnim.cancel();
    L.open = true;
    L.busy = false;
  }

  function shock(L) {
    const n = L.letters.length;
    L.letters.forEach((el, k) => {
      const d = (n - 1 - k) * 38;
      el.animate([
        { transform: 'none' },
        { transform: 'skewX(-14deg) scaleY(.86) translateX(.02em)', offset: 0.28 },
        { transform: 'skewX(8deg) scaleY(1.06)', offset: 0.6 },
        { transform: 'skewX(-2deg)', offset: 0.82 },
        { transform: 'none' },
      ], { duration: 560, delay: d, easing: 'ease-out', composite: 'add' });
    });
  }

  function hop(L) {
    const em = L.em;
    L.ball.animate([
      { transform: 'translate(0,0) scale(1,1)' },
      { transform: 'translate(0,0) scale(1.22,.78)', offset: 0.12 },
      { transform: `translate(0,${-em * 0.45}px) scale(.9,1.12)`, offset: 0.42 },
      { transform: 'translate(0,0) scale(1.18,.82)', offset: 0.7 },
      { transform: `translate(0,${-em * 0.08}px) scale(1)`, offset: 0.84 },
      { transform: 'translate(0,0) scale(1,1)' },
    ], { duration: 780, easing: 'linear' });
    setTimeout(() => shock(L), 545);
  }

  /* ---------- close ---------- */
  async function close(L) {
    if (L.busy || !L.open) return;
    L.busy = true;
    const X = L.x, em = L.em;
    const steps = [7, 6, 5, 4, 3, 2, 1];
    const STEP = 95;
    const frames = [{ transform: 'translate(0,0) scale(1,1)', offset: 0 }];
    const total = 140 + steps.length * STEP + 360;
    frames.push({ transform: `translate(${em * 0.04}px,0) scale(1.2,.8)`, offset: 140 / total });
    steps.forEach((k, j) => {
      const at = 140 + (j + 1) * STEP;
      frames.push({ transform: `translate(${(X[k - 1] + X[k]) / 2}px,${-em * 0.06}px) scale(1.04,.96)`, offset: (at - STEP / 2) / total });
      frames.push({ transform: `translate(${X[k - 1]}px,0) scale(1.1,.9)`, offset: at / total });
    });
    const endAt = 140 + steps.length * STEP;
    frames.push({ transform: `translate(${X[0]}px,${-em * 0.22}px) scale(.94,1.06)`, offset: (endAt + 160) / total });
    frames.push({ transform: `translate(${X[0]}px,0) scale(1.14,.86)`, offset: (endAt + 280) / total });
    frames.push({ transform: `translate(${X[0]}px,0) scale(1,1)`, offset: 1 });
    const ballAnim = L.ball.animate(frames, { duration: total, easing: 'linear', fill: 'forwards' });

    steps.forEach((k, j) => {
      settle(L.letters[k].animate([
        { transform: 'none', opacity: 1 },
        { transform: 'scaleY(.35) scaleX(1.3)', opacity: 1, offset: 0.4 },
        { transform: 'scaleY(0) scaleX(1.5)', opacity: 0 },
      ], { duration: 260, delay: 140 + j * STEP + STEP * 0.4, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'both' }));
    });
    setTimeout(() => {
      L.letters[0].animate([{ transform: 'none' }, { transform: 'scaleY(1.1) translateY(-.03em)', offset: 0.35 }, { transform: 'none' }],
        { duration: 340, easing: 'ease-out' });
    }, endAt + 280);

    await ballAnim.finished.catch(() => {});
    try { ballAnim.commitStyles(); } catch (e) {}
    ballAnim.cancel();
    L.open = false;
    L.busy = false;
  }

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  /* ---------- nav logo ---------- */
  const navEl = document.querySelector('.nav .brand');
  if (navEl) {
    const L = build(navEl);
    let hovered = false, cycling = false;
    const canPlay = () => !reduce.matches && roomy.matches;
    measure(L);
    restClosed(L);

    async function cycle() {
      if (cycling || hovered || document.hidden || !canPlay()) return;
      cycling = true;
      await open(L);
      await wait(2400);
      if (!hovered) await close(L);
      cycling = false;
    }
    navEl.addEventListener('pointerenter', () => {
      hovered = true;
      if (!canPlay()) return;
      if (L.open && !L.busy) hop(L); else open(L);
    });
    navEl.addEventListener('pointerleave', () => {
      hovered = false;
      setTimeout(async () => { if (!hovered && !cycling) { while (L.busy) await wait(80); if (!hovered) close(L); } }, 600);
    });
    navEl.addEventListener('focus', () => { hovered = true; if (canPlay()) open(L); });
    navEl.addEventListener('blur', () => { hovered = false; close(L); });

    fontsReady.then(() => {
      measure(L);
      restClosed(L);
      L.logo.classList.add('l3d-ready');
      if (canPlay()) setTimeout(cycle, 700);
    });
    setInterval(cycle, 14000);
    window.addEventListener('resize', () => {
      if (L.busy) return;
      measure(L);
      L.open && canPlay() ? restOpen(L) : restClosed(L);
    });
  }

  /* ---------- footer logo ---------- */
  document.querySelectorAll('footer .brand').forEach(el => {
    const L = build(el);
    L.logo.classList.add('l3d-static', 'l3d-ready');
    fontsReady.then(() => { measure(L); restOpen(L); });
    restOpen(L);
    el.addEventListener('pointerenter', () => { if (!reduce.matches) { measure(L); hop(L); } });
  });
})();
