#!/usr/bin/env node
/**
 * build-docs.mjs
 *
 * Transforms the `docs-content/` GitBook mirror into a set of JSON files that
 * the app can render natively, replacing the old iframe approach.
 *
 * Outputs:
 *   generated/docs-manifest.json     nav tree + slug metadata
 *   generated/docs/<slug>.json       compiled AST per page
 *   public/docs-assets/<name>            copied binary assets
 *
 * The script is run by `npm run prebuild` (and the top-level build.sh) so the
 * compiled output is always fresh on every deploy. See DESIGN.md for the
 * complete pipeline description.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { toString as mdastToString } from "mdast-util-to-string";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEBSITE_ROOT, "..");
const DOCS_SRC = path.join(REPO_ROOT, "docs-content");
const GENERATED_DIR = path.join(WEBSITE_ROOT, "generated");
const PAGES_OUT = path.join(GENERATED_DIR, "docs");
const ASSETS_SRC = path.join(DOCS_SRC, ".gitbook", "assets");
const ASSETS_OUT = path.join(WEBSITE_ROOT, "public", "docs-assets");
const ASSET_URL_PREFIX = "/docs-assets";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function slugifyAssetName(name) {
  // URL-safe: keep the extension, replace everything else with -
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length || undefined);
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safe || "asset"}${ext.toLowerCase()}`;
}

function pageSlugFromRelPath(relPath) {
  // relPath: "welcome/neoflix/how-it-works.md" → "welcome/neoflix/how-it-works"
  // "welcome/neoflix/README.md"                → "welcome/neoflix"
  const noExt = relPath.replace(/\.md$/i, "");
  if (noExt.endsWith("/README")) return noExt.slice(0, -"/README".length);
  if (noExt === "README") return "";
  return noExt;
}

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(path.relative(base, full).replace(/\\/g, "/"));
    }
  }
  return out;
}

function stripFrontmatter(src) {
  if (!src.startsWith("---")) return { body: src, frontmatter: {} };
  const end = src.indexOf("\n---", 3);
  if (end === -1) return { body: src, frontmatter: {} };
  const block = src.slice(3, end).trim();
  const body = src.slice(end + 4).replace(/^\n/, "");
  const frontmatter = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) frontmatter[m[1]] = m[2].trim();
  }
  return { body, frontmatter };
}

// ---------------------------------------------------------------------------
// GitBook liquid pre-processing
// ---------------------------------------------------------------------------
//
// We convert the liquid syntax into HTML sentinel tags so the markdown parser
// treats them as opaque blocks. A post-pass then turns those sentinels back
// into typed AST nodes.
//
//   {% hint style="info" %}X{% endhint %}
//     → <div data-gb="hint" data-style="info">X</div>
//   {% tabs %}{% tab title="T" %}X{% endtab %}{% endtabs %}
//     → <div data-gb="tabs"><div data-gb="tab" data-title="T">X</div></div>
//   {% embed url="U" %}optional caption{% endembed %}
//     → <div data-gb="embed" data-url="U">caption</div>
//   {% file src="S" %}  (self-closing)
//     → <div data-gb="file" data-src="S"></div>

function preprocessLiquid(src) {
  let out = src;
  out = out.replace(
    /\{%\s*hint\s+style="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g,
    (_, style, inner) => `\n<div data-gb="hint" data-style="${style}">\n\n${inner.trim()}\n\n</div>\n`,
  );
  out = out.replace(
    /\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/g,
    (_, inner) => {
      const tabs = [];
      inner.replace(
        /\{%\s*tab\s+title="([^"]*)"\s*%\}([\s\S]*?)\{%\s*endtab\s*%\}/g,
        (__, title, body) => {
          tabs.push(
            `<div data-gb="tab" data-title=${JSON.stringify(title.trim())}>\n\n${body.trim()}\n\n</div>`,
          );
          return "";
        },
      );
      return `\n<div data-gb="tabs">\n\n${tabs.join("\n\n")}\n\n</div>\n`;
    },
  );
  out = out.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endembed\s*%\}/g,
    (_, url, caption) =>
      `\n<div data-gb="embed" data-url=${JSON.stringify(url)}>\n\n${caption.trim()}\n\n</div>\n`,
  );
  out = out.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}/g,
    (_, url) => `\n<div data-gb="embed" data-url=${JSON.stringify(url)}></div>\n`,
  );
  out = out.replace(
    /\{%\s*file\s+src="([^"]+)"\s*%\}/g,
    (_, src) => `\n<div data-gb="file" data-src=${JSON.stringify(src)}></div>\n`,
  );

  // {% worldmap %} — renders the interactive Framer worldmap inline.
  // {% worldmap city="vienna" %} — same, paused on the named city until
  // the reader clicks anywhere inside the embed. Local extension (not
  // GitBook native): the docs source lives in this repo and is rendered
  // exclusively by this app, so we own the dialect. See
  // components/docs/blocks/WorldMapEmbed.jsx.
  out = out.replace(
    /\{%\s*worldmap(?:\s+city="([^"]+)")?\s*%\}/g,
    (_, city) => {
      const attr = city ? ` data-city=${JSON.stringify(city)}` : '';
      return `\n<div data-gb="worldmap"${attr}></div>\n`;
    },
  );

  // <figure><img src="X" alt="A"><figcaption>C</figcaption></figure>
  //   → sentinel div that survives markdown parsing and gets lifted back
  //     into a `figure` AST node in the collapse pass.
  out = out.replace(
    /<figure>\s*<img\s+([^>]*?)\/?>(?:\s*<figcaption>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g,
    (_, imgAttrs, caption) => {
      const attrs = parseAttrs(imgAttrs);
      const src = (attrs.src || "").replace(/"/g, "&quot;");
      const alt = (attrs.alt || "").replace(/"/g, "&quot;");
      const capAttr = caption ? ` data-caption=${JSON.stringify(caption.trim())}` : "";
      return `\n<div data-gb="figure" data-src="${src}" data-alt="${alt}"${capAttr}></div>\n`;
    },
  );

  // <table data-view="cards">... — GitBook cards. We extract each row's
  // content-ref anchor href + the visible cell text into a typed cards node.
  out = out.replace(
    /<table\s+data-view="cards"[^>]*>([\s\S]*?)<\/table>/g,
    (_, body) => {
      const cards = [];
      const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
      let rowMatch;
      while ((rowMatch = rowRe.exec(body))) {
        const row = rowMatch[1];
        if (/<th/.test(row)) continue; // skip header row
        const cells = [];
        const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
        let cellMatch;
        while ((cellMatch = cellRe.exec(row))) cells.push(cellMatch[1]);
        // Last cell holds the content-ref <a href="...">label</a>; other
        // cells hold the visible title + description markup (sometimes img).
        const refCell = cells[cells.length - 1] || "";
        const hrefMatch = refCell.match(/<a[^>]*href="([^"]+)"/);
        const href = hrefMatch ? hrefMatch[1] : "";
        // Body cells: extract an optional leading image + plain text blocks
        const bodyHtml = cells.slice(0, -1).join("\n");
        const imgMatch = bodyHtml.match(/<img\s+([^>]*?)\/?>/);
        const imgAttrs = imgMatch ? parseAttrs(imgMatch[1]) : {};
        cards.push({
          href,
          src: imgAttrs.src || null,
          alt: imgAttrs.alt || "",
          body: bodyHtml.replace(/<img\s+[^>]*>/, "").trim(),
        });
      }
      const payload = JSON.stringify(cards).replace(/"/g, "&quot;");
      return `\n<div data-gb="cards" data-cards="${payload}"></div>\n`;
    },
  );

  return out;
}

// ---------------------------------------------------------------------------
// Link & asset rewriting
// ---------------------------------------------------------------------------

// Names of .gitbook/assets files actually referenced by some page. Only
// these are copied into public/docs-assets — the GitBook space carries
// many uploads (old decks, duplicate exports, raw footage) that no page
// links to, and none of that belongs on the public site.
const usedAssetNames = new Set();

function normalizeAssetUrl(rawUrl, assetMap) {
  // Strip angle-bracket wrapping used by GitBook for paths with spaces/parens
  let url = rawUrl.trim();
  if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);

  try {
    url = decodeURI(url);
  } catch {
    /* leave as-is */
  }

  const match = url.match(/\.gitbook\/assets\/(.+)$/);
  if (!match) return null;
  const name = match[1];
  const safe = assetMap.get(name);
  if (!safe) return null;
  usedAssetNames.add(name);
  return `${ASSET_URL_PREFIX}/${safe}`;
}

