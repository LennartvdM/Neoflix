#!/usr/bin/env node
/**
 * build-readings.mjs — the papers as readings: an index for the atlas.
 *
 * system/content/readings/<id>.json holds each paper either as a
 * *reading* (open licence: its own words, verbatim, in sections, with
 * our notes in a separate layer) or as a *synopsis* (publisher's
 * licence: notes in our own words). The full texts are big, so the
 * browser loads one only when a reader opens it (system/readings.js).
 * The atlas needs only their shape: this writes
 * generated/readings-index.json (sections, intermissions, key facts and
 * the morsels other pages can quote).
 *
 * Runs before system-check (which reads the index too).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../system/content/readings');
const out = path.join(__dirname, '../generated/readings-index.json');

const words = (s) => (s.match(/[A-Za-z0-9][\w'’-]*/g) || []).length;
const index = {};
for (const f of (await fs.readdir(dir)).filter((x) => x.endsWith('.json')).sort()) {
  const r = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
  const passages = new Map(r.sections.flatMap((s) => s.passages.map((p) => [p.id, { ...p, section: s.id }])));
  index[r.id] = {
    id: r.id,
    kind: r.kind,
    licence: r.licence || null,
    pdf: r.pdf || null,
    disclaimer: r.disclaimer || null,
    sections: r.sections.map((s) => ({ id: s.id, title: s.title, passages: s.passages.length, words: s.passages.reduce((a, p) => a + words(p.text), 0), notes: (r.notes || []).filter((n) => s.passages.some((p) => p.id === n.at)).length })),
    intermissions: r.intermissions || [],
    keyFacts: r.keyFacts || [],
    morsels: (r.morsels || []).map((m) => ({ ...m, paper: r.id, section: passages.get(m.at)?.section || null, verbatim: r.kind === 'reading' })),
  };
}
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify(index));
const n = Object.values(index);
console.log(`[build-readings] ${n.length} papers: ${n.filter((x) => x.kind === 'reading').length} readings, ${n.filter((x) => x.kind === 'synopsis').length} synopses, ${n.reduce((a, x) => a + x.morsels.length, 0)} morsels`);
