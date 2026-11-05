/**
 * Export the site's material as plain JSON for a Claude chat session
 * (chat-package/README.md). Run after a build, so generated/ exists:
 *   node chat-package/export-data.mjs <out-dir>
 * Everything here is computed by the site's own modules, so the export
 * is what the site shows, not a retelling of it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../website');
const out = path.resolve(process.argv[2] || 'chat-package/out/data');
const imp = (p) => import(path.join(root, p));
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const { buildCatalog, LOOP } = await imp('system/catalog.js');
const { buildGraph } = await imp('system/graph.js');
const { buildAtlas } = await imp('composition/atlas.js');
const { buildOntology } = await imp('composition/ontology.js');
const tour = await imp('composition/tour.js');
const onto = await imp('system/content/ontology.js');
const film = await imp('system/content/session-film.js');
const { FILMS, SESSION_FILM_SRC } = await imp('system/content/films.js');
const { PATHS } = await imp('system/content/paths.js');

const manifest = readJSON('generated/docs-manifest.json');
const readingsIndex = readJSON('generated/readings-index.json');
const catalog = buildCatalog(manifest);
const graph = buildGraph(catalog);
const atlas = buildAtlas(catalog, graph, readingsIndex);
const { pageOf } = buildOntology({ catalog, graph, readings: readingsIndex });

fs.mkdirSync(path.join(out, 'readings'), { recursive: true });
const write = (name, data) => fs.writeFileSync(path.join(out, name), `${JSON.stringify(data, null, 1)}\n`);

// Every record: 74 toolbox pages, 6 papers, 6 films.
write('library.json', {
  about: 'Every record on the site. key = kind:id. Toolbox bodies are in toolbox-pages.json; paper texts in readings/.',
  loop: LOOP,
  records: [...catalog.records.values()],
  paths: catalog.paths,
});

// The links between records, each with the sentence that explains it.
write('graph.json', {
  about: 'Links between records (film↔paper evidence, film↔toolbox practice). why = the thread from a to b.',
  edges: graph.edges.map((e) => ({ ...e, why: graph.threadBetween(e.a, e.b) })),
});

// The atlas: every page, its address, and what the ontology puts on it.
const strip = (n, addr) => {
  const { kids, stop, ...rest } = n;
  let page = null;
  try { page = pageOf(n); } catch { page = null; }
  return {
    addr: addr.join('.'),
    ...rest,
    stop: stop?.id,
    page,
    kids: (kids || []).map((k, i) => strip(k, [...addr, i])),
  };
};
write('atlas.json', {
  about: 'The site as pages. addr: first number = the story going down (spine), each further number = one step right (depth). page = what composition/ontology.js puts on that page: layout, need (figure/modules/list), want (≤3), adjacent (percolating neighbours), under (evidence tucked beneath), witness (a session-film moment).',
  pages: atlas.spine.map((n, i) => strip(n, [i])),
});

write('tour.json', { chapters: tour.CHAPTERS, stops: tour.TOUR, intermissions: tour.INTERMISSIONS, doors: tour.DOORS });
write('ontology.json', {
  about: 'What the material is made of below records. Draft; see website/composition/ONTOLOGY.md.',
  movements: onto.MOVEMENTS, claims: onto.CLAIMS, findings: onto.FINDINGS, concepts: onto.CONCEPTS,
  practices: onto.PRACTICES, roles: onto.ROLES, units: onto.UNITS, links: onto.ontologyLinks(),
});
write('films.json', { sessionFilmSrc: SESSION_FILM_SRC, films: FILMS, paths: PATHS });
write('session-film.json', {
  about: 'The session film (6:44, Vimeo), transcribed. Frames: media/session/pNNN.webp.',
  film: film.SESSION_FILM, lines: film.LINES, scenes: film.SCENES, frames: film.FRAMES, moments: film.MOMENTS,
});
fs.copyFileSync(path.join(root, 'generated/docs-pages.json'), path.join(out, 'toolbox-pages.json'));
for (const f of fs.readdirSync(path.join(root, 'system/content/readings')).filter((x) => x.endsWith('.json'))) {
  fs.copyFileSync(path.join(root, 'system/content/readings', f), path.join(out, 'readings', f));
}
console.log(`[export-data] ${catalog.records.size} records, ${graph.edges.length} links, ${atlas.count()} pages → ${out}`);
