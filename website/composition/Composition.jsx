/**
 * The composition: the whole site as one screen that arranges itself.
 *
 * Everything is always on screen: six films, six papers, the toolbox's
 * pages in the five steps of the loop. What changes is how much room each
 * gets. Nobody lays the screen out; the reader's situation sets weights
 * (scene.js) and the composer (compose.js) cuts the screen into shapes
 * that fit together edge to edge, the way a bento box is divided: a few
 * big compartments, more small ones, nothing left over. When the
 * situation changes, the shapes re-assemble (engine.js), continuously.
 *
 *   resting      the films take turns at being the big shape
 *   a record     its modules open in the middle, composed the same way;
 *                the rest becomes a live map beside it, with what the
 *                record connects to grown so you can see where links go
 *   a search     the matches grow, everything else shrinks
 *   the tour     every stop is a weighting; scrolling re-assembles the
 *                screen from one to the next (story.js, tour.js)
 *
 * On the left, always, is the voice: the words for what you're looking
 * at (the tour's narration, an open record's title, the way in).
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
import { MODULES, MODULE_NAMES } from '../system/modules';
import { FrontContext } from '../system/modules/front';
import { Here } from '../system/ui/nav';
import { shortAuthors, doiUrl } from '../pages/publications/records';
import { publicationPdfs } from '../pages/publications/content';
import { TAGLINE } from '../pages/home/content';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import { assetUrl } from '../lib/utils/assetUrl';
import { prefersReducedMedia } from '../lib/utils/reducedMedia';
import { buildScene, weigh, blend } from './scene';
import { createEngine } from './engine';
import { createStory } from './story';
import { TOUR, CHAPTERS, DOORS } from './tour';
import '../system/system.css';
import './composition.css';

const SCENE = buildScene(catalog);
const LEAVES = [...SCENE.leaves.values()];
const FILMS = catalog.list('film');
const PAGES = catalog.list('guidance').filter((g) => !g.divider && !/^level\s+\d/i.test(g.title)).length;
const fillText = (t) => t.replace('{pages}', PAGES);
const GAP = 6;
const clamp = (lo, v, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/* ── how far into the tour this browser got (localStorage only) ────────── */
const TOUR_KEY = 'neoflix:tour';
const loadTour = () => { try { return { stop: 0, done: false, ...(JSON.parse(localStorage.getItem(TOUR_KEY)) || {}) }; } catch { return { stop: 0, done: false }; } };
const saveTour = (patch) => { try { localStorage.setItem(TOUR_KEY, JSON.stringify({ ...loadTour(), ...patch })); } catch { /* in memory only */ } };

/** What a tour stop asks the composition to show. */
function stopState(s) {
  if (s.at === 'everything') return {};
  if (Array.isArray(s.at) || /^(column|region):/.test(s.at)) return { lens: s.at };
  return { anchor: s.at };
}
const STOP_WEIGHTS = TOUR.map((s) => weigh(SCENE, stopState(s), graph));
const stopKey = (s) => (s && typeof s.at === 'string' && catalog.has(s.at) ? s.at : null);

/** The screen's three regions for a mode: the voice, the reading area, the world. */
function regionsFor(mode, W, H) {
  if (W < 760) {
    const vh = Math.round(H * (mode === 'read' ? 0.3 : 0.36));
    if (mode === 'read') return { voice: { x: 0, y: 0, w: W, h: vh }, read: { x: 0, y: vh, w: W, h: H - vh }, world: { x: 0, y: H, w: W, h: 0 } };
    return { voice: { x: 0, y: 0, w: W, h: vh }, read: { x: 0, y: vh, w: 0, h: H - vh }, world: { x: 0, y: vh, w: W, h: H - vh } };
  }
  if (mode === 'read') {
    const vw = Math.round(clamp(300, W * 0.235, 380));
    const rw = Math.round((W - vw) * 0.62);
    return { voice: { x: 0, y: 0, w: vw, h: H }, read: { x: vw, y: 0, w: rw, h: H }, world: { x: vw + rw, y: 0, w: W - vw - rw, h: H } };
  }
  const vw = Math.round(mode === 'tour' ? clamp(380, W * 0.3, 500) : clamp(360, W * 0.28, 470));
  return { voice: { x: 0, y: 0, w: vw, h: H }, read: { x: vw, y: 0, w: 0, h: H }, world: { x: vw, y: 0, w: W - vw, h: H } };
}