function resolveInternalLink(rawHref, fromRelPath, pageSlugs) {
  // Ignore external / anchors
  if (!rawHref) return null;
  if (/^(https?:|mailto:|tel:)/i.test(rawHref)) return null;
  if (rawHref.startsWith("#")) return null;
  if (rawHref.startsWith("broken-reference")) return null;

  let url = rawHref.trim();
  if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);

  // Split off anchor
  const hashIdx = url.indexOf("#");
  const anchor = hashIdx >= 0 ? url.slice(hashIdx) : "";
  let filePart = hashIdx >= 0 ? url.slice(0, hashIdx) : url;

  if (!filePart) {
    return { href: anchor || "#", internal: false };
  }

  // Resolve relative to the source file's directory
  const fromDir = path.posix.dirname(fromRelPath);
  let joined = path.posix.normalize(path.posix.join(fromDir, filePart));
  if (joined.startsWith("./")) joined = joined.slice(2);

  // If the path ends with `.md` or points at a directory, map to a slug
  if (joined.endsWith(".md")) {
    const slug = pageSlugFromRelPath(joined);
    if (pageSlugs.has(slug)) {
      return { href: `/toolbox/${slug}${anchor}`, internal: true };
    }
    return { href: `/toolbox/${slug}${anchor}`, internal: true };
  }
  // Directory-like (README implied)
  const cleaned = joined.replace(/\/$/, "");
  if (pageSlugs.has(cleaned)) {
    return { href: `/toolbox/${cleaned}${anchor}`, internal: true };
  }
  // Last resort: pass through as-is (will likely 404 in renderer, which is fine
  // — matches the old iframe failure mode for broken GitBook refs).
  return null;
}

