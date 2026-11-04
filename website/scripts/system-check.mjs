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
import { buildCatalog, parseKey } from '../system/catalog.js';
import { buildGraph } from '../system/graph.js';
import { urlFor, keyForPath } from '../system/urls.js';
import { planRecord } from '../system/modules/plans.js';
import { assemble, rowsOf, COLUMNS } from '../system/assemble.js';
import { searchLibrary } from '../system/search.js';

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

check('kinds are the three the site knows', () => {
  for (const key of catalog.records.keys()) if (!['guidance', 'paper', 'film'].includes(parseKey(key).kind)) fail(`odd key ${key}`);
});

if (failures) {
  console.error(`[system-check] ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('[system-check] the library holds together');
