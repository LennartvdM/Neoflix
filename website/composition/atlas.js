/**
 * The atlas: the site as pages in two directions.
 *
 * Down is the story: the tour's stops (tour.js), one page each, top to
 * bottom. Right is depth: from any page you can go into what it rests on.
 * A film's stop opens onto the film itself, then the papers behind it,
 * then the toolbox pages that put it into practice; a step of the loop
 * onto its chapters, a chapter onto its pages; a path onto its steps.
 * Left is back out. So the site is a tree read sideways, and every page
 * has an address in it: a list of positions, one per level ([3] is the
 * fourth stop; [3, 1] the second page to its right).
 *
 * Moving down past the last page of a branch carries on with the story
 * (the next page of the level above), so reading straight down never
 * gets stuck at the end of a detour.
 *
 * Node-safe: system-check.mjs walks the whole atlas.
 */
import { LOOP } from '../system/catalog.js';
import { TOUR, CHAPTERS, INTERMISSIONS } from './tour.js';
import { entry } from '../system/content/ontology.js';

const kindOf = (key) => key.slice(0, key.indexOf(':'));
const depth = (slug) => (slug ? slug.split('/').length : 1);
const isLevel = (g) => /^level\s+\d/i.test(g.title);

export function buildAtlas(catalog, graph) {
  const guidance = catalog.list('guidance').filter((g) => !g.divider && !isLevel(g));
  const chapterOf = (g) => (depth(g.id) >= 3 ? guidance.find((c) => depth(c.id) === 2 && g.id.startsWith(`${c.id}/`)) || null : null);
  const pagesUnder = (key) => guidance.filter((g) => chapterOf(g)?.key === key);
  const chapters = (phase) => guidance.filter((g) => g.phase === phase && depth(g.id) <= 2);

  const label = (key) => {
    const r = catalog.get(key);
    if (r.kind === 'paper') return r.short;
    if (r.kind === 'film') return r.name;
    return r.id === '' ? 'Welcome to the toolbox' : r.title;
  };
  const num = (key) => {
    const r = catalog.get(key);
    if (r.kind === 'paper') return String(r.n);
    if (r.kind === 'film') return String(r.order + 1);
    return r.number || null;
  };

  // A record's page; a toolbox chapter opens onto its pages.
  const record = (key) => ({
    id: `rec:${key}`,
    kind: 'record',
    key,
    label: label(key),
    num: num(key),
    rkind: kindOf(key),
    kids: kindOf(key) === 'guidance' ? pagesUnder(key).map((g) => record(g.key)) : [],
  });
  const uniq = (keys) => [...new Set(keys)].filter((k) => catalog.has(k));
  const records = (keys) => uniq(keys).map(record);
  const near = (key, kind) => [...graph.neighbours(key)].filter((k) => kindOf(k) === kind);

  const step = (l, i) => ({
    id: `step:${l.id}`,
    kind: 'step',
    phase: l.id,
    label: l.name,
    num: String(i + 1),
    kids: chapters(l.id).map((g) => record(g.key)),
  });
  const path = (p) => ({ id: `path:${p.id}`, kind: 'path', pathId: p.id, label: p.name, num: null, kids: p.steps.map(record) });

  // What each stop of the story opens onto.
  const kidsOfStop = (s) => {
    if (s.doors) return catalog.paths.map(path);
    if (Array.isArray(s.at)) return records(s.at);
    if (s.at === 'region:practice') return LOOP.map(step);
    const col = /^column:(.+)$/.exec(s.at);
    if (col) return chapters(col[1]).map((g) => record(g.key));
    if (catalog.has(s.at)) {
      const k = kindOf(s.at);
      // A film: the film, then the evidence behind it, then the practice.
      if (k === 'film') return records([s.at, ...near(s.at, 'paper'), ...near(s.at, 'guidance')]);
      if (k === 'paper') return records([s.at, ...near(s.at, 'guidance'), ...near(s.at, 'film')]);
      return records([s.at, ...near(s.at, 'film'), ...near(s.at, 'paper')]);
    }
    return [];
  };

  // The story's stops, with an intermission after the stops that have
  // one. `n` is a stop's number in the story (intermissions don't count).
  const spine = [];
  TOUR.forEach((s, i) => {
    spine.push({
      id: `stop:${s.id}`,
      kind: 'stop',
      stop: s,
      index: spine.length,
      n: i + 1,
      chapter: s.chapter || null,
      label: s.title,
      short: shortOf(s),
      num: String(i + 1),
      kids: kidsOfStop(s),
    });
    for (const im of INTERMISSIONS.filter((x) => x.after === s.id)) {
      const c = entry(`concept:${im.concept}`);
      spine.push({ id: `pause:${im.concept}`, kind: 'pause', concept: im.concept, index: spine.length, chapter: s.chapter || null, label: c?.name || im.concept, short: c?.name || im.concept, num: null, kids: [] });
    }
  });
  const root = { id: 'root', kind: 'root', kids: spine };

  /** The node at an address (or null). */
  const at = (addr) => {
    let n = root;
    for (const i of addr) { n = n.kids[i]; if (!n) return null; }
    return n;
  };
  /** Each node along an address, from the stop down. */
  const trail = (addr) => addr.map((_, d) => at(addr.slice(0, d + 1)));

  // Where a record lives, when it's reached by its own URL: the first
  // place the story comes to it (breadth first, so the shallowest).
  const home = new Map();
  const homeOfPath = new Map();
  const queue = spine.map((n, i) => [n, [i]]);
  while (queue.length) {
    const [n, addr] = queue.shift();
    if (n.key && !home.has(n.key)) home.set(n.key, addr);
    if (n.kind === 'path') homeOfPath.set(n.pathId, addr);
    n.kids.forEach((k, i) => queue.push([k, [...addr, i]]));
  }
  // A record's natural home beats the first mention: a toolbox page
  // lives under its step of the loop, a paper under the six papers, a
  // film at its own stop.
  const find = (addr, key) => {
    const n = at(addr);
    if (!n) return null;
    if (n.key === key) return addr;
    for (let i = 0; i < n.kids.length; i += 1) { const r = find([...addr, i], key); if (r) return r; }
    return null;
  };
  for (const r of catalog.records.values()) {
    let s = -1;
    if (r.kind === 'guidance') s = spine.findIndex((n) => n.stop?.at === `column:${r.phase}`);
    else if (r.kind === 'paper') s = spine.findIndex((n) => Array.isArray(n.stop?.at) && n.stop?.at.includes(r.key));
    else s = spine.findIndex((n) => n.stop?.at === r.key);
    const a = s >= 0 ? find([s], r.key) : null;
    if (a) home.set(r.key, a);
  }
  // Pages of the toolbox that aren't their own page (section dividers,
  // level headings) live with their step of the loop.
  for (const g of catalog.list('guidance')) {
    if (home.has(g.key)) continue;
    const s = spine.findIndex((n) => n.stop?.at === `column:${g.phase}`);
    if (s >= 0) home.set(g.key, [s]);
  }

  /** The address of `key` inside a path, if it's one of its steps. */
  const inPath = (pathId, key) => {
    const a = homeOfPath.get(pathId);
    if (!a) return null;
    const i = at(a).kids.findIndex((k) => k.key === key);
    return i < 0 ? null : [...a, i];
  };

  /**
   * One page on, in a direction:
   *   down   the next page at this level; past the last, the next page of
   *          the level above (the story carries on)
   *   up     the page before at this level; above the first, back out
   *   right  into the first page this one opens onto (or `remember`'s)
   *   left   back out to the page this one came from
   */
  const move = (addr, dir, remember) => {
    if (dir === 'right') {
      const n = at(addr);
      if (!n?.kids.length) return null;
      const i = Math.min(n.kids.length - 1, remember?.get(addr.join('.')) ?? 0);
      return [...addr, i];
    }
    if (dir === 'left') return addr.length > 1 ? addr.slice(0, -1) : null;
    const step = dir === 'down' ? 1 : -1;
    for (let d = addr.length - 1; d >= 0; d -= 1) {
      const parent = d === 0 ? root : at(addr.slice(0, d));
      const i = addr[d] + step;
      if (i >= 0 && i < parent.kids.length) return [...addr.slice(0, d), i];
      if (dir === 'up') return d > 0 ? addr.slice(0, d) : null;
    }
    return null;
  };

  const count = () => {
    let n = 0;
    const walk = (x) => { n += 1; x.kids.forEach(walk); };
    spine.forEach(walk);
    return n;
  };

  return { root, spine, at, trail, move, home, inPath, homeOfPath, count, chapters: CHAPTERS };
}

/** A stop's name in the sidebar (tour.js `short`). */
function shortOf(s) {
  return s.short || s.title;
}
