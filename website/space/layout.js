/**
 * The geography of the space: where every record sits, for good.
 *
 * A website without a geography can't be remembered; you only ever see
 * the one page you're on. Here every record has a fixed place, and the
 * directions mean something. They are the same everywhere:
 *
 *   north   the evidence: the six papers, each above the films it supports
 *   middle  the argument: the six films, read west to east
 *   south   the practice: the toolbox, one column per step of the loop
 *
 * A link from a film to its paper always points up, and to its guidance
 * always points down. Readers learn the map without being told.
 *
 * Units are CSS pixels at zoom 1. Node-safe (no JSX, no assets), so a
 * build check can lay the space out too.
 */
import { LOOP } from '../system/catalog.js';

export const FILM = { w: 960, h: 540, cap: 210 };
export const PAPER = { w: 560, h: 740 };
export const COL = { w: 1480, gap: 150 };
export const SUB = { w: 460, h: 220, gap: 50 };
export const CHAPTER_H = 176;
export const DIVIDER_H = 120;
export const ROWS = { paper: -1560, film: 0, practice: 1560 };

const depth = (slug) => (slug ? slug.split('/').length : 0);
const isDivider = (g) => g.divider || /^level\s+\d/i.test(g.title);

export function layoutSpace(catalog, graph) {
  const nodes = new Map();
  const put = (key, x, y, w, h, role, extra = {}) => {
    nodes.set(key, { key, x, y, w, h, role, cx: x + w / 2, cy: y + h / 2, ...extra });
  };

  // ── south: the loop, as five columns ─────────────────────────────────
  const totalW = LOOP.length * COL.w + (LOOP.length - 1) * COL.gap;
  const left = -totalW / 2;
  const columns = LOOP.map((l, i) => ({ id: l.id, name: l.name, x: left + i * (COL.w + COL.gap), y: ROWS.practice, w: COL.w, h: 0, count: 0, header: null }));
  for (const col of columns) {
    const list = catalog.list('guidance').filter((g) => g.phase === col.id);
    col.count = list.filter((g) => !isDivider(g)).length;
    let y = col.y;
    let subs = [];
    const flush = () => {
      if (!subs.length) return;
      subs.forEach((g, j) => {
        const r = Math.floor(j / 3);
        const c = j % 3;
        put(g.key, col.x + c * (SUB.w + SUB.gap), y + r * (SUB.h + SUB.gap), SUB.w, SUB.h, 'sub', { phase: col.id });
      });
      y += Math.ceil(subs.length / 3) * (SUB.h + SUB.gap) - SUB.gap + 90;
      subs = [];
    };
    for (const g of list) {
      // A divider named after the step itself ("RECORD") is the column's
      // header; it sits above the column, where the step's name is.
      if (isDivider(g) && g.title.toLowerCase() === col.name.toLowerCase()) {
        col.header = g.key;
        put(g.key, col.x, col.y - 230, COL.w, 150, 'header', { phase: col.id });
        continue;
      }
      if (isDivider(g)) {
        flush();
        put(g.key, col.x, y, COL.w, DIVIDER_H, 'divider', { phase: col.id });
        y += DIVIDER_H + 30;
        continue;
      }
      if (depth(g.id) >= 3) { subs.push(g); continue; }
      flush();
      put(g.key, col.x, y, COL.w, CHAPTER_H, 'chapter', { phase: col.id });
      y += CHAPTER_H + 36;
    }
    flush();
    col.h = y - col.y;
  }

  // ── middle: the argument ─────────────────────────────────────────────
  const films = catalog.list('film');
  const step = (totalW - FILM.w) / (films.length - 1);
  films.forEach((f, i) => put(f.key, left + i * step, ROWS.film, FILM.w, FILM.h + FILM.cap, 'film', { index: i }));

  // ── north: each paper above the films it supports ───────────────────
  const papers = catalog.list('paper').map((p) => {
    const xs = [...graph.neighbours(p.key)].filter((k) => k.startsWith('film:')).map((k) => nodes.get(k).cx);
    const want = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    return { p, want };
  }).sort((a, b) => a.want - b.want || a.p.order - b.p.order);
  const minGap = PAPER.w + 180;
  const xs = [];
  papers.forEach(({ want }, i) => { xs[i] = i ? Math.max(want, xs[i - 1] + minGap) : want; });
  // Pushing right drifts the row; centre it back on what it wanted.
  const drift = (xs.reduce((a, b) => a + b, 0) - papers.reduce((a, b) => a + b.want, 0)) / papers.length;
  papers.forEach(({ p }, i) => put(p.key, xs[i] - drift - PAPER.w / 2, ROWS.paper, PAPER.w, PAPER.h, 'paper'));

  // ── what is drawn between them ───────────────────────────────────────
  const edges = graph.edges.map((e) => {
    const a = nodes.get(e.a);
    const b = nodes.get(e.b);
    if (!a || !b) return null;
    // Films sit in the middle: an edge leaves a film from its top (up to
    // a paper) or from its bottom (down to guidance).
    const up = b.cy < a.cy;
    const ax = a.cx;
    const ay = up ? a.y : a.y + a.h;
    const bx = b.cx;
    const by = up ? b.y + b.h : b.y;
    const my = (ay + by) / 2;
    return { ...e, d: `M${ax},${ay} C${ax},${my} ${bx},${my} ${bx},${by}` };
  }).filter(Boolean);

  const rails = Object.fromEntries(catalog.paths.map((p) => {
    const pts = p.steps.map((k) => nodes.get(k)).filter(Boolean);
    const d = pts.map((n, i) => `${i ? 'L' : 'M'}${n.cx},${n.cy}`).join(' ');
    return [p.id, { d, steps: p.steps }];
  }));

  const maxCol = Math.max(...columns.map((c) => c.h));
  const bounds = { x: left - 900, y: ROWS.paper - 420, w: totalW + 1200, h: ROWS.practice + maxCol + 420 - (ROWS.paper - 420) };

  // Named places, for the far view and for "where am I".
  const regions = [
    { id: 'evidence', name: 'The evidence', note: 'Six papers, 2022–2026', y: ROWS.paper, h: PAPER.h },
    { id: 'argument', name: 'The argument', note: 'Six films, west to east', y: ROWS.film, h: FILM.h + FILM.cap },
    { id: 'practice', name: 'The practice', note: 'The toolbox, step by step of the loop', y: ROWS.practice, h: maxCol },
  ];
  const groups = [
    { name: 'What goes wrong in the moment', x: nodes.get(films[0].key).x, w: nodes.get(films[2].key).x + FILM.w - nodes.get(films[0].key).x },
    { name: 'What watching it back changes', x: nodes.get(films[3].key).x, w: nodes.get(films[5].key).x + FILM.w - nodes.get(films[3].key).x },
  ];

  const argument = { x: left, y: ROWS.paper, w: totalW, h: FILM.h + FILM.cap - ROWS.paper };

  // The films are shown in the dark, the way films are: one dark band
  // across the bright ground, edge to edge, with the film group labels on
  // it. Everything else (evidence, practice) is on paper.
  const band = { y: ROWS.film - 250, h: FILM.h + FILM.cap + 250 + 280 };

  return { nodes, columns, edges, rails, bounds, regions, groups, left, totalW, argument, band };
}

/** Which named place a world point is in. */
export function placeAt(space, x, y) {
  if (y < (ROWS.paper + PAPER.h + ROWS.film) / 2) return { region: 'The evidence' };
  if (y < ROWS.practice - 300) return { region: 'The argument' };
  const col = space.columns.find((c) => x >= c.x - COL.gap / 2 && x < c.x + c.w + COL.gap / 2);
  return { region: 'The practice', sub: col?.name };
}
