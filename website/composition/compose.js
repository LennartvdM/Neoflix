/**
 * The composer: a list of shapes, each with a weight, poured into a
 * rectangle so that they fill it exactly, edge to edge, with no gaps but
 * the gutters, and every shape's area in proportion to its weight.
 *
 * This is what makes the site assemble itself. Nobody draws the layout:
 * the reader's situation sets the weights (composition/scene.js), and the
 * composer finds the shapes. When the weights move, the composition
 * moves with them; called every frame with weights in between, it
 * re-assembles continuously.
 *
 * How. A list (in reading order; order is never changed) is cut in two,
 * across or along, and each half gets the share of the rectangle its
 * weights add up to; then each half is cut again, down to single shapes.
 * Every cut gives exact areas, so the only question is where to cut and
 * which way, and that is decided by shape: the cut that leaves each
 * piece nearest the proportions it wants (a film wants to be wide, a
 * paper tall, a group squarish) wins.
 *
 * Steadiness. Recomputed every frame, the best cut can flip back and
 * forth between two near-equal options, and the whole layout would
 * flicker. `memo` remembers the cut each sub-list got last time, and it
 * keeps it until another is clearly better.
 *
 * A node is a leaf { id, weight, aspect? } or a group { id, kids, dir?,
 * fold? }. `dir: 'rows'` stacks a group's kids top to bottom instead
 * of composing them (the world's three bands keep north and south).
 * `fold: true` lets a group fold into its first kid when each of its
 * pieces would get less than `foldAt` square pixels: the shape says
 * "6 Recording equipment +5" instead of six slivers. Folded-away
 * leaves come back as zero-sized rects (`gone: true`) at the fold's
 * centre, so they shrink into it rather than vanish.
 *
 * Node-safe and pure: scripts/system-check.mjs composes every scene and
 * fails the build if the shapes overlap, leave holes, or lose weight.
 */

const STICK = 0.18; // how much better a new cut must be before the old one goes

/** Total weight under a node. */
export function weightOf(node, weights) {
  if (!node.kids) return Math.max(1e-6, weights.get(node.id) ?? node.weight ?? 1);
  let s = 0;
  for (const k of node.kids) s += weightOf(k, weights);
  return s;
}

// How far a rectangle is from the proportions it wants, plus a penalty
// for being thin: a 30px strip is useless whatever it was meant to be.
const THIN = 46;
const bad = (w, h, want) => {
  if (w <= 0 || h <= 0) return 9;
  const m = Math.min(w, h);
  return Math.abs(Math.log(w / h / want)) + (m < THIN ? (THIN - m) / 9 : 0);
};

