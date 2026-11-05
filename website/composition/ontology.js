/**
 * The ontology: what each page gives the reader.
 *
 * Three tiers, and the discipline is in keeping them apart:
 *
 *   need   what the page is about, in full: the story's words and the
 *          one film, paper or page they're about; a record's own
 *          content. It is always there and it is the biggest thing.
 *   want   what the reader could want next, without competing with what
 *          they need: at most three things, each with one line saying
 *          why ("the evidence: 8 of 20 infants weren't breathing at
 *          birth"). Small, to one side, never another index.
 *   adjacent  what lies right beside the subject, percolating out of it:
 *          a few neighbours (the films either side, the films that share
 *          its evidence, its papers, the pages beside it), small, at the
 *          subject's edges, quiet until pointed at. Not a list and not
 *          a want: the sense that the thing you're looking at sits in a
 *          body of material, and the nearest of it is one click away.
 *   rest   everything else in the library.
 *
 * And a grammar of overlap, for where things sit relative to the subject:
 *   over      part of it: its own record, laid over its edge (a film's
 *             chip on its scene)
 *   under     what it rests on: the evidence, tucked beneath its edge,
 *             peeking out; pull it out to read the finding (`under`)
 *   separate  somewhere else you could go: the wants and the neighbours,
 *             apart from it, joined to it or tethered away by an edge Not on the page. It is
 *          reachable (the sidebar, down, right) but the page doesn't
 *          spend the reader's attention listing it.
 *
 * A "list" is a need when the page is about a set: the six papers, the
 * five steps of the loop, a step's chapters, a path's steps.
 *
 * Wants are chosen by what a record rests on (system/graph.js) in the
 * order a reader needs it: a film's evidence, then its practice; a
 * paper's film, then its practice; a toolbox page's evidence, then the
 * film where it happens. The line under each is the content's own
 * sentence (the finding, the excerpt, the claim), never made up here.
 *
 * Node-safe: system-check.mjs checks every page of the atlas against it.
 */
const kindOf = (key) => key.slice(0, key.indexOf(':'));
const first = (s) => (s ? String(s).split(/(?<=[.!?])\s/)[0] : '');

/** At most `n`, in the order given, once each. */
const cap = (list, n) => {
  const seen = new Set();
  return list.filter((w) => w && !seen.has(w.key) && seen.add(w.key)).slice(0, n);
};

import { claimOfFilm } from '../system/content/ontology.js';

