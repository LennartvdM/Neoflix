// Doors and cites, named for where they go (blueprint, "The link rule":
// one layer deeper on the same subject, or across to it on the other axis).
import { navSections, pageMeta } from '../../pages/toolbox/docsIndex';
import { publicationRecords, paperPath, doiUrl } from '../../pages/publications/records';
import { ARC } from '../../pages/publications/arc';
import { PAPERS } from '../argument';

// Titles as the toolbox sidebar shows them.
const navTitle = {};
const walk = (items) => (items || []).forEach((i) => {
  if (i.slug != null) navTitle[i.slug] = i.title;
  walk(i.children);
});
navSections.forEach((s) => walk(s.items));

/** Down into the loop. Labelled with the toolbox's current title. */
export function toolboxDoor(slug) {
  const title = navTitle[slug] || pageMeta[slug]?.title;
  if (!title) return null;
  return { href: `/toolbox/${slug}`, label: `Toolbox · ${title}` };
}

/** Where a paper lives: its own page if it has one, else the journal. */
export function paperHref(id) {
  return paperPath(id) || doiUrl(publicationRecords[id]);
}

/** "Paper 3 · 2024" — a proof's source line, and the door to it. */
export function paperCite(id) {
  const p = PAPERS[id];
  return p ? { href: paperHref(id), label: `Paper ${p.n} · ${p.year}` } : null;
}

/** Across to the paper: "Paper 3 · Record, reflect, refine". */
export function paperDoor(id) {
  const p = PAPERS[id];
  return p ? { href: paperHref(id), label: `Paper ${p.n} · ${ARC[id]?.short || ''}`, direction: 'across' } : null;
}
