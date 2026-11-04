/**
 * The engine: keeps every shape on screen where the composer says it
 * should be, and moves it there smoothly.
 *
 * Two kinds of change, two kinds of smoothing:
 *   - weights change (a record opened, a search typed, the tour moved):
 *     the engine eases the *weights* from old to new and composes every
 *     frame in between, so the screen is always a whole composition,
 *     never shapes sliding over each other;
 *   - a cut flips, or a region resizes: each shape *chases* its new
 *     rectangle (critically damped, ~70 ms), which turns any jump into
 *     a quick slide.
 *
 * Like the old camera, it writes styles directly, every frame, with no
 * React render: 90 shapes re-rendering per frame would stutter. React
 * only renders when what a shape *says* changes.
 *
 * Regions: the screen is split into the voice (the words), the reading
 * area (an open record's modules, composed the same way) and the world
 * (everything else). Their sizes are chased too.
 */
import { compose } from './compose';
import { blend } from './scene';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const near = (a, b) => Math.abs(a.x - b.x) < 0.3 && Math.abs(a.y - b.y) < 0.3 && Math.abs(a.w - b.w) < 0.3 && Math.abs(a.h - b.h) < 0.3;

export function createEngine({ world, gap = 6, foldAt = 9000 }) {
  const els = new Map();
  const shown = new Map();
  const written = new Map();
  const memoW = new Map();
  const memoR = new Map();
  let weights = null;
  let tween = null;
  let regions = null;
  let regionsShown = null;
  let screen = { w: 1, h: 1 };
  let reading = null; // { tree, weights, origin }
  let raf = 0;
  let last = 0;
  let reduced = false;
  const listeners = new Set();
  let lastTargets = new Map();

  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* default */ }

  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  function currentWeights(now) {
    if (!tween) return weights;
    const t = tween.ms ? Math.min(1, (now - tween.t0) / tween.ms) : 1;
    const w = blend(tween.from, tween.to, ease(t));
    if (t >= 1) { weights = tween.to; tween = null; return weights; }
    weights = w;
    return w;
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    if (!regions || !weights) return;
    const w = currentWeights(now);

    // Regions chase their targets.
    const ar = reduced ? 1 : 1 - Math.exp(-dt / 120);
    let moving = !!tween;
    const rs = {};
    for (const k of Object.keys(regions)) {
      const t = regions[k];
      const s = regionsShown?.[k] || t;
      const n = { x: s.x + (t.x - s.x) * ar, y: s.y + (t.y - s.y) * ar, w: s.w + (t.w - s.w) * ar, h: s.h + (t.h - s.h) * ar };
      if (!near(n, t)) moving = true;
      rs[k] = near(n, t) ? t : n;
    }
    regionsShown = rs;

    // Where two regions meet, each reaches half a gutter over the line,
    // so the gutter between them is the same as everywhere else.
    const adj = (r) => {
      const x0 = r.x > 0.5 ? r.x - gap / 2 : r.x;
      const y0 = r.y > 0.5 ? r.y - gap / 2 : r.y;
      const x1 = r.x + r.w < screen.w - 0.5 ? r.x + r.w + gap / 2 : r.x + r.w;
      const y1 = r.y + r.h < screen.h - 0.5 ? r.y + r.h + gap / 2 : r.y + r.h;
      return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
    };
    const targets = rs.world.w > gap * 2 && rs.world.h > gap * 2
      ? compose(world, adj(rs.world), { weights: w, gap, memo: memoW, foldAt })
      : new Map();
    const v = adj(rs.voice);
    targets.set('voice', { x: v.x + gap, y: v.y + gap, w: Math.max(0, v.w - gap * 2), h: Math.max(0, v.h - gap * 2) });
    if (reading && rs.read.w > gap * 2 && rs.read.h > gap * 2) {
      compose(reading.tree, adj(rs.read), { weights: reading.weights, gap, memo: memoR }).forEach((r, id) => targets.set(id, r));
    }
    lastTargets = targets;

    const a = reduced ? 1 : 1 - Math.exp(-dt / 70);
    els.forEach((el, id) => {
      const t = targets.get(id);
      if (!t) return;
      let s = shown.get(id);
      if (!s) {
        // A shape arriving grows out of where its record already is.
        const from = reading?.origin && id.startsWith('mod:') ? shown.get(reading.origin) : null;
        s = from ? { ...from } : { ...t };
      }
      const n = { x: s.x + (t.x - s.x) * a, y: s.y + (t.y - s.y) * a, w: s.w + (t.w - s.w) * a, h: s.h + (t.h - s.h) * a };
      const done = near(n, t);
      if (!done) moving = true;
      const r = done ? { x: t.x, y: t.y, w: t.w, h: t.h } : n;
      shown.set(id, r);
      write(el, id, r, t);
    });
    listeners.forEach((fn) => fn(targets));
    if (moving) raf = requestAnimationFrame(frame);
  }

  function write(el, id, r, t) {
    const prev = written.get(id);
    const rx = Math.round(r.x * 2) / 2;
    const ry = Math.round(r.y * 2) / 2;
    const rw = Math.round(r.w);
    const rh = Math.round(r.h);
    if (prev && prev[0] === rx && prev[1] === ry && prev[2] === rw && prev[3] === rh && prev[4] === (t.folded || 0)) return;
    written.set(id, [rx, ry, rw, rh, t.folded || 0]);
    el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    el.style.width = `${rw}px`;
    el.style.height = `${rh}px`;
    const hidden = rw < 6 || rh < 6;
    if (hidden !== (el.dataset.gone === '')) el.toggleAttribute('data-gone', hidden);
    const f = t.folded ? String(t.folded) : '';
    if ((el.dataset.folded || '') !== f) { if (f) el.dataset.folded = f; else delete el.dataset.folded; }
  }

  return {
    register(id, el) {
      if (el) { els.set(id, el); written.delete(id); kick(); } else { els.delete(id); written.delete(id); if (id.startsWith('mod:')) shown.delete(id); }
    },
    /** New weights; eased over `ms` (0: at once, for the tour's scrubbing). */
    setWeights(next, { ms = 700 } = {}) {
      if (!weights || reduced || !ms) { weights = next; tween = null; }
      else tween = { from: weights, to: next, t0: performance.now(), ms };
      kick();
    },
    setRegions(next, { now = false, size } = {}) {
      regions = next;
      if (size) screen = size;
      if (now || !regionsShown) regionsShown = next;
      kick();
    },
    setReading(r) {
      if (r?.tree.id !== reading?.tree.id) memoR.clear();
      reading = r;
      kick();
    },
    /** Where a shape is right now (for hit-testing and links). */
    rectOf: (id) => shown.get(id) || lastTargets.get(id) || null,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    refresh: kick,
  };
}
