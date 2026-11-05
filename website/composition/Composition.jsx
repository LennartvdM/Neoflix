/**
 * The composition: the site as pages in two directions, with the sidebar
 * as the reader's anchor.
 *
 * Down is the story (the tour's stops), right is depth (what a page
 * rests on), left is back out (atlas.js). Every move is one page: a
 * wheel notch, a swipe, an arrow key, a click. The new page slides in
 * from the direction you moved, whole (pagination, not a canvas). What
 * a page shows is decided by the ontology (ontology.js): what the reader
 * needs, at most three things they could want, nothing else (Page.jsx).
 * The sidebar (Sidebar.jsx) is the atlas drawn as an outline that
 * branches as you go deeper and folds as you come back.
 *
 * Addresses: a record's page has the record's own URL (/films/team,
 * /toolbox/…, /publications/…); which branch you reached it by rides in
 * the history state, so back and forward return to the same place. Any
 * other page is /?at=3.1 (the stop, then the page to its right). A
 * record reached by its URL alone opens where the story first comes to it.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { catalog, graph, lib } from '../system/library';
import { parseKey } from '../system/catalog';
import { urlFor, keyForPath } from '../system/urls';
import { searchLibrary } from '../system/search';
import { visit } from '../system/state';
import { noteIntroDone, noteSeen, noteLibrary } from '../system/ripeness';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import { buildAtlas } from './atlas';
import Page, { labelOf } from './Page';
import Sidebar from './Sidebar';
import '../system/system.css';
import './composition.css';

const ATLAS = buildAtlas(catalog, graph);
const clamp = (lo, v, hi) => Math.max(lo, Math.min(hi, v));
const EASE = [0.32, 0.72, 0, 1];
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);

/* ── where the reader was (localStorage only) ─────────────────────────── */
const AT_KEY = 'neoflix:at';
const loadAt = () => { try { const a = JSON.parse(localStorage.getItem(AT_KEY)); return Array.isArray(a) && ATLAS.at(a) ? a : null; } catch { return null; } };
const saveAt = (a) => { try { localStorage.setItem(AT_KEY, JSON.stringify(a)); } catch { /* in memory only */ } };

/** The URL of a page. */
function urlOf(addr) {
  const n = ATLAS.at(addr);
  if (n?.kind === 'record') return urlFor(n.key);
  if (n?.kind === 'path' && same(ATLAS.homeOfPath.get(n.pathId), addr)) return `/paths/${n.pathId}`;
  return addr.length === 1 && addr[0] === 0 ? '/' : `/?at=${addr.join('.')}`;
}

/** Which page a location is. */
function addrOf(pathname, search, state) {
  const params = new URLSearchParams(search);
  const key = keyForPath(pathname, { resolveSlug });
  const fromState = Array.isArray(state?.at) ? state.at : null;
  if (key && catalog.has(key)) {
    if (fromState && ATLAS.at(fromState)?.key === key) return fromState;
    const via = params.get('path');
    return (via && ATLAS.inPath(via, key)) || ATLAS.home.get(key) || [0];
  }
  const p = /^\/paths\/([^/]+)/.exec(pathname);
  if (p && ATLAS.homeOfPath.has(p[1])) return ATLAS.homeOfPath.get(p[1]);
  if (fromState && ATLAS.at(fromState)) return fromState;
  const at = params.get('at');
  if (at) {
    const a = at.split('.').map(Number);
    if (a.every(Number.isInteger) && ATLAS.at(a)) return a;
  }
  return [0];
}

/** Which way the page moved, from `a` to `b`: where the new one comes from. */
function directionOf(a, b) {
  if (!a) return 'none';
  let d = 0;
  while (d < a.length && d < b.length && a[d] === b[d]) d += 1;
  if (d === a.length && b.length > a.length) return 'right';
  if (d === b.length && a.length > b.length) return 'left';
  if (d < a.length && d < b.length) {
    if (d === 0 || a.length === b.length) return b[d] > a[d] ? 'down' : 'up';
    return b[d] > a[d] ? 'down' : 'up';
  }
  return 'none';
}

