/**
 * Contexts: in each situation, which elements are out, how big each one
 * is, and what it clamps to.
 *
 * An element is one record (a film, a paper, a toolbox page), a step of
 * the loop, or one of the site's own pieces: the voice (the words for
 * what you're looking at: the way in, the tour's narration, an open
 * record's title), the tour's controls, an open record's modules. Each
 * has its own size, from a few sizes per kind chosen so that a context
 * always mixes them: one big, a few middling, more small; wide films,
 * tall papers, squarish pages.
 *
 * The geography the site always had survives as preference, not as
 * place: a paper prefers to clamp above what it supports, guidance
 * below, the next film to the right.
 *
 * A context returns items in the order they are put down (magnet.js):
 * the element in focus first, then what clamps to it, outward.
 *
 * Node-safe: system-check.mjs assembles every context.
 */
import { LOOP } from '../system/catalog.js';

// Sizes at a 1440×900 screen; `f` scales them to others.
const SIZE = {
  film: { xl: [640, 360], l: [480, 270], m: [300, 169], s: [210, 118], xs: [150, 84] },
  paper: { l: [300, 400], m: [210, 280], s: [150, 200], xs: [118, 158] },
  guidance: { l: [380, 240], m: [260, 160], s: [190, 116], xs: [140, 86] },
  head: { l: [300, 200], m: [220, 140], s: [160, 100] },
};
const isLevel = (g) => /^level\s+\d/i.test(g.title);
const depth = (slug) => (slug ? slug.split('/').length : 1);

/** The elements that exist, built once from the catalogue. */
export function buildWorld(catalog) {
  const films = catalog.list('film');
  const papers = catalog.list('paper');
  const guidance = catalog.list('guidance').filter((g) => !g.divider && !isLevel(g));
  const heads = LOOP.map((l, i) => ({ id: `head:${l.id}`, phase: l.id, step: i + 1, name: l.name }));
  // A toolbox page's chapter: the depth-2 page it sits under.
  const chapterOf = (g) => (depth(g.id) >= 3 ? guidance.find((c) => depth(c.id) === 2 && g.id.startsWith(`${c.id}/`)) || null : null);
  const chapters = (phase) => guidance.filter((g) => g.phase === phase && depth(g.id) <= 2);
  const pagesUnder = (c) => guidance.filter((g) => chapterOf(g)?.key === c.key);
  return { films, papers, guidance, heads, chapterOf, chapters, pagesUnder };
}

const el = (id, kind, tier, f, extra = {}) => {
  const [w, h] = SIZE[kind][tier];
  return { id, kind, tier, w: Math.round(w * f), h: Math.round(h * f), scalable: true, ...extra };
};
const kindOf = (key) => key.slice(0, key.indexOf(':'));

/**
 * The items for a context.
 *   ctx.mode     'rest' | 'tour' | 'read' | 'search' | 'step'
 *   ctx.anchor   the record in focus (tour stop or open record)
 *   ctx.lens     a tour stop's other subjects: a list of keys,
 *                'region:practice', 'column:<id>', 'everything'
 *   ctx.feature  the film that has the floor at rest
 *   ctx.hits     search matches, best first
 *   ctx.modules  an open record's modules: [{ id, w, h }] in order
 *   ctx.everyModule  none may be left out (a phone's tall plate)
 *   ctx.voice    the voice's size { w, h }
 *   ctx.controls the tour controls' size, on the tour
 *   f            the size factor for this screen
 */
