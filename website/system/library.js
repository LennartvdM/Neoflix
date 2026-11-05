/**
 * The library, as the browser sees it: one catalogue and one graph,
 * built once from the toolbox manifest (already in the main bundle via
 * docsIndex) and the content files.
 */
import manifest from '../generated/docs-manifest.json';
import { buildCatalog } from './catalog.js';
import { buildGraph } from './graph.js';
import { assetUrl } from '../lib/utils/assetUrl';

export const catalog = buildCatalog(manifest);
export const graph = buildGraph(catalog);
export const lib = { catalog, graph };

export const stillFor = (film) => assetUrl(`/videos/stills/${film.clip}.webp`);
export const clipFor = (film) => assetUrl(`/videos/${film.clip}.mp4`);
export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
