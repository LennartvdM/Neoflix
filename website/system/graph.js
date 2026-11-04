/**
 * How the records hang together — and what each link means.
 *
 * Edges are read off the content, never written here:
 *   film ↔ paper     a finding from the paper, shown in the film
 *   film ↔ guidance  the film's "in practice", which the guidance does
 *   path steps       one after the other
 *   guidance ↔ guidance in the same part of the loop (weak: not drawn on
 *                    the map, used as context on a record)
 *
 * `threadBetween(from, to)` is the sentence that explains a link the
 * reader just followed; a record opens on it (modules/plans.js, thread).
 *
 * Node-safe.
 */
import { parseKey } from './catalog.js';

export function buildGraph(catalog) {
  const edges = [];
  const nbr = new Map();
  const add = (a, b, meta) => {
    edges.push({ a, b, ...meta });
    if (!nbr.has(a)) nbr.set(a, new Set());
    if (!nbr.has(b)) nbr.set(b, new Set());
    nbr.get(a).add(b);
    nbr.get(b).add(a);
  };
  for (const film of catalog.list('film')) {
    const papers = [...new Set(film.findings.map((f) => f.paper))];
    papers.forEach((p) => add(film.key, `paper:${p}`, { kind: 'evidence' }));
    film.guidance.forEach((slug) => add(film.key, `guidance:${slug}`, { kind: 'practice' }));
  }
  const none = new Set();
  const neighbours = (key) => nbr.get(key) || none;

  /** Films a record is linked to, papers behind a guidance record, … */
  const filmsOf = (key) => [...neighbours(key)].filter((k) => k.startsWith('film:')).map(catalog.get).filter(Boolean);
  const papersOf = (key) => {
    const { kind } = parseKey(key);
    if (kind === 'paper') return [];
    if (kind === 'film') return [...neighbours(key)].filter((k) => k.startsWith('paper:')).map(catalog.get);
    return [...new Set(filmsOf(key).flatMap((f) => f.findings.map((x) => `paper:${x.paper}`)))].map(catalog.get);
  };
  const guidanceOf = (key) => {
    const { kind } = parseKey(key);
    if (kind === 'guidance') return [];
    if (kind === 'film') return catalog.get(key).guidance.map((s) => catalog.get(`guidance:${s}`)).filter(Boolean);
    return [...new Set(filmsOf(key).flatMap((f) => f.guidance))].map((s) => catalog.get(`guidance:${s}`)).filter(Boolean);
  };
  /** Sentences from the papers that bear on this record. */
  const findingsOf = (key) => {
    const { kind, id } = parseKey(key);
    if (kind === 'film') return catalog.get(key).findings;
    if (kind === 'paper') return catalog.list('film').flatMap((f) => f.findings.filter((x) => x.paper === id).map((x) => ({ ...x, film: f.id })));
    return filmsOf(key).flatMap((f) => f.findings.map((x) => ({ ...x, film: f.id })));
  };

  function threadBetween(fromKey, toKey) {
    if (!fromKey || fromKey === toKey || !catalog.has(fromKey) || !catalog.has(toKey)) return null;
    const a = parseKey(fromKey), b = parseKey(toKey);
    const onPath = catalog.paths.find((p) => { const i = p.steps.indexOf(fromKey); return i >= 0 && p.steps[i + 1] === toKey; });
    if (onPath) {
      const j = onPath.steps.indexOf(toKey);
      return { kind: 'path', path: onPath.id, text: `Step ${j + 1} of ${onPath.steps.length} on “${onPath.name}”, after ${catalog.label(fromKey)}.` };
    }
    const pick = (k) => (a.kind === k ? a.id : b.kind === k ? b.id : null);
    const P = pick('paper'), G = pick('guidance'), F = pick('film');
    if (P && G) {
      const film = catalog.list('film').find((f) => f.guidance.includes(G) && f.findings.some((x) => x.paper === P));
      const finding = film?.findings.find((x) => x.paper === P);
      if (finding) return { kind: 'evidence', text: finding.text, film: film.id, paper: P };
    }
    if (P && F) {
      const finding = catalog.get(`film:${F}`).findings.find((x) => x.paper === P);
      if (finding) return { kind: 'evidence', text: finding.text, film: F, paper: P };
    }
    if (F && G) {
      const film = catalog.get(`film:${F}`);
      if (film.guidance.includes(G)) return { kind: 'practice', text: film.inPractice, film: F };
    }
    if (a.kind === 'guidance' && b.kind === 'guidance') {
      const ga = catalog.get(fromKey), gb = catalog.get(toKey);
      if (ga.phase && ga.phase === gb.phase) return { kind: 'loop', text: `Both are part of the same step of the loop.` };
    }
    if (a.kind === 'film' && b.kind === 'film') return { kind: 'argument', text: catalog.get(toKey).claim, film: b.id };
    return null;
  }

  return { edges, neighbours, filmsOf, papersOf, guidanceOf, findingsOf, threadBetween };
}