// ---------------------------------------------------------------------------
// mdast → simplified AST
// ---------------------------------------------------------------------------
//
// Our AST is just {type, ...props, children?}. The renderer maps each type to
// a React component. We keep the shape close to mdast to minimize translation
// cost but flatten text/inline details that React handles natively.

function astNodeText(node) {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) return node.children.map(astNodeText).join("");
  return "";
}

function normalizeHeadingText(text) {
  return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function stripGitBookHeadingAnchor(text) {
  // "Heading <a href="#slug" id="slug"></a>" → "Heading"
  // Note: no .trim() — text nodes carry meaningful whitespace between inline
  // siblings (e.g. " " between a text and a following link). Heading text
  // consumers that need trimming (id generation) should trim themselves.
  return text.replace(/\s*<a\s+[^>]*id="[^"]*"[^>]*>\s*<\/a>\s*/g, "");
}

function mdastToAst(tree, ctx) {
  const convert = (node) => {
    switch (node.type) {
      case "root":
        return { type: "root", children: node.children.map(convert).filter(Boolean) };

      case "paragraph":
        return { type: "paragraph", children: node.children.map(convert).filter(Boolean) };

      case "heading": {
        const plain = stripGitBookHeadingAnchor(mdastToString(node));
        const id = slugifyHeading(plain);
        return {
          type: "heading",
          depth: node.depth,
          id,
          children: node.children
            .map(convert)
            .filter(Boolean)
            // Drop the trailing anchor element GitBook inserts. Remark
            // splits `<a ...></a>` into TWO separate html nodes — an
            // opening `<a ... id="x">` and a closing `</a>` — so match
            // either form, not just the self-closed single-node case.
            .filter((c) => {
              if (!c || c.type !== "html") return true;
              const v = (c.value || "").trim();
              if (/^<a\s+[^>]*id="[^"]*"[^>]*>\s*(?:<\/a>)?$/.test(v)) return false;
              if (v === "</a>") return false;
              return true;
            }),
        };
      }

      case "text":
        return { type: "text", value: stripGitBookHeadingAnchor(node.value) };

      case "strong":
        return { type: "strong", children: node.children.map(convert).filter(Boolean) };
      case "emphasis":
        return { type: "emphasis", children: node.children.map(convert).filter(Boolean) };
      case "delete":
        return { type: "delete", children: node.children.map(convert).filter(Boolean) };
      case "inlineCode":
        return { type: "inlineCode", value: node.value };
      case "break":
        return { type: "break" };
      case "thematicBreak":
        return { type: "thematicBreak" };

      case "link": {
        const asset = normalizeAssetUrl(node.url, ctx.assetMap);
        if (asset) {
          return {
            type: "link",
            href: asset,
            internal: false,
            children: node.children.map(convert).filter(Boolean),
          };
        }
        const resolved = resolveInternalLink(node.url, ctx.relPath, ctx.pageSlugs);
        if (resolved) {
          return {
            type: "link",
            href: resolved.href,
            internal: resolved.internal,
            children: node.children.map(convert).filter(Boolean),
          };
        }
        return {
          type: "link",
          href: node.url,
          internal: false,
          external: /^https?:/i.test(node.url),
          children: node.children.map(convert).filter(Boolean),
        };
      }

      case "image": {
        const asset = normalizeAssetUrl(node.url, ctx.assetMap);
        return {
          type: "image",
          src: asset || node.url,
          alt: node.alt || "",
          title: node.title || null,
        };
      }

      case "list":
        return {
          type: "list",
          ordered: !!node.ordered,
          start: node.start || null,
          children: node.children.map(convert).filter(Boolean),
        };
      case "listItem":
        return {
          type: "listItem",
          checked: node.checked ?? null,
          children: node.children.map(convert).filter(Boolean),
        };

      case "blockquote":
        return { type: "blockquote", children: node.children.map(convert).filter(Boolean) };

      case "code":
        return { type: "code", lang: node.lang || null, value: node.value };

      case "table":
        return {
          type: "table",
          align: node.align || [],
          children: node.children.map(convert).filter(Boolean),
        };
      case "tableRow":
        return { type: "tableRow", children: node.children.map(convert).filter(Boolean) };
      case "tableCell":
        return { type: "tableCell", children: node.children.map(convert).filter(Boolean) };

      case "html":
        return convertHtml(node, ctx);

      default:
        return null;
    }
  };
  return convert(tree);
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// HTML block handling (GitBook sentinels + passthrough)
// ---------------------------------------------------------------------------

function convertHtml(node, ctx) {
  const raw = node.value || "";
  // Sentinel blocks from preprocessLiquid
  // Quote-aware: the data-cards value can contain `>` characters (from embedded
  // HTML like <p>), so the attrs region has to be a sequence of well-formed
  // `key="value"` pairs rather than "anything up to >".
  const gbMatch = raw.match(/^<div\s+data-gb="([^"]+)"((?:\s+[a-zA-Z0-9_-]+="[^"]*")*)\s*>/);
  if (gbMatch) {
    const kind = gbMatch[1];
    const attrs = parseAttrs(gbMatch[2]);
    if (kind === "file") {
      const asset = normalizeAssetUrl(attrs.src || "", ctx.assetMap);
      return { type: "file", src: asset || attrs.src, name: path.posix.basename(attrs.src || "") };
    }
    if (kind === "worldmap") {
      return { type: "worldmap", city: attrs.city || null };
    }
    if (kind === "figure") {
      const raw = attrs.src || "";
      const resolved = normalizeAssetUrl(raw, ctx.assetMap);
      return {
        type: "figure",
        src: resolved || raw,
        alt: attrs.alt || "",
        caption: attrs.caption || "",
      };
    }
    if (kind === "cards") {
      const decoded = (attrs.cards || "").replace(/&quot;/g, '"');
      let cards = [];
      try { cards = JSON.parse(decoded); } catch { cards = []; }
      const rewritten = cards.map((c) => ({
        href: resolveCardHref(c.href || "", ctx),
        src: c.src ? (normalizeAssetUrl(c.src, ctx.assetMap) || c.src) : null,
        alt: c.alt || "",
        body: c.body || "",
      }));
      return { type: "cards", cards: rewritten };
    }
    // hint / tab / tabs / embed opening: children will follow as separate mdast
    // nodes (the parser splits blocks on blank lines). We record an opener
    // placeholder and reassemble them in a post-pass.
    return { type: "gbOpen", kind, attrs };
  }
  if (/^<\/div>\s*$/.test(raw.trim())) {
    return { type: "gbClose" };
  }
  // Inline HTML (e.g. <mark style="...">) — passthrough.
  return { type: "html", value: raw };
}

