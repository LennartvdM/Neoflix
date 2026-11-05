/**
 * The papers as readings (system/content/readings, see
 * scripts/build-readings.mjs), as the browser sees them: the small index
 * eagerly (the atlas needs its shape), each full text only when a reader
 * opens it.
 */
import index from '../generated/readings-index.json';

export const readings = index;

const loaders = import.meta.glob('./content/readings/*.json');
const cache = new Map();

/** The full reading for a paper id (a promise; cached). */
export function loadReading(id) {
  if (!cache.has(id)) {
    const load = loaders[`./content/readings/${id}.json`];
    cache.set(id, load ? load().then((m) => m.default || m) : Promise.resolve(null));
  }
  return cache.get(id);
}

/** Morsels whose tags or paper touch `key` (a record or ontology key). */
export function morselsFor(key, { verbatimOnly = false } = {}) {
  const out = [];
  for (const r of Object.values(index)) {
    for (const m of r.morsels) {
      if (verbatimOnly && !m.verbatim) continue;
      if ((m.tags || []).includes(key) || `paper:${m.paper}` === key) out.push(m);
    }
  }
  return out;
}