function roomFor(W, H, depth) {
  const phone = W < 760;
  // The sidebar widens a step for every level you're in.
  const side = phone ? 0 : Math.round(clamp(272, W * 0.19, 300) + Math.min(depth, 3) * 26);
  return { W, H, phone, side, areaW: W - side };
}

const SLIDE = {
  enter: (dir) => ({ x: dir === 'right' ? '100%' : dir === 'left' ? '-100%' : 0, y: dir === 'down' ? '100%' : dir === 'up' ? '-100%' : 0, opacity: dir === 'none' ? 0 : 1 }),
  center: { x: 0, y: 0, opacity: 1 },
  exit: (dir) => ({ x: dir === 'right' ? '-35%' : dir === 'left' ? '35%' : 0, y: dir === 'down' ? '-35%' : dir === 'up' ? '35%' : 0, opacity: 0 }),
};

export default function Composition() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search } = location;
  const cur = useMemo(() => addrOf(pathname, search, location.state), [pathname, search, location.state]);
  const node = ATLAS.at(cur);

  const [size, setSize] = useState(() => ({ W: window.innerWidth, H: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ W: window.innerWidth, H: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const room = useMemo(() => roomFor(size.W, size.H, cur.length - 1), [size, cur.length]);

  // Which page to the right each page last went to, so going right again
  // returns there.
  const remember = useRef(new Map());
  const prev = useRef(null);
  const dir = useMemo(() => directionOf(prev.current, cur), [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    prev.current = cur;
    for (let d = 1; d < cur.length; d += 1) remember.current.set(cur.slice(0, d).join('.'), cur[d]);
  }, [cur]);

  const [resume] = useState(() => {
    const a = loadAt();
    if (!a || a.length === 1 && a[0] === 0 || pathname !== '/' || search) return null;
    const n = ATLAS.at(a);
    return { addr: a, key: n.key, label: n.kind === 'record' ? labelOf(n.key) : n.short || n.label };
  });

  // ── search: a page of its own, over the story ──────────────────────────
  const [query, setQuery] = useState(() => (pathname.startsWith('/search') ? new URLSearchParams(search).get('q') || '' : ''));
  const [searching, setSearching] = useState(() => pathname.startsWith('/search'));
  const result = useMemo(() => (searching && query.trim() ? searchLibrary(query, lib) : null), [searching, query]);

  const go = useCallback((addr, { replace } = {}) => {
    if (!addr || !ATLAS.at(addr)) return;
    setSearching(false);
    navigate(urlOf(addr), { state: { at: addr }, replace });
  }, [navigate]);
  const step = useCallback((d) => {
    const next = ATLAS.move(cur, d, remember.current);
    if (next) go(next);
  }, [cur, go]);

  // A record picked on the page: one of this page's own goes right; one
  // next door goes sideways; anything else, where it lives.
  const pick = useCallback((id) => {
    if (id.startsWith('head:')) {
      const s = ATLAS.spine.findIndex((n) => n.stop.at === `column:${id.slice(5)}`);
      if (s >= 0) go([s]);
      return;
    }
    const kids = node.kids;
    const i = kids.findIndex((k) => k.key === id);
    if (i >= 0) { go([...cur, i]); return; }
    if (node.key === id) return;
    const parent = cur.length > 1 ? ATLAS.at(cur.slice(0, -1)) : null;
    const j = parent ? parent.kids.findIndex((k) => k.key === id) : -1;
    if (j >= 0) { go([...cur.slice(0, -1), j]); return; }
    const home = ATLAS.home.get(id);
    if (home) go(home);
  }, [node, cur, go]);

  // ── bookkeeping ─────────────────────────────────────────────────────────
  useEffect(() => {
    saveAt(cur);
    if (node.kind === 'record') { visit(node.key); noteLibrary(); }
    if (node.kind === 'stop' && node.index === ATLAS.spine.length - 1) noteIntroDone();
    const film = node.kind === 'stop' && typeof node.stop.at === 'string' && parseKey(node.stop.at).kind === 'film' ? parseKey(node.stop.at).id : null;
    if (!film) return undefined;
    const t = setTimeout(() => noteSeen(film), 1500);
    return () => clearTimeout(t);
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── the pager: one gesture, one page ────────────────────────────────────
  // A wheel or trackpad gesture moves exactly one page, in its main axis;
  // the rest of the gesture (its momentum) is swallowed, so one flick can
  // never overshoot. A scrolling text inside a page keeps its wheel until
  // it reaches its end.
  const gesture = useRef({ acc: [0, 0], fired: false, quietT: 0, at: 0 });
  useEffect(() => {
    if (room.phone) return undefined;
    // Anything that scrolls (a long page, a long text) keeps the wheel
    // until it reaches its end.
    const canScroll = (el, dy) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const { scrollTop, scrollHeight, clientHeight } = n;
        if (scrollHeight > clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) {
          if ((dy > 0 && scrollTop + clientHeight < scrollHeight - 1) || (dy < 0 && scrollTop > 0)) return true;
        }
      }
      return false;
    };
    const onWheel = (e) => {
      if (e.ctrlKey) return;
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      if (Math.abs(dy) >= Math.abs(dx) && canScroll(e.target, dy)) return;
      e.preventDefault();
      const g = gesture.current;
      clearTimeout(g.quietT);
      g.quietT = setTimeout(() => { g.fired = false; g.acc = [0, 0]; }, 200);
      if (g.fired || performance.now() - g.at < 560) return;
      g.acc[0] += dx;
      g.acc[1] += dy;
      const [ax, ay] = g.acc;
      if (Math.max(Math.abs(ax), Math.abs(ay)) < 28) return;
      g.fired = true;
      g.at = performance.now();
      if (Math.abs(ax) > Math.abs(ay)) step(ax > 0 ? 'right' : 'left');
      else step(ay > 0 ? 'down' : 'up');
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [step, room.phone]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && t.closest('input, textarea, [contenteditable]');
      if (e.key === 'Escape') {
        if (searching) { setSearching(false); setQuery(''); return; }
        step('left');
        return;
      }
      if (typing) return;
      const d = { ArrowDown: 'down', PageDown: 'down', ' ': 'down', ArrowUp: 'up', PageUp: 'up', ArrowRight: 'right', ArrowLeft: 'left' }[e.key];
      if (d) { e.preventDefault(); if (searching) setSearching(false); step(d); return; }
      if (e.key.length === 1 && /\S/.test(e.key)) {
        e.preventDefault();
        setSearching(true);
        setQuery((q) => (searching ? q : '') + (e.key === '/' ? '' : e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, searching]);

  // Hovering a link in an open record lights where it lands, if it's here.
  const root = useRef(null);
  const onProbe = useCallback((key) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-probe]').forEach((x) => x.removeAttribute('data-probe'));
    if (key) el.querySelector(`.pg [data-id="${CSS.escape(key)}"]`)?.setAttribute('data-probe', '');
  }, []);

  // ── the ways on, at the page's edges ────────────────────────────────────
  const ways = useMemo(() => {
    const one = (d) => { const a = ATLAS.move(cur, d, remember.current); return a ? { addr: a, node: ATLAS.at(a) } : null; };
    return { down: one('down'), up: one('up'), right: one('right'), left: one('left') };
  }, [cur]);
  const nameOf = (n) => (n.kind === 'stop' ? n.short : n.kind === 'record' ? labelOf(n.key) : n.label);

  const searchNode = searching ? { kind: 'search', id: 'search', hits: (result?.hits || []).slice(0, 9).map((h) => h.key) } : null;
  const shown = searchNode || node;
  const pageKey = searching ? 'search' : cur.join('.');

  const searchVoice = (
    <div className="search">
      <p className="eyebrow">Search the library</p>
      <form onSubmit={(e) => { e.preventDefault(); const top = result?.hits[0]; if (top) { const h = ATLAS.home.get(top.key); if (h) go(h); } }}>
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search" aria-label="Search the library" />
        <button type="button" onClick={() => { setSearching(false); setQuery(''); }} aria-label="Close search">✕</button>
      </form>
      <p className="prose">{result ? (result.hits.length ? `${result.hits.length} match${result.hits.length === 1 ? '' : 'es'}. Enter opens the first.` : 'Nothing in the library uses those words.') : 'Every film, paper and page, by what it says.'}</p>
    </div>
  );

  return (
    <div className="cmp" ref={root} data-depth={cur.length - 1} style={{ '--side': `${room.side}px` }}>
      {!room.phone && (
        <aside className="cmp__side">
          <header className="cmp__mast">
            <a href="/" onClick={(e) => { e.preventDefault(); go([0]); }}>Neoflix</a>
            <nav>
              <button type="button" onClick={() => setSearching((s) => !s)}>Search</button>
              <a href="/neoflix" onClick={(e) => { e.preventDefault(); navigate('/neoflix'); }}>The long read</a>
              <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
            </nav>
          </header>
          <Sidebar atlas={ATLAS} cur={cur} onGo={go} searching={searching} query={query} />
        </aside>
      )}

      <main className="cmp__area" style={{ left: room.side, width: room.areaW }}>
        <AnimatePresence initial={false} custom={searching ? 'none' : dir}>
          <motion.div
            key={pageKey}
            className="cmp__page"
            custom={searching ? 'none' : dir}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.62, ease: EASE }}
          >
            <Page
              node={shown}
              onPick={pick}
              onPath={(id) => go(ATLAS.homeOfPath.get(id))}
              onProbe={onProbe}
              search={searchVoice}
              resume={node.index === 0 && cur.length === 1 ? resume : null}
              onResume={() => resume && go(resume.addr)}
            />
          </motion.div>
        </AnimatePresence>

        {!searching && (
          <>
            {ways.right && (
              <button type="button" className="way way--right" onClick={() => step('right')} title={nameOf(ways.right.node)}>
                <i aria-hidden="true">→</i>
                <span><small>{node.kids.length} {node.kids.length === 1 ? 'page' : 'pages'} deeper</small>{nameOf(ways.right.node)}</span>
              </button>
            )}
            {ways.left && (
              <button type="button" className="way way--left" onClick={() => step('left')} title={nameOf(ways.left.node)}>
                <i aria-hidden="true">←</i>
              </button>
            )}
            {ways.down && (
              <button type="button" className="way way--down" onClick={() => step('down')}>
                <i aria-hidden="true">↓</i>
                <span>{ways.down.addr.length < cur.length ? <small>Back to the story</small> : null}{nameOf(ways.down.node)}</span>
              </button>
            )}
          </>
        )}
      </main>

      {room.phone && (
        <nav className="cmp__phonebar" aria-label="Pages">
          <a href="/" onClick={(e) => { e.preventDefault(); go([0]); }}>Neoflix</a>
          <span>{cur.length > 1 ? nameOf(ATLAS.at(cur.slice(0, -1))) : `${cur[0] + 1} of ${ATLAS.spine.length}`}</span>
          <button type="button" disabled={!ways.left} onClick={() => step('left')} aria-label="Back out">←</button>
          <button type="button" disabled={!ways.up} onClick={() => step('up')} aria-label="Previous page">↑</button>
          <button type="button" disabled={!ways.down} onClick={() => step('down')} aria-label="Next page">↓</button>
          <button type="button" disabled={!ways.right} onClick={() => step('right')} aria-label="Deeper">→</button>
        </nav>
      )}
    </div>
  );
}
