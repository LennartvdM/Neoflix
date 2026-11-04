/**
 * The composition: the site as elements that clamp to each other.
 *
 * Every film, paper and toolbox page is its own element, with its own
 * size and shape; so are the site's own pieces (the voice, the tour's
 * controls, an open record's modules). What is out, how big, and what
 * clamps to what depends on the context (contexts.js): at rest the
 * films are out with their papers and the steps of the loop; open a
 * record and its modules clamp round its title, with the records it
 * links to clamped to the module that mentions them; search, and the
 * matches clamp to the search. The magnet (magnet.js) decides where
 * each one docks; the engine (engine.js) moves them there on springs.
 * Nothing divides the screen: the elements cluster, and the ground
 * between clusters is allowed to show.
 *
 * Any element can be picked up and dropped: it clamps to the nearest
 * free edge where it lands, and stays there until the context changes.
 *
 * URLs are the records' own (/films/team, /toolbox/…, /publications/…).
 */
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { catalog, graph, lib, stillFor, clipFor } from '../system/library';
import { LOOP, loopName, parseKey } from '../system/catalog';
import { urlFor, keyForPath } from '../system/urls';
import { searchLibrary } from '../system/search';
import { useTrail, usePins, visit, togglePin } from '../system/state';
import { useRipeness, noteIntroDone, noteSeen, noteLibrary, noteHurry, noteIntent } from '../system/ripeness';
import { planRecord } from '../system/modules/plans';
import { MODULES, MODULE_NAMES, SessionFilmButton } from '../system/modules';
import { FrontContext } from '../system/modules/front';
import { Here } from '../system/ui/nav';
import { shortAuthors, doiUrl } from '../pages/publications/records';
import { publicationPdfs } from '../pages/publications/content';
import { TAGLINE } from '../pages/home/content';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import { assetUrl } from '../lib/utils/assetUrl';
import { prefersReducedMedia } from '../lib/utils/reducedMedia';
import { buildWorld, itemsFor } from './contexts';
import { assemble, dockNear } from './magnet';
import { createEngine } from './engine';
import { createStory } from './story';
import { TOUR, CHAPTERS, DOORS } from './tour';
import '../system/system.css';
import './composition.css';

