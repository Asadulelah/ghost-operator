/* GHOST OPERATOR - synthesized audio. Zero assets.
   A haunted-server-room register: low drone with a slow breathing LFO,
   soft UI ticks, air whooshes when the ghost crosses the screen,
   and one dissonant sting for the moment it notices you. */

const AudioEngine = (() => {
  let ctx = null, master = null, drone = null, enabled = false;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function startDrone() {
    if (drone || !ctx) return;
    const g = ctx.createGain(); g.gain.value = 0.05; g.connect(master);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 52;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 52.8;
    const o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 156; /* faint 5th-ish shimmer */
    const g3 = ctx.createGain(); g3.gain.value = 0.06;
    o1.connect(g); o2.connect(g); o3.connect(g3); g3.connect(g);
    /* slow breathing */
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 0.02;
    lfo.connect(lg); lg.connect(g.gain);
    /* filtered noise bed */
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.18;
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    n.connect(lp); lp.connect(g);
    o1.start(); o2.start(); o3.start(); lfo.start(); n.start();
    drone = true;
  }

  function env(gn, t0, a, peak, d) {
    gn.gain.cancelScheduledValues(t0);
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(peak, t0 + a);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  function noiseBurst(dur, filterType, freq, peak) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(master);
    env(g, t, 0.02, peak, dur);
    s.start(t);
  }

  return {
    get on() { return enabled; },
    enable(v) {
      if (!ensure()) return false;
      enabled = v;
      if (v) { ctx.resume(); startDrone(); master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.8); }
      else master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      return enabled;
    },
    toggle() { return this.enable(!enabled); },

    click() { noiseBurst(0.06, 'highpass', 2000, 0.07); },
    clack() { noiseBurst(0.035, 'highpass', 2600, 0.05); },
    whoosh() { noiseBurst(0.5, 'bandpass', 420, 0.05); },
    ping() { /* inbound event */
      if (!enabled || !ctx) return;
      const t = ctx.currentTime;
      [880, 1174].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ctx.createGain(); o.connect(g); g.connect(master);
        env(g, t + i * 0.12, 0.01, 0.07, 0.5);
        o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.6);
      });
    },
    sting() { /* it noticed you: minor-second rub, slow swell */
      if (!enabled || !ctx) return;
      const t = ctx.currentTime;
      [220, 233].forEach(f => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ctx.createGain(); o.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 1.1);
        g.gain.linearRampToValueAtTime(0.0001, t + 2.6);
        o.start(t); o.stop(t + 2.7);
      });
    }
  };
})();
