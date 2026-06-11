/* GHOST OPERATOR - the ghost itself.
   A spectral cursor that moves along eased bezier paths, leaves a wisp
   trail, clicks, types, and drags. All promises, so the director can
   write scenarios as plain async scripts. innerHTML never sees user input. */

const Ghost = (() => {
  let el, ring, trailCv, tx, gx = 200, gy = 200, motion = true, speed = 1;
  const wisps = [];

  function init() {
    el = document.getElementById('ghost');
    ring = document.getElementById('ghostRing');
    trailCv = document.getElementById('trail');
    place(innerWidth * 0.6, innerHeight * 0.4);
    (function loop() {
      requestAnimationFrame(loop);
      const c = fitTrail(); if (!c) return;
      tx.clearRect(0, 0, c.w, c.h);
      for (let i = wisps.length - 1; i >= 0; i--) {
        const p = wisps[i];
        p.life -= 0.016; p.x += p.vx; p.y += p.vy; p.vy -= 0.02;
        if (p.life <= 0) { wisps.splice(i, 1); continue; }
        tx.fillStyle = `rgba(111,255,194,${p.life * 0.32})`;
        tx.beginPath(); tx.arc(p.x, p.y, p.r * p.life, 0, 7); tx.fill();
      }
    })();
  }
  function fitTrail() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (trailCv.width !== innerWidth * dpr | 0) { trailCv.width = innerWidth * dpr; trailCv.height = innerHeight * dpr; }
    tx = trailCv.getContext('2d');
    tx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: innerWidth, h: innerHeight };
  }
  function place(x, y) { gx = x; gy = y; el.style.transform = `translate(${x}px,${y}px)`; }
  function emit(n) { for (let i = 0; i < n; i++) wisps.push({ x: gx + (Math.random() * 10 - 5), y: gy + (Math.random() * 10 - 5), vx: Math.random() * .6 - .3, vy: Math.random() * .4 - .1, r: 2 + Math.random() * 3, life: 1 }); }

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function moveTo(x, y) {
    return new Promise(res => {
      if (!motion) { place(x, y); return res(); }
      const sx = gx, sy = gy, dist = Math.hypot(x - sx, y - sy);
      const dur = Math.min(1400, 260 + dist * 1.1) / speed;
      /* control point bows the path so movement feels alive, not robotic */
      const mx = (sx + x) / 2 + (Math.random() * 2 - 1) * dist * 0.18;
      const my = (sy + y) / 2 + (Math.random() * 2 - 1) * dist * 0.18;
      const t0 = performance.now();
      if (dist > 220) AudioEngine.whoosh();
      (function step(t) {
        const k = Math.min(1, (t - t0) / dur), e = ease(k);
        const ix = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * x;
        const iy = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * y;
        place(ix, iy); emit(1);
        if (k < 1) requestAnimationFrame(step); else res();
      })(t0);
    });
  }

  async function moveToEl(target, dx, dy) {
    if (!target) return;
    target.scrollIntoView({ block: 'center', behavior: motion ? 'smooth' : 'auto' });
    await wait(motion ? 320 : 0);
    const r = target.getBoundingClientRect();
    await moveTo(r.left + (dx ?? r.width / 2), r.top + (dy ?? r.height / 2));
  }

  async function click(target) {
    await moveToEl(target);
    ring.classList.remove('pulse'); void ring.offsetWidth; ring.classList.add('pulse');
    AudioEngine.click(); emit(8);
    target && target.click();
    await wait(180 / speed);
  }

  async function type(target, text) {
    await moveToEl(target);
    target.focus();
    for (const ch of text) {
      target.value += ch;
      target.dispatchEvent(new Event('input'));
      AudioEngine.clack();
      await wait((14 + Math.random() * 38) / speed);
    }
    await wait(140 / speed);
  }

  /* drag a kanban card into a stage column (visual clone glides, then data moves) */
  async function drag(cardEl, colEl, commit) {
    await moveToEl(cardEl);
    const cr = cardEl.getBoundingClientRect();
    const clone = cardEl.cloneNode(true);
    clone.className = 'kcard kdrag';
    Object.assign(clone.style, { left: cr.left + 'px', top: cr.top + 'px', width: cr.width + 'px' });
    document.body.appendChild(clone);
    cardEl.style.opacity = .25;
    const tr = colEl.getBoundingClientRect();
    const dest = { x: tr.left + 12, y: tr.top + 64 };
    AudioEngine.whoosh();
    const steps = motion ? 34 : 1, sx = cr.left, sy = cr.top;
    for (let i = 1; i <= steps; i++) {
      const e = ease(i / steps);
      const x = sx + (dest.x - sx) * e, y = sy + (dest.y - sy) * e;
      clone.style.left = x + 'px'; clone.style.top = y + 'px';
      place(x + cr.width * .5, y + 14); emit(1);
      await wait(12 / speed);
    }
    clone.remove(); commit && commit();
    AudioEngine.click(); emit(10);
    await wait(200 / speed);
  }

  async function drift() { /* small idle wander */
    await moveTo(gx + (Math.random() * 160 - 80), gy + (Math.random() * 90 - 45));
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  return {
    init, moveTo, moveToEl, click, type, drag, drift, wait, emit,
    setMotion(v) { motion = v; }, setSpeed(v) { speed = v; },
    get x() { return gx; }, get y() { return gy; }
  };
})();
