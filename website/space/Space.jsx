/**
 * The space: the whole site as one place you move through.
 *
 * Every record (film, paper, toolbox page) has a fixed place on one plane
 * (layout.js). Nothing is a page load: opening a record is a flight to it
 * (camera.js), and its reading sheet opens beside it while everything
 * around it stays in view. The three tiers the site always had (the
 * introduction, the argument, the toolbox) are three distances from
 * the same plane, not three separate pages:
 *
 *   close up       one film, full size: the introduction, scroll to go on
 *   the argument   the films with the papers above them
 *   everything     the whole library, with your own route drawn on it
 *
 * What it does about the usual web:
 *   - a click doesn't wipe the world: the camera moves, the world stays
 *   - links aren't blind: hover one and a line shows where it lands
 *   - the shape and size of the site are visible: zoom out
 *   - the slideshow/labyrinth dilemma: a path is a rail through an open
 *     space; scroll moves you along it, and you can step off anywhere
 *   - search is a lens over the space, not a separate list
 *   - the site remembers what you read (your trail is inked on it;
 *     localStorage only, nothing leaves the browser)
 *
 * URLs are the records' own (/films/team, /toolbox/…, /publications/…),
 * so every place can be linked, reloaded and opened in a new tab.
 */
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { catalog, graph, lib, stillFor, clipFor } from '../system/library';
import { loopName, parseKey } from '../system/catalog';
import { urlFor, keyForPath } from '../system/urls';
import { searchLibrary } from '../system/search';
import { useTrail, visit } from '../system/state';
import { useRipeness, noteIntroDone, noteSeen, noteLibrary, noteHurry, noteIntent } from '../system/ripeness';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import { sections as ARGUMENT } from '../pages/neoflix/content';
import { prefersReducedMedia } from '../lib/utils/reducedMedia';
import { layoutSpace, placeAt, FILM } from './layout';
import { createCamera, cameraFor, toScreen, toWorld } from './camera';
import { TOUR, CHAPTERS, DOORS } from './tour';
import { createTour, Narration, TourBar, useTourStop } from './Tour';
import Sheet from './Sheet';
import './space.css';

const SPACE = layoutSpace(catalog, graph);
const FILMS = catalog.list('film');
const PAGES = catalog.list('guidance').filter((g) => !g.divider && !/^level\s+\d/i.test(g.title)).length;
const fillText = (t) => t.replace('{pages}', PAGES);

/* ── how far into the tour this browser got (localStorage only) ────────── */
const TOUR_KEY = 'neoflix:tour';
const loadTour = () => { try { return { stop: 0, done: false, ...(JSON.parse(localStorage.getItem(TOUR_KEY)) || {}) }; } catch { return { stop: 0, done: false }; } };
const saveTour = (patch) => { try { localStorage.setItem(TOUR_KEY, JSON.stringify({ ...loadTour(), ...patch })); } catch { /* in memory only */ } };

/** The part of the screen the tour frames things in: right of its words. */
const tourFrame = () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return W < 900 ? { x0: 0, y0: 64, x1: W, y1: H * 0.5 } : { x0: 480, y0: 76, x1: W - 36, y1: H - 104 };
};
const bbox = (ns) => {
  const x0 = Math.min(...ns.map((n) => n.x));
  const y0 = Math.min(...ns.map((n) => n.y));
  return { x: x0, y: y0, w: Math.max(...ns.map((n) => n.x + n.w)) - x0, h: Math.max(...ns.map((n) => n.y + n.h)) - y0 };
};
/** Where the camera stands for a stop of the tour. */
function tourCam(stop) {
  const f = tourFrame();
  const at = stop.at;
  if (at === 'everything') return cameraFor(SPACE.bounds, f, { fill: 0.96, maxK: 1 });
  if (Array.isArray(at)) return cameraFor(bbox(at.map((k) => SPACE.nodes.get(k))), f, { fill: 0.9, maxK: 0.7 });
  if (at === 'region:practice') {
    const c0 = SPACE.columns[0];
    const h = Math.min(2400, Math.max(...SPACE.columns.map((c) => c.h)) + 260);
    return cameraFor({ x: c0.x, y: c0.y - 260, w: SPACE.totalW, h }, f, { fill: 0.94, maxK: 0.5 });
  }
  const col = /^column:(.+)$/.exec(at);
  if (col) {
    const c = SPACE.columns.find((x) => x.id === col[1]);
    return cameraFor({ x: c.x, y: c.y - 260, w: c.w, h: Math.min(c.h + 260, 2000) }, f, { fill: 0.9, maxK: 0.6 });
  }
  const n = SPACE.nodes.get(at);
  if (n.role === 'film') return cameraFor({ ...n, h: FILM.h }, f, { fill: 0.88, maxK: 1.1 });
  if (n.role === 'paper') return cameraFor(n, f, { fill: 0.8, maxK: 0.9 });
  // A toolbox page is shown among its neighbours: where it sits matters.
  return cameraFor({ x: n.x - 260, y: n.y - 200, w: n.w + 520, h: n.h + 400 }, f, { fill: 0.9, maxK: 0.55 });
}
const stopKey = (s) => (s && typeof s.at === 'string' && catalog.has(s.at) ? s.at : null);
const BEAT = Object.fromEntries(ARGUMENT.map((s) => [s.id, s.title]));
const EASE = [0.32, 0.72, 0, 1];
const K_MAX = 1.6;

