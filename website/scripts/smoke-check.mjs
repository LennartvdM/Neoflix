#!/usr/bin/env node
/**
 * smoke-check.mjs — post-build sanity assertions.
 *
 * Runs against the build output and fails loudly if the site is
 * structurally broken in ways a compile can't catch. The missing
 * og-preview.png shipped for months precisely because nothing asserted
 * it existed; each check here encodes one such lesson.
 *
 * Usage: node scripts/smoke-check.mjs [--out ../dist]
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_META, SITE_URL } from '../shared/routeMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outArg = process.argv.indexOf('--out');
const OUT = path.resolve(
  path.join(__dirname, '..'),
  outArg !== -1 ? process.argv[outArg + 1] : '../dist'
);

let failures = 0;
async function check(label, fn) {
  try {
    await fn();
    console.log(`  ok  ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL  ${label}: ${err.message}`);
  }
}

async function mustExist(rel, minBytes = 1) {
  const p = path.join(OUT, rel);
  const st = await fs.stat(p).catch(() => null);
  if (!st) throw new Error(`${rel} missing`);
  if (st.size < minBytes) throw new Error(`${rel} is ${st.size} bytes (< ${minBytes})`);
  return p;
}

console.log(`[smoke-check] ${OUT}`);

await check('og-preview.png exists (every route head points at it)', () =>
  mustExist('og-preview.png', 10_000)
);

await check('every ROUTE_META route emitted an HTML file', async () => {
  for (const route of Object.keys(ROUTE_META)) {
    const rel = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`;
    await mustExist(rel, 500);
  }
});

await check('every film and path of the library emitted an HTML file', async () => {
  const { libraryRoutePaths } = await import('../shared/routeMeta.js');
  for (const route of libraryRoutePaths()) await mustExist(`${route.slice(1)}/index.html`, 500);
});

await check('every paper has its own page', async () => {
  const { papersWithPages, paperPath } = await import('../pages/publications/records.js');
  for (const id of papersWithPages()) await mustExist(`${paperPath(id).slice(1)}/index.html`, 500);
});

await check('sitemap.xml exists and lists this site', async () => {
  const p = await mustExist('sitemap.xml', 200);
  const xml = await fs.readFile(p, 'utf8');
  if (!xml.includes(SITE_URL)) throw new Error(`no ${SITE_URL} URLs in sitemap`);
  const count = (xml.match(/<loc>/g) || []).length;
  if (count < 50) throw new Error(`only ${count} URLs — toolbox pages missing?`);
});

await check('404.html and _redirects emitted', async () => {
  await mustExist('404.html', 500);
  const p = await mustExist('_redirects', 100);
  const txt = await fs.readFile(p, 'utf8');
  if (!txt.includes('301')) throw new Error('no 301 rules in _redirects');
});

await check('robots.txt and llms.txt emitted', async () => {
  await mustExist('robots.txt', 20);
  await mustExist('llms.txt', 200);
});

await check('self-hosted fonts shipped', async () => {
  await mustExist('fonts/inter-latin.woff2', 10_000);
  await mustExist('fonts/montserrat-latin.woff2', 10_000);
});

await check('no unexpected HTML references Google Fonts', async () => {
  const html = await fs.readFile(path.join(OUT, 'index.html'), 'utf8');
  if (html.includes('fonts.googleapis.com')) throw new Error('index.html still hot-links Google Fonts');
});

if (failures > 0) {
  console.error(`[smoke-check] ${failures} check(s) failed`);
  process.exit(1);
}
console.log('[smoke-check] all good');
