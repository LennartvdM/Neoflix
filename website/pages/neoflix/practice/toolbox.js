// The toolbox, as /neoflix's third act sees it — read from the compiled
// docs manifest (generated/docs-manifest.json, built from the GitBook
// mirror), never retyped. A page renamed, added or reordered in GitBook
// shows up here on the next build. `excerpt` is each page's opening
// sentence, extracted by scripts/build-docs.mjs.
import { navSections, pageMeta } from '../../toolbox/docsIndex';

export const toolboxHref = (slug) => `/toolbox/${slug}`;

// Titles as the toolbox's own sidebar shows them (SUMMARY.md), not each
// page's H1: several H1s carry stale numbering ("2. Preparation and
// Consent" is chapter 5 in the sidebar), and this page should agree with
// the toolbox you land in. All-caps phase titles ("REFLECT") are set in
// sentence case; the styling does the shouting where wanted.
const navTitles = (() => {
  const out = {};
  const walk = (items) => {
    for (const item of items || []) {
      if (item.slug != null) out[item.slug] = item.title;
      walk(item.children);
    }
  };
  navSections.forEach((section) => walk(section.items));
  return out;
})();

function displayTitle(title) {
  const t = (title || '').trim();
  return /^[A-Z]{3,}$/.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t;
}

export function toolboxPage(slug) {
  const meta = pageMeta[slug];
  if (!meta) return null;
  return { slug, title: displayTitle(navTitles[slug] || meta.title), excerpt: meta.excerpt || null };
}

// "LEVEL 2: In Action" → { number: '2', name: 'In action' }
function parseLevel(title) {
  const m = /level\s*(\d+)\s*:\s*(.+)/i.exec(title || '');
  if (!m) return { number: '', name: title };
  const name = m[2].trim().toLowerCase();
  return { number: m[1], name: name.charAt(0).toUpperCase() + name.slice(1) };
}

// A level's nav items, split at its phase pages — Level 2's RECORD,
// REFLECT and REFINE are pages titled in capitals, each followed by its
// chapters. A level without phases is one group with no phase.
function groupByPhase(items) {
  const groups = [];
  let current = { phase: null, chapters: [] };
  for (const item of items) {
    const isPhase = /^[A-Z]{3,}$/.test((item.title || '').trim());
    if (isPhase) {
      if (current.phase || current.chapters.length) groups.push(current);
      const page = toolboxPage(item.slug);
      current = { phase: page && { ...page, name: page.title }, chapters: [] };
    } else {
      const page = toolboxPage(item.slug);
      if (page) current.chapters.push(page);
    }
  }
  if (current.phase || current.chapters.length) groups.push(current);
  return groups;
}

/** The three levels, in order, with their intro page and chapter groups. */
export function toolboxLevels() {
  return navSections
    .filter((section) => /^level\s*\d/i.test(section.title))
    .map((section) => {
      const [introItem, ...rest] = section.items;
      return {
        ...parseLevel(section.title),
        intro: toolboxPage(introItem?.slug),
        groups: groupByPhase(rest),
      };
    });
}

/** The success-story pages (the NICUs), from Level 1's chapter 4. */
export function successStories() {
  for (const section of navSections) {
    for (const item of section.items || []) {
      if (/success stories/i.test(item.title)) {
        return {
          chapter: toolboxPage(item.slug),
          stories: (item.children || [])
            .filter((child) => /^nicu/i.test(child.title))
            .map((child) => toolboxPage(child.slug))
            .filter(Boolean),
        };
      }
    }
  }
  return { chapter: null, stories: [] };
}

/** The Neoflix-network page that closes Level 3. */
export function networkPage() {
  const slug = Object.keys(pageMeta).find((s) => /join-the-network$/.test(s));
  return slug ? toolboxPage(slug) : null;
}

/**
 * The toolbox pages a markdown passage links to, in order, deduplicated,
 * with their real titles — what a chapter of the essay points at.
 */
export function toolboxLinksIn(markdown) {
  const seen = new Set();
  const out = [];
  for (const m of (markdown || '').matchAll(/\]\(\/toolbox\/([^)#\s]+)\)/g)) {
    const slug = m[1].replace(/\/+$/, '');
    if (seen.has(slug)) continue;
    seen.add(slug);
    const page = toolboxPage(slug);
    if (page) out.push(page);
  }
  return out;
}