const WORLD = buildWorld(catalog);
const FILMS = WORLD.films;
const PAGES = WORLD.guidance.length;
const fillText = (t) => t.replace('{pages}', PAGES);
const GAP = 10;
const PAD = 24; // inside the voice and the modules (composition.css)
const clamp = (lo, v, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/* ── how far into the tour this browser got (localStorage only) ────────── */
const TOUR_KEY = 'neoflix:tour';
const loadTour = () => { try { return { stop: 0, done: false, ...(JSON.parse(localStorage.getItem(TOUR_KEY)) || {}) }; } catch { return { stop: 0, done: false }; } };
const saveTour = (patch) => { try { localStorage.setItem(TOUR_KEY, JSON.stringify({ ...loadTour(), ...patch })); } catch { /* in memory only */ } };

function stopState(s) {
  if (s.at === 'everything') return { lens: 'everything' };
  if (Array.isArray(s.at) || /^(column|region):/.test(s.at)) return { lens: s.at };
  return { anchor: s.at };
}
const stopKey = (s) => (s && typeof s.at === 'string' && catalog.has(s.at) ? s.at : null);

/** The room the elements have, and how big they are on this screen. */
function roomFor(W, H) {
  const phone = W < 760;
  // A phone gets a tall plate that scrolls, so nothing is left out.
  const bounds = phone ? { x: 10, y: 58, w: W - 20, h: Math.max(H * 8, 6000) } : { x: 20, y: 70, w: W - 40, h: H - 88 };
  const f = clamp(0.62, Math.min(W / 1440, H / 900), 1.25);
  const vw = Math.min(bounds.w, Math.round(400 * Math.max(0.9, f)));
  return { W, H, phone, bounds, f, vw };
}

/* ── an open record's modules ──────────────────────────────────────────── */

// Shown otherwise: the film is its own element, and the rest of the
// library is out around the record.
const NOT_IN_READING = new Set(['map', 'loop', 'loopbrowse', 'paperlist', 'player']);
const MOD_W = { text: 560, thread: 560, pathcards: 560, found: 440, summary: 380, findings: 380, sequence: 380, abstract: 360, practice: 340, film: 340, inpractice: 340, paths: 300, cite: 300 };
const plansOf = (record, from) => planRecord(record, { from }, lib).filter((p) => !NOT_IN_READING.has(p.id)).sort((a, b) => a.order - b.order);

const labelOf = (key) => {
  const r = catalog.get(key);
  if (!r) return '';
  if (r.kind === 'paper') return `Paper ${r.n} · ${r.short}`;
  if (r.kind === 'film') return `Film · ${r.name}`;
  return `${r.number ? `${r.number} ` : ''}${r.title}`;
};

/* ── the records' elements ─────────────────────────────────────────────── */

const RecordEl = memo(function RecordEl({ id, kind, engine, anchor, visited, hit, playing, onOpen, onHover, onGrab }) {
  const ref = useCallback((el) => engine.register(id, el), [engine, id]);
  const head = kind === 'head' ? WORLD.heads.find((h) => h.id === id) : null;
  const r = head ? null : catalog.get(id);
  const [reduced] = useState(prefersReducedMedia);
  let body;
  if (kind === 'film') {
    body = (
      <>
        {playing && !reduced
          ? <video className="t__media" src={clipFor(r)} poster={stillFor(r)} autoPlay muted loop playsInline preload="auto" />
          : <img className="t__media" src={stillFor(r)} alt="" draggable={false} />}
        <span className="t__plate">
          <span className="t__n">{r.order + 1}</span>
          <span className="t__name">{r.name}</span>
          <span className="t__claim">{r.claim}</span>
        </span>
      </>
    );
  } else if (kind === 'paper') {
    body = (
      <span className="t__in">
        <span className="t__n">{r.n}</span>
        <span className="t__title">{r.short}</span>
        <span className="t__found">{r.found}</span>
        <span className="t__meta">{r.journal} · {r.year}</span>
      </span>
    );
  } else if (kind === 'head') {
    const count = WORLD.guidance.filter((g) => g.phase === head.phase).length;
    body = (
      <span className="t__in">
        <span className="t__n">{head.step}</span>
        <span className="t__title">{head.name}</span>
        <span className="t__meta">{count} pages</span>
      </span>
    );
  } else {
    body = (
      <span className="t__in">
        {r.number ? <span className="t__n">{r.number}</span> : null}
        <span className="t__title">{r.id === '' ? 'Welcome to the toolbox' : r.title}</span>
        {r.excerpt && <span className="t__ex">{r.excerpt}</span>}
      </span>
    );
  }
  const link = !head;
  const Tag = link ? 'a' : 'button';
  return (
    <Tag
      ref={ref}
      className={`e e--${kind}`}
      href={link ? urlFor(id) : undefined}
      type={link ? undefined : 'button'}
      data-id={id}
      data-numbered={kind === 'guidance' && !r.number ? undefined : ''}
      data-anchor={anchor ? '' : undefined}
      data-visited={visited ? '' : undefined}
      data-hit={hit ? '' : undefined}
      draggable={false}
      onClick={(e) => onOpen(e, id)}
      onPointerDown={(e) => onGrab(e, id)}
      onPointerEnter={() => onHover(link ? id : null)}
      onPointerLeave={() => onHover(null)}
      aria-label={link ? labelOf(id) : `${head.name}: this step of the loop`}
    >
      {body}
    </Tag>
  );
});

/** An element as tall as what it says (the voice, a module). */
const Measured = React.forwardRef(function Measured({ id, engine, width, className, children, ...rest }, measureRef) {
  const ref = useCallback((el) => engine.register(id, el), [engine, id]);
  return (
    <section ref={ref} className={`e e--measured ${className || ''}`} data-id={id} {...rest}>
      <div className="e__scroll">
        <div className="e__content" ref={measureRef} style={{ width: Math.max(0, width - PAD * 2) }}>{children}</div>
      </div>
    </section>
  );
});

/* ── the voice: the words for what you're looking at ───────────────────── */

function NarrationBody({ cur, hurried, onOpen, onDoor }) {
  const s = TOUR[cur];
  const chapter = CHAPTERS.find((c) => c.id === s.chapter);
  const showDoors = s.doors || hurried;
  return (
    <>
      <p className="v__where">{chapter ? <><b>{CHAPTERS.indexOf(chapter) + 1}</b>{chapter.name}</> : <><b>{cur === 0 ? '↓' : '■'}</b>{cur === 0 ? 'A tour, in a few minutes' : 'The end of the tour'}</>}</p>
      <h1 className="v__title">{s.title}</h1>
      <p className="v__text">{fillText(s.text)}</p>
      {s.open && (
        <a className="v__open" href={urlFor(s.open)} onClick={(e) => { e.preventDefault(); onOpen?.(s.open); }}>
          Open {s.open === 'guidance:' ? 'the toolbox' : labelOf(s.open)} <span aria-hidden="true">→</span>
        </a>
      )}
      {showDoors && (
        <div className="v__doors">
          <p>{s.doors ? (cur === 0 ? 'Or go straight to' : 'Where to next') : 'Moving fast? Go straight to'}</p>
          {DOORS.map((d) => (
            <button key={d.id} type="button" className="v__door" onClick={() => onDoor?.(d)}>
              <strong>{d.label}</strong><span>{d.note}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function Narration({ story, hurried, onOpen, onDoor }) {
  const ref = useRef(null);
  const [cur, setCur] = useState(() => Math.max(0, story.get().cur));
  useEffect(() => story.subscribe((n) => {
    setCur((o) => (o === n.cur ? o : Math.max(0, n.cur)));
    const el = ref.current;
    if (el) {
      el.style.opacity = n.opacity.toFixed(3);
      el.style.transform = `translateY(${((1 - n.opacity) * 12).toFixed(1)}px)`;
    }
  }), [story]);
  return (
    <div className="v__story" ref={ref} aria-live="polite">
      <NarrationBody cur={cur} hurried={hurried} onOpen={onOpen} onDoor={onDoor} />
    </div>
  );
}

function Controls({ story, onLeave }) {
  const [s, setS] = useState(() => story.get());
  useEffect(() => story.subscribe((n) => setS((o) => (o.cur === n.cur && o.playing === n.playing ? o : { cur: n.cur, playing: n.playing }))), [story]);
  const cur = Math.max(0, s.cur);
  return (
    <div className="v__foot">
      <div className="v__progress" role="list">
        {TOUR.map((st, i) => (
          <button key={st.id} type="button" role="listitem" data-depth={st.depth} data-past={i < cur ? '' : undefined} data-on={i === cur ? '' : undefined} title={st.title} aria-label={`${i + 1}: ${st.title}`} onClick={() => story.goTo(i)} />
        ))}
      </div>
      <div className="v__controls">
        <button type="button" onClick={() => story.prev()} disabled={cur <= 0} aria-label="Previous stop">←</button>
        <button type="button" onClick={() => (s.playing ? story.pause() : story.play())}>{s.playing ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={() => story.next()} aria-label="Next stop">→</button>
        <span className="v__count">{cur + 1}<i>/</i>{TOUR.length}</span>
        <button type="button" className="v__leave" onClick={onLeave}>Leave the tour</button>
      </div>
    </div>
  );
}

function RecordVoice({ record, walking, onGo, onClose }) {
  const pins = usePins();
  const pinned = pins.includes(record.key);
  let where;
  let sub = null;
  let title = record.title;
  if (record.key === 'guidance:') {
    where = <><b>T</b>The toolbox</>;
    title = 'Video review for neonatal teams, step by step';
    sub = <p className="v__text">How to start recording and reviewing, from the decision to the first session and beyond.</p>;
  } else if (record.kind === 'guidance') {
    where = <><b>{record.number || LOOP.findIndex((l) => l.id === record.phase) + 1 || 'T'}</b>{loopName(record.phase) || 'The toolbox'}</>;
    sub = record.excerpt && <p className="v__text">{record.excerpt}</p>;
  } else if (record.kind === 'paper') {
    const pdf = publicationPdfs[record.id];
    where = <><b>{record.n}</b>{record.journal}, {record.year}</>;
    sub = (
      <p className="v__meta">
        {shortAuthors(record)}
        {record.doi && <><br /><a href={doiUrl(record)} target="_blank" rel="noopener noreferrer">doi.org/{record.doi}</a></>}
        {pdf && <><br /><a href={assetUrl(pdf.src)} download>Author PDF, {pdf.pages} pages</a></>}
      </p>
    );
  } else {
    where = <><b>{record.order + 1}</b>Film · {record.name}</>;
    sub = (
      <>
        <p className="v__text">{record.caption}</p>
        <SessionFilmButton at={record.at} />
      </>
    );
  }
  const i = walking ? walking.steps.indexOf(record.key) : -1;
  return (
    <div className="v__record">
      <p className="v__where">{where}</p>
      <h1 className={`v__title${title.length > 90 ? ' v__title--long' : ''}`}>{title}</h1>
      {sub}
      <div className="v__actions">
        <button type="button" data-on={pinned ? '' : undefined} onClick={() => togglePin(record.key)}>{pinned ? '✓ In your pack' : '+ Pack'}</button>
        <button type="button" onClick={onClose}>Close <kbd>Esc</kbd></button>
      </div>
      {walking && (
        <div className="v__walk">
          <p><b>Path</b>{walking.name}<span>{i + 1} of {walking.steps.length}</span></p>
          <div className="v__steps">
            {walking.steps.map((s, j) => (
              <button key={s} type="button" data-on={j === i ? '' : undefined} data-past={j < i ? '' : undefined} onClick={() => onGo(s, { path: walking.id })} title={catalog.label(s)} aria-label={catalog.label(s)} />
            ))}
          </div>
          <div className="v__controls">
            <button type="button" disabled={i <= 0} onClick={() => onGo(walking.steps[i - 1], { path: walking.id })}>← Before</button>
            <button type="button" disabled={i >= walking.steps.length - 1} onClick={() => onGo(walking.steps[i + 1], { path: walking.id })}>Next →</button>
            <button type="button" className="v__leave" onClick={() => onGo(record.key, { from: null })}>Stop walking</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Rest({ tourState, trail, onTour, onPath, onBack }) {
  const last = trail.length && catalog.has(trail[trail.length - 1]) ? trail[trail.length - 1] : null;
  return (
    <div className="v__rest">
      <p className="v__where"><b>N</b>Neoflix, Leiden</p>
      <h1 className="v__title v__title--big">{TAGLINE}</h1>
      <p className="v__text">Six short films, the six papers behind them, and a toolbox of {PAGES} pages for doing it in your own unit. Open anything and what belongs with it comes to it. Pick anything up and put it where you want it.</p>
      {last && <p className="v__back">Welcome back. <a href={urlFor(last)} onClick={(e) => { e.preventDefault(); onBack(last); }}>Carry on with {labelOf(last)} →</a></p>}
      <div className="v__doors">
        <button type="button" className="v__door v__door--tour" onClick={onTour}>
          <strong>{tourState.done ? 'Take the tour again' : tourState.stop > 0 ? 'Carry on with the tour' : 'Take the tour'}</strong>
          <span>{tourState.stop > 0 && !tourState.done ? `You were at ${tourState.stop + 1} of ${TOUR.length}` : `${TOUR.length} stops, a few minutes`}</span>
        </button>
        {catalog.paths.map((p) => (
          <button key={p.id} type="button" className="v__door" onClick={() => onPath(p)}>
            <strong>{p.name}</strong><span>A path, {p.steps.length} steps</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepVoice({ phase, onClose }) {
  const head = WORLD.heads.find((h) => h.phase === phase);
  const pages = WORLD.guidance.filter((g) => g.phase === phase);
  return (
    <div className="v__rest">
      <p className="v__where"><b>{head.step}</b>Step {head.step} of the loop</p>
      <h1 className="v__title">{head.name}</h1>
      <p className="v__text">{pages.length} pages of the toolbox: the chapters in a run, each with its pages clamped under it.</p>
      <div className="v__actions"><button type="button" onClick={onClose}>Back <kbd>Esc</kbd></button></div>
    </div>
  );
}

/* ── the composition ───────────────────────────────────────────────────── */

const ALL = [
  ...FILMS.map((r) => [r.key, 'film']),
  ...WORLD.papers.map((r) => [r.key, 'paper']),
  ...WORLD.guidance.map((r) => [r.key, 'guidance']),
  ...WORLD.heads.map((h) => [h.id, 'head']),
];

export default function Composition() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const routeKey = keyForPath(pathname, { resolveSlug });
  const focus = routeKey && catalog.has(routeKey) ? routeKey : null;
  const fromParam = params.get('from');
  const from = fromParam && catalog.has(fromParam) ? fromParam : null;
  const pathParam = params.get('path');
  const walking = pathParam && focus && catalog.path(pathParam)?.steps.includes(focus) ? catalog.path(pathParam) : null;
  const ripe = useRipeness();
  const trail = useTrail();
  const visited = useMemo(() => new Set(trail), [trail]);

  const engine = useMemo(() => createEngine(), []);
  const root = useRef(null);
  const [size, setSize] = useState(() => ({ W: window.innerWidth, H: window.innerHeight }));
  const room = useMemo(() => roomFor(size.W, size.H), [size]);

  const [saved] = useState(loadTour);
  const tourState = useRef(saved);
  const [touring, setTouring] = useState(() => pathname === '/' && !saved.done && (ripe.level < 2 || saved.stop > 0));
  const touringRef = useRef(touring);
  touringRef.current = touring;
  const [hurried, setHurried] = useState(false);
  const [query, setQuery] = useState(() => (pathname.startsWith('/search') ? params.get('q') || '' : ''));
  const [searching, setSearching] = useState(() => pathname.startsWith('/search'));
  const [step, setStep] = useState(null);
  const [feature, setFeature] = useState(FILMS[4].key);
  const [stop, setStop] = useState(() => (touring ? saved.stop : -1));
  const result = useMemo(() => (searching && query.trim() ? searchLibrary(query, lib) : null), [searching, query]);
  const hits = useMemo(() => (result ? result.hits.map((r) => r.key) : null), [result]);
  const hitSet = useMemo(() => (hits ? new Set(hits) : null), [hits]);

  const mode = focus ? 'read' : searching ? 'search' : touring ? 'tour' : step ? 'step' : 'rest';
  const plans = useMemo(() => (focus ? plansOf(catalog.get(focus), from) : []), [focus, from]);

  // ── measuring: the voice and the modules are as tall as what they say ──
  const measureRefs = useRef(new Map());
  const refFns = useRef(new Map());
  const measureRef = (id) => {
    if (!refFns.current.has(id)) refFns.current.set(id, (el) => { if (el) measureRefs.current.set(id, el); else measureRefs.current.delete(id); });
    return refFns.current.get(id);
  };
  const [heights, setHeights] = useState({});
  useLayoutEffect(() => {
    const next = {};
    let changed = false;
    measureRefs.current.forEach((el, id) => {
      const h = Math.ceil(el.offsetHeight + PAD * 2);
      next[id] = h;
      if (Math.abs((heights[id] || 0) - h) > 3) changed = true;
    });
    if (changed) setHeights((o) => ({ ...o, ...next }));
  });

  // ── the story ───────────────────────────────────────────────────────────
  // Each stop's words are as tall as they are: measured once, hidden.
  const stopHeights = TOUR.map((_, i) => heights[`stop:${i}`] || 520).join(',');
  const tourVoice = useMemo(() => {
    const hs = stopHeights.split(',').map(Number);
    return { w: room.vw, h: (i) => Math.min(hs[i], room.phone ? Math.round(room.H * 0.7) : room.bounds.h - 100 - GAP) };
  }, [room, stopHeights]);
  const tourControls = useMemo(() => ({ w: room.vw, h: 100 }), [room]);
  const layoutOfStop = useMemo(() => {
    const cache = new Map();
    return (i) => {
      if (!cache.has(i)) {
        const items = itemsFor(WORLD, { mode: 'tour', ...stopState(TOUR[i]), voice: { w: tourVoice.w, h: tourVoice.h(i) }, controls: tourControls }, graph, room.f);
        const { rects } = assemble(items, { bounds: room.bounds, gap: GAP, top: room.phone });
        cache.set(i, { rects, from: new Map(items.map((it) => [it.id, it.parent])) });
      }
      return cache.get(i);
    };
  }, [tourVoice, tourControls, room]);
  const layoutOfStopRef = useRef(layoutOfStop);
  layoutOfStopRef.current = layoutOfStop;

  const stopTimes = useRef([]);
  const onStopRef = useRef(null);
  const onEndRef = useRef(null);
  const story = useMemo(() => createStory({
    stops: TOUR,
    onFrame: (l) => {
      const A = layoutOfStopRef.current(l.i);
      if (!l.travel || l.t <= 0) { engine.setTargets(A.rects, A.from); return; }
      // Between two stops: what both have moves across; what only one
      // has leaves or arrives half way.
      const B = layoutOfStopRef.current(l.i + 1);
      const t = ease(l.t);
      const out = new Map();
      A.rects.forEach((a, id) => {
        const b = B.rects.get(id);
        if (b) out.set(id, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });
        else if (t < 0.5) out.set(id, a);
      });
      if (t >= 0.5) B.rects.forEach((b, id) => { if (!out.has(id)) out.set(id, b); });
      engine.setTargets(out, B.from);
    },
    onJump: (i) => { const L = layoutOfStopRef.current(i); engine.setTargets(L.rects, L.from); },
    onStop: (i) => onStopRef.current?.(i),
    onEnd: () => onEndRef.current?.(),
  }), [engine]);
  onStopRef.current = (i) => {
    setStop(i);
    if (!touringRef.current) return;
    saveTour({ stop: i });
    tourState.current = { ...tourState.current, stop: i };
    const now = performance.now();
    const ts = [...stopTimes.current, now].slice(-3);
    stopTimes.current = ts;
    if (ts.length === 3 && now - ts[0] < 3000 && !hurried) { setHurried(true); noteHurry(); }
  };

  const finishTour = useCallback(() => {
    story.halt();
    setTouring(false);
    setHurried(false);
    if (!tourState.current.done) { tourState.current = { ...tourState.current, done: true }; saveTour({ done: true }); }
    noteIntroDone();
  }, [story]);
  onEndRef.current = () => finishTour();
  const pauseTour = useCallback(() => {
    if (!touringRef.current) return;
    story.halt();
    setTouring(false);
  }, [story]);
  const startTour = useCallback(() => {
    setSearching(false);
    setStep(null);
    if (focus) navigate('/');
    const st = tourState.current;
    if (st.done) { tourState.current = { stop: 0, done: false }; saveTour({ stop: 0, done: false }); }
    setTouring(true);
  }, [focus, navigate]);

  const tourKey = touring && stop >= 0 ? stopKey(TOUR[stop]) : null;
  useEffect(() => {
    if (!tourKey || parseKey(tourKey).kind !== 'film') return undefined;
    const t = setTimeout(() => noteSeen(parseKey(tourKey).id), 1500);
    return () => clearTimeout(t);
  }, [tourKey]);

  // ── navigation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const m = /^\/paths\/([^/]+)/.exec(pathname);
    const p = m && catalog.path(m[1]);
    if (p) navigate(urlFor(p.steps[0], { path: p.id }), { replace: true });
  }, [pathname, navigate]);

  const go = useCallback((key, opts = {}) => {
    navigate(urlFor(key, { from: opts.from === undefined ? focus : opts.from, path: opts.path }));
  }, [navigate, focus]);

  useEffect(() => {
    if (!focus) return;
    pauseTour();
    setStep(null);
    setSearching(false);
    visit(focus);
    noteLibrary();
  }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps

  const takeDoor = useCallback((door) => {
    noteIntent();
    finishTour();
    if (door.path) {
      const p = catalog.path(door.path);
      go(p.steps[0], { path: p.id, from: null });
    }
  }, [finishTour, go]);

  // ── the assembly ────────────────────────────────────────────────────────
  const voiceW = mode === 'tour' ? tourVoice.w : mode === 'read' ? Math.round(room.vw * 0.95) : room.vw;
  const layout = useMemo(() => {
    if (mode === 'tour') return null;
    const modules = plans.map((p) => {
      const w = Math.min(room.bounds.w, Math.max(280, Math.round((MOD_W[p.id] || 360) * room.f)));
      const cap = room.phone ? Math.round(room.H * 0.7) : p.id === 'text' ? room.bounds.h : Math.round(440 * Math.max(0.9, room.f));
      return { id: `mod:${p.id}`, w, h: Math.min(cap, heights[`mod:${p.id}`] || 240), scalable: false };
    });
    const items = itemsFor(WORLD, {
      mode,
      anchor: focus,
      lens: step ? `column:${step}` : null,
      feature,
      hits,
      modules,
      everyModule: room.phone,
      voice: { w: voiceW, h: Math.min(room.phone ? Math.round(room.H * 0.7) : room.bounds.h, heights.voice || 520) },
    }, graph, room.f);
    const { rects } = assemble(items, { bounds: room.bounds, gap: GAP, top: room.phone });
    return { rects, from: new Map(items.map((it) => [it.id, it.parent])), key: `${mode}|${focus}|${from}|${step}|${feature}|${hits?.join(',')}|${room.W}x${room.H}` };
  }, [mode, focus, from, step, feature, hits, plans, heights, room, voiceW]);

  const lastKey = useRef(null);
  useLayoutEffect(() => {
    if (!layout) return;
    if (layout.key !== lastKey.current) { engine.release(); lastKey.current = layout.key; }
    engine.setTargets(layout.rects, layout.from);
  }, [layout, engine]);
  // On the tour, the story drives: put it where it was.
  useLayoutEffect(() => {
    if (!touring) return;
    lastKey.current = null;
    engine.release();
    story.seek(Math.max(0, tourState.current.stop || 0));
  }, [touring, layoutOfStop]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => setSize({ W: window.innerWidth, H: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // At rest, the films take turns at having the floor, unless a hand is
  // over the elements (nothing moves under a hand).
  const holding = useRef(false);
  useEffect(() => {
    if (mode !== 'rest' || prefersReducedMedia()) return undefined;
    const t = setInterval(() => {
      if (holding.current || document.hidden || engine.dragging()) return;
      setFeature((f) => FILMS[(FILMS.findIndex((x) => x.key === f) + 1) % FILMS.length].key);
    }, 9000);
    return () => clearInterval(t);
  }, [mode, engine]);

  // ── picking up and putting down ─────────────────────────────────────────
  const grab = useRef(null);
  const justDropped = useRef(false);
  const onGrab = useCallback((e, id) => {
    if (e.button !== 0) return;
    grab.current = { id, x: e.clientX, y: e.clientY, live: false, pid: e.pointerId };
  }, []);
  useEffect(() => {
    const move = (e) => {
      const g = grab.current;
      if (!g || e.pointerId !== g.pid) return;
      if (!g.live) {
        if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
        g.live = true;
        if (touringRef.current) pauseTour();
        root.current?.querySelector(`.e[data-id="${CSS.escape(g.id)}"]`)?.setAttribute('data-held', '');
        engine.pick(g.id, e.clientX, e.clientY);
      }
      engine.move(e.clientX, e.clientY);
    };
    const up = (e) => {
      const g = grab.current;
      grab.current = null;
      if (!g || !g.live || e.pointerId !== g.pid) return;
      root.current?.querySelector(`.e[data-id="${CSS.escape(g.id)}"]`)?.removeAttribute('data-held');
      const r = engine.rectOf(g.id);
      const others = engine.visible().filter((o) => o.id !== g.id);
      engine.drop(r ? dockNear(Math.round(r.w), Math.round(r.h), { x: e.clientX, y: e.clientY }, others, { bounds: room.bounds, gap: GAP }) : null);
      justDropped.current = true;
      setTimeout(() => { justDropped.current = false; }, 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [engine, room, pauseTour]);

  // ── pointing ────────────────────────────────────────────────────────────
  const onOpen = useCallback((e, id) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    if (justDropped.current) return;
    if (id.startsWith('head:')) {
      pauseTour();
      setSearching(false);
      if (focus) navigate('/');
      const ph = id.slice(5);
      setStep((s) => (s === ph && !focus ? null : ph));
      return;
    }
    if (id === focus) return;
    setSearching(false);
    setQuery('');
    go(id, { path: walking?.steps.includes(id) ? walking.id : undefined });
  }, [go, focus, walking, pauseTour, navigate]);

  // Hovering an element lights what it connects to.
  const onHover = useCallback((key) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-lit]').forEach((x) => x.removeAttribute('data-lit'));
    if (!key) return;
    graph.neighbours(key).forEach((k) => el.querySelector(`.e[data-id="${CSS.escape(k)}"]`)?.setAttribute('data-lit', ''));
  }, []);
  // Hovering a link in an open record lights where it lands.
  const onProbe = useCallback((key) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-probe]').forEach((x) => x.removeAttribute('data-probe'));
    if (key) el.querySelector(`.e[data-id="${CSS.escape(key)}"]`)?.setAttribute('data-probe', '');
  }, []);
  useEffect(() => onProbe(null), [focus, onProbe]);
  const probe = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    const key = keyForPath(href.split('?')[0], { resolveSlug });
    if (key && key !== focus && catalog.has(key)) onProbe(key);
  };

  // ── wheel: on the tour, scrolling moves along the story ─────────────────
  useEffect(() => {
    const el = root.current;
    const onWheel = (e) => {
      if (!touringRef.current || e.ctrlKey) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      story.scroll((Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [story]);

  // ── keys ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && t.closest('input, textarea, [contenteditable]');
      if (e.key === 'Escape') {
        if (searching) { setSearching(false); setQuery(''); return; }
        if (touring) { pauseTour(); return; }
        if (focus) { navigate('/'); return; }
        if (step) setStep(null);
        return;
      }
      if (typing) return;
      if (touring && ['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); story.next(); return; }
      if (touring && ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); story.prev(); return; }
      if (t instanceof HTMLElement && t.closest('.e--module') && e.key.startsWith('Arrow')) return;
      if (walking && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const i = walking.steps.indexOf(focus) + (e.key === 'ArrowRight' ? 1 : -1);
        if (walking.steps[i]) { e.preventDefault(); go(walking.steps[i], { path: walking.id }); }
        return;
      }
      if (e.key.length === 1 && /\S/.test(e.key)) {
        e.preventDefault();
        pauseTour();
        if (focus) navigate('/');
        setSearching(true);
        setQuery((q) => (searching ? q : '') + (e.key === '/' ? '' : e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, touring, story, walking, searching, step, navigate, go, pauseTour]);

  const closeRecord = useCallback(() => navigate('/'), [navigate]);
  const anchor = focus || tourKey;
  const playing = anchor && parseKey(anchor).kind === 'film' ? anchor : mode === 'rest' ? feature : null;
  const record = focus ? catalog.get(focus) : null;

  return (
    <div className="cmp" ref={root} data-mode={mode}>
      <header className="cmp__mast">
        <a href="/" onClick={(e) => { e.preventDefault(); setSearching(false); setStep(null); if (touring) pauseTour(); if (focus) navigate('/'); }}>Neoflix</a>
        <nav>
          <button type="button" onClick={() => { pauseTour(); if (focus) navigate('/'); setSearching((s) => !s); }}>Search</button>
          <a href="/neoflix" onClick={(e) => { e.preventDefault(); navigate('/neoflix'); }}>The long read</a>
          <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
        </nav>
      </header>

      {room.phone && <div className="cmp__tall" style={{ height: Math.max(...[...(layout?.rects.values() || [])].map((r) => r.y + r.h), room.H) + 20 }} />}
      <div className="cmp__plate" onPointerEnter={() => { holding.current = true; }} onPointerLeave={() => { holding.current = false; }}>
        {ALL.map(([id, kind]) => (
          <RecordEl
            key={id}
            id={id}
            kind={kind}
            engine={engine}
            anchor={anchor === id || (kind === 'head' && step === id.slice(5))}
            visited={visited.has(id)}
            hit={hitSet?.has(id)}
            playing={id === playing}
            onOpen={onOpen}
            onHover={onHover}
            onGrab={onGrab}
          />
        ))}

        {record && (
          <Here.Provider value={{ current: record.key, path: walking?.id || null }}>
            <FrontContext.Provider value={{ route: null, setRoute: () => {}, trail: [] }}>
              <div className="cmp__reading" onMouseOver={probe} onMouseOut={(e) => e.target.closest?.('a[href]') && onProbe(null)}>
                {plans.map((plan, i) => {
                  const Cmp = MODULES[plan.id];
                  const w = Math.min(room.bounds.w, Math.max(280, Math.round((MOD_W[plan.id] || 360) * room.f)));
                  return (
                    <Measured key={`${record.key}|${from || ''}|${plan.id}`} id={`mod:${plan.id}`} engine={engine} width={w} ref={measureRef(`mod:${plan.id}`)} className={`e--module mod--${plan.id}`} data-emph={plan.emph ? '' : undefined} title={`Here because ${plan.reason}`}>
                      <div className="sys">
                        <h2 className="t__modname"><b>{i + 1}</b>{MODULE_NAMES[plan.id]}</h2>
                        {Cmp ? <Cmp record={record} plan={plan} /> : null}
                      </div>
                    </Measured>
                  );
                })}
              </div>
            </FrontContext.Provider>
          </Here.Provider>
        )}

        <Measured id="voice" engine={engine} width={voiceW} ref={measureRef('voice')} className="e--voice" aria-label="Neoflix">
          {searching ? (
            <div className="v__search">
              <form onSubmit={(e) => { e.preventDefault(); const top = result?.hits[0]; if (top) { setSearching(false); setQuery(''); go(top.key); } }}>
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search" aria-label="Search the library" />
                <button type="button" onClick={() => { setSearching(false); setQuery(''); }} aria-label="Close search">✕</button>
              </form>
              <p className="v__count">{result ? (result.hits.length ? `${result.hits.length} match${result.hits.length === 1 ? '' : 'es'}, clamped here. Enter opens the first.` : 'Nothing in the library uses those words.') : 'Every film, paper and page, by what it says.'}</p>
            </div>
          ) : record ? (
            <RecordVoice record={record} walking={walking} onGo={go} onClose={closeRecord} />
          ) : touring ? (
            <Narration story={story} hurried={hurried} onOpen={(k) => go(k, { from: null })} onDoor={takeDoor} />
          ) : step ? (
            <StepVoice phase={step} onClose={() => setStep(null)} />
          ) : (
            <Rest tourState={tourState.current} trail={trail} onTour={startTour} onPath={(p) => go(p.steps[0], { path: p.id, from: null })} onBack={(k) => go(k, { from: null })} />
          )}
        </Measured>

        <div className="cmp__measure" aria-hidden="true">
          {TOUR.map((st, i) => (
            <div key={st.id} className="e__content" ref={measureRef(`stop:${i}`)} style={{ width: tourVoice.w - PAD * 2 }}>
              <div className="v__story"><NarrationBody cur={i} /></div>
            </div>
          ))}
        </div>

        <Measured id="controls" engine={engine} width={tourControls.w} className="e--controls">
          {touring && <Controls story={story} onLeave={pauseTour} />}
        </Measured>
      </div>
    </div>
  );
}