export function itemsFor(world, ctx, graph, f = 1) {
  const items = [];
  const seen = new Set();
  const add = (it) => { if (it && !seen.has(it.id)) { seen.add(it.id); items.push(it); } return it; };
  const voice = (parent, sides = ['left', 'top']) => add({ id: 'voice', kind: 'voice', w: ctx.voice.w, h: ctx.voice.h, parent, sides, must: true });
  const controls = () => ctx.controls && add({ id: 'controls', kind: 'controls', w: ctx.controls.w, h: ctx.controls.h, parent: 'voice', sides: ['bottom', 'top'], must: true });
  const near = (key, sizes) => {
    // What a record clamps to itself: its papers above, its films beside,
    // its guidance below.
    const out = [];
    for (const k of graph.neighbours(key)) {
      const kind = kindOf(k);
      if (kind === 'paper') out.push(el(k, 'paper', sizes.paper, f, { parent: key, sides: ['top', 'right', 'left'] }));
      if (kind === 'film') out.push(el(k, 'film', sizes.film, f, { parent: key, sides: ['right', 'bottom', 'top'] }));
      if (kind === 'guidance') out.push(el(k, 'guidance', sizes.guidance, f, { parent: key, sides: ['bottom', 'right'] }));
    }
    return out;
  };

  const { films, papers, heads } = world;

  // Everything at once: the words first, the films in a run to their
  // right (the one with the floor big), each paper over the film it
  // supports, the five steps of the loop in a row under the films.
  const overview = (lead, leadTier) => {
    voice(null, []);
    controls();
    const li = films.findIndex((x) => x.key === lead);
    // Two runs, as the argument has two halves: what goes wrong in the
    // moment (1–3), what watching it back changes (4–6), one under the other.
    films.forEach((fm, j) => {
      const tier = j === li ? leadTier : Math.abs(j - li) === 1 ? 'm' : 's';
      const parent = j === 0 ? 'voice' : j === 3 ? films[0].key : films[j - 1].key;
      const sides = j === 3 ? ['bottom'] : ['right'];
      add(el(fm.key, 'film', tier, f, { parent, sides, must: true }));
    });
    heads.forEach((h, i) => add(el(h.id, 'head', 's', f, { parent: i ? heads[i - 1].id : films[3].key, sides: i ? ['right'] : ['bottom'], must: true })));
    for (const p of papers) {
      const fs = [...graph.neighbours(p.key)].filter((k) => kindOf(k) === 'film');
      add(el(p.key, 'paper', 'xs', f, { parent: fs[0] || lead, sides: ['top', 'right', 'left'] }));
    }
  };

  if (ctx.mode === 'search') {
    voice(null);
    (ctx.hits || []).slice(0, 14).forEach((k, i) => {
      const kind = kindOf(k);
      const tier = i < 2 ? (kind === 'film' ? 'l' : 'm') : i < 6 ? 's' : 'xs';
      const id = kind === 'guidance' || kind === 'paper' || kind === 'film' ? k : null;
      if (id) add(el(id, kind, tier, f, { parent: i ? ctx.hits[Math.max(0, i - 2)] : 'voice', sides: ['right', 'bottom', 'top'] }));
    });
    return items;
  }

  if (ctx.mode === 'read' && ctx.anchor) {
    const key = ctx.anchor;
    const kind = kindOf(key);
    const mods = ctx.modules || [];
    // A film opens as itself, big; a paper or a page opens as its text.
    let root;
    if (kind === 'film') root = add(el(key, 'film', 'xl', f, { must: true }));
    else root = add({ ...mods[0], kind: 'module', must: true });
    voice(root.id, ['left', 'top']);
    const rest = kind === 'film' ? mods : mods.slice(1);
    rest.forEach((m, i) => add({ ...m, kind: 'module', parent: i < 2 ? root.id : rest[i - 2]?.id || root.id, sides: ['right', 'bottom', 'left', 'top'], must: i < 3 || !!ctx.everyModule }));
    // What the record links to clamps to the module that mentions it.
    const host = (k) => {
      const kk = kindOf(k);
      const id = kk === 'paper' ? 'mod:findings' : kk === 'film' ? 'mod:film' : 'mod:practice';
      return seen.has(id) ? id : root.id;
    };
    for (const it of near(key, { paper: 'xs', film: 'xs', guidance: 'xs' })) add({ ...it, parent: host(it.id), sides: ['right', 'bottom', 'top', 'left'] });
    return items;
  }

  if (ctx.mode === 'step' || (ctx.mode === 'tour' && typeof ctx.lens === 'string' && ctx.lens.startsWith('column:'))) {
    const phase = ctx.lens.slice(7);
    const head = heads.find((h) => h.phase === phase);
    add(el(head.id, 'head', 'l', f, { must: true }));
    voice(head.id, ['left']);
    controls();
    let prev = head.id;
    for (const c of world.chapters(phase)) {
      add(el(c.key, 'guidance', 'm', f, { parent: prev, sides: ['right', 'bottom'] }));
      prev = c.key;
    }
    for (const c of world.chapters(phase)) {
      for (const p of world.pagesUnder(c)) add(el(p.key, 'guidance', 'xs', f, { parent: c.key, sides: ['bottom', 'right', 'top'] }));
    }
    // The other steps stay in reach, in a run of their own.
    heads.filter((h) => h !== head).forEach((h, i, rest) => add(el(h.id, 'head', 's', f, { parent: i ? rest[i - 1].id : head.id, sides: i ? ['right'] : ['top', 'bottom'] })));
    return items;
  }

  if (ctx.mode === 'tour') {
    const lens = ctx.lens;
    if (lens === 'everything' || (!ctx.anchor && !lens)) { overview(films[0].key, 'm'); return items; }
    if (Array.isArray(lens)) {
      const [first, ...more] = lens;
      add(el(first, kindOf(first), 'm', f, { must: true }));
      voice(first, ['left']);
      controls();
      let prev = first;
      for (const k of more) { add(el(k, kindOf(k), 'm', f, { parent: prev, sides: ['right', 'bottom'], must: true })); prev = k; }
      for (const k of lens) {
        for (const fk of graph.neighbours(k)) if (kindOf(fk) === 'film') add(el(fk, 'film', 'xs', f, { parent: k, sides: ['bottom'] }));
      }
      return items;
    }
    if (lens === 'region:practice') {
      add(el(heads[0].id, 'head', 'm', f, { must: true }));
      voice(heads[0].id, ['left']);
      controls();
      heads.slice(1).forEach((h, i) => add(el(h.id, 'head', 'm', f, { parent: heads[i].id, sides: ['right', 'bottom'], must: true })));
      // Each step's chapters hang in a column under it.
      for (const h of heads) {
        let prev = h.id;
        for (const c of world.chapters(h.phase)) { add(el(c.key, 'guidance', 'xs', f, { parent: prev, sides: ['bottom'] })); prev = c.key; }
      }
      return items;
    }
    // A record in focus: it, big; the words beside it; what it connects
    // to clamped round it.
    const key = ctx.anchor;
    const kind = kindOf(key);
    add(el(key, kind, kind === 'film' ? 'xl' : 'l', f, { must: true }));
    voice(key, ['left']);
    controls();
    near(key, { paper: 's', film: 's', guidance: 's' }).forEach(add);
    if (kind === 'film') {
      const i = films.findIndex((x) => x.key === key);
      [films[i - 1], films[i + 1]].filter(Boolean).forEach((fm) => add(el(fm.key, 'film', 'xs', f, { parent: key, sides: ['bottom', 'right', 'top'] })));
    }
    if (kind === 'guidance') {
      const g = world.guidance.find((x) => x.key === key);
      const ch = world.chapterOf(g) || g;
      [ch, ...world.pagesUnder(ch)].filter((x) => x.key !== key).forEach((x) => add(el(x.key, 'guidance', 'xs', f, { parent: key, sides: ['bottom', 'right', 'top'] })));
    }
    return items;
  }

  // At rest.
  overview(ctx.feature || films[0].key, 'l');
  return items;
}