function resolveCardHref(rawHref, ctx) {
  if (!rawHref) return "";
  const resolved = resolveInternalLink(rawHref, ctx.relPath, ctx.pageSlugs);
  if (resolved && resolved.internal) return resolved.href;
  if (/^https?:/i.test(rawHref)) return rawHref;
  return rawHref;
}

function parseAttrs(str) {
  const out = {};
  const re = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(str))) {
    const key = m[1].replace(/^data-/, "");
    out[key] = m[2];
  }
  return out;
}

// Reassemble gbOpen/gbClose pairs into nested nodes.
function collapseGitBookBlocks(root) {
  const walk = (children) => {
    const stack = [{ children: [], kind: null, attrs: null }];
    for (const child of children) {
      if (!child) continue;
      if (child.type === "gbOpen") {
        stack.push({ children: [], kind: child.kind, attrs: child.attrs });
        continue;
      }
      if (child.type === "gbClose") {
        const frame = stack.pop();
        if (!frame || frame.kind === null) {
          // Unbalanced; append as comment and continue
          stack[stack.length - 1].children.push({
            type: "html",
            value: "<!-- unbalanced gb close -->",
          });
          continue;
        }
        const collapsed = finalizeGbFrame(frame);
        stack[stack.length - 1].children.push(collapsed);
        continue;
      }
      // Recurse into container children
      if (child.children) child.children = walk(child.children);
      stack[stack.length - 1].children.push(child);
    }
    // Unclosed frames → flatten as-is (rare in practice)
    while (stack.length > 1) {
      const frame = stack.pop();
      stack[stack.length - 1].children.push(finalizeGbFrame(frame));
    }
    return stack[0].children;
  };
  root.children = walk(root.children);
  return root;
}