const sheetWidth = () => (window.innerWidth < 760 ? window.innerWidth - 24 : Math.round(Math.min(660, Math.max(440, window.innerWidth * 0.42))));
const frameOf = (sheet) => ({ x0: 0, y0: 0, x1: window.innerWidth - (sheet ? sheetWidth() : 0), y1: window.innerHeight });

function fitFor(n, frame) {
  // Wide toolbox rows are framed by their start: the rest runs on under
  // the sheet, where the reader is reading anyway.
  const rect = n.role === 'chapter' || n.role === 'divider' || n.role === 'header' ? { ...n, w: 820 } : n;
  const maxK = n.role === 'film' ? 0.7 : n.role === 'paper' ? 0.78 : 0.66;
  return cameraFor(rect, frame, { fill: 0.58, maxK });
}
const everything = (frame) => cameraFor(SPACE.bounds, frame, { fill: 0.96, maxK: 1 });
const theArgument = (frame) => cameraFor(SPACE.argument, frame, { fill: 0.92, maxK: 1 });

const labelOf = (key) => {
  const r = catalog.get(key);
  if (!r) return '';
  if (r.kind === 'paper') return `Paper ${r.n} · ${r.short}`;
  if (r.kind === 'film') return `Film · ${r.name}`;
  return `${r.number ? `${r.number} ` : ''}${r.title}`;
};

/* ── the plane ─────────────────────────────────────────────────────────── */

const Card = memo(function Card({ n, active, visited, lit, hit, playing, onOpen, onHover }) {
  const r = catalog.get(n.key);
  const [reduced] = useState(prefersReducedMedia);
  let body = null;
  let lbl = '';
  if (n.role === 'film') {
    lbl = <><b>{r.name}</b><span>{r.claim}</span></>;
    body = (
      <>
        <span className="card__media">
          {playing && !reduced
            ? <video src={clipFor(r)} poster={stillFor(r)} autoPlay muted loop playsInline preload="auto" />
            : <img src={stillFor(r)} alt="" draggable={false} />}
        </span>
        <span className="card__cap">
          <span className="card__kick">Film {n.index + 1} of {FILMS.length} · {BEAT[r.anchor] || r.name}</span>
          <strong>{r.claim}</strong>
        </span>
      </>
    );
  } else if (n.role === 'paper') {
    lbl = `${r.n} · ${r.short}`;
    body = (
      <>
        <span className="card__n">{r.n}</span>
        <span className="card__kick">{r.journal} · {r.year}</span>
        <strong className="card__title">{r.title}</strong>
        <span className="card__short">{r.short}</span>
        <span className="card__found">{r.found}</span>
      </>
    );
  } else if (n.role === 'divider') {
    lbl = r.title;
    body = <strong className="card__divider">{r.title}</strong>;
  } else {
    lbl = r.title;
    body = (
      <>
        <span className="card__num">{r.number || (r.id === '' ? '◆' : '·')}</span>
        <span className="card__text">
          <strong>{r.id === '' ? 'Welcome to the toolbox' : r.title}</strong>
          {r.excerpt && <span className="card__ex">{r.excerpt}</span>}
          {r.tasks > 0 && <span className="card__tasks">Checklist · {r.tasks}</span>}
        </span>
      </>
    );
  }
  return (
    <a
      className={`card card--${n.role}`}
      href={urlFor(n.key)}
      data-key={n.key}
      data-active={active ? '' : undefined}
      data-visited={visited ? '' : undefined}
      data-lit={lit ? '' : undefined}
      data-hit={hit ? '' : undefined}
      style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
      draggable={false}
      onClick={(e) => onOpen(e, n.key)}
      onPointerEnter={() => onHover(n.key)}
      onPointerLeave={() => onHover(null)}
      aria-label={labelOf(n.key)}
    >
      {body}
      <span className="lbl" aria-hidden="true">{lbl}</span>
    </a>
  );
});

