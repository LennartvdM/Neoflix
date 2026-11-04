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
import { TOUR, CHAPTERS, DOORS, tourKeys } from '../composition/tour.js';
import { buildGraph } from '../system/graph.js';
import { urlFor, keyForPath } from '../system/urls.js';
import { planRecord } from '../system/modules/plans.js';
import { assemble, rowsOf, COLUMNS } from '../system/assemble.js';
import { searchLibrary } from '../system/search.js';
import { buildWorld, itemsFor } from '../composition/contexts.js';
import { assemble as magnetAssemble } from '../composition/magnet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(__dirname, '../generated/docs-manifest.json'), 'utf8'));
const catalog = buildCatalog(manifest);
const graph = buildGraph(catalog);
const lib = { catalog, graph };

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

// The composition assembles itself: elements clamp to each other by
// context, and nobody looks at most of what it makes. Assemble every
// tour stop, every record open (with rough module sizes), the resting
// screen with each film in front and every step of the loop, at desktop
// size, and fail if elements overlap, leave the screen, or something a
// context can't do without has nowhere to go.
check('the composition assembles every context', () => {
  const world = buildWorld(catalog);
  const bounds = { x: 20, y: 70, w: 1400, h: 812 };
  const voice = { w: 400, h: 520 };
  const at = (s) => (s.at === 'everything' ? { lens: 'everything' } : Array.isArray(s.at) || /^(column|region):/.test(s.at) ? { lens: s.at } : { anchor: s.at });
  const cases = [
    ...TOUR.map((s) => [`tour stop ${s.id}`, { mode: 'tour', ...at(s), voice, controls: { w: 400, h: 100 } }]),
    ...catalog.list('film').map((f) => [`resting on ${f.key}`, { mode: 'rest', feature: f.key, voice: { w: 400, h: 600 } }]),
    ...LOOP.map((l) => [`step ${l.id}`, { mode: 'step', lens: `column:${l.id}`, voice: { w: 400, h: 300 } }]),
    ...[...catalog.records.keys()].filter((k) => !catalog.get(k).divider).map((k) => {
      const modules = planRecord(catalog.get(k), {}, lib).filter((p) => !['map', 'loop', 'loopbrowse', 'paperlist', 'player'].includes(p.id))
        .map((p) => ({ id: `mod:${p.id}`, w: p.id === 'text' ? 560 : 360, h: p.id === 'text' ? 700 : 260, scalable: false }));
      return [`reading ${k}`, { mode: 'read', anchor: k, modules, voice: { w: 380, h: 420 } }];
    }),
  ];
  for (const [name, ctx] of cases) {
    const items = itemsFor(world, ctx, graph, 1);
    const { rects, dropped } = magnetAssemble(items, { bounds, gap: 10 });
    for (const id of dropped) if (items.find((i) => i.id === id)?.must) fail(`${name}: ${id} has nowhere to clamp`);
    const vis = [...rects.entries()];
    for (const [id, q] of vis) {
      if (q.x < bounds.x - 1 || q.y < bounds.y - 1 || q.x + q.w > bounds.x + bounds.w + 1 || q.y + q.h > bounds.y + bounds.h + 1) fail(`${name}: ${id} leaves the screen`);
    }
    for (let i = 0; i < vis.length; i += 1) {
      for (let j = i + 1; j < vis.length; j += 1) {
        const a = vis[i][1];
        const b = vis[j][1];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) fail(`${name}: ${vis[i][0]} overlaps ${vis[j][0]}`);
      }
    }
  }
});

check('kinds are the three the site knows', () => {
  for (const key of catalog.records.keys()) if (!['guidance', 'paper', 'film'].includes(parseKey(key).kind)) fail(`odd key ${key}`);
});

if (failures) {
  console.error(`[system-check] ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('[system-check] the library holds together');
