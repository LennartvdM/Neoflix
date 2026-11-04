/**
 * Every record's one address, and the way back from an address to a
 * record. Existing URLs are kept: guidance stays at /toolbox/<slug>,
 * papers at /publications/<slug>. Films and paths are new.
 *
 * Arrival context rides in the query string, so it survives a reload and
 * a shared link, and every route is still one physical HTML file:
 *   ?from=<key>   the record the reader came from (system/graph.js
 *                 threadBetween turns that link into the page's opening)
 *   ?path=<id>    the path the reader is walking
 *
 * Node-safe.
 */
import { parseKey } from './catalog.js';
import { paperPath, publicationSlugs } from '../pages/publications/records.js';

export function urlFor(key, { from, path } = {}) {
  const { kind, id } = parseKey(key);
  let base = '/';
  if (kind === 'guidance') base = id ? `/toolbox/${id}` : '/toolbox';
  else if (kind === 'paper') base = paperPath(id) || '/publications';
  else if (kind === 'film') base = `/films/${id}`;
  const q = [];
  if (path) q.push(`path=${encodeURIComponent(path)}`);
  if (from && from !== key) q.push(`from=${encodeURIComponent(from)}`);
  return q.length ? `${base}?${q.join('&')}` : base;
}

export const pathUrl = (id) => `/paths/${id}`;

/** Pathname → record key, or null. `resolveSlug` maps legacy toolbox slugs. */
export function keyForPath(pathname, { resolveSlug } = {}) {
  const p = String(pathname || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (p === '/toolbox') return 'guidance:';
  if (p.startsWith('/toolbox/')) {
    const raw = p.slice('/toolbox/'.length);
    return `guidance:${resolveSlug ? resolveSlug(raw) : raw}`;
  }
  if (p.startsWith('/publications/')) {
    const slug = p.slice('/publications/'.length);
    const id = Object.keys(publicationSlugs).find((k) => publicationSlugs[k] === slug);
    return id ? `paper:${id}` : null;
  }
  if (p.startsWith('/films/')) return `film:${p.slice('/films/'.length)}`;
  return null;
}