/* ── an open record, composed ──────────────────────────────────────────── */

// The world already shows these (the whole library, the loop).
const NOT_IN_READING = new Set(['map', 'loop', 'loopbrowse', 'paperlist']);
// How much room each module asks for, and in what proportions.
const MOD = {
  text: [7, 0.72], player: [7, 1.6], found: [3.6, 1.5], summary: [3, 1.1], findings: [3, 0.95],
  practice: [2.6, 1], film: [3, 1.3], abstract: [2.6, 0.9], inpractice: [2.2, 1.5], thread: [2, 2.4],
  pathcards: [3.4, 1.2], sequence: [1.6, 2.2], paths: [1.2, 1.6], cite: [1.1, 1.6],
};
function readingOf(record, from) {
  const plans = planRecord(record, { from }, lib).filter((p) => !NOT_IN_READING.has(p.id)).sort((a, b) => a.order - b.order);
  const kids = plans.map((p) => {
    let [w, aspect] = MOD[p.id] || [2, 1.2];
    // A module with little to say asks for little room.
    if (p.id === 'abstract' && !record.abstract) [w, aspect] = [1.1, 1.8];
    if (p.id === 'text' && record.excerpt == null && !record.tasks) w = 5;
    return { id: `mod:${p.id}`, weight: w * (p.emph ? 1.6 : 1), aspect };
  });
  if (!kids.length) kids.push({ id: 'mod:none', weight: 1, aspect: 1 });
  return { plans, tree: { id: `read:${record.key}|${from || ''}`, kids }, weights: new Map(kids.map((k) => [k.id, k.weight])) };
}

/* ── the shapes ────────────────────────────────────────────────────────── */

const labelOf = (key) => {
  const r = catalog.get(key);
  if (!r) return '';
  if (r.kind === 'paper') return `Paper ${r.n} · ${r.short}`;
  if (r.kind === 'film') return `Film · ${r.name}`;
  return `${r.number ? `${r.number} ` : ''}${r.title}`;
};

const Tile = memo(function Tile({ leaf, engine, anchor, visited, hit, dim, playing, onOpen, onHover }) {
  const ref = useCallback((el) => engine.register(leaf.id, el), [engine, leaf.id]);
  const r = leaf.key ? catalog.get(leaf.key) : null;
  const [reduced] = useState(prefersReducedMedia);
  let body;
  if (leaf.kind === 'film') {
    body = (
      <>
        {playing && !reduced
          ? <video className="t__media" src={clipFor(r)} poster={stillFor(r)} autoPlay muted loop playsInline preload="auto" />
          : <img className="t__media" src={stillFor(r)} alt="" draggable={false} />}
        <span className="t__plate">
          <span className="t__n">{leaf.index + 1}</span>
          <span className="t__name">{r.name}</span>
          <span className="t__claim">{r.claim}</span>
        </span>
      </>
    );
  } else if (leaf.kind === 'paper') {
    body = (
      <>
        <span className="t__n">{r.n}</span>
        <span className="t__title">{r.short}</span>
        <span className="t__found">{r.found}</span>
        <span className="t__meta">{r.journal} · {r.year}</span>
      </>
    );
  } else if (leaf.kind === 'head') {
    const count = LEAVES.filter((l) => l.kind === 'guidance' && l.phase === leaf.phase).length;
    body = (
      <>
        <span className="t__n">{leaf.step}</span>
        <span className="t__title">{leaf.name}</span>
        <span className="t__meta">{count} pages</span>
      </>
    );
  } else {
    body = (
      <>
        {r.number ? <span className="t__n">{r.number}</span> : null}
        <span className="t__title">{r.id === '' ? 'Welcome to the toolbox' : r.title}</span>
        {r.excerpt && <span className="t__ex">{r.excerpt}</span>}
        <span className="t__more" aria-hidden="true" />
      </>
    );
  }
  const Tag = leaf.key ? 'a' : 'button';
  return (
    <Tag
      ref={ref}
      className={`t t--${leaf.kind}`}
      href={leaf.key ? urlFor(leaf.key) : undefined}
      type={leaf.key ? undefined : 'button'}
      data-id={leaf.id}
      data-numbered={leaf.kind === 'guidance' && !r.number ? undefined : ''}
      data-anchor={anchor ? '' : undefined}
      data-visited={visited ? '' : undefined}
      data-hit={hit ? '' : undefined}
      data-dim={dim ? '' : undefined}
      data-tasks={r?.tasks ? '' : undefined}
      draggable={false}
      onClick={(e) => onOpen(e, leaf)}
      onPointerEnter={() => onHover(leaf.key)}
      onPointerLeave={() => onHover(null)}
      aria-label={leaf.key ? labelOf(leaf.key) : `${leaf.name}: show this step of the loop`}
    >
      {leaf.kind === 'film' ? body : <span className="t__in">{body}</span>}
    </Tag>
  );
});