function finalizeGbFrame(frame) {
  const { kind, attrs, children } = frame;
  if (kind === "hint") return { type: "hint", style: attrs.style || "info", children };
  if (kind === "tabs") return { type: "tabs", children };
  if (kind === "tab") return { type: "tab", title: attrs.title || "", children };
  if (kind === "embed") return { type: "embed", url: attrs.url || "", children };
  return { type: "html", value: `<!-- unknown gb:${kind} -->` };
}

// ---------------------------------------------------------------------------
// SUMMARY.md → nav tree
// ---------------------------------------------------------------------------

function parseSummary(src, pageSlugs) {
  const lines = src.split(/\r?\n/);
  const sections = [];
  let currentSection = null;
  // Stack holds nodes at each indent depth
  let itemStack = [];

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    if (h1) continue; // "Table of contents"
    if (h2) {
      currentSection = { title: h2[1].trim(), items: [] };
      sections.push(currentSection);
      itemStack = [{ depth: -1, items: currentSection.items }];
      continue;
    }
    const item = line.match(/^(\s*)\*\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (!item || !currentSection) continue;
    const indent = item[1].length;
    const depth = Math.floor(indent / 2);
    const title = item[2].trim();
    const href = item[3].trim();
    const slug = pageSlugFromRelPath(href);
    const node = { title, slug, children: [] };
    // Pop until we find a parent one level up
    while (itemStack.length > 1 && itemStack[itemStack.length - 1].depth >= depth) {
      itemStack.pop();
    }
    itemStack[itemStack.length - 1].items.push(node);
    itemStack.push({ depth, items: node.children });
    if (!pageSlugs.has(slug)) {
      // Still include; slug lookup at render time will fall back to a 404-ish state.
    }
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
  try {
    await fs.access(DOCS_SRC);
  } catch {
    console.warn(`[build-docs] docs-content/ missing at ${DOCS_SRC}; skipping`);
    await fs.mkdir(PAGES_OUT, { recursive: true });
    await fs.writeFile(
      path.join(GENERATED_DIR, "docs-manifest.json"),
      JSON.stringify({ sections: [], pages: {} }, null, 2),
    );
    return;
  }

  // 1. Index assets into a name → safe-name map. Copying happens after
  // page compilation, so only assets a page actually references are
  // published (see usedAssetNames).
  const assetMap = new Map();
  try {
    const assetNames = await fs.readdir(ASSETS_SRC);
    for (const name of assetNames) {
      assetMap.set(name, slugifyAssetName(name));
    }
  } catch (err) {
    console.warn(`[build-docs] no .gitbook/assets dir (${err.message})`);
  }

  // 2. Walk markdown files, collect slug universe
  const mdFiles = (await walk(DOCS_SRC)).filter((f) => !f.startsWith(".gitbook/"));
  const pageSlugs = new Set(
    mdFiles.filter((f) => f.toLowerCase() !== "summary.md").map(pageSlugFromRelPath),
  );

  // 3. Clear previous page output
  await fs.rm(PAGES_OUT, { recursive: true, force: true });
  await fs.mkdir(PAGES_OUT, { recursive: true });

  // 4. Compile each page
  const pageMeta = {};
  const allPages = {};
  for (const relPath of mdFiles) {
    if (relPath.toLowerCase() === "summary.md") continue;
    const abs = path.join(DOCS_SRC, relPath);
    const raw = await fs.readFile(abs, "utf8");
    const { body, frontmatter } = stripFrontmatter(raw);
    const pre = preprocessLiquid(body);
    const tree = unified().use(remarkParse).use(remarkGfm).parse(pre);
    const ctx = { relPath, assetMap, pageSlugs };
    let ast = mdastToAst(tree, ctx);
    ast = collapseGitBookBlocks(ast);

    // Title: frontmatter title if present, else first H1, else filename
    let title = frontmatter.title || null;
    if (!title) {
      visit(tree, "heading", (n) => {
        if (!title && n.depth === 1) title = stripGitBookHeadingAnchor(mdastToString(n)).trim();
      });
    }
    if (!title) title = path.basename(relPath, ".md");

    // GitBook pages conventionally start with an H1 matching the page title.
    // We render the title separately, so drop that leading H1 to avoid showing
    // it twice. Only strip when the text actually matches — a custom frontmatter
    // title against a different body H1 should still render the body heading.
    if (ast.children?.length) {
      const first = ast.children[0];
      if (first && first.type === "heading" && first.depth === 1) {
        const firstText = astNodeText(first);
        if (normalizeHeadingText(firstText) === normalizeHeadingText(title)) {
          ast = { ...ast, children: ast.children.slice(1) };
        }
      }
    }

    const slug = pageSlugFromRelPath(relPath);
    const outFile = slug === "" ? "_root.json" : `${slug.replace(/\//g, "__")}.json`;
    const compiled = { slug, title, frontmatter, ast };
    // Per-page file: read at build time by build-route-html.mjs for each
    // route's meta description.
    await fs.writeFile(path.join(PAGES_OUT, outFile), JSON.stringify(compiled));
    // ...and into the single bundle the CLIENT loads. One request when a
    // visitor enters /toolbox, then every page is in memory, so moving
    // between pages never waits on the network. Splitting this per page
    // meant each click paid a round trip.
    allPages[outFile] = compiled;

    pageMeta[slug] = {
      title,
      description: frontmatter.description || null,
      file: outFile,
      source: relPath,
    };
  }

  // 5. Parse SUMMARY.md for nav structure
  let navSections = [];
  try {
    const summary = await fs.readFile(path.join(DOCS_SRC, "SUMMARY.md"), "utf8");
    navSections = parseSummary(summary, pageSlugs);
  } catch (err) {
    console.warn(`[build-docs] no SUMMARY.md (${err.message})`);
  }

  // 6. Emit manifest + the single client-side page bundle
  await fs.writeFile(
    path.join(GENERATED_DIR, "docs-manifest.json"),
    JSON.stringify({ sections: navSections, pages: pageMeta }, null, 2),
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, "docs-pages.json"),
    JSON.stringify(allPages),
  );

  // 7. Publish only the assets the compiled pages referenced. The output
  // dir is cleared first so nothing unreferenced can survive from an
  // earlier build.
  await fs.rm(ASSETS_OUT, { recursive: true, force: true });
  await fs.mkdir(ASSETS_OUT, { recursive: true });
  for (const name of usedAssetNames) {
    await fs.copyFile(path.join(ASSETS_SRC, name), path.join(ASSETS_OUT, assetMap.get(name)));
  }

  console.log(
    `[build-docs] ${mdFiles.length - 1} pages, ${navSections.length} nav sections, ` +
      `${usedAssetNames.size}/${assetMap.size} assets referenced and published`,
  );
}

main().catch((err) => {
  console.error("[build-docs] failed:", err);
  process.exit(1);
});
