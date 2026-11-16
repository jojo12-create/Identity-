/* Identity — 3D logo.
   "I." at rest. The letters of "dentity" unfold one by one on a hinge in perspective, the glossy
   red dot rides behind the last letter and lands with a small bounce, a light passes over the word,
   then it folds back. Plays once on load, every 14 s while the tab is visible, and on hover or focus.
   The footer logo stays unfolded and answers the pointer with a wave. Reduced motion: still "I.". */
(() => {
  const WORD = 'Identity';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const roomy = matchMedia('(min-width: 761px)'); // on phones the word would run into the call to action

  function build(logo, open) {
    logo.classList.add('logo3d');
    logo.classList.toggle('is-open', open);
    logo.classList.remove('animation2');
    logo.setAttribute('aria-label', 'Identity, accueil');
    const letters = [...WORD].map((c, i) =>
      `<span class="l3d-ch${i ? '' : ' l3d-first'}" style="--i:${i}"><span class="l3d-face">${c}</span></span>`).join('');
    logo.innerHTML = `<span class="l3d" aria-hidden="true">${letters}<span class="l3d-dot"><span class="l3d-ball"></span></span></span>`;
    measure(logo);
  }

  // each letter collapses to width 0; its open width is measured once fonts are ready
  function measure(logo) {
    logo.classList.add('l3d-measure');
    logo.querySelectorAll('.l3d-ch').forEach(ch => {
      ch.style.setProperty('--w', ch.firstElementChild.getBoundingClientRect().width.toFixed(2) + 'px');
    });
    logo.classList.remove('l3d-measure');
  }

  function hop(logo) {
    const ball = logo.querySelector('.l3d-ball');
    ball.classList.remove('is-hop');
    void ball.offsetWidth;
    ball.classList.add('is-hop');
  }

  function glint(logo) {
    logo.classList.remove('is-glint');
    void logo.offsetWidth;
    logo.classList.add('is-glint');
  }

  /* ---------- nav logo ---------- */
  const nav = document.querySelector('.nav .brand');
  if (nav) {
    build(nav, false);
    let busy = false, hovered = false;

    const open = async () => {
      if (nav.classList.contains('is-open')) return;
      nav.classList.add('is-open');
      hop(nav);
      await sleep(820);
      glint(nav);
    };
    const close = () => {
      if (!nav.classList.contains('is-open')) return;
      nav.classList.remove('is-open');
      hop(nav);
    };
    async function cycle() {
      if (busy || hovered || document.hidden || reduce.matches || !roomy.matches) return;
      busy = true;
      await open();
      await sleep(2600);
      if (!hovered) close();
      await sleep(900);
      busy = false;
    }

    nav.addEventListener('pointerenter', () => { hovered = true; if (!reduce.matches && roomy.matches) open(); });
    nav.addEventListener('pointerleave', () => { hovered = false; if (!busy) setTimeout(close, 450); });
    nav.addEventListener('focus', () => { hovered = true; if (!reduce.matches && roomy.matches) open(); });
    nav.addEventListener('blur', () => { hovered = false; close(); });

    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      measure(nav);
      if (!reduce.matches) setTimeout(cycle, 650);
    });
    setInterval(cycle, 14000);
    window.addEventListener('resize', () => { measure(nav); if (!roomy.matches) close(); });
  }

  /* ---------- footer logo ---------- */
  document.querySelectorAll('footer .brand').forEach(logo => {
    build(logo, true);
    logo.classList.add('l3d-static');
    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => measure(logo));
    logo.addEventListener('pointerenter', () => {
      if (reduce.matches) return;
      logo.classList.remove('is-wave');
      void logo.offsetWidth;
      logo.classList.add('is-wave');
      hop(logo);
    });
  });
})();
