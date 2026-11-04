#!/usr/bin/env node
/**
 * build-route-html.mjs
 *
 * Gives every route a real HTML file with its own head, plus a sitemap
 * and robots.txt.
 *
 * The app is a SPA: Netlify serves index.html for every path, so every
 * URL used to carry the homepage's <title>, description and canonical.
 * Google renders JavaScript and would eventually see the head that
 * hooks/useDocumentMeta.js writes, but a rel=canonical pointing at the
 * homepage in the served markup is a strong signal it may act on first —
 * and social scrapers (LinkedIn, Slack, WhatsApp, Facebook, X) never run
 * JavaScript at all, so a shared link showed the homepage no matter
 * which page was shared.
 *
 * The fix doesn't need SSR. Netlify serves <path>/index.html when it
 * exists and only falls through to the SPA rewrite when it doesn't, so
 * writing one small HTML file per route is enough: same bundle, same
 * client-side rendering, correct head on arrival.
 *
 * Outputs (into the Vite output directory):
 *   <out>/<route>/index.html   one per app route and toolbox page
 *   <out>/sitemap.xml
 *   <out>/robots.txt
 *
 * Run after `vite build` — by `npm run postbuild` and by build.sh, which
 * passes its own --out because it builds to the repo root.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE_URL,
  SITE_NAME,
  ROUTE_META,
  resolveRouteMeta,
  canonicalUrl,
  staticRoutePaths,
  libraryRoutePaths,
} from '../shared/routeMeta.js';
import {
  publicationRecords,
  publicationOrder,
  publicationSlugs,
  papersWithPages,
  recordForSlug,
  paperPath,
  doiUrl,
} from '../pages/publications/records.js';
import legacySlugMap from '../pages/toolbox/legacySlugMap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = path.resolve(__dirname, '..');
const GENERATED_DIR = path.join(WEBSITE_ROOT, 'generated');

function parseOutDir() {
  const i = process.argv.indexOf('--out');
  const raw = i !== -1 ? process.argv[i + 1] : 'dist';
  return path.resolve(WEBSITE_ROOT, raw);
}

/* ── Head rewriting ─────────────────────────────────────────────────
   Replaces the tags index.html already ships with, rather than
   appending, so a route never ends up with two canonicals. Each helper
   is a no-op when the tag isn't in the template. */

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceTitle(html, title) {
  return html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeAttr(title).replace(/&quot;/g, '"')}</title>`
  );
}

function replaceMeta(html, attr, key, value) {
  const pattern = new RegExp(
    `<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
    'i'
  );
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html;
}

function replaceCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"[^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeAttr(href)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html;
}

function applyMeta(template, meta) {
  let html = replaceTitle(template, meta.title);
  html = replaceMeta(html, 'name', 'description', meta.description);
  html = replaceCanonical(html, meta.canonical);

  html = replaceMeta(html, 'property', 'og:url', meta.canonical);
  html = replaceMeta(html, 'property', 'og:title', meta.title);
  html = replaceMeta(html, 'property', 'og:description', meta.description);
  html = replaceMeta(html, 'property', 'og:image', meta.image);
  html = replaceMeta(html, 'property', 'og:image:alt', meta.imageAlt);

  html = replaceMeta(html, 'name', 'twitter:url', meta.canonical);
  html = replaceMeta(html, 'name', 'twitter:title', meta.title);
  html = replaceMeta(html, 'name', 'twitter:description', meta.description);
  html = replaceMeta(html, 'name', 'twitter:image', meta.image);
  html = replaceMeta(html, 'name', 'twitter:image:alt', meta.imageAlt);
  return html;
}

/* ── Machine-readable bibliography ──────────────────────────────────
   The six papers as schema.org ScholarlyArticle, injected into the
   /publications HTML. Two KB of JSON buys a crawler every fact it would
   otherwise have to guess at by parsing 24MB of two-column PDF: exact
   titles, complete author lists, journals, years and DOIs. Nothing here
   is visible, so it costs the reader nothing.

   The DOI is the important field. It resolves to the publisher's copy
   of record, which is what a citation should point at — this page is
   how a machine finds that, not a substitute for it. */
function publicationsJsonLd() {
  const articles = publicationOrder
    .map((id) => [id, publicationRecords[id]])
    .filter(([, record]) => record)
    .map(([id, record]) => {
      const node = {
        '@type': 'ScholarlyArticle',
        headline: record.title,
        name: record.title,
        author: record.authors.map((name) => ({ '@type': 'Person', name })),
        datePublished: String(record.year),
        isPartOf: { '@type': 'Periodical', name: record.journal },
        url: paperPath(id)
          ? canonicalUrl(paperPath(id))
          : `${canonicalUrl('/publications')}#${id}`,
      };
      const doi = doiUrl(record);
      if (doi) {
        node.identifier = { '@type': 'PropertyValue', propertyID: 'DOI', value: record.doi };
        node.sameAs = doi;
      }
      if (record.licence) node.license = record.licence;
      return node;
    });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: ROUTE_META['/publications'].title,
    description: ROUTE_META['/publications'].description,
    url: canonicalUrl('/publications'),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
    hasPart: articles,
  };
}