const Plane = memo(function Plane({ planeRef, focus, lit, hits, trail, rail, playing, onOpen, onHover }) {
  const visited = useMemo(() => new Set(trail), [trail]);
  const trailD = useMemo(() => {
    const pts = trail.map((k) => SPACE.nodes.get(k)).filter(Boolean);
    return pts.length > 1 ? pts.map((n, i) => `${i ? 'L' : 'M'}${n.cx},${n.cy}`).join(' ') : null;
  }, [trail]);
  const B = SPACE.bounds;
  return (
    <div className="plane" ref={planeRef} data-searching={hits ? '' : undefined}>
      {/* the screening band: the films, in the dark */}
      <div className="band" style={{ top: SPACE.band.y, height: SPACE.band.h }} />
      {/* the named places, legible from far away */}
      {SPACE.regions.map((g) => (
        <div key={g.id} className={`region region--${g.id}`} style={{ left: SPACE.left - 160, top: g.y + Math.min(g.h, 900) / 2 }}>
          <strong>{g.name}</strong>
          <span>{g.note}</span>
        </div>
      ))}
      {SPACE.groups.map((g) => (
        <div key={g.name} className="group" style={{ left: g.x, top: -150, width: g.w }}><span>{g.name}</span></div>
      ))}
      {SPACE.columns.map((c, i) => {
        const inner = (
          <>
            <span className="colhead__n">{i + 1}</span>
            <strong>{c.name}</strong>
            <em>{c.count} pages</em>
          </>
        );
        const style = { left: c.x, top: c.y - 230, width: c.w };
        return c.header ? (
          <a key={c.id} className="colhead" href={urlFor(c.header)} style={style} data-key={c.header} draggable={false} onClick={(e) => onOpen(e, c.header)}>{inner}<span className="lbl lbl--col">{c.name}</span></a>
        ) : (
          <div key={c.id} className="colhead" style={style}>{inner}<span className="lbl lbl--col">{c.name}</span></div>
        );
      })}

      <svg className="wires" style={{ left: B.x, top: B.y, width: B.w, height: B.h }} viewBox={`${B.x} ${B.y} ${B.w} ${B.h}`} aria-hidden="true">
        <defs>
          <marker id="loop-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" /></marker>
        </defs>
        {/* the loop closes: after "keep going", back to the start */}
        <path className="loopback" d={loopbackPath()} markerEnd="url(#loop-head)" />
        {SPACE.edges.map((e) => (
          <path key={`${e.a}>${e.b}`} className={`wire wire--${e.kind}`} d={e.d} data-a={e.a} data-b={e.b} data-lit={lit && (e.a === focus || e.b === focus) ? '' : undefined} />
        ))}
        {Object.entries(SPACE.rails).map(([id, r]) => (
          <path key={id} className="rail" d={r.d} data-on={rail === id ? '' : undefined} />
        ))}
        {trailD && <path className="trail" d={trailD} />}
      </svg>

      {[...SPACE.nodes.values()].filter((n) => n.role !== 'header').map((n) => (
        <Card
          key={n.key}
          n={n}
          active={n.key === focus}
          visited={visited.has(n.key)}
          lit={lit?.has(n.key)}
          hit={hits?.has(n.key)}
          playing={n.key === playing}
          onOpen={onOpen}
          onHover={onHover}
        />
      ))}
    </div>
  );
});

function loopbackPath() {
  const first = SPACE.columns[0];
  const last = SPACE.columns[SPACE.columns.length - 1];
  const y = first.y - 300;
  const x0 = last.x + last.w / 2;
  const x1 = first.x + first.w / 2;
  return `M${x0},${y} C${x0},${y - 420} ${x1},${y - 420} ${x1},${y - 20}`;
}

/* ── where the anchor's links lead, when they're off screen ────────────── */

function useNeighbours(anchor, path) {
  return useMemo(() => {
    if (!anchor) return [];
    const out = new Map();
    const add = (k, why) => { if (k && k !== anchor && catalog.has(k) && !out.has(k)) out.set(k, why); };
    if (path) {
      const i = path.steps.indexOf(anchor);
      add(path.steps[i + 1], 'next');
      add(path.steps[i - 1], 'back');
    }
    const r = catalog.get(anchor);
    if (r.kind === 'film') {
      add(FILMS[r.order + 1]?.key, 'next');
      add(FILMS[r.order - 1]?.key, 'back');
    }
    graph.neighbours(anchor).forEach((k) => add(k, parseKey(k).kind === 'paper' ? 'evidence' : parseKey(k).kind === 'film' ? 'film' : 'practice'));
    if (r.kind === 'guidance') {
      const list = catalog.list('guidance').filter((g) => !g.divider);
      const i = list.findIndex((g) => g.key === anchor);
      add(list[i + 1]?.key, 'next');
      add(list[i - 1]?.key, 'back');
    }
    return [...out.entries()].map(([key, why]) => ({ key, why }));
  }, [anchor, path]);
}

const WHY = { evidence: 'evidence', practice: 'in practice', film: 'on film', next: 'next', back: 'before' };