const Module = memo(function Module({ plan, record, n, engine }) {
  const ref = useCallback((el) => engine.register(`mod:${plan.id}`, el), [engine, plan.id]);
  const Cmp = MODULES[plan.id];
  return (
    <section ref={ref} className={`t t--mod mod--${plan.id}`} data-emph={plan.emph ? '' : undefined} title={`Here because ${plan.reason}`}>
      <div className="sys t__scroll">
        <h2 className="t__modname"><b>{n}</b>{MODULE_NAMES[plan.id]}</h2>
        {Cmp ? <Cmp record={record} plan={plan} /> : null}
      </div>
    </section>
  );
});

function Reading({ record, from, path, reading, engine, onProbe }) {
  const probe = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    const key = keyForPath(href.split('?')[0], { resolveSlug });
    if (key && key !== record.key && catalog.has(key)) onProbe(key);
  };
  return (
    <Here.Provider value={{ current: record.key, path: path?.id || null }}>
      <FrontContext.Provider value={{ route: null, setRoute: () => {}, trail: [] }}>
        <div className="cmp__reading" onMouseOver={probe} onMouseOut={(e) => e.target.closest?.('a[href]') && onProbe(null)}>
          {reading.plans.map((plan, i) => <Module key={`${record.key}|${from || ''}|${plan.id}`} plan={plan} record={record} n={i + 1} engine={engine} />)}
        </div>
      </FrontContext.Provider>
    </Here.Provider>
  );
}

/* ── the voice: the words for what you're looking at ───────────────────── */

function Progress({ story, onGo }) {
  const [s, setS] = useState(() => story.get());
  useEffect(() => story.subscribe((n) => setS((o) => (o.cur === n.cur && o.playing === n.playing ? o : n))), [story]);
  return (
    <div className="v__progress" role="list">
      {story.stops.map((st, i) => (
        <button
          key={st.id}
          type="button"
          role="listitem"
          data-depth={st.depth}
          data-past={i < s.cur ? '' : undefined}
          data-on={i === s.cur ? '' : undefined}
          title={st.title}
          aria-label={`${i + 1}: ${st.title}`}
          onClick={() => onGo(i)}
        />
      ))}
    </div>
  );
}

