/**
 * routeMeta.js — one description of every page, for two consumers.
 *
 * The app is a single index.html served for every path, so without this
 * each route inherited the homepage's <title>, description and canonical.
 * That told Google the canonical version of /publications was the
 * homepage, and made every shared link preview show the homepage.
 *
 * Two things read this file and must never disagree:
 *   - hooks/useDocumentMeta.js  updates the head on client-side navigation
 *   - scripts/build-route-html.mjs  writes a real HTML file per route at
 *     build time, because social scrapers don't run JavaScript and only
 *     ever see the raw markup
 *
 * That second consumer is plain Node, so nothing here may import JSON,
 * touch import.meta.env, or use a Vite glob. Page data arrives as an
 * argument instead.
 */

// Canonical origin, no trailing slash. This must match the host Netlify
// actually serves as primary — if the apex redirects to www this is
// right; if www redirects to the apex, drop the "www." here.
export const SITE_URL = 'https://www.neoflix.care';
export const SITE_NAME = 'Neoflix';
export const DEFAULT_OG_IMAGE = '/og-preview.png';
export const OG_IMAGE_ALT = 'Neoflix documentation: Elevate your medical practice';

// Google renders about this much of a description; longer isn't
// penalised, it's just not shown.
const DESCRIPTION_LIMIT = 158;
// Below this, an authored description is treated as a subtitle rather
// than a description, and the page's opening paragraph is added to it.
const SUBSTANTIAL_DESCRIPTION = 80;

/**
 * The routes the app defines itself. Toolbox pages aren't here — they
 * come from the docs manifest, which already carries a title and often
 * a description per page.
 */
export const ROUTE_META = {
  '/': {
    title: 'Neoflix: Hospital Video Recording and Medical Training',
    description:
      'Video Recording in Healthcare: Improve Training, Reduce Errors, Enhance Patient Safety.',
  },
  '/neoflix': {
    title: `How video review works | ${SITE_NAME}`,
    description:
      'Acute care moves too fast to recall accurately. See how recording and reviewing real procedures sharpens skills and reveals what debriefing misses.',
  },
  '/publications': {
    title: `Publications | ${SITE_NAME}`,
    description:
      'Six peer-reviewed studies on video recording and review in neonatal intensive care, from narrative review to international multicentre collaboration.',
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description:
      'Questions about starting video review in your department? Reach the Neoflix team at the Department of Neonatology, Leiden University Medical Center.',
    // /contact renders the same page as /neoflix (scrolled to its last
    // section). Two URLs with identical content each claiming to be
    // canonical read as duplicate content, so this one points at the
    // page that owns the content — and the sitemap skips it.
    canonicalPath: '/neoflix',
  },
  '/toolbox': {
    title: `Toolbox | ${SITE_NAME}`,
    description:
      'A practical guide to setting up video review in your unit: consent and privacy, equipment, running sessions, and turning what you see into better care.',
  },
};

/** Trim to a whole word, so a description never ends mid-syllable. */
export function clampDescription(text, limit = DESCRIPTION_LIMIT) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

/**
 * Meta for one toolbox page.
 *
 * `page` is an entry from the docs manifest ({ title, description }).
 * Only 14 of the 74 pages carry a description of their own, so the rest
 * fall back to their opening paragraph — passed in as `leadText` by
 * whichever caller has the compiled page to hand. A page with neither
 * still gets something specific to itself rather than the site default,
 * because 60 identical descriptions is its own SEO problem.
 */
export function toolboxRouteMeta(slug, page, leadText) {
  const title = page?.title || 'Toolbox';
  const authored = String(page?.description || '').trim();
  const lead = String(leadText || '').trim();

  // Front matter wins when it's substantial. Several pages carry a
  // two-word label instead ("LUMC example", "Practical guidance") that
  // reads well as a subtitle but is too short — and too repeated, four
  // pages share one of them — to work as a description by itself, so
  // those keep the label and gain the opening paragraph behind it.
  let description;
  if (authored.length >= SUBSTANTIAL_DESCRIPTION) description = authored;
  else if (authored && lead) description = `${authored} — ${lead}`;
  else {
    description =
      authored ||
      lead ||
      `${title} — part of the Neoflix toolbox, a practical guide to video review in clinical care.`;
  }

  return {
    title: slug ? `${title} | ${SITE_NAME} Toolbox` : ROUTE_META['/toolbox'].title,
    description: clampDescription(description),
  };
}

/** Absolute canonical URL for a path. */
export function canonicalUrl(pathname) {
  const clean = `/${String(pathname || '/').replace(/^\/+/, '').replace(/\/+$/, '')}`;
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

/**
 * Resolve any pathname to its meta. `docsPages` is the manifest's page
 * map; `leadTextFor` is an optional (slug) => string used only when a
 * toolbox page has no description of its own.
 */
export function resolveRouteMeta(pathname, { docsPages, leadTextFor, resolveSlug, paperFor } = {}) {
  const path = normalizePath(pathname);

  // A paper's own page is described by the paper, not by the index it
  // sits under: its real title, and its abstract's opening as the
  // description, so a search result shows the study rather than the site.
  if (path.startsWith('/publications/') && paperFor) {
    const paper = paperFor(path.slice('/publications/'.length));
    if (paper) {
      return withDefaults(
        {
          title: `${paper.title} | ${SITE_NAME}`,
          description: paper.abstract || ROUTE_META['/publications'].description,
        },
        path
      );
    }
    return withDefaults(ROUTE_META['/publications'], path);
  }

  if (path.startsWith('/toolbox')) {
    const raw = path.slice('/toolbox'.length).replace(/^\/+/, '');
    const slug = resolveSlug ? resolveSlug(raw) : raw;
    const page = docsPages ? docsPages[slug] : null;
    // An unknown slug renders the toolbox shell, so describe that
    // rather than inventing a page that doesn't exist.
    if (!page && slug) return withDefaults(ROUTE_META['/toolbox'], path);
    return withDefaults(toolboxRouteMeta(slug, page, leadTextFor ? leadTextFor(slug) : ''), path);
  }

  return withDefaults(ROUTE_META[path] || ROUTE_META['/'], path);
}

export function normalizePath(pathname) {
  const p = String(pathname || '/').split(/[?#]/)[0];
  const trimmed = p.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function withDefaults(meta, path) {
  return {
    path,
    title: meta.title,
    description: clampDescription(meta.description),
    canonical: canonicalUrl(meta.canonicalPath || path),
    image: `${SITE_URL}${meta.image || DEFAULT_OG_IMAGE}`,
    imageAlt: meta.imageAlt || OG_IMAGE_ALT,
  };
}

/** Every path the build should emit a real HTML file and sitemap entry for. */
export function staticRoutePaths() {
  return Object.keys(ROUTE_META);
}
