/**
 * The library's catalogue: every record on the site, one shape.
 *
 * Neoflix is three kinds of record — guidance (the toolbox's pages),
 * papers and films — plus the paths that run through them. A record is
 * named by a key, `kind:id` ("guidance:welcome/quick-start",
 * "paper:providers", "film:team"), the same string everywhere: in URLs'
 * `from=` and `path=`, in the trail, in the session pack, in checks.
 *
 * Node-safe on purpose: the build (routes, sitemap, system-check) and the
 * browser read the same catalogue. Nothing here may import JSON, assets
 * or import.meta — the toolbox manifest is passed in.
 */
import { FILMS } from './content/films.js';
import { PAPER_NOTES } from './content/papers.js';
import { PATHS } from './content/paths.js';
import { publicationRecords, publicationOrder } from '../pages/publications/records.js';

export const KINDS = ['guidance', 'paper', 'film'];
export const KIND_NAME = { guidance: 'Guidance', paper: 'Paper', film: 'Film' };

export const keyOf = (kind, id) => `${kind}:${id}`;
export function parseKey(key) {
  const i = String(key || '').indexOf(':');
  return i < 0 ? { kind: null, id: null } : { kind: key.slice(0, i), id: key.slice(i + 1) };
}

/**
 * The loop — the five parts of running video review, and the order the
 * toolbox already follows: Welcome + Level 1 come before you record;
 * Level 2 splits at its RECORD / REFLECT / REFINE dividers (chapters
 * 5–9, 10–11, 12–16); Level 3 is keeping it going.
 */
export const LOOP = [
  { id: 'before', name: 'Before you record' },
  { id: 'record', name: 'Record' },
  { id: 'reflect', name: 'Reflect' },
  { id: 'refine', name: 'Refine' },
  { id: 'keep', name: 'Keep going' },
];
export const loopName = (id) => LOOP.find((l) => l.id === id)?.name || '';

export function loopOfSlug(slug = '') {
  if (!slug || slug.startsWith('welcome') || slug.startsWith('level-1')) return 'before';
  if (slug.startsWith('level-3')) return 'keep';
  if (!slug.startsWith('level-2')) return null;
  const rest = slug.slice(slug.indexOf('/') + 1);
  const divider = /^(record|reflect|refine)(\/|$)/.exec(rest);
  if (divider) return divider[1];
  const n = parseFloat(/^(\d+(?:\.\d+)?)/.exec(rest)?.[1]);
  if (!n) return 'record';
  return n < 10 ? 'record' : n < 12 ? 'reflect' : 'refine';
}

// "11.3 Tasks of the chair" → { number: '11.3', title: 'Tasks of the chair' }
function splitNumber(title = '') {
  const m = /^(\d+(?:\.\d+)*)\.?\s+(.*)$/.exec(title.trim());
  return m ? { number: m[1], title: m[2] } : { number: null, title: title.trim() };
}

/**
 * Build the catalogue from the toolbox manifest ({ sections, pages },
 * written by scripts/build-docs.mjs), the paper records and the films.
 */
export function buildCatalog(manifest = {}) {
  const records = new Map();
  const sections = manifest.sections || [];
  const pages = manifest.pages || {};

  let order = 0;
  const walk = (items, section) => {
    for (const item of items || []) {
      const meta = pages[item.slug] || {};
      const { number, title } = splitNumber(item.title);
      records.set(keyOf('guidance', item.slug), {
        key: keyOf('guidance', item.slug),
        kind: 'guidance',
        id: item.slug,
        title: title || meta.title || 'Toolbox',
        number,
        section: section.title,
        phase: loopOfSlug(item.slug),
        excerpt: meta.excerpt || null,
        description: meta.description || null,
        tasks: meta.tasks || 0,
        // The toolbox's section dividers ("RECORD", "LEVEL 3: GROWTH"):
        // real pages, but signposts — lists put them after the content.
        divider: /[A-Z]{3}/.test(title) && title === title.toUpperCase(),
        order: order++,
      });
      walk(item.children, section);
    }
  };
  sections.forEach((s) => walk(s.items, s));

  publicationOrder.forEach((id, i) => {
    const r = publicationRecords[id];
    const notes = PAPER_NOTES[id] || {};
    if (!r) return;
    records.set(keyOf('paper', id), {
      key: keyOf('paper', id),
      kind: 'paper',
      id,
      n: i + 1,
      title: r.title,
      short: notes.short || r.title,
      year: r.year,
      journal: r.journal,
      doi: r.doi || null,
      authors: r.authors || [],
      abstract: r.abstract || null,
      licence: r.licence || null,
      asked: notes.asked || null,
      found: notes.found || null,
      changed: notes.changed || null,
      order: i,
    });
  });

  FILMS.forEach((f, i) => {
    records.set(keyOf('film', f.id), { key: keyOf('film', f.id), kind: 'film', ...f, title: f.claim, order: i });
  });

  const list = (kind) => [...records.values()].filter((r) => r.kind === kind).sort((a, b) => a.order - b.order);
  return {
    records,
    get: (key) => records.get(key) || null,
    has: (key) => records.has(key),
    list,
    paths: PATHS,
    path: (id) => PATHS.find((p) => p.id === id) || null,
    /** Short display name — what a link or a node label says. */
    label(key) {
      const r = records.get(key);
      if (!r) return '';
      return r.kind === 'paper' ? r.short : r.kind === 'film' ? r.name : r.title;
    },
  };
}