function Narration({ story, hurried, onOpen, onDoor, onLeave }) {
  const ref = useRef(null);
  const [st, setSt] = useState(() => story.get());
  useEffect(() => story.subscribe((n) => {
    setSt((o) => (o.cur === n.cur && o.playing === n.playing ? o : { cur: n.cur, playing: n.playing }));
    const el = ref.current;
    if (el) {
      el.style.opacity = n.opacity.toFixed(3);
      el.style.transform = `translateY(${((1 - n.opacity) * 12).toFixed(1)}px)`;
    }
  }), [story]);
  const cur = Math.max(0, st.cur);
  const s = TOUR[cur];
  const chapter = CHAPTERS.find((c) => c.id === s.chapter);
  const showDoors = s.doors || hurried;
  return (
    <>
      <div className="v__story" ref={ref} aria-live="polite">
        <p className="v__where">{chapter ? <><b>{CHAPTERS.indexOf(chapter) + 1}</b>{chapter.name}</> : <><b>{cur === 0 ? '↓' : '■'}</b>{cur === 0 ? 'A tour, in a few minutes' : 'The end of the tour'}</>}</p>
        <h1 className="v__title">{s.title}</h1>
        <p className="v__text">{fillText(s.text)}</p>
        {s.open && (
          <a className="v__open" href={urlFor(s.open)} onClick={(e) => { e.preventDefault(); onOpen(s.open); }}>
            Open {s.open === 'guidance:' ? 'the toolbox' : labelOf(s.open)} <span aria-hidden="true">→</span>
          </a>
        )}
        {showDoors && (
          <div className="v__doors">
            <p>{s.doors ? (cur === 0 ? 'Or go straight to' : 'Where to next') : 'Moving fast? Go straight to'}</p>
            {DOORS.map((d) => (
              <button key={d.id} type="button" className="v__door" onClick={() => onDoor(d)}>
                <strong>{d.label}</strong><span>{d.note}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="v__foot">
        <Progress story={story} onGo={(i) => story.goTo(i)} />
        <div className="v__controls">
          <button type="button" onClick={() => story.prev()} disabled={cur <= 0} aria-label="Previous stop">←</button>
          <button type="button" onClick={() => (st.playing ? story.pause() : story.play())}>{st.playing ? 'Pause' : 'Play'}</button>
          <button type="button" onClick={() => story.next()} aria-label="Next stop">→</button>
          <span className="v__count">{cur + 1}<i>/</i>{TOUR.length}</span>
          <button type="button" className="v__leave" onClick={onLeave}>Leave the tour</button>
        </div>
        {cur === 0 && <p className="v__hint">Scroll, or use the arrow keys</p>}
      </div>
    </>
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
    sub = <p className="v__text">How to start recording and reviewing, from the decision to the first session and beyond. Every page is in the five steps of the loop, beside this.</p>;
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
    sub = <p className="v__text">{record.caption}</p>;
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

function Rest({ tourState, trail, lens, onTour, onPath, onBack, onClearLens }) {
  const last = trail.length && catalog.has(trail[trail.length - 1]) ? trail[trail.length - 1] : null;
  const col = lens && lens.startsWith('column:') ? SCENE.columns.find((c) => c.phase === lens.slice(7)) : null;
  if (col) {
    const head = col.kids[0];
    const pages = LEAVES.filter((l) => l.kind === 'guidance' && l.phase === col.phase);
    return (
      <div className="v__rest">
        <p className="v__where"><b>{head.step}</b>Step {head.step} of the loop</p>
        <h1 className="v__title">{head.name}</h1>
        <p className="v__text">{pages.length} pages of the toolbox. Open any of them; they’re in the order you’ll need them.</p>
        <div className="v__actions"><button type="button" onClick={onClearLens}>Back to everything <kbd>Esc</kbd></button></div>
      </div>
    );
  }
  return (
    <div className="v__rest">
      <p className="v__where"><b>N</b>Neoflix, Leiden</p>
      <h1 className="v__title v__title--big">{TAGLINE}</h1>
      <p className="v__text">Six short films, the six papers behind them, and a toolbox of {PAGES} pages for doing it in your own unit. All of it is here, on one screen; open anything and the rest makes room.</p>
      {last && <p className="v__back">Welcome back. <a href={urlFor(last)} onClick={(e) => { e.preventDefault(); onBack(last); }}>Carry on with {labelOf(last)} →</a></p>}
      <div className="v__doors">
        <button type="button" className="v__door v__door--tour" onClick={onTour}>
          <strong>{tourState.done ? 'Take the tour again' : tourState.stop > 0 ? 'Carry on with the tour' : 'Take the tour'}</strong>
          <span>{tourState.done ? `${TOUR.length} stops, a few minutes` : tourState.stop > 0 ? `You were at ${tourState.stop + 1} of ${TOUR.length}` : `${TOUR.length} stops, a few minutes, scroll to move`}</span>
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

/* ── the composition ───────────────────────────────────────────────────── */

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

  const engine = useMemo(() => createEngine({ world: SCENE.world, gap: GAP, foldAt: 9000 }), []);
  const root = useRef(null);

  const [saved] = useState(loadTour);
  const tourState = useRef(saved);
  const [touring, setTouring] = useState(() => pathname === '/' && !saved.done && (ripe.level < 2 || saved.stop > 0));
  const touringRef = useRef(touring);
  touringRef.current = touring;
  const [hurried, setHurried] = useState(false);
  const [query, setQuery] = useState(() => (pathname.startsWith('/search') ? params.get('q') || '' : ''));
  const [searching, setSearching] = useState(() => pathname.startsWith('/search'));
  const [lens, setLens] = useState(null);
  const [feature, setFeature] = useState(FILMS[0].key);
  const [stop, setStop] = useState(() => (touring ? saved.stop : -1));
  const result = useMemo(() => (searching && query.trim() ? searchLibrary(query, lib) : null), [searching, query]);
  const hits = useMemo(() => (result ? new Set(result.hits.map((r) => r.key)) : null), [result]);

  const reading = useMemo(() => (focus ? readingOf(catalog.get(focus), from) : null), [focus, from]);
  const mode = focus ? 'read' : touring ? 'tour' : 'look';

  // ── the story ───────────────────────────────────────────────────────────
  const stopTimes = useRef([]);
  const onStopRef = useRef(null);
  const onEndRef = useRef(null);
  const story = useMemo(() => createStory({
    stops: TOUR,
    onFrame: (l) => engine.setWeights(l.travel ? blend(STOP_WEIGHTS[l.i], STOP_WEIGHTS[l.i + 1], ease(l.t)) : STOP_WEIGHTS[l.i], { ms: 0 }),
    onJump: (i) => engine.setWeights(STOP_WEIGHTS[i], { ms: 950 }),
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
    setLens(null);
    if (focus) navigate('/');
    const st = tourState.current;
    const i = st.done ? 0 : st.stop || 0;
    if (st.done) { tourState.current = { stop: 0, done: false }; saveTour({ stop: 0, done: false }); }
    setTouring(true);
    story.seek(i, { jump: true });
  }, [focus, navigate, story]);

  // A film the tour stops on counts as seen.
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
    setLens(null);
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

  // ── what the screen weighs ──────────────────────────────────────────────
  useLayoutEffect(() => {
    const size = () => ({ w: window.innerWidth, h: window.innerHeight });
    const first = !engine.rectOf('voice');
    engine.setRegions(regionsFor(mode, window.innerWidth, window.innerHeight), { size: size(), now: first });
  }, [mode, engine]);
  useEffect(() => {
    const onResize = () => engine.setRegions(regionsFor(mode, window.innerWidth, window.innerHeight), { size: { w: window.innerWidth, h: window.innerHeight }, now: true });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mode, engine]);

  const firstWeights = useRef(true);
  useLayoutEffect(() => {
    if (touring) {
      if (firstWeights.current) story.seek(saved.stop || 0);
      firstWeights.current = false;
      return;
    }
    const w = weigh(SCENE, { anchor: focus, lens, hits, path: walking?.steps || null, feature: mode === 'look' && !lens ? feature : null }, graph);
    engine.setWeights(w, { ms: firstWeights.current ? 0 : 750 });
    firstWeights.current = false;
  }, [touring, focus, lens, hits, walking, feature, mode, engine, story]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engine.setReading(reading && focus ? { ...reading, origin: SCENE.leafOf(focus) } : null);
  }, [reading, focus, engine]);

  // Resting, the films take turns at being the big shape, unless the
  // reader's pointer is over the shapes (nothing moves under a hand).
  const holding = useRef(false);
  useEffect(() => {
    if (mode !== 'look' || lens || hits || prefersReducedMedia()) return undefined;
    const t = setInterval(() => {
      if (holding.current || document.hidden) return;
      setFeature((f) => FILMS[(FILMS.findIndex((x) => x.key === f) + 1) % FILMS.length].key);
    }, 9000);
    return () => clearInterval(t);
  }, [mode, lens, hits]);

  // ── pointing ────────────────────────────────────────────────────────────
  const onOpen = useCallback((e, leaf) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    if (!leaf.key) { pauseTour(); setLens((l) => (l === `column:${leaf.phase}` ? null : `column:${leaf.phase}`)); return; }
    if (leaf.key === focus) return;
    setSearching(false);
    setQuery('');
    go(leaf.key, { path: walking?.steps.includes(leaf.key) ? walking.id : undefined });
  }, [go, focus, walking, pauseTour]);

  // Hovering a shape lights everything it connects to.
  const onHover = useCallback((key) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-lit]').forEach((x) => x.removeAttribute('data-lit'));
    if (!key) return;
    [...graph.neighbours(key)].forEach((k) => {
      const id = SCENE.leafOf(k);
      if (id) el.querySelector(`.t[data-id="${CSS.escape(id)}"]`)?.setAttribute('data-lit', '');
    });
  }, []);
  // Hovering a link in an open record lights where it lands.
  const onProbe = useCallback((key) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-probe]').forEach((x) => x.removeAttribute('data-probe'));
    const id = key && SCENE.leafOf(key);
    if (id) el.querySelector(`.t[data-id="${CSS.escape(id)}"]`)?.setAttribute('data-probe', '');
  }, []);
  useEffect(() => onProbe(null), [focus, onProbe]);

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
        if (lens) setLens(null);
        return;
      }
      if (typing) return;
      if (touring && ['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); story.next(); return; }
      if (touring && ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); story.prev(); return; }
      if (t instanceof HTMLElement && t.closest('.cmp__reading') && e.key.startsWith('Arrow')) return;
      if (walking && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const i = walking.steps.indexOf(focus) + (e.key === 'ArrowRight' ? 1 : -1);
        if (walking.steps[i]) { e.preventDefault(); go(walking.steps[i], { path: walking.id }); }
        return;
      }
      if (e.key.length === 1 && /\S/.test(e.key) && !(t instanceof HTMLElement && t.closest('button, a') && e.key === ' ')) {
        e.preventDefault();
        pauseTour();
        setSearching(true);
        setQuery((q) => (searching ? q : '') + (e.key === '/' ? '' : e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, touring, story, walking, searching, lens, navigate, go, pauseTour]);

  const closeRecord = useCallback(() => navigate('/'), [navigate]);
  const anchor = focus || tourKey;
  const playing = (() => {
    if (focus) return null; // an open film plays in its module
    if (anchor && parseKey(anchor).kind === 'film') return anchor;
    return mode === 'look' && !hits ? feature : null;
  })();

  return (
    <div className="cmp" ref={root} data-mode={mode} data-searching={hits ? '' : undefined}>
      <div
        className="cmp__world"
        onPointerEnter={() => { holding.current = true; }}
        onPointerLeave={() => { holding.current = false; }}
      >
        {LEAVES.map((leaf) => (
          <Tile
            key={leaf.id}
            leaf={leaf}
            engine={engine}
            anchor={anchor ? SCENE.leafOf(anchor) === leaf.id : lens === `column:${leaf.phase}` && leaf.kind === 'head'}
            visited={leaf.key && visited.has(leaf.key)}
            hit={hits?.has(leaf.key)}
            dim={hits && !hits.has(leaf.key)}
            playing={leaf.id === playing}
            onOpen={onOpen}
            onHover={onHover}
          />
        ))}
      </div>

      {focus && reading && <Reading record={catalog.get(focus)} from={from} path={walking} reading={reading} engine={engine} onProbe={onProbe} />}

      <aside className="t t--voice" ref={(el) => engine.register('voice', el)} aria-label="Neoflix">
        <div className="v">
          <header className="v__mast">
            <a href="/" onClick={(e) => { e.preventDefault(); setSearching(false); setLens(null); if (touring) pauseTour(); if (focus) navigate('/'); }}>Neoflix</a>
            <nav>
              <button type="button" onClick={() => { pauseTour(); setSearching((s) => !s); }}>Search</button>
              <a href="/neoflix" onClick={(e) => { e.preventDefault(); navigate('/neoflix'); }}>The long read</a>
              <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
            </nav>
          </header>

          {searching && (
            <div className="v__search">
              <form onSubmit={(e) => { e.preventDefault(); const top = result?.hits[0]; if (top) { setSearching(false); setQuery(''); go(top.key); } }}>
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search the library" aria-label="Search the library" />
                <button type="button" onClick={() => { setSearching(false); setQuery(''); }} aria-label="Close search">✕</button>
              </form>
              {result && (
                <p className="v__count">{result.hits.length ? `${result.hits.length} match${result.hits.length === 1 ? '' : 'es'}, grown on the right. Enter opens the first.` : 'Nothing in the library uses those words.'}</p>
              )}
              {result && result.hits.length > 0 && (
                <ol>
                  {result.hits.slice(0, 7).map((r) => (
                    <li key={r.key}><a href={urlFor(r.key)} data-kind={r.kind} onClick={(e) => { e.preventDefault(); setSearching(false); setQuery(''); go(r.key); }}>{labelOf(r.key)}</a></li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {!searching && (
            focus ? (
              <RecordVoice record={catalog.get(focus)} walking={walking} onGo={go} onClose={closeRecord} />
            ) : touring ? (
              <Narration
                story={story}
                hurried={hurried}
                onOpen={(k) => go(k, { from: null })}
                onDoor={takeDoor}
                onLeave={pauseTour}
              />
            ) : (
              <Rest
                tourState={tourState.current}
                trail={trail}
                lens={lens}
                onTour={startTour}
                onPath={(p) => go(p.steps[0], { path: p.id, from: null })}
                onBack={(k) => go(k, { from: null })}
                onClearLens={() => setLens(null)}
              />
            )
          )}
        </div>
      </aside>
    </div>
  );
}