/* A paper's own page describes exactly one article, and says which page
   it belongs to. The abstract goes in here as well as on screen — it is
   the field a citation tool reads. */
function paperJsonLd(id) {
  const record = publicationRecords[id];
  const node = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: record.title,
    name: record.title,
    author: record.authors.map((name) => ({ '@type': 'Person', name })),
    datePublished: String(record.year),
    isPartOf: { '@type': 'Periodical', name: record.journal },
    url: canonicalUrl(paperPath(id)),
    mainEntityOfPage: canonicalUrl(paperPath(id)),
    isBasedOn: canonicalUrl('/publications'),
    publisher: { '@type': 'Organization', name: record.journal },
  };
  if (record.abstract) node.abstract = record.abstract;
  const doi = doiUrl(record);
  if (doi) {
    node.identifier = { '@type': 'PropertyValue', propertyID: 'DOI', value: record.doi };
    node.sameAs = doi;
  }
  if (record.licence) node.license = record.licence;
  return node;
}

/* The homepage names the organization behind the site. Kept to facts
   that appear on the site itself (footer, llms.txt, contact copy). */
function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/web-app-manifest-512x512.png`,
        email: 'info@neoflix.care',
        parentOrganization: {
          '@type': 'Organization',
          name: 'Department of Neonatology, Leiden University Medical Center',
        },
      },
    ],
  };
}

function withJsonLd(html, data) {
  // </script> inside JSON would close the tag early; escaping the slash
  // is the standard way to keep the payload inert.
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return html.replace(
    '</head>',
    `  <script type="application/ld+json">\n${json}\n  </script>\n  </head>`
  );
}

/* ── llms.txt ───────────────────────────────────────────────────────
   The convention for handing an LLM a clean map of a site instead of
   letting it scrape one. A few KB of markdown, no JavaScript to run and
   no PDF to misparse, listing each paper with its DOI so an answer that
   draws on this work can attribute it correctly. */
function llmsTxt() {
  const papers = publicationOrder
    .map((id) => [id, publicationRecords[id]])
    .filter(([, record]) => record)
    .map(([id, record]) => {
      const doi = doiUrl(record);
      return [
        `- [${record.title}](${
          paperPath(id) ? canonicalUrl(paperPath(id)) : `${canonicalUrl('/publications')}#${id}`
        })`,
        `  ${record.authors.join(', ')}. *${record.journal}*, ${record.year}.`,
        doi ? `  DOI: ${doi}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `# ${SITE_NAME}

> ${ROUTE_META['/'].description}

Neoflix is interprofessional video review of real neonatal procedures:
recording care as it happens, then reviewing it together to find what
routine hides. Developed at the Department of Neonatology, Leiden
University Medical Center.

## Publications

The peer-reviewed work behind the method. Cite the publisher's copy of
record via the DOI.

${papers}

## Guides

- [Toolbox](${canonicalUrl('/toolbox')}): practical guidance for running video review in a unit — consent and privacy, equipment, running sessions, acting on what you find.
- [How video review works](${canonicalUrl('/neoflix')}): why acute care is hard to see clearly, and what review changes.

## Notes

- Author copies of the papers are available on the publications page as
  PDFs. They are excluded from crawling in robots.txt because they are
  large and their text extracts poorly; the metadata above and the
  publisher DOI are the better source.
- Contact: info@neoflix.care
`;
}

/* ── Toolbox lead paragraphs ────────────────────────────────────────
   Same extraction the client hook does, so a page's description is
   identical whether it was served as HTML or reached by clicking. */

function firstParagraphText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'paragraph') {
    const text = collectText(node);
    if (text.trim()) return text;
  }
  for (const child of node.children || []) {
    const found = firstParagraphText(child);
    if (found) return found;
  }
  return '';
}

function collectText(node) {
  if (!node || typeof node !== 'object') return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children || []).map(collectText).join('');
}

async function loadDocs() {
  try {
    const manifest = JSON.parse(
      await fs.readFile(path.join(GENERATED_DIR, 'docs-manifest.json'), 'utf8')
    );
    const pages = manifest.pages || {};
    const leads = {};
    // Extracted for every page, not only the ones missing a description:
    // toolboxRouteMeta also wants the lead paragraph behind a short
    // authored label. The client hook has no equivalent shortcut, so
    // skipping any page here would make the two disagree.
    for (const [slug, page] of Object.entries(pages)) {
      if (!page.file) continue;
      try {
        const compiled = JSON.parse(
          await fs.readFile(path.join(GENERATED_DIR, 'docs', page.file), 'utf8')
        );
        leads[slug] = firstParagraphText(compiled.ast);
      } catch {
        leads[slug] = '';
      }
    }
    return { pages, leads };
  } catch {
    // Docs aren't built — emit the app routes and skip the toolbox
    // rather than failing the whole build over it.
    return { pages: {}, leads: {} };
  }
}

