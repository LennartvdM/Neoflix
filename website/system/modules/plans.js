/**
 * Which modules a record calls for — the rules, kept apart from the
 * React that draws them so the build can check them in plain Node.
 *
 * A plan is { id, span, order, reason, tall?, emph?, data? }:
 *   span    columns of twelve it wants (assemble.js stretches rows)
 *   order   where it goes; lower first. Arrival moves things: a reader
 *           coming from a paper gets the evidence first, from a film
 *           the film first.
 *   reason  why it is on this page, in a phrase — shown when the reader
 *           turns on "Assembly", and the honest answer to "why this
 *           layout?"
 *
 * A module that has nothing to show for a record doesn't plan itself.
 * Add a module: write its rule here, its component in ./index.jsx.
 */
import { KIND_NAME, loopName, parseKey } from '../catalog.js';

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function planRecord(record, ctx, { catalog, graph }) {
  const key = record.key;
  const from = ctx.from && catalog.has(ctx.from) && ctx.from !== key ? ctx.from : null;
  const fromKind = from ? parseKey(from).kind : null;
  const thread = from ? graph.threadBetween(from, key) : null;
  const plans = [];
  const add = (p) => plans.push(p);

  if (thread) add({ id: 'thread', span: 12, order: 0, reason: `you came here from ${KIND_NAME[fromKind].toLowerCase()} “${catalog.label(from)}”`, data: { from, thread } });

  // The front of the library is the toolbox's root record.
  if (key === 'guidance:') {
    add({ id: 'map', span: 12, order: 1, reason: 'the whole library, and how it connects' });
    add({ id: 'pathcards', span: 12, order: 2, reason: `${plural(catalog.paths.length, 'guided path')} through the library` });
    add({ id: 'text', span: 7, order: 3, tall: true, reason: 'the toolbox’s welcome' });
    add({ id: 'loopbrowse', span: 5, order: 4, reason: 'the guidance, in the order of the loop' });
    add({ id: 'paperlist', span: 5, order: 5, reason: 'the six papers' });
    return plans;
  }

  const films = graph.filmsOf(key);
  const findings = graph.findingsOf(key).filter((f) => !thread || f.text !== thread.text);
  const practice = graph.guidanceOf(key);
  const onPaths = catalog.paths.filter((p) => p.steps.includes(key));

  if (record.kind === 'guidance') {
    add({ id: 'text', span: 7, order: 2, tall: true, reason: record.tasks ? `a checklist of ${record.tasks} items to work through` : 'the record’s own text, from the toolbox' });
    if (films.length) add({ id: 'film', span: 5, order: fromKind === 'film' ? 1 : 3, emph: fromKind === 'film', reason: fromKind === 'film' ? 'you came from this film, so it comes first' : `shown in ${plural(films.length, 'film')}`, data: { films: films.map((f) => f.key), lead: fromKind === 'film' ? from : null } });
    if (findings.length) add({ id: 'findings', span: 5, order: fromKind === 'paper' ? 1 : 3, emph: fromKind === 'paper', reason: fromKind === 'paper' ? `you came from Paper ${catalog.get(from).n}; its findings come first` : `rests on ${plural(new Set(findings.map((f) => f.paper)).size, 'paper')}`, data: { findings, lead: fromKind === 'paper' ? parseKey(from).id : null } });
    add({ id: 'sequence', span: 5, order: 5, reason: 'read on in the toolbox’s own order' });
    const sameStep = fromKind === 'guidance' && catalog.get(from).phase === record.phase;
    if (record.phase) add({ id: 'loop', span: 12, order: sameStep ? 1 : 6, reason: sameStep ? 'you are moving within one step of the loop' : `part of “${loopName(record.phase)}”` });
  }

  if (record.kind === 'paper') {
    if (record.found) add({ id: 'found', span: 7, order: 1, reason: 'a paper leads with what it found' });
    if (record.asked || record.changed) add({ id: 'summary', span: 5, order: 2, reason: 'written for this library, not part of the paper' });
    if (practice.length) add({ id: 'practice', span: 5, order: fromKind === 'guidance' ? 1 : 3, emph: fromKind === 'guidance', reason: fromKind === 'guidance' ? 'you came from one of these; it comes first' : `${plural(practice.length, 'guidance record')} put this into practice`, data: { lead: fromKind === 'guidance' ? from : null } });
    if (films.length) add({ id: 'film', span: 7, order: fromKind === 'film' ? 1 : 4, emph: fromKind === 'film', reason: `shown in ${plural(films.length, 'film')}`, data: { films: films.map((f) => f.key), lead: fromKind === 'film' ? from : null } });
    add({ id: 'abstract', span: record.abstract ? 8 : 4, order: 5, reason: record.abstract ? 'open licence: the abstract as published' : 'not under an open licence, so the abstract is at the publisher' });
  }

  if (record.kind === 'film') {
    add({ id: 'player', span: 8, order: 1, reason: 'a film record is the film' });
    add({ id: 'inpractice', span: 4, order: 2, reason: 'what this looks like on a real unit' });
    if (findings.length) add({ id: 'findings', span: 5, order: fromKind === 'paper' ? 1 : 3, emph: fromKind === 'paper', reason: `rests on ${plural(new Set(findings.map((f) => f.paper)).size, 'paper')}`, data: { findings, lead: fromKind === 'paper' ? parseKey(from).id : null } });
    if (practice.length) add({ id: 'practice', span: 7, order: fromKind === 'guidance' ? 1 : 3, emph: fromKind === 'guidance', reason: `${plural(practice.length, 'guidance record')} put this into practice`, data: { lead: fromKind === 'guidance' ? from : null } });
    add({ id: 'sequence', span: 5, order: 5, reason: 'the argument, film by film' });
  }

  if (onPaths.length) add({ id: 'paths', span: 4, order: 7, reason: `a step on ${plural(onPaths.length, 'path')}`, data: { paths: onPaths.map((p) => p.id) } });
  if (record.kind !== 'film') add({ id: 'cite', span: 4, order: 8, reason: 'every record can be cited' });
  return plans;
}
