#!/usr/bin/env node
/**
 * system-check.mjs — the library's integrity, checked before the build.
 *
 * The library (website/system) is content wired together: films point at
 * papers and toolbox pages, paths list records, modules decide layouts.
 * A renamed toolbox page in GitBook, a typo in a path step or a module
 * rule that leaves a ragged row would all still compile. This fails the
 * build instead, naming what broke.
 *
 * Runs after build-docs.mjs (it reads the generated manifest).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, parseKey, LOOP } from '../system/catalog.js';
import { TOUR, CHAPTERS, DOORS, INTERMISSIONS, tourKeys } from '../composition/tour.js';
import { buildGraph } from '../system/graph.js';
import { urlFor, keyForPath } from '../system/urls.js';
import { planRecord } from '../system/modules/plans.js';
import { assemble, rowsOf, COLUMNS } from '../system/assemble.js';
import { searchLibrary } from '../system/search.js';
import { buildAtlas } from '../composition/atlas.js';
import { buildOntology } from '../composition/ontology.js';
import { ontologyLinks, entry, PRACTICES, CLAIMS } from '../system/content/ontology.js';
import { SESSION_FILM, LINES, MOMENTS, SCENES, linesOf } from '../system/content/session-film.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(__dirname, '../generated/docs-manifest.json'), 'utf8'));
const catalog = buildCatalog(manifest);
const graph = buildGraph(catalog);
const lib = { catalog, graph };
const readingsIndex = JSON.parse(await fs.readFile(path.join(__dirname, '../generated/readings-index.json'), 'utf8').catch(() => '{}'));

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`FAIL  ${msg}`); };
const check = (label, fn) => { const before = failures; fn(); if (failures === before) console.log(`  ok  ${label}`); };

console.log(`[system-check] ${catalog.records.size} records`);

check('films point at papers and toolbox pages that exist', () => {
  for (const f of catalog.list('film')) {
    f.findings.forEach((x) => catalog.has(`paper:${x.paper}`) || fail(`film:${f.id} cites unknown paper "${x.paper}"`));
    f.guidance.forEach((s) => catalog.has(`guidance:${s}`) || fail(`film:${f.id} leads to unknown toolbox page "${s}" (renamed in GitBook?)`));
  }
});

check('every path step is a record', () => {
  for (const p of catalog.paths) p.steps.forEach((k) => catalog.has(k) || fail(`path ${p.id}: unknown step "${k}"`));
});

check('every tour stop points at a record that exists', () => {
  for (const k of tourKeys()) catalog.has(k) || fail(`tour: unknown record "${k}"`);
  for (const s of TOUR) {
    if (s.chapter && !CHAPTERS.some((c) => c.id === s.chapter)) fail(`tour stop ${s.id}: unknown chapter "${s.chapter}"`);
    const m = /^column:(.+)$/.exec(Array.isArray(s.at) ? '' : s.at);
    if (m && !LOOP.some((l) => l.id === m[1])) fail(`tour stop ${s.id}: no column "${m[1]}"`);
  }
  for (const d of DOORS) if (d.path && !catalog.path(d.path)) fail(`tour door ${d.id}: unknown path "${d.path}"`);
  for (const im of INTERMISSIONS) {
    if (!TOUR.some((s) => s.id === im.after)) fail(`intermission ${im.concept}: no stop "${im.after}"`);
    if (!entry(`concept:${im.concept}`)) fail(`intermission: unknown concept "${im.concept}"`);
  }
});

check('every record has one address that maps back to it', () => {
  for (const key of catalog.records.keys()) {
    const url = urlFor(key);
    const back = keyForPath(url);
    if (back !== key) fail(`${key} → ${url} → ${back}`);
  }
});

check('every guidance record sits in a step of the loop', () => {
  for (const g of catalog.list('guidance')) if (!g.phase) fail(`${g.key} has no step of the loop`);
});

check('every drawn link explains itself (threadBetween)', () => {
  for (const e of graph.edges) {
    if (!graph.threadBetween(e.a, e.b)) fail(`no thread from ${e.a} to ${e.b}`);
    if (!graph.threadBetween(e.b, e.a)) fail(`no thread from ${e.b} to ${e.a}`);
  }
});

check(`every assembled layout fills rows of ${COLUMNS}, from every arrival`, () => {
  for (const r of catalog.records.values()) {
    const arrivals = [null, ...graph.neighbours(r.key)];
    for (const from of arrivals) {
      const plans = planRecord(r, { from }, lib);
      if (!plans.length) fail(`${r.key} assembled nothing`);
      const items = assemble(plans);
      const placed = items.flatMap((it) => (it.stack ? it.stack : [it.module])).length;
      if (placed !== plans.length) fail(`${r.key} (from ${from}): ${plans.length} modules planned, ${placed} placed`);
      for (const row of rowsOf(items)) {
        const sum = row.reduce((n, it) => n + it.span, 0);
        if (sum !== COLUMNS) fail(`${r.key} (from ${from}): a row of ${sum} columns`);
      }
      plans.forEach((p) => p.reason || fail(`${r.key}: module ${p.id} gives no reason`));
    }
  }
});

check('search finds what it should', () => {
  for (const [q, want] of [['consent', 'guidance:level-2-in-action/5.-preparation-and-consent'], ['vocal cords', 'paper:drivingresearch'], ['chair', 'guidance:level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair']]) {
    const { hits } = searchLibrary(q, lib);
    if (!hits.some((h) => h.key === want)) fail(`search "${q}" doesn't find ${want}`);
  }
});

// The site is an atlas of pages (composition/atlas.js): the story down,
// depth to the right. Every record must have a page somewhere in it, and
// every move from every page must land on a page.
check('every record has a page in the atlas, and every move lands', () => {
  const atlas = buildAtlas(catalog, graph, readingsIndex);
  for (const k of catalog.records.keys()) if (!atlas.home.has(k)) fail(`atlas: no page for ${k}`);
  const walk = (n, addr) => {
    for (const d of ['down', 'up', 'right', 'left']) {
      const to = atlas.move(addr, d, new Map());
      if (to && !atlas.at(to)) fail(`atlas: ${d} from ${addr.join('.')} lands nowhere`);
    }
    n.kids.forEach((k, i) => walk(k, [...addr, i]));
  };
  atlas.spine.forEach((n, i) => walk(n, [i]));
});

// What every page shows comes from the ontology (composition/ontology.js):
// what the reader needs, at most three things they could want, nothing
// else. Check every page of the atlas: the need is there (a record's
// own modules exist for it, a set isn't empty), the wants are few and
// real, and none of them is the page itself.
check('every page gives what is needed, and no more than three wants', () => {
  const atlas = buildAtlas(catalog, graph, readingsIndex);
  const { pageOf } = buildOntology({ catalog, graph, readings: readingsIndex });
  const walk = (n, addr) => {
    const name = `${addr.join('.')} (${n.key || n.id})`;
    const page = pageOf(n);
    if (page.want.length > 3) fail(`${name}: ${page.want.length} wants`);
    for (const w of page.want) {
      if (w.path ? !catalog.path(w.path) : !catalog.has(w.key)) fail(`${name}: wants something that doesn't exist (${w.key})`);
      if (w.key === n.key) fail(`${name}: wants itself`);
      if (!w.why || !w.title) fail(`${name}: a want without its reason`);
    }
    if (page.layout === 'list' && !page.list.length) fail(`${name}: a set with nothing in it`);
    if (page.layout === 'read') {
      const plans = planRecord(catalog.get(n.key), {}, lib).map((p) => p.id);
      const missing = page.modules.filter((m) => !plans.includes(m));
      if (!page.figure && page.modules.length - missing.length === 0) fail(`${name}: a record page with nothing of its own to show`);
    }
    n.kids.forEach((k, i) => walk(k, [...addr, i]));
  };
  atlas.spine.forEach((n, i) => walk(n, [i]));
});

// The ontology (system/content/ontology.js) names what the material is
// made of (claims, findings, concepts, practices, roles, units) and links
// it. Every link must land, on the catalogue or on the ontology itself.
check('the ontology holds together', () => {
  for (const [from, to] of ontologyLinks()) {
    const ok = catalog.has(to) || !!entry(to);
    if (!ok) fail(`ontology: ${from} points at "${to}", which doesn't exist`);
  }
  for (const p of PRACTICES) if (!LOOP.some((l) => l.id === p.step)) fail(`ontology: practice:${p.id} in an unknown step "${p.step}"`);
  for (const f of catalog.list('film')) if (!CLAIMS.some((c) => c.film === f.key)) fail(`ontology: ${f.key} illustrates no claim`);
});

// The papers as readings (system/content/readings): an open-licence
// paper's passages are its own words (checked against the PDF by
// tooling when written; see the readings README); here, everything we
// layered on must hold: notes and morsels sit on passages that exist,
// a morsel is an exact substring of its passage, every link lands, and
// an intermission names a concept that exists.
{
  const dir = path.join(__dirname, '../system/content/readings');
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json'));
  const before = failures;
  for (const f of files) {
    const r = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
    const name = `reading ${r.id}`;
    if (!catalog.has(`paper:${r.id}`)) fail(`${name}: no such paper`);
    const passages = new Map(r.sections.flatMap((s) => s.passages.map((p) => [p.id, p])));
    for (const n of r.notes || []) {
      if (!passages.has(n.at)) fail(`${name}: a note on unknown passage ${n.at}`);
      for (const k of n.links || []) if (!catalog.has(k) && !entry(k)) fail(`${name}: note links to unknown ${k}`);
    }
    for (const m of r.morsels || []) {
      const p = passages.get(m.at);
      if (!p) fail(`${name}: a morsel on unknown passage ${m.at}`);
      else if (!p.text.includes(m.quote)) fail(`${name}: morsel isn't an exact substring of ${m.at}`);
      for (const k of m.tags || []) if (!catalog.has(k) && !entry(k)) fail(`${name}: morsel tagged with unknown ${k}`);
    }
    for (const im of r.intermissions || []) {
      if (!entry(`concept:${im.concept}`)) fail(`${name}: intermission with unknown concept ${im.concept}`);
      if (!r.sections.some((s) => s.id === im.after)) fail(`${name}: intermission after unknown section ${im.after}`);
    }
    if (r.kind === 'reading' && !r.licence) fail(`${name}: a verbatim reading needs an open licence`);
  }
  if (failures === before) console.log(`  ok  the readings hold together (${files.length})`);
}

// The session film, cut up (system/content/session-film.js): every moment
// covers real lines inside the film and is tagged with things that exist;
// scenes tile the film in order.
check('the session film’s moments hold together', () => {
  for (const m of MOMENTS) {
    if (!(m.from < m.to && m.to <= SESSION_FILM.length)) fail(`session film: moment ${m.id} has a bad range`);
    if (!linesOf(m).length) fail(`session film: moment ${m.id} covers no lines`);
    for (const k of m.tags) if (!catalog.has(k) && !entry(k)) fail(`session film: moment ${m.id} tagged with unknown ${k}`);
  }
  SCENES.forEach((s, i) => { if (i && s.from !== SCENES[i - 1].to) fail(`session film: scene ${s.id} doesn't follow the one before`); });
  if (LINES.some((l, i) => i && l.t < LINES[i - 1].t)) fail('session film: lines out of order');
});

check('kinds are the three the site knows', () => {
  for (const key of catalog.records.keys()) if (!['guidance', 'paper', 'film'].includes(parseKey(key).kind)) fail(`odd key ${key}`);
});

if (failures) {
  console.error(`[system-check] ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('[system-check] the library holds together');