export function compose(root, rect, { weights = new Map(), gap = 6, memo = new Map(), foldAt = 0 } = {}) {
  const out = new Map();
  const sums = new Map();
  const sum = (n) => {
    let s = sums.get(n);
    if (s === undefined) { s = weightOf(n, weights); sums.set(n, s); }
    return s;
  };

  const place = (node, r) => {
    if (!node.kids) {
      out.set(node.id, { x: r.x + gap / 2, y: r.y + gap / 2, w: Math.max(0, r.w - gap), h: Math.max(0, r.h - gap) });
      return;
    }
    // A group that has no room for its pieces folds into its first one
    // (a chapter takes in its pages) and unfolds again when it has.
    if (node.fold) {
      const key = `fold:${node.id}`;
      const was = memo.get(key);
      const per = (r.w * r.h) / node.kids.length;
      const folded = per < foldAt * (was ? 1.3 : 1);
      memo.set(key, folded);
      if (folded) {
        // It folds into its first piece, unless one piece already holds
        // most of it (the record in focus): then into that one.
        const total = node.kids.reduce((a, k) => a + sum(k), 0);
        const lead = node.kids.find((k) => sum(k) > total * 0.5) || node.kids[0];
        const rest = node.kids.filter((k) => k !== lead);
        place(lead, r);
        if (!lead.kids) out.get(lead.id).folded = rest.length;
        const c = { x: r.x + r.w / 2, y: r.y + r.h / 2, w: 0, h: 0, gone: true };
        rest.forEach((k) => leavesOf(k).forEach((l) => out.set(l.id, c)));
        return;
      }
    }
    if (node.dir === 'rows' || node.dir === 'cols') {
      const total = node.kids.reduce((a, k) => a + sum(k), 0);
      let at = node.dir === 'rows' ? r.y : r.x;
      for (const k of node.kids) {
        const f = sum(k) / total;
        if (node.dir === 'rows') { place(k, { x: r.x, y: at, w: r.w, h: r.h * f }); at += r.h * f; }
        else { place(k, { x: at, y: r.y, w: r.w * f, h: r.h }); at += r.w * f; }
      }
      return;
    }
    cut(node.kids, r, node.fold);
  };

  // Each piece is judged by the shape it would get: a leaf by its own
  // preferred proportions, a group of several as roughly square (it will
  // be cut again), a pair by the better of its two ways of sitting.
  const want = (list) => (list.length === 1 ? list[0].aspect || 1 : 1);

  const cut = (list, r, foldable = false) => {
    if (list.length === 1) { place(list[0], r); return; }
    // One piece holding most of the weight takes a side to itself, and
    // its small neighbours gather on the other side, in their order,
    // instead of being cut into slivers on either side of it.
    {
      const tot = list.reduce((a, k) => a + sum(k), 0);
      const i = list.findIndex((k) => sum(k) > tot * 0.55);
      if (i >= 0) {
        const big = list[i];
        const others = list.filter((k) => k !== big);
        // In a group that may fold, neighbours with too little room
        // fold into the big one rather than line up as slivers.
        if (foldable && (r.w * r.h * (1 - sum(big) / tot)) / others.length < foldAt * 0.7) {
          place(big, r);
          if (!big.kids) out.get(big.id).folded = (out.get(big.id).folded || 0) + others.reduce((a, k) => a + leavesOf(k).length, 0);
          const c = { x: r.x + r.w / 2, y: r.y + r.h / 2, w: 0, h: 0, gone: true };
          others.forEach((k) => leavesOf(k).forEach((l) => out.set(l.id, c)));
          return;
        }
        if (others.length >= 2) {
          const rest = { id: `rest:${others[0].id}…${others[others.length - 1].id}`, kids: others };
          sums.set(rest, tot - sum(big));
          cut(i < list.length / 2 ? [big, rest] : [rest, big], r);
          return;
        }
      }
    }
    const n = list.length;
    const total = list.reduce((a, k) => a + sum(k), 0);
    const id = `${list[0].id}…${list[n - 1].id}`;
    const pre = [0];
    for (let i = 0; i < n; i++) pre.push(pre[i] + sum(list[i]));

    const score = (across, k) => {
      const f = pre[k] / total;
      const a = list.slice(0, k);
      const b = list.slice(k);
      const [r1, r2] = halves(r, across, f);
      return bad(r1.w, r1.h, want(a)) * weightShare(a.length) + bad(r2.w, r2.h, want(b)) * weightShare(b.length);
    };

    let best = null;
    for (const across of [false, true]) {
      for (let k = 1; k < n; k++) {
        const s = score(across, k);
        if (!best || s < best.s - 1e-9) best = { across, k, s };
      }
    }
    const was = memo.get(id);
    if (was && was.n === n && was.k < n) {
      const s = score(was.across, was.k);
      if (s <= best.s + STICK) best = { across: was.across, k: was.k, s };
    }
    memo.set(id, { across: best.across, k: best.k, n });

    const [r1, r2] = halves(r, best.across, pre[best.k] / total);
    cut(list.slice(0, best.k), r1);
    cut(list.slice(best.k), r2);
  };

  place(root, { x: rect.x + gap / 2, y: rect.y + gap / 2, w: rect.w - gap, h: rect.h - gap });
  return out;
}

// A cut "across" divides top from bottom; otherwise left from right.
function halves(r, across, f) {
  if (across) return [{ x: r.x, y: r.y, w: r.w, h: r.h * f }, { x: r.x, y: r.y + r.h * f, w: r.w, h: r.h * (1 - f) }];
  return [{ x: r.x, y: r.y, w: r.w * f, h: r.h }, { x: r.x + r.w * f, y: r.y, w: r.w * (1 - f), h: r.h }];
}

// A single shape's proportions matter most (it's what you see); a big
// group's less (it will be cut again and can still come out well).
const weightShare = (m) => (m === 1 ? 1 : 0.55);

/** Every leaf of a tree, in order. */
export function leavesOf(node, out = []) {
  if (!node.kids) out.push(node);
  else node.kids.forEach((k) => leavesOf(k, out));
  return out;
}
