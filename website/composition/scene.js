/**
 * What the composition is made of, and how much each piece weighs in a
 * given situation.
 *
 * The pieces are the library's records: six films, six papers, and the
 * toolbox's pages (with a head for each step of the loop). They keep a
 * fixed order, and the world keeps three bands, north to south, as the
 * site always had them: the evidence, the argument, the practice.
 * Within a band nothing is fixed; shapes are composed from weights.
 *
 * The weights are the design. A record you open takes over half the
 * screen and what it connects to grows beside it; a search makes its
 * matches big and the rest small; a tour stop is a weighting; the
 * resting state lets the films take turns. None of it is drawn by hand.
 *
 * Node-safe: system-check.mjs composes every scene to check the result.
 */
import { LOOP } from '../system/catalog.js';

// What a shape wants to be: films wide (they are films), papers tall
// (they are pages), guidance a little wide (a number and a title).
const ASPECT = { film: 1.55, paper: 0.78, guidance: 1.35, head: 1.1 };
const BASE = { film: 9, paper: 3.4, head: 1.15 };

const depth = (slug) => (slug ? slug.split('/').length : 1);
const isLevel = (g) => /^level\s+\d/i.test(g.title);

/**
 * The tree, built once from the catalogue. Returns { world, leaves,
 * leafOf } — `leafOf(key)` is the shape a record is shown in (a column's
 * divider pages live in its head; level dividers too).
 */
export function buildScene(catalog) {
  const leaves = new Map();
  const leaf = (id, kind, extra = {}) => {
    const n = { id, kind, aspect: ASPECT[kind], ...extra };
    leaves.set(id, n);
    return n;
  };
  const alias = new Map();

  const papers = catalog.list('paper').map((p) => leaf(p.key, 'paper', { key: p.key, weight: BASE.paper }));
  const films = catalog.list('film').map((f, i) => leaf(f.key, 'film', { key: f.key, index: i, weight: BASE.film }));

  const columns = LOOP.map((l, li) => {
    const list = catalog.list('guidance').filter((g) => g.phase === l.id);
    const headRec = list.find((g) => g.divider && g.title.toLowerCase() === l.name.toLowerCase());
    const head = leaf(headRec ? headRec.key : `head:${l.id}`, 'head', { key: headRec?.key || null, phase: l.id, step: li + 1, name: l.name, weight: BASE.head });
    const kids = [head];
    let group = null;
    for (const g of list) {
      if (g.divider || isLevel(g)) { alias.set(g.key, head.id); continue; }
      const d = depth(g.id);
      const w = (d >= 3 ? 0.55 : 1.3) + (g.tasks ? (d >= 3 ? 0.25 : 0.4) : 0);
      const n = leaf(g.key, 'guidance', { key: g.key, phase: l.id, depth: d, weight: w });
      if (d === 2) {
        group = { id: `grp:${g.key}`, fold: true, kids: [n] };
        kids.push(group);
      } else if (d >= 3 && group) group.kids.push(n);
      else { group = null; kids.push(n); }
    }
    // A chapter with no pages under it is just itself.
    return { id: `col:${l.id}`, phase: l.id, fold: true, kids: kids.map((k) => (k.kids && k.kids.length === 1 ? k.kids[0] : k)) };
  });

  const world = {
    id: 'world',
    dir: 'rows',
    kids: [
      { id: 'evidence', kids: papers },
      { id: 'argument', kids: [{ id: 'moment', kids: films.slice(0, 3) }, { id: 'back', kids: films.slice(3) }] },
      { id: 'practice', kids: columns },
    ],
  };
  const leafOf = (key) => (key && leaves.has(key) ? key : alias.get(key) || null);
  return { world, leaves, leafOf, columns };
}

/**
 * The weights for a situation:
 *   anchor   the record in focus (reading it, or the tour is on it)
 *   reading  true when its text is open: it takes most of the screen
 *   lens     what the tour or the reader is looking at as a whole:
 *            a list of keys, 'column:<id>', 'region:practice', 'everything'
 *   hits     a search's matches (a Set), or null
 *   path     the steps of a path being walked, or null
 *   feature  the film that has the floor when nothing else does
 */
export function weigh(scene, { anchor = null, reading = false, lens = null, hits = null, path = null, feature = null } = {}, graph) {
  const w = new Map();
  scene.leaves.forEach((n) => w.set(n.id, n.weight));
  const mul = (id, f) => { if (w.has(id)) w.set(id, w.get(id) * f); };

  if (Array.isArray(lens)) lens.forEach((k) => mul(scene.leafOf(k), 5));
  else if (lens === 'region:practice') scene.leaves.forEach((n) => (n.kind === 'guidance' || n.kind === 'head') && mul(n.id, 3.4));
  else if (lens && lens.startsWith('column:')) {
    const id = lens.slice(7);
    scene.leaves.forEach((n) => n.phase === id && mul(n.id, n.kind === 'head' ? 4 : 8));
  }
  if (feature && !anchor && !hits) mul(feature, 3.2);
  if (path) path.forEach((k) => mul(scene.leafOf(k), 1.8));
  if (hits) scene.leaves.forEach((n) => mul(n.id, hits.has(n.key) ? 5 : 0.5));

  const a = scene.leafOf(anchor);
  if (a) {
    if (graph && anchor) graph.neighbours(anchor).forEach((k) => mul(scene.leafOf(k), 2.2));
    // The anchor takes a set share of the whole, whatever the rest weighs.
    const n = scene.leaves.get(a);
    const share = reading ? 0.56 : n.kind === 'film' ? 0.4 : n.kind === 'paper' ? 0.24 : 0.2;
    let rest = 0;
    w.forEach((v, k) => { if (k !== a) rest += v; });
    w.set(a, (rest * share) / (1 - share));
  }
  return w;
}

/** Weights in between two situations (log-space, so growth looks even). */
export function blend(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const out = new Map();
  a.forEach((va, k) => {
    const vb = b.get(k) ?? va;
    out.set(k, Math.exp(Math.log(va) * (1 - t) + Math.log(vb) * t));
  });
  return out;
}
