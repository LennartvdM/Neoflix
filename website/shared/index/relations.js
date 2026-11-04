/**
 * The site's things and how they hang together.
 *
 * Neoflix is three small sets: the six beats of the argument (one per
 * clip), the five parts of the loop (the toolbox), and the six papers.
 * Every page is an interface onto the same sets, arranged for what that
 * page is for — the homepage plays the beats as film, /neoflix crosses
 * beats with the loop, /publications puts the papers on their years, the
 * toolbox walks the loop. A thing is named by a token, `kind:id`
 * ("beat:cost", "loop:reflect", "paper:providers"), the same string on
 * every page, so the navbar index, the pages and the carry between them
 * can all point at it.
 *
 * Relations are read off shared/argument.js, never written here: a beat
 * relates to the papers it cites and to the loop parts its exits lead to.
 */
import { BEATS, LOOP, PAPERS, beatById, loopOfSlug } from '../argument';
import { ARC } from '../../pages/publications/arc';

export const token = (kind, id) => `${kind}:${id}`;
export const parseToken = (t) => {
  const i = (t || '').indexOf(':');
  return i < 0 ? { kind: null, id: null } : { kind: t.slice(0, i), id: t.slice(i + 1) };
};

export const PAPER_IDS = Object.keys(PAPERS);

const EDGES = new Map();
const link = (a, b) => {
  if (!EDGES.has(a)) EDGES.set(a, new Set());
  if (!EDGES.has(b)) EDGES.set(b, new Set());
  EDGES.get(a).add(b);
  EDGES.get(b).add(a);
};
BEATS.forEach((b) => {
  const t = token('beat', b.id);
  b.papers.forEach((p) => link(t, token('paper', p)));
  b.exits.forEach((e) => {
    const part = loopOfSlug(e.slug);
    if (part) link(t, token('loop', part));
  });
});
const NONE = new Set();
export const relatedTo = (t) => EDGES.get(t) || NONE;

/** Where a thing lives: the one place a click on its token goes. */
export function hrefFor(t) {
  const { kind, id } = parseToken(t);
  if (kind === 'beat') return `/neoflix#${id}`;
  if (kind === 'paper') return `/publications#${id}`;
  if (kind === 'loop') {
    const part = LOOP.find((l) => l.id === id);
    return part?.entry ? `/toolbox/${part.entry}` : '/toolbox';
  }
  return '/';
}

export function nameOf(t) {
  const { kind, id } = parseToken(t);
  if (kind === 'beat') return beatById(id)?.name || id;
  if (kind === 'paper') return `Paper ${PAPERS[id]?.n} · ${ARC[id]?.short || ''}`;
  if (kind === 'loop') return LOOP.find((l) => l.id === id)?.name || id;
  return '';
}

/** Which page holds which set: the index groups, in navbar order. */
export const SETS = [
  { kind: 'beat', label: 'Neoflix', to: '/neoflix', tokens: BEATS.map((b) => token('beat', b.id)) },
  { kind: 'paper', label: 'Publications', to: '/publications', tokens: PAPER_IDS.map((id) => token('paper', id)) },
  { kind: 'loop', label: 'Toolbox', to: '/toolbox', tokens: LOOP.map((l) => token('loop', l.id)) },
];
