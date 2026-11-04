/**
 * The magnet: elements clamping to each other.
 *
 * Every element is its own object with its own size (a film is wide, a
 * paper tall, a block of text as tall as its text). Nothing divides the
 * screen. The context says what is in focus and what clamps to what
 * (composition/contexts.js): the element in focus is put down first, and
 * every other one docks onto an edge of something already down, flush,
 * one gutter away, the way a magnet clacks onto a plate.
 *
 * Where exactly, out of all the edges it could take, is a matter of
 * attraction:
 *   - near the element it belongs to (its `parent`), on the side it
 *     prefers (`sides`: a paper goes above its film, guidance below);
 *   - its edges lined up with the edges around it (a magnet pulls into
 *     line), and as much of it touching others as possible (compact);
 *   - the whole assembly kept to the screen's proportions, so it fits.
 * An element with nowhere to go is left out (it isn't needed in this
 * context); if one the context can't do without (`must`) has nowhere to
 * go, the elements that may shrink (`scalable`) shrink and it tries
 * again.
 *
 * Pure and Node-safe: system-check.mjs assembles every context and fails
 * on overlaps or anything off screen.
 */

const SIDES = ['top', 'right', 'bottom', 'left'];

const overlaps = (a, b, gap) =>
  a.x < b.x + b.w + gap - 0.5 && b.x < a.x + a.w + gap - 0.5 && a.y < b.y + b.h + gap - 0.5 && b.y < a.y + a.h + gap - 0.5;

const union = (a, b) => {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/** The side of `p` that `r` sits on, by direction from centre to centre. */
function sideOf(p, r) {
  const dx = (r.x + r.w / 2 - (p.x + p.w / 2)) / Math.max(1, p.w + r.w);
  const dy = (r.y + r.h / 2 - (p.y + p.h / 2)) / Math.max(1, p.h + r.h);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'bottom' : 'top';
}

/** Length of edge two rectangles share across one gutter. */
function contact(a, b, gap) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (ox > 0 && (Math.abs(a.y + a.h + gap - b.y) < 1 || Math.abs(b.y + b.h + gap - a.y) < 1)) return ox;
  if (oy > 0 && (Math.abs(a.x + a.w + gap - b.x) < 1 || Math.abs(b.x + b.w + gap - a.x) < 1)) return oy;
  return 0;
}

/**
 * Every place `w`×`h` could clamp onto `host`, flush, aligned to the
 * host's own edges or to any edge already on the plate.
 */
function spots(host, w, h, gap, linesX, linesY) {
  const out = [];
  const xs = [host.x, host.x + host.w - w, host.x + (host.w - w) / 2];
  const ys = [host.y, host.y + host.h - h, host.y + (host.h - h) / 2];
  for (const x of linesX) { xs.push(x, x - w); }
  for (const y of linesY) { ys.push(y, y - h); }
  for (const x of xs) {
    if (x + w <= host.x + 1 || x >= host.x + host.w - 1) continue; // must touch the host
    out.push({ x, y: host.y - gap - h, side: 'top' }, { x, y: host.y + host.h + gap, side: 'bottom' });
  }
  for (const y of ys) {
    if (y + h <= host.y + 1 || y >= host.y + host.h - 1) continue;
    out.push({ x: host.x - gap - w, y, side: 'left' }, { x: host.x + host.w + gap, y, side: 'right' });
  }
  return out;
}