function Indicators({ camera, items, frame, onGo }) {
  const refs = useRef(new Map());
  useEffect(() => {
    const place = (cam) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const fr = frame();
      // Keep clear of the HUD: the top bar and the bottom row.
      const f = { ...fr, x0: fr.x0 + 8, x1: fr.x1 - 8, y0: fr.y0 + 72, y1: fr.y1 - 78 };
      const fx = (f.x0 + f.x1) / 2;
      const fy = (f.y0 + f.y1) / 2;
      const taken = [];
      items.forEach(({ key }) => {
        const el = refs.current.get(key);
        const n = SPACE.nodes.get(key);
        if (!el || !n) return;
        const [sx, sy] = toScreen(cam, W, H, n.cx, n.cy);
        const half = [Math.min(n.w * cam.k, 400) / 2, Math.min(n.h * cam.k, 300) / 2];
        const inside = sx + half[0] > f.x0 + 40 && sx - half[0] < f.x1 - 40 && sy + half[1] > f.y0 + 40 && sy - half[1] < f.y1 - 40;
        if (inside) { el.style.visibility = 'hidden'; return; }
        el.style.visibility = 'visible';
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const dx = sx - fx;
        const dy = sy - fy;
        const m = 18;
        const tx = dx ? ((dx > 0 ? f.x1 - m - w / 2 : f.x0 + m + w / 2) - fx) / dx : Infinity;
        const ty = dy ? ((dy > 0 ? f.y1 - m - h / 2 : f.y0 + m + h / 2) - fy) / dy : Infinity;
        const t = Math.min(Math.abs(tx), Math.abs(ty));
        let x = fx + dx * t;
        let y = fy + dy * t;
        const vertical = Math.abs(ty) < Math.abs(tx); // pinned to top/bottom
        for (let guard = 0; guard < 8; guard += 1) {
          const hit = taken.find((r) => Math.abs(r.x - x) < (r.w + w) / 2 + 6 && Math.abs(r.y - y) < (r.h + h) / 2 + 4);
          if (!hit) break;
          if (vertical) x = hit.x + (x >= hit.x ? 1 : -1) * ((hit.w + w) / 2 + 8);
          else y = hit.y + (y >= hit.y ? 1 : -1) * ((hit.h + h) / 2 + 6);
        }
        x = Math.max(f.x0 + m + w / 2, Math.min(f.x1 - m - w / 2, x));
        y = Math.max(f.y0 + m + h / 2, Math.min(f.y1 - m - h / 2, y));
        taken.push({ x, y, w, h });
        el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`;
        el.querySelector('i').style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      });
    };
    place(camera.get());
    return camera.subscribe(place);
  }, [camera, items, frame]);
  return (
    <div className="ind" aria-label="Where this leads">
      {items.map(({ key, why }) => {
        const kind = parseKey(key).kind;
        return (
          <a
            key={key}
            ref={(el) => (el ? refs.current.set(key, el) : refs.current.delete(key))}
            className={`ind__chip ind__chip--${kind}`}
            data-key={key}
            href={urlFor(key)}
            onClick={(e) => onGo(e, key)}
          >
            <i aria-hidden="true">→</i>
            <span><small>{WHY[why]}</small>{labelOf(key)}</span>
          </a>
        );
      })}
    </div>
  );
}

/* ── a line from a hovered link to where it lands ──────────────────────── */

function Probe({ camera, probe, frame }) {
  const pathRef = useRef(null);
  const dotRef = useRef(null);
  useEffect(() => {
    if (!probe) return undefined;
    let raf = 0;
    const target = document.querySelector(`.plane [data-key="${CSS.escape(probe.key)}"]`);
    target?.setAttribute('data-probe', '');
    const draw = () => {
      const cam = camera.get();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const n = SPACE.nodes.get(probe.key);
      const a = probe.el.getBoundingClientRect();
      const f = frame();
      let [tx, ty] = toScreen(cam, W, H, n.cx, n.cy);
      // Off screen, the line ends at the chip that points the way.
      const chip = document.querySelector(`.ind__chip[data-key="${CSS.escape(probe.key)}"]`);
      if (chip && chip.style.visibility === 'visible') {
        const c = chip.getBoundingClientRect();
        tx = c.left + c.width / 2;
        ty = c.top + c.height / 2;
      }
      tx = Math.max(f.x0 + 30, Math.min(f.x1 - 30, tx));
      ty = Math.max(f.y0 + 30, Math.min(f.y1 - 30, ty));
      const ax = a.left - 6;
      const ay = a.top + a.height / 2;
      const mx = (ax + tx) / 2;
      pathRef.current?.setAttribute('d', `M${ax},${ay} C${mx},${ay} ${mx},${ty} ${tx},${ty}`);
      dotRef.current?.setAttribute('transform', `translate(${tx},${ty})`);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); target?.removeAttribute('data-probe'); };
  }, [probe, camera, frame]);
  if (!probe) return null;
  return (
    <svg className="probe" aria-hidden="true">
      <path ref={pathRef} />
      <g ref={dotRef}><circle r="7" /></g>
    </svg>
  );
}

/* ── the distance gauge: the three tiers as three distances ────────────── */

function Gauge({ camera, onStop }) {
  const mark = useRef(null);
  const [zone, setZone] = useState(null);
  useEffect(() => {
    const kAll = everything(frameOf(false)).k;
    const kArg = theArgument(frameOf(false)).k;
    const lo = Math.log(kAll);
    const hi = Math.log(1.1);
    const upd = (cam) => {
      const t = Math.max(0, Math.min(1, (Math.log(cam.k) - lo) / (hi - lo)));
      if (mark.current) mark.current.style.left = `${(1 - t) * 100}%`;
      const z = cam.k > 0.45 ? 'close' : cam.k > kArg * 0.75 ? 'argument' : 'everything';
      setZone((p) => (p === z ? p : z));
    };
    upd(camera.get());
    return camera.subscribe(upd);
  }, [camera]);
  const stops = [
    ['close', 'Close up', 'One thing at a time'],
    ['argument', 'The argument', 'Films and their evidence'],
    ['everything', 'Everything', 'The whole library'],
  ];
  return (
    <nav className="gauge" aria-label="Distance">
      <ol>
        {stops.map(([id, name, note]) => (
          <li key={id}>
            <button type="button" data-on={zone === id ? '' : undefined} onClick={() => onStop(id)} title={note}>
              <strong>{name}</strong>
            </button>
          </li>
        ))}
      </ol>
      <div className="gauge__track"><span ref={mark} className="gauge__mark" /></div>
    </nav>
  );
}

function Place({ camera, focus }) {
  const [place, setPlace] = useState('');
  useEffect(() => {
    const upd = (cam) => {
      const p = placeAt(SPACE, cam.x, cam.y);
      const s = p.sub ? `${p.region} · ${p.sub}` : p.region;
      setPlace((old) => (old === s ? old : s));
    };
    upd(camera.get());
    return camera.subscribe(upd);
  }, [camera]);
  return <span className="hud__place">{focus ? labelOf(focus) : place}</span>;
}

/* ── the space ─────────────────────────────────────────────────────────── */

export default function Space() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const routeKey = keyForPath(pathname, { resolveSlug });
  const focus = routeKey && catalog.has(routeKey) ? routeKey : null;
  const from = params.get('from');
  const pathParam = params.get('path');
  const walking = pathParam && focus && catalog.path(pathParam)?.steps.includes(focus) ? catalog.path(pathParam) : null;
  const ripe = useRipeness();
  const trail = useTrail();

  const viewport = useRef(null);
  const planeRef = useRef(null);
  const lod = useRef({});
  const camera = useMemo(() => createCamera((cam, motion) => {
    const plane = planeRef.current;
    const vp = viewport.current;
    if (!plane || !vp) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const tx = W / 2 - cam.x * cam.k;
    const ty = H / 2 - cam.y * cam.k;
    plane.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${cam.k})`;
    plane.style.willChange = motion ? 'transform' : 'auto';
    plane.style.setProperty('--k', cam.k.toFixed(4));
    const set = (name, v) => { if (lod.current[name] !== v) { lod.current[name] = v; plane.dataset[name] = v; } };
    set('lodFilm', cam.k * FILM.w < 230 ? 'block' : 'card');
    set('lodPaper', cam.k < 0.36 ? 'block' : 'card');
    set('lodGuide', cam.k >= 0.42 ? 'card' : cam.k >= 0.24 ? 'label' : 'block');
    set('far', cam.k < 0.13 ? 'yes' : 'no');
    let s = 160 * cam.k;
    while (s < 18) s *= 5;
    vp.style.backgroundSize = `${s}px ${s}px`;
    vp.style.backgroundPosition = `${tx % s}px ${ty % s}px`;
  }), []);

  // Story mode. A newcomer arriving at the front is taken on the tour; so
  // is anyone who left it half way (they pick it up where they were).
  // Everyone else lands on the map, with a way back to where they were.
  const [saved] = useState(loadTour);
  const [touring, setTouring] = useState(() => pathname === '/' && !saved.done && (ripe.level < 2 || saved.stop > 0));
  const [welcome, setWelcome] = useState(() => {
    if (pathname !== '/') return null;
    if (touring && saved.stop > 0) return 'resumed';
    return !touring && trail.length ? 'back' : null;
  });
  const [hurried, setHurried] = useState(false);
  const onStopRef = useRef(null);
  const onEndRef = useRef(null);
  const tour = useMemo(() => createTour({
    camera,
    stops: TOUR,
    camFor: tourCam,
    onStop: (i) => onStopRef.current?.(i),
    onEnd: () => onEndRef.current?.(),
  }), [camera]);
  const { cur: tourStop } = useTourStop(tour);
  const tourDoneRef = useRef(saved.done);
  const touringRef = useRef(touring);
  touringRef.current = touring;

  const [query, setQuery] = useState(() => (pathname.startsWith('/search') ? params.get('q') || '' : ''));
  const [searching, setSearching] = useState(() => pathname.startsWith('/search'));
  const [rail, setRail] = useState(null);
  const [probe, setProbe] = useState(null);
  const sheetOpen = !!focus;
  const frame = useCallback(() => frameOf(sheetOpen), [sheetOpen]);
  const anchor = focus || (touring ? stopKey(TOUR[tourStop]) : null);
  const neighbours = useNeighbours(touring ? null : anchor, walking);
  const lit = useMemo(() => (anchor ? new Set([anchor, ...graph.neighbours(anchor)]) : null), [anchor]);

  const result = useMemo(() => (searching && query.trim() ? searchLibrary(query, lib) : null), [searching, query]);
  const hits = useMemo(() => (result ? new Set(result.hits.map((r) => r.key)) : null), [result]);

  // /paths/<id> starts walking it; /paths and /search are views of the space.
  useEffect(() => {
    const m = /^\/paths\/([^/]+)/.exec(pathname);
    const p = m && catalog.path(m[1]);
    if (p) navigate(urlFor(p.steps[0], { path: p.id }), { replace: true });
  }, [pathname, navigate]);

  // Arriving: put the camera where this reader belongs before first paint.
  const first = useRef(true);
  useLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    tour.layout();
    if (focus) camera.set(fitFor(SPACE.nodes.get(focus), frameOf(true)));
    else if (touring) {
      tour.seek(saved.stop);
      // The first sight is the whole map, settling into place.
      const target = camera.get();
      camera.set({ ...target, k: target.k * 1.7 });
      camera.fly(target, { duration: 1700 });
    } else if (ripe.level >= 3) camera.set(everything(frameOf(false)));
    else camera.set(theArgument(frameOf(false)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── the tour's bookkeeping ──────────────────────────────────────────────
  const stopTimes = useRef([]);
  onStopRef.current = (i) => {
    if (!touring) return;
    saveTour({ stop: i });
    // Three stops in under three seconds: they want to be somewhere else.
    const now = performance.now();
    const ts = [...stopTimes.current, now].slice(-3);
    stopTimes.current = ts;
    if (ts.length === 3 && now - ts[0] < 3000 && !hurried) { setHurried(true); noteHurry(); }
  };
  onEndRef.current = () => endTour();
  // A film watched on the tour counts as seen, and goes on the trail.
  useEffect(() => {
    if (!touring) return undefined;
    const key = stopKey(TOUR[tourStop]);
    if (!key || parseKey(key).kind !== 'film') return undefined;
    const t = setTimeout(() => noteSeen(parseKey(key).id), 1500);
    return () => clearTimeout(t);
  }, [touring, tourStop]);

  const finishTour = useCallback(() => {
    tour.halt();
    setTouring(false);
    setHurried(false);
    if (!tourDoneRef.current) { tourDoneRef.current = true; saveTour({ done: true }); }
    noteIntroDone();
  }, [tour]);
  const endTour = useCallback(() => {
    finishTour();
    camera.fly(everything(frameOf(false)), { duration: 1400 });
  }, [finishTour, camera]);
  /** Step out of the tour without finishing it (drag, zoom, search, open). */
  const pauseTour = useCallback(() => {
    if (!touring) return;
    tour.halt();
    setTouring(false);
  }, [touring, tour]);
  const resumeTour = useCallback((from) => {
    setWelcome(null);
    setSearching(false);
    if (focus) navigate('/');
    setTouring(true);
    if (from === 0) { saveTour({ stop: 0, done: false }); tourDoneRef.current = false; tour.goTo(0); }
    else tour.resume();
  }, [focus, navigate, tour]);

  // A record opened (by a click, a link, the address bar, back/forward).
  const lastFocus = useRef(focus);
  useEffect(() => {
    const prev = lastFocus.current;
    lastFocus.current = focus;
    if (focus === prev) return;
    if (focus) {
      pauseTour();
      setWelcome(null);
      camera.fly(fitFor(SPACE.nodes.get(focus), frameOf(true)));
    } else if (prev) {
      // Closing a record steps back from it, keeping it in the middle.
      const n = SPACE.nodes.get(prev);
      const cam = camera.get();
      camera.fly({ x: n.cx, y: n.cy, k: Math.max(0.2, cam.k * 0.6) }, { duration: 900 });
    }
  }, [focus, camera]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (focus) { visit(focus); noteLibrary(); } setProbe(null); }, [focus]);

  const go = useCallback((key, opts = {}) => {
    navigate(urlFor(key, { from: opts.from === undefined ? focus : opts.from, path: opts.path }));
  }, [navigate, focus]);

  /** A door out of the tour: straight to where this reader needs to be. */
  const takeDoor = useCallback((door) => {
    noteIntent();
    finishTour();
    if (door.path) {
      const p = catalog.path(door.path);
      go(p.steps[0], { path: p.id, from: null });
    } else camera.fly(everything(frameOf(false)), { duration: 1400 });
  }, [finishTour, go, camera]);

  const toStop = useCallback((id) => {
    pauseTour();
    const f = frameOf(sheetOpen);
    if (id === 'everything') camera.fly(everything(f));
    else if (id === 'argument') camera.fly(theArgument(f));
    else {
      const c = camera.get();
      const target = focus ? fitFor(SPACE.nodes.get(focus), f) : nearestClose(c, f);
      camera.fly(target);
    }
  }, [camera, focus, sheetOpen, pauseTour]);

  // ── pointer: drag to move, click to open ────────────────────────────────
  const drag = useRef(null);
  const dragged = useRef(false);
  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('.hud, .ind, .sheet')) return;
    drag.current = { x: e.clientX, y: e.clientY, cam: camera.get(), id: e.pointerId, moved: false };
    dragged.current = false;
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) { d.moved = true; viewport.current.setPointerCapture?.(e.pointerId); viewport.current.dataset.dragging = ''; pauseTour(); setWelcome(null); }
    camera.nudge({ ...d.cam, x: d.cam.x - dx / d.cam.k, y: d.cam.y - dy / d.cam.k });
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) {
      dragged.current = true;
      delete viewport.current.dataset.dragging;
      viewport.current.releasePointerCapture?.(e.pointerId);
      camera.settle();
      setTimeout(() => { dragged.current = false; }, 0);
    }
  };

  const onOpen = useCallback((e, key) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    if (dragged.current) return;
    if (key === focus) return;
    go(key, { path: walking?.steps.includes(key) ? walking.id : undefined });
  }, [go, focus, walking]);

  // Hovering a card lights up everything it connects to, across the space.
  const onHover = useCallback((key) => {
    const plane = planeRef.current;
    if (!plane) return;
    plane.querySelectorAll('[data-hover]').forEach((el) => el.removeAttribute('data-hover'));
    if (!key) { delete plane.dataset.hovering; return; }
    plane.dataset.hovering = '';
    const keys = [key, ...graph.neighbours(key)];
    keys.forEach((k) => plane.querySelector(`.card[data-key="${CSS.escape(k)}"]`)?.setAttribute('data-hover', ''));
    plane.querySelectorAll(`.wire[data-a="${CSS.escape(key)}"], .wire[data-b="${CSS.escape(key)}"]`).forEach((el) => el.setAttribute('data-hover', ''));
  }, []);

  // ── wheel: on the tour, scrolling (either axis) moves along the story;
  // otherwise it zooms (mouse) or moves (trackpad). Pinch always zooms,
  // and steps out of the tour.
  const wheelAcc = useRef({ v: 0, lock: 0 });
  useEffect(() => {
    const el = viewport.current;
    const onWheel = (e) => {
      if (e.target.closest('.sheet, .hud__search, .gauge')) return;
      e.preventDefault();
      if (touring && !e.ctrlKey) {
        const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
        tour.scroll((Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit);
        return;
      }
      if (touring) pauseTour();
      const cam = camera.get();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const trackpad = !e.ctrlKey && e.deltaMode === 0 && (Math.abs(e.deltaX) > 0.5 || Math.abs(e.deltaY) < 40 || !Number.isInteger(e.deltaY));
      if (trackpad) {
        camera.nudge({ ...cam, x: cam.x + e.deltaX / cam.k, y: cam.y + e.deltaY / cam.k });
      } else {
        const unit = e.deltaMode === 1 ? 32 : 1;
        const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.012 : 0.0018));
        const kMin = everything(frameOf(false)).k * 0.7;
        const k = Math.max(kMin, Math.min(K_MAX, cam.k * factor));
        const [wx, wy] = toWorld(cam, W, H, e.clientX, e.clientY);
        camera.nudge({ k, x: wx - (e.clientX - W / 2) / k, y: wy - (e.clientY - H / 2) / k });
      }
      clearTimeout(wheelAcc.current.t);
      wheelAcc.current.t = setTimeout(() => camera.settle(), 140);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [camera, touring, tour, pauseTour]);

  // ── keys ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.closest('input, textarea, [contenteditable]'));
      const inSheet = t instanceof HTMLElement && t.closest('.sheet');
      if (e.key === 'Escape') {
        if (searching) { setSearching(false); setQuery(''); return; }
        if (touring) { pauseTour(); return; }
        if (focus) { navigate('/'); return; }
        const c = camera.get();
        toStop(c.k > theArgument(frameOf(false)).k * 1.3 ? 'argument' : 'everything');
        return;
      }
      if (typing) return;
      if (touring && ['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); tour.next(); return; }
      if (touring && ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); tour.prev(); return; }
      if (inSheet) return;
      if (walking && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const i = walking.steps.indexOf(focus) + (e.key === 'ArrowRight' ? 1 : -1);
        if (walking.steps[i]) { e.preventDefault(); go(walking.steps[i], { path: walking.id }); }
        return;
      }
      const cam = camera.get();
      const pan = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (pan) { e.preventDefault(); camera.fly({ ...cam, x: cam.x + (pan[0] * 260) / cam.k, y: cam.y + (pan[1] * 220) / cam.k }, { duration: 380 }); return; }
      if (e.key === '+' || e.key === '=') { camera.fly({ ...cam, k: Math.min(K_MAX, cam.k * 1.6) }, { duration: 420 }); return; }
      if (e.key === '-' || e.key === '_') { camera.fly({ ...cam, k: Math.max(0.02, cam.k / 1.6) }, { duration: 420 }); return; }
      if (e.key.length === 1 && /\S/.test(e.key)) {
        e.preventDefault();
        pauseTour();
        setSearching(true);
        setQuery((q) => (searching ? q : '') + (e.key === '/' ? '' : e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [camera, focus, touring, tour, walking, searching, navigate, go, toStop, pauseTour]);

  // Search is a lens: the space dims, the matches light, the camera frames them.
  useEffect(() => {
    if (!result || !result.hits.length) return undefined;
    const t = setTimeout(() => {
      const ns = result.hits.slice(0, 40).map((r) => SPACE.nodes.get(r.key)).filter(Boolean);
      const x0 = Math.min(...ns.map((n) => n.x));
      const y0 = Math.min(...ns.map((n) => n.y));
      const x1 = Math.max(...ns.map((n) => n.x + n.w));
      const y1 = Math.max(...ns.map((n) => n.y + n.h));
      camera.fly(cameraFor({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, frameOf(sheetOpen), { fill: 0.86, maxK: 0.7 }), { duration: 900 });
    }, 320);
    return () => clearTimeout(t);
  }, [result, camera, sheetOpen]);

  // "Welcome back" says its piece and goes.
  useEffect(() => {
    if (!welcome) return undefined;
    const t = setTimeout(() => setWelcome(null), 14000);
    return () => clearTimeout(t);
  }, [welcome]);

  useEffect(() => {
    const onResize = () => {
      tour.layout();
      if (touringRef.current) tour.seek(tour.get().cur);
      else camera.set(camera.get());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [camera, tour]);

  const closeSheet = useCallback(() => navigate('/'), [navigate]);
  const playing = anchor && parseKey(anchor).kind === 'film' ? anchor : null;

  return (
    <div className="space" data-tour={touring ? '' : undefined} data-sheet={sheetOpen ? '' : undefined} style={{ '--sheet-w': `${sheetWidth()}px` }}>
      <div
        className="space__view"
        ref={viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Plane planeRef={planeRef} focus={anchor} lit={lit} hits={hits} trail={trail} rail={walking?.id || rail} playing={playing} onOpen={onOpen} onHover={onHover} />
      </div>

      <Indicators camera={camera} items={neighbours} frame={frame} onGo={(e, key) => { e.preventDefault(); go(key, { from: anchor, path: walking?.steps.includes(key) ? walking.id : undefined }); }} />
      <Probe camera={camera} probe={probe} frame={frame} />

      {/* ── HUD ── */}
      <header className="hud hud--top">
        <a className="hud__mark" href="/" onClick={(e) => { e.preventDefault(); if (focus) navigate('/'); toStop('everything'); }}>
          <strong>Neoflix</strong>
          <Place camera={camera} focus={focus} />
        </a>
        <nav className="hud__links">
          <button type="button" className="hud__find" onClick={() => { pauseTour(); setSearching(true); }}>
            <span>Search</span><kbd>type anywhere</kbd>
          </button>
          <a href="/neoflix" onClick={(e) => { e.preventDefault(); navigate('/neoflix'); }}>The long read</a>
          <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
        </nav>
      </header>

      <Gauge camera={camera} onStop={toStop} />

      {touring && (
        <>
          <Narration
            tour={tour}
            chapters={CHAPTERS}
            fill={fillText}
            hurried={hurried}
            doors={DOORS}
            labelOf={(k) => (k === 'guidance:' ? 'the toolbox' : labelOf(k))}
            hrefOf={urlFor}
            onOpen={(k) => go(k, { from: null })}
            onDoor={takeDoor}
          />
          <TourBar tour={tour} chapters={CHAPTERS} onLeave={pauseTour} />
        </>
      )}

      <AnimatePresence>
        {welcome && (
          <motion.div className="hud welcome" key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}>
            {welcome === 'resumed' ? (
              <>
                <p><strong>Welcome back.</strong> You’re where you left the tour.</p>
                <button type="button" onClick={() => resumeTour(0)}>Start over</button>
                <button type="button" onClick={() => { setWelcome(null); takeDoor(DOORS.find((d) => d.id === 'look')); }}>Skip the tour</button>
              </>
            ) : (
              <>
                <p><strong>Welcome back.</strong> Your route so far is drawn in gold.</p>
                {trail.length > 0 && catalog.has(trail[trail.length - 1]) && (
                  <button type="button" onClick={() => go(trail[trail.length - 1], { from: null })}>Back to {labelOf(trail[trail.length - 1])}</button>
                )}
              </>
            )}
            <button type="button" className="welcome__x" onClick={() => setWelcome(null)} aria-label="Dismiss">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searching && (
          <motion.div className="hud hud__search" key="search" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: EASE }}>
            <form onSubmit={(e) => { e.preventDefault(); const top = result?.hits[0]; if (top) { setSearching(false); setQuery(''); go(top.key); } }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the library"
                aria-label="Search the library"
              />
              <span className="hud__count">{result ? `${result.hits.length} lit` : ''}</span>
              <button type="button" onClick={() => { setSearching(false); setQuery(''); }} aria-label="Close search">✕</button>
            </form>
            {result && result.hits.length > 0 && (
              <ol>
                {result.hits.slice(0, 6).map((r, i) => (
                  <li key={r.key}>
                    <a href={urlFor(r.key)} data-kind={r.kind} onClick={(e) => { e.preventDefault(); setSearching(false); setQuery(''); go(r.key); }}>
                      <span>{labelOf(r.key)}</span>{i === 0 && <kbd>↵</kbd>}
                    </a>
                  </li>
                ))}
              </ol>
            )}
            {result && !result.hits.length && <p className="hud__none">Nothing in the library uses those words.</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="hud hud--paths" aria-label="Paths">
        {walking ? (
          <div className="walk">
            {(() => {
              const i = walking.steps.indexOf(focus);
              const prev = walking.steps[i - 1];
              const next = walking.steps[i + 1];
              return (
                <>
                  <button type="button" disabled={!prev} onClick={() => go(prev, { path: walking.id })} aria-label="Previous step">←</button>
                  <span className="walk__name"><small>Walking</small>{walking.name}</span>
                  <span className="walk__dots">{walking.steps.map((s, j) => <button key={s} type="button" data-on={j === i ? '' : undefined} data-past={j < i ? '' : undefined} onClick={() => go(s, { path: walking.id })} aria-label={catalog.label(s)} />)}</span>
                  <span className="walk__n">{i + 1} / {walking.steps.length}</span>
                  <button type="button" disabled={!next} onClick={() => go(next, { path: walking.id })} aria-label="Next step">→</button>
                  <button type="button" className="walk__x" onClick={() => go(focus, { from: null })} aria-label="Stop walking">✕</button>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="pathpills">
            <button type="button" className="pathpills__tour" onClick={() => resumeTour(tourDoneRef.current ? 0 : undefined)}>
              <span className="ico-play" />{tourDoneRef.current ? 'Replay the tour' : tourStop > 0 ? `Resume the tour · ${tourStop + 1}/${TOUR.length}` : 'Take the tour'}
            </button>
            <small>Walk a path</small>
            {catalog.paths.map((p) => (
              <a
                key={p.id}
                href={urlFor(p.steps[0], { path: p.id })}
                onPointerEnter={() => setRail(p.id)}
                onPointerLeave={() => setRail(null)}
                onClick={(e) => { e.preventDefault(); setRail(null); go(p.steps[0], { path: p.id, from: null }); }}
              >
                {p.name}<em>{p.steps.length}</em>
              </a>
            ))}
          </div>
        )}
      </nav>

      <AnimatePresence>
        {focus && (
          <motion.aside
            key="sheet"
            className="sheet"
            style={{ width: sheetWidth() }}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Sheet
              record={catalog.get(focus)}
              from={from && catalog.has(from) ? from : null}
              path={walking}
              onClose={closeSheet}
              onProbe={setProbe}
              onRail={setRail}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Close up" from wherever the camera is: the record nearest the middle. */
function nearestClose(cam, frame) {
  let best = null;
  let bd = Infinity;
  SPACE.nodes.forEach((n) => {
    const d = Math.hypot(n.cx - cam.x, n.cy - cam.y);
    if (d < bd) { bd = d; best = n; }
  });
  return best ? cameraFor(best, frame, { fill: 0.8, maxK: 1 }) : { ...cam, k: 1 };
}