export function buildOntology({ catalog, graph, readings = {} }) {
  // The paper's own sentence that best fits a subject, when its reading
  // has one (a verbatim morsel tagged with the subject or its claim).
  const quoteFor = (paperKey, subject) => {
    const r = readings[paperKey.slice(6)];
    if (!r || r.kind !== 'reading') return null;
    const want = new Set([subject, claimOfFilm(subject) && `claim:${claimOfFilm(subject).id}`].filter(Boolean));
    return r.morsels.find((m) => (m.tags || []).some((t) => want.has(t))) || null;
  };
  // A want: a record, why it's offered, and its own line.
  const evidence = (key, about) => {
    const f = graph.findingsOf(about).find((x) => `paper:${x.paper}` === key);
    const p = catalog.get(key);
    return { key, type: 'evidence', why: 'The evidence', title: `Paper ${p.n} · ${p.short}`, line: f?.text || first(p.found) };
  };
  const practice = (key) => {
    const g = catalog.get(key);
    return { key, type: 'practice', why: 'How to do it', title: `${g.number ? `${g.number} ` : ''}${g.title}`, line: first(g.excerpt) };
  };
  const onFilm = (key) => {
    const f = catalog.get(key);
    return { key, type: 'film', why: 'On film', title: f.name, line: f.claim };
  };

  /**
   * What a subject rests on, shown tucked under it (≤ 3): the papers
   * behind a film or a toolbox page, each with the finding that ties it
   * to this subject. A paper rests on nothing here.
   */
  const underOf = (key) => {
    if (kindOf(key) === 'paper') return [];
    // Where the paper has a sentence of its own for this, it's quoted
    // word for word (from its reading) instead of our paraphrase.
    return graph.papersOf(key).slice(0, 3).map((p) => {
      const e = evidence(p.key, key);
      const q = quoteFor(p.key, key);
      return q ? { ...e, line: q.quote, quoted: true } : e;
    });
  };

  /**
   * What a record's reader could want next (≤ 2). With `under` shown, the
   * evidence is already there, beneath the subject, so the wants are the
   * ways onward instead.
   */
  const wantsOf = (key, { under = false } = {}) => {
    const k = kindOf(key);
    const papers = graph.papersOf(key).map((p) => p.key);
    const guides = graph.guidanceOf(key).map((g) => g.key);
    const films = graph.filmsOf(key).map((f) => f.key);
    if (k === 'film' && under) return cap([guides[0] && practice(guides[0]), guides[1] && practice(guides[1])], 2);
    if (k === 'guidance' && under) return cap([films[0] && onFilm(films[0]), films[1] && onFilm(films[1])], 2);
    if (k === 'film') return cap([papers[0] && evidence(papers[0], key), guides[0] && practice(guides[0])], 2);
    if (k === 'paper') return cap([films[0] && onFilm(films[0]), guides[0] && practice(guides[0])], 2);
    return cap([papers[0] && evidence(papers[0], key), films[0] && onFilm(films[0])], 2);
  };

  /**
   * What lies beside a record, percolating out of it (≤ 4), not counting
   * what the page already offers. Films first: they're the pictures.
   */
  const films = catalog.list('film');
  const percolateOf = (key, taken = []) => {
    const skip = new Set([key, ...taken]);
    const k = kindOf(key);
    const out = [];
    const add = (x) => { if (x && catalog.has(x) && !skip.has(x)) { skip.add(x); out.push(x); } };
    if (k === 'film') {
      const i = films.findIndex((f) => f.key === key);
      add(films[i + 1]?.key);
      add(films[i - 1]?.key);
      // Films that rest on the same evidence.
      const mine = new Set(graph.papersOf(key).map((p) => p.key));
      films.filter((f) => graph.papersOf(f.key).some((p) => mine.has(p.key))).forEach((f) => add(f.key));
      graph.papersOf(key).forEach((p) => add(p.key));
    } else if (k === 'paper') {
      graph.filmsOf(key).forEach((f) => add(f.key));
      const r = catalog.get(key);
      catalog.list('paper').filter((p) => p.year === r.year).forEach((p) => add(p.key));
    } else {
      graph.filmsOf(key).forEach((f) => add(f.key));
      const list = catalog.list('guidance').filter((g) => !g.divider && g.phase === catalog.get(key).phase);
      const i = list.findIndex((g) => g.key === key);
      add(list[i + 1]?.key);
      add(list[i - 1]?.key);
    }
    return out.slice(0, 4);
  };

  // A record's own content: which of the library's modules (system/
  // modules) are its need. The rest (citations, abstracts, the loop map,
  // "read on") are actions in its title block or are the atlas itself.
  const NEED = { film: ['inpractice'], paper: ['found', 'summary'], guidance: ['text'] };

  /**
   * The page for an atlas node (or a search, { kind: 'search', hits }).
   * Returns { layout, figure?, list?, modules?, want }:
   *   layout  'figure' (words + one thing), 'list' (words + a set),
   *           'read' (a record), 'cover'
   */
  function pageOf(node) {
    if (node.kind === 'search') return { layout: 'list', list: node.hits.slice(0, 9), want: [] };
    if (node.kind === 'path') return { layout: 'list', list: node.kids.map((k) => k.key), ordered: true, want: [] };
    if (node.kind === 'step') return { layout: 'list', list: node.kids.map((k) => k.key), want: [] };
    // An intermission: the explainer alone, edge to edge. Nothing else.
    if (node.kind === 'pause') return { layout: 'pause', concept: node.concept, want: [] };
    // A paper as a reading (its own words) or as our notes on it.
    if (node.kind === 'section') return { layout: 'paper', paper: node.paper, section: node.section, want: [] };
    if (node.kind === 'synopsis') return { layout: 'synopsis', paper: node.paper, want: [] };
    if (node.kind === 'record') {
      const r = catalog.get(node.key);
      if (!r) return { layout: 'read', modules: [], want: [] };
      const want = wantsOf(node.key);
      return { layout: 'read', figure: r.kind === 'film' ? r.key : null, modules: NEED[r.kind] || [], want, adjacent: percolateOf(node.key, want.map((w) => w.key)) };
    }
    // A stop of the story.
    const s = node.stop;
    const paths = catalog.paths.map((p) => ({ path: p.id, key: `path:${p.id}`, type: 'path', why: 'A path', title: p.name, line: p.blurb }));
    if (s.doors) return { layout: 'cover', figure: node.index === 0 ? 'film:team' : null, want: cap(paths, 3), adjacent: node.index === 0 ? percolateOf('film:team') : [] };
    if (Array.isArray(s.at)) return { layout: 'list', list: s.at, want: [] };
    if (s.at === 'region:practice') return { layout: 'list', list: node.kids.map((k) => `step:${k.phase}`), want: [] };
    if (/^column:/.test(s.at)) return { layout: 'list', list: node.kids.map((k) => k.key), want: [] };
    if (catalog.has(s.at)) {
      const under = underOf(s.at);
      const want = wantsOf(s.at, { under: under.length > 0 });
      return { layout: 'figure', figure: s.at, want, under, adjacent: percolateOf(s.at, [...want, ...under].map((w) => w.key)) };
    }
    return { layout: 'figure', want: [] };
  }

  return { pageOf, wantsOf, percolateOf, underOf };
}