function placeAll(items, { bounds, gap, scale }) {
  const placed = new Map();
  const list = [];
  const dropped = [];
  let box = null;
  const linesX = [];
  const linesY = [];
  const area = bounds.w * bounds.h;
  const aspect = bounds.w / bounds.h;
  let offside = 0;

  for (const it of items) {
    const s = it.scalable ? scale : 1;
    const w = Math.round(it.w * s);
    const h = Math.round(it.h * s);
    if (!list.length) {
      const r = { x: 0, y: 0, w, h };
      placed.set(it.id, r);
      list.push(r);
      box = { ...r };
      linesX.push(0, w);
      linesY.push(0, h);
      continue;
    }
    const parent = placed.get(it.parent) || list[0];
    const pc = { x: parent.x + parent.w / 2, y: parent.y + parent.h / 2 };
    // The hosts worth trying: the parent and what is nearest to it.
    const near = [...list].sort((a, b) => Math.hypot(a.x + a.w / 2 - pc.x, a.y + a.h / 2 - pc.y) - Math.hypot(b.x + b.w / 2 - pc.x, b.y + b.h / 2 - pc.y));
    const want = it.sides || SIDES;
    let best = null;
    // Nearest first; only if nothing near has room, anything at all.
    for (const hosts of [near.slice(0, 9), near.slice(9)]) {
    if (best) break;
    for (const host of hosts) {
      for (const c of spots(host, w, h, gap, linesX, linesY)) {
        const r = { x: c.x, y: c.y, w, h };
        let clash = false;
        for (const o of list) { if (overlaps(r, o, gap)) { clash = true; break; } }
        if (clash) continue;
        const nb = union(box, r);
        if (nb.w > bounds.w + 0.5 || nb.h > bounds.h + 0.5) continue;
        const side = sideOf(parent, r);
        const si = want.indexOf(side);
        let score = Math.hypot(r.x + w / 2 - pc.x, r.y + h / 2 - pc.y) / 140;
        score += si < 0 ? 6 : si * 2.2;
        if (host !== parent) score += 0.8;
        let touch = 0;
        let lined = 0;
        for (const o of list) {
          touch += contact(r, o, gap);
          if (Math.abs(o.x - r.x) < 0.5 || Math.abs(o.x + o.w - r.x - w) < 0.5) lined += 1;
          if (Math.abs(o.y - r.y) < 0.5 || Math.abs(o.y + o.h - r.y - h) < 0.5) lined += 1;
        }
        score -= (touch / (w + h)) * 2.2;
        score -= Math.min(lined, 4) * 0.35;
        score += ((nb.w * nb.h - box.w * box.h) / area) * 3;
        score += Math.abs(Math.log(nb.w / nb.h / aspect)) * 0.6;
        if (!best || score < best.score) best = { r, score };
      }
    }
    }
    if (!best) { dropped.push(it.id); continue; }
    if (want.length && want.indexOf(sideOf(parent, best.r)) < 0) offside += 1;
    placed.set(it.id, best.r);
    list.push(best.r);
    box = union(box, best.r);
    linesX.push(best.r.x, best.r.x + w);
    linesY.push(best.r.y, best.r.y + h);
  }
  return { placed, dropped, box, offside };
}

/**
 * Assemble `items` (in the order they should be put down; the first is
 * the one in focus) inside `bounds`, centred (or from the `top`, for a
 * phone's tall scrolling plate). Returns { rects, dropped, scale }:
 * screen rectangles for what clamped, the ids left out.
 */
export function assemble(items, { bounds, gap = 10, top = false } = {}) {
  if (!items.length) return { rects: new Map(), dropped: [], scale: 1 };
  // Smaller is worse, but an element on the wrong side of what it belongs
  // to, or left out, is worse still: try a few sizes, keep the best.
  const must = new Set(items.filter((i) => i.must).map((i) => i.id));
  let res = null;
  let scale = 1;
  for (const s of [1, 0.9, 0.8, 0.7, 0.6]) {
    const r = placeAll(items, { bounds, gap, scale: s });
    r.cost = r.dropped.reduce((a, id) => a + (must.has(id) ? 100 : 2), 0) + r.offside * 2.5 + (1 - s) * 6;
    if (!res || r.cost < res.cost) { res = r; scale = s; }
    if (res.cost < 0.5) break;
  }
  const { placed, dropped, box } = res;
  // The assembly sits in the middle of the room it has.
  const dx = bounds.x + (bounds.w - box.w) / 2 - box.x;
  const dy = top ? bounds.y - box.y : bounds.y + (bounds.h - box.h) / 2 - box.y;
  const rects = new Map();
  placed.forEach((r, id) => rects.set(id, { x: Math.round(r.x + dx), y: Math.round(r.y + dy), w: r.w, h: r.h }));
  return { rects, dropped, scale };
}

/**
 * Where an element let go of at `point` clamps: the free edge spot
 * nearest to where it was dropped, among `others` (screen rectangles).
 */
export function dockNear(w, h, point, others, { bounds, gap = 10 } = {}) {
  const linesX = others.flatMap((o) => [o.x, o.x + o.w]);
  const linesY = others.flatMap((o) => [o.y, o.y + o.h]);
  let best = null;
  for (const host of others) {
    for (const c of spots(host, w, h, gap, linesX, linesY)) {
      const r = { x: c.x, y: c.y, w, h };
      if (r.x < bounds.x || r.y < bounds.y || r.x + w > bounds.x + bounds.w || r.y + h > bounds.y + bounds.h) continue;
      if (others.some((o) => overlaps(r, o, gap))) continue;
      const d = Math.hypot(r.x + w / 2 - point.x, r.y + h / 2 - point.y);
      if (!best || d < best.d) best = { r, d };
    }
  }
  return best ? best.r : null;
}
