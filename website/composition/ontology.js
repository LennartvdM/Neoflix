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
 *   rest   everything else in the library. Not on the page. It is
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

export function buildOntology({ catalog, graph }) {
  // A want: a record, why it's offered, and its own line.
  const evidence = (key, about) => {
    const f = graph.findingsOf(about).find((x) => `paper:${x.paper}` === key);
    const p = catalog.get(key);
    return { key, why: 'The evidence', title: `Paper ${p.n} · ${p.short}`, line: f?.text || first(p.found) };
  };
  const practice = (key) => {
    const g = catalog.get(key);
    return { key, why: 'How to do it', title: `${g.number ? `${g.number} ` : ''}${g.title}`, line: first(g.excerpt) };
  };
  const onFilm = (key) => {
    const f = catalog.get(key);
    return { key, why: 'On film', title: f.name, line: f.claim };
  };

  /** What a record's reader could want next (≤ 2). */
  const wantsOf = (key) => {
    const k = kindOf(key);
    const papers = graph.papersOf(key).map((p) => p.key);
    const guides = graph.guidanceOf(key).map((g) => g.key);
    const films = graph.filmsOf(key).map((f) => f.key);
    if (k === 'film') return cap([papers[0] && evidence(papers[0], key), guides[0] && practice(guides[0])], 2);
    if (k === 'paper') return cap([films[0] && onFilm(films[0]), guides[0] && practice(guides[0])], 2);
    return cap([papers[0] && evidence(papers[0], key), films[0] && onFilm(films[0])], 2);
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
    if (node.kind === 'record') {
      const r = catalog.get(node.key);
      if (!r) return { layout: 'read', modules: [], want: [] };
      return { layout: 'read', figure: r.kind === 'film' ? r.key : null, modules: NEED[r.kind] || [], want: wantsOf(node.key) };
    }
    // A stop of the story.
    const s = node.stop;
    const paths = catalog.paths.map((p) => ({ path: p.id, key: `path:${p.id}`, why: 'A path', title: p.name, line: p.blurb }));
    if (s.doors) return { layout: 'cover', figure: node.index === 0 ? 'film:team' : null, want: cap(paths, 3) };
    if (Array.isArray(s.at)) return { layout: 'list', list: s.at, want: [] };
    if (s.at === 'region:practice') return { layout: 'list', list: node.kids.map((k) => `step:${k.phase}`), want: [] };
    if (/^column:/.test(s.at)) return { layout: 'list', list: node.kids.map((k) => k.key), want: [] };
    if (catalog.has(s.at)) return { layout: 'figure', figure: s.at, want: wantsOf(s.at) };
    return { layout: 'figure', want: [] };
  }

  return { pageOf, wantsOf };
}