async function writeRoute(outDir, routePath, html) {
  const dir =
    routePath === '/' ? outDir : path.join(outDir, routePath.replace(/^\//, ''));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), html);
}

function sitemap(paths) {
  const urls = paths
    .map((p) => `  <url><loc>${canonicalUrl(p)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/* ── 404.html ───────────────────────────────────────────────────────
   Every real route gets a physical HTML file above, so the SPA rewrite
   is gone from netlify.toml: a URL with no file behind it now falls
   through to this shell, which Netlify serves with a genuine 404
   status (no more soft-404s for crawlers). The shell is still the app,
   so the visitor sees the router's NotFoundPage, navbar intact. */
function notFoundHtml(template) {
  let html = applyMeta(template, {
    title: `Page not found · ${SITE_NAME}`,
    description: 'There is nothing at this address.',
    canonical: `${SITE_URL}/`,
    image: `${SITE_URL}/og-preview.png`,
    imageAlt: SITE_NAME,
  });
  return html.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>');
}

/* ── Legacy redirects ───────────────────────────────────────────────
   Two generations of old toolbox URLs survive in the wild (LinkedIn
   posts, printed QR codes): /toolbox/PascalDashCase from the iframe
   era and /Toolbox-PascalDashCase from the Framer era. legacySlugMap
   already knows the mapping for client-side resolution; emitting the
   same table as Netlify 301s means old links land on the canonical
   URL with a real redirect instead of a 404 shell. Netlify matches
   redirect paths case-insensitively, so the map's lowercase aliases
   are skipped. */
function legacyRedirects() {
  const seen = new Set();
  const lines = [];
  for (const [key, target] of Object.entries(legacySlugMap)) {
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    const to = target ? `/toolbox/${target}` : '/toolbox';
    lines.push(`/toolbox/${key} ${to} 301`);
    lines.push(`/Toolbox-${key} ${to} 301`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const outDir = parseOutDir();
  const templatePath = path.join(outDir, 'index.html');

  let template;
  try {
    template = await fs.readFile(templatePath, 'utf8');
  } catch {
    console.error(
      `[route-html] no index.html in ${outDir} — run vite build first`
    );
    process.exit(1);
  }

  const { pages, leads } = await loadDocs();

  const paperPaths = papersWithPages().map((id) => paperPath(id));

  const routePaths = [
    ...staticRoutePaths(),
    ...libraryRoutePaths(),
    ...paperPaths,
    ...Object.keys(pages)
      .filter((slug) => slug !== '')
      .map((slug) => `/toolbox/${slug}`),
  ];

  const sitemapPaths = [];
  for (const routePath of routePaths) {
    const meta = resolveRouteMeta(routePath, {
      docsPages: pages,
      leadTextFor: (slug) => leads[slug] || '',
      paperFor: (slug) => recordForSlug(slug)?.record || null,
    });
    // Alias routes (canonical pointing elsewhere, e.g. /contact →
    // /neoflix) still get their HTML file but stay out of the sitemap:
    // a sitemap entry whose page declares a different canonical is a
    // duplicate-content signal.
    if (meta.canonical === canonicalUrl(routePath)) sitemapPaths.push(routePath);
    let html = applyMeta(template, meta);
    if (routePath === '/') {
      html = withJsonLd(html, siteJsonLd());
    } else if (routePath === '/publications') {
      html = withJsonLd(html, publicationsJsonLd());
    } else if (paperPaths.includes(routePath)) {
      const found = recordForSlug(routePath.slice('/publications/'.length));
      if (found) html = withJsonLd(html, paperJsonLd(found.id));
    }
    await writeRoute(outDir, routePath, html);
  }

  await fs.writeFile(path.join(outDir, '404.html'), notFoundHtml(template));
  await fs.writeFile(path.join(outDir, '_redirects'), legacyRedirects());

  await fs.writeFile(path.join(outDir, 'llms.txt'), llmsTxt());

  await fs.writeFile(path.join(outDir, 'sitemap.xml'), sitemap(sitemapPaths));
  // /papers/ is disallowed for bandwidth, not secrecy. The PDFs already
  // carry X-Robots-Tag: noindex, but a crawler only reads that header
  // after downloading the file — so Google was pulling 24MB of papers,
  // seeing "noindex", discarding them, and coming back later. Disallow
  // stops the fetch instead of wasting it. Readers are unaffected;
  // robots.txt binds crawlers, not browsers.
  await fs.writeFile(
    path.join(outDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /papers/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  console.log(
    `[route-html] ${routePaths.length} routes (${
      Object.keys(pages).length
    } toolbox pages, ${paperPaths.length} paper pages) + 404.html + _redirects + sitemap.xml + robots.txt + llms.txt, ${
      publicationOrder.length
    } papers as JSON-LD, for ${SITE_NAME}`
  );
}

main().catch((err) => {
  console.error('[route-html] failed:', err);
  process.exit(1);
});
