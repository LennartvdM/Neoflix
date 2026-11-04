/**
 * Story mode's clock: where the reader is along the tour (tour.js).
 *
 * Scroll position is a position along the story. Each stop has a hold
 * (the composition stays, the words are read) and a travel (the
 * composition re-assembles into the next stop's, the words cross-fade at
 * the midpoint). Scrolling either axis scrubs it, forward or back;
 * letting go settles on a stop in the direction the reader was going, so
 * one flick is one stop. Keys and the progress strip jump; "Play" runs it.
 *
 * It knows nothing about the screen: `onFrame({ i, travel, t })` says
 * where the story is, and the composition turns that into weights.
 */
const HOLD = { core: 440, skim: 200 };
const TRAVEL = 560;
const clamp = (lo, v, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createStory({ stops, onFrame, onJump, onStop, onEnd }) {
  const start = [];
  const holds = [];
  let end = 0;
  let acc = 0;
  stops.forEach((s, i) => {
    start[i] = acc;
    holds[i] = HOLD[s.depth] || HOLD.core;
    acc += holds[i];
    if (i < stops.length - 1) acc += TRAVEL;
  });
  end = acc;

  let p = 0;
  let cur = -1;
  let raf = 0;
  let snapT = 0;
  let playT = 0;
  let dir = 1;
  let over = 0;
  let playing = false;
  let aim = 0;
  const listeners = new Set();

  const locate = (q) => {
    let i = stops.length - 1;
    while (i > 0 && start[i] > q) i -= 1;
    const u = q - start[i];
    if (u <= holds[i] || i === stops.length - 1) return { i, travel: false, t: 0 };
    return { i, travel: true, t: Math.min(1, (u - holds[i]) / TRAVEL) };
  };
  const emit = () => {
    const l = locate(p);
    const at = l.travel && l.t >= 0.5 ? l.i + 1 : l.i;
    const opacity = l.travel ? Math.abs(1 - 2 * l.t) : 1;
    if (at !== cur) { cur = at; onStop?.(cur); }
    listeners.forEach((fn) => fn({ p, end, cur, opacity, playing }));
  };
  const apply = () => { onFrame(locate(p)); emit(); };

  const stopTween = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const stopPlay = () => { clearTimeout(playT); if (playing) { playing = false; emit(); } };

  function tweenTo(target, { ms, onDone } = {}) {
    stopTween();
    const from = p;
    const dist = Math.abs(target - from);
    if (dist < 0.5) { p = target; apply(); onDone?.(); return; }
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* default */ }
    const dur = reduced ? 0 : ms ?? clamp(520, dist * 1.4, 1500);
    const t0 = performance.now();
    const tick = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      p = from + (target - from) * ease(t);
      apply();
      if (t < 1) raf = requestAnimationFrame(tick);
      else { raf = 0; onDone?.(); }
    };
    raf = requestAnimationFrame(tick);
  }

  function arrived() {
    if (!playing) return;
    const s = stops[cur];
    const words = `${s.title} ${s.text}`.length;
    const dwell = clamp(3200, words * 48, 10000) * (s.depth === 'skim' ? 0.7 : 1);
    clearTimeout(playT);
    playT = setTimeout(() => { if (cur >= stops.length - 1) { playing = false; emit(); } else goTo(cur + 1, { keepPlaying: true }); }, dwell);
  }

  function goTo(i, { keepPlaying = false } = {}) {
    if (!keepPlaying) stopPlay();
    clearTimeout(snapT);
    i = clamp(0, i, stops.length - 1);
    aim = i;
    const l = locate(p);
    const from = l.travel && l.t >= 0.5 ? l.i + 1 : l.i;
    if (Math.abs(i - from) <= 1) { tweenTo(start[i], { onDone: arrived }); return; }
    // Further than next door: re-assemble straight into it instead of
    // fast-forwarding through every stop in between.
    stopTween();
    p = start[i];
    onJump(i);
    emit();
    setTimeout(arrived, 900);
  }

  function snap() {
    const l = locate(p);
    if (!l.travel) {
      const into = (p - start[l.i]) / holds[l.i];
      if (dir > 0 && into > 0.3 && l.i < stops.length - 1) tweenTo(start[l.i + 1], { onDone: arrived });
      return;
    }
    tweenTo(dir > 0 ? start[l.i + 1] : start[l.i], { ms: 560 + 480 * (dir > 0 ? 1 - l.t : l.t) });
  }

  return {
    stops,
    get: () => ({ p, end, cur, playing }),
    holdOf: (i) => start[i],
    /** Put the story on stop i at once (arriving, resuming). */
    seek(i, { jump = false } = {}) {
      stopTween(); stopPlay();
      i = clamp(0, i, stops.length - 1);
      p = start[i];
      over = 0;
      if (jump) onJump(i); else apply();
      emit();
    },
    scroll(delta) {
      stopTween();
      stopPlay();
      if (!delta) return;
      dir = Math.sign(delta);
      if (delta > 0 && p >= end) {
        over += delta;
        if (over > 240) { over = 0; onEnd?.(); }
        return;
      }
      over = 0;
      p = clamp(0, p + delta, end);
      apply();
      clearTimeout(snapT);
      snapT = setTimeout(snap, 170);
    },
    next() { const i = (raf ? aim : locate(p).i) + 1; if (i >= stops.length) onEnd?.(); else goTo(i); },
    prev() { const l = locate(p); goTo(raf ? aim - 1 : l.travel ? l.i : l.i - 1); },
    goTo,
    play() { if (cur >= stops.length - 1) return; playing = true; emit(); goTo(cur + 1, { keepPlaying: true }); },
    pause: () => stopPlay(),
    halt() { stopTween(); stopPlay(); clearTimeout(snapT); },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
