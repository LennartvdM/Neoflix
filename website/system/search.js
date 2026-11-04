/**
 * Search that assembles itself around the query. Pure and Node-safe:
 * given a query it returns the matches and the modules the results page
 * calls for — a best match, where the matches sit on the map, the loop
 * when the matches gather in one step of it, the papers' sentences that
 * use the words, then the matches by kind.
 */
import { LOOP } from './catalog.js';

const norm = (s) => String(s || '').toLowerCase();

export function searchLibrary(query, { catalog, graph }) {
  const q = norm(query).trim();
  if (!q) return { q, hits: [], plans: [], sentences: [] };
  const words = q.split(/\s+/).filter(Boolean);
  const textOf = (r) => (r.kind === 'paper' ? [r.title, r.short, r.found, r.asked, r.changed].join(' ') : r.kind === 'film' ? [r.name, r.claim, r.caption, r.inPractice].join(' ') : [r.title, r.excerpt, r.description].join(' '));
  const titleOf = (r) => (r.kind === 'paper' ? `${r.short} ${r.title}` : r.kind === 'film' ? `${r.name} ${r.claim}` : r.title);
  const score = (r) => {
    const t = norm(titleOf(r)), b = norm(textOf(r));
    if (!words.every((w) => b.includes(w) || t.includes(w))) return 0;
    return words.reduce((s, w) => s + (t.includes(w) ? 3 : 0) + (b.includes(w) ? 1 : 0), 0) + (t.includes(q) ? 4 : 0);
  };
  const hits = [...catalog.records.values()].filter((r) => r.key !== 'guidance:').map((r) => ({ r, s: score(r) })).filter((h) => h.s > 0).sort((a, b) => b.s - a.s || a.r.order - b.r.order).map((h) => h.r);
  const sentences = [
    ...catalog.list('film').flatMap((f) => f.findings.map((x) => ({ ...x, film: f.id }))),
    ...catalog.list('paper').map((p) => ({ paper: p.id, text: p.found })),
  ].filter((x, i, all) => words.every((w) => norm(x.text).includes(w)) && all.findIndex((y) => y.text === x.text) === i);
  const by = (k) => hits.filter((r) => r.kind === k);
  const plans = [];
  if (hits[0]) plans.push({ id: 'top', span: 7, order: 0, reason: 'the strongest match for your words', data: { key: hits[0].key } });
  if (hits.length > 1) plans.push({ id: 'where', span: 5, order: 1, reason: `${hits.length} matches, lit on the map` });
  const named = LOOP.find((l) => q.length > 2 && norm(l.name).includes(q));
  const counts = LOOP.map((l) => ({ l, n: by('guidance').filter((g) => g.phase === l.id).length })).filter((x) => x.n);
  const gathered = counts.sort((a, b) => b.n - a.n)[0];
  if (named || (gathered && gathered.n >= 3 && gathered.n / by('guidance').length > 0.5)) {
    const step = named || gathered.l;
    plans.push({ id: 'loop', span: 12, order: 2, reason: named ? `“${query}” is a step of the loop` : `most of the guidance found is in “${step.name}”`, data: { step: step.id, named: !!named } });
  }
  if (sentences.length) plans.push({ id: 'sentences', span: 7, order: 3, reason: `${sentences.length} sentence${sentences.length === 1 ? '' : 's'} from the papers use these words`, data: { sentences: sentences.slice(0, 6) } });
  if (by('paper').length) plans.push({ id: 'papers', span: 5, order: 4, reason: `${by('paper').length} paper${by('paper').length === 1 ? '' : 's'}` });
  if (by('film').length) plans.push({ id: 'films', span: by('film').length > 2 ? 12 : 5, order: 5, reason: `${by('film').length} film${by('film').length === 1 ? '' : 's'}` });
  if (by('guidance').length) plans.push({ id: 'guidance', span: 7, order: 6, reason: `${by('guidance').length} guidance record${by('guidance').length === 1 ? '' : 's'}` });
  return { q, hits, plans, sentences };
}
