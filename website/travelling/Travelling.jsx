import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { QUESTIONS, UNITS, TOOLBOX_TREE } from './places.js';
import {
  STAGE,
  SLOTS,
  PITCH,
  DEPTHS,
  SEAMS_OPEN_AT,
  TERMINUS,
  DASH_FLOW,
  tracks,
  WHEEL,
  START,
  around,
  cellOf,
  inWorld,
  isNeighbour,
  addressOf,
  placeAt,
} from './world.js';
import './travelling.css';

/**
 * The travelling interface: a grid of places (a question in a unit), of
 * which the reader only ever sees the one they are on and what stands
 * around it. A train, not a drone:
 *
 *   - Moving goes sideways. A step carries the world one place past you.
 *   - Staying goes deeper. What lies further on, what the place rests
 *     on and where it stops come up from behind it while you stay.
 *   - There is no camera. Nothing zooms; the reader stays put.
 *   - One gesture is one step.
 *
 * The rules (who stands where, at which depth) are world.js; the words
 * are places.js; this file draws them and listens.
 *
 * HOW A CARD TRAVELS. Every card on the stage is kept in `cards` with
 * the box it is drawn at and a phase. A place keeps one card (one DOM
 * element) for as long as it is on the stage, whatever its role, so the
 * CSS transitions on left/top/width/height carry it from slot to slot.
 *   enter  just added: drawn at its starting box, invisible
 *   in     drawn at its slot
 *   leave  no longer wanted: fading out, removed after the fade
 * Cards are only ever appended, never re-sorted: moving a DOM node
 * restarts its transitions.
 */

const LEAVE_MS = 520;

function startBox(item, moving, move) {
  const { slot } = item;
  // What a place rests on always slides down from under the subject.
  if (item.role === 'slip') return { ...slot, y: slot.y - 70 };
  // On a move, a new place comes in from one step away, in the
  // direction of travel.
  if (moving && item.q !== undefined) {
    return { ...slot, x: slot.x + move[1] * PITCH.x, y: slot.y + move[0] * PITCH.y };
  }
  // On staying, it comes out along its line: what lies two steps on from
  // behind the place one step on, everything else from behind the subject.
  const s = item.role === 'far' ? SLOTS.near : item.role === 'qfar' ? SLOTS.down : SLOTS.subject;
  return { ...slot, x: s.x + s.w / 2 - slot.w / 2, y: s.y + s.h / 2 - slot.h / 2 };
}

function reconcile(state, wanted, cause, now) {
  const moving = cause === 'move';
  const { move } = state;
  const byKey = new Map(wanted.map((item) => [item.key, item]));
  const live = new Set();
  let { serial, leaves } = state;

  const cards = state.cards.map((card) => {
    if (card.phase === 'leave') return card;
    const item = byKey.get(card.key);
    if (item) {
      live.add(card.key);
      // A card still on its way in keeps its starting box until it settles.
      return card.phase === 'enter' ? { ...card, item } : { ...card, item, box: item.slot };
    }
    leaves += 1;
    return {
      ...card,
      phase: 'leave',
      slide: moving,
      leftAt: now,
      // Left behind: carried three quarters of a step the other way.
      box: moving
        ? { ...card.box, x: card.box.x - move[1] * PITCH.x * 0.75, y: card.box.y - move[0] * PITCH.y * 0.75 }
        : card.box,
    };
  });

  wanted.forEach((item) => {
    if (live.has(item.key)) return;
    serial += 1;
    cards.push({
      id: `${item.key}#${serial}`,
      key: item.key,
      item,
      phase: 'enter',
      slide: moving && item.q !== undefined,
      box: startBox(item, moving, move),
    });
  });

  return { ...state, cards, serial, leaves };
}

function init(start) {
  const base = {
    q: start.q,
    u: start.u,
    depth: 1,
    held: false, // the reader set the depth by hand; staying no longer raises it
    step: 0,
    move: [0, 0],
    trail: [[start.q, start.u]],
    seen: { [`${start.q}:${start.u}`]: true },
    cards: [],
    serial: 0,
    leaves: 0,
  };
  return reconcile(base, around(start.q, start.u, 1), 'dwell', 0);
}

function reducer(state, action) {
  switch (action.type) {
    case 'go': {
      const { q, u } = action;
      if (!inWorld(q, u) || (q === state.q && u === state.u)) return state;
      const next = {
        ...state,
        q,
        u,
        depth: 1,
        held: false,
        step: state.step + 1,
        move: [Math.sign(q - state.q), Math.sign(u - state.u)],
        trail: [...state.trail, [q, u]],
        seen: { ...state.seen, [`${q}:${u}`]: true },
      };
      return reconcile(next, around(q, u, 1), 'move', action.now);
    }
    case 'depth': {
      // `only: 'raise'` is staying (never takes anything away again).
      if (action.only === 'raise' && state.depth >= action.depth) return state;
      const depth = Math.max(1, Math.min(DEPTHS.length, action.depth));
      if (depth === state.depth && !action.hold) return state;
      const next = { ...state, depth, held: state.held || !!action.hold };
      return reconcile(next, around(state.q, state.u, depth), 'dwell', action.now);
    }
    case 'settle':
      if (!state.cards.some((c) => c.phase === 'enter')) return state;
      return {
        ...state,
        cards: state.cards.map((c) => (c.phase === 'enter' ? { ...c, phase: 'in', slide: false, box: c.item.slot } : c)),
      };
    case 'sweep':
      return { ...state, cards: state.cards.filter((c) => !(c.phase === 'leave' && c.leftAt <= action.before)) };
    default:
      return state;
  }
}

/** The stage is drawn at 1440×900 and scaled to the window as one piece. */
function useFit() {
  const [fit, setFit] = useState({ scale: 1, flow: false });
  useLayoutEffect(() => {
    const measure = () => {
      const w = window.innerWidth - 32;
      const h = window.innerHeight - 24;
      const flow = w < 900;
      setFit({ flow, scale: flow ? 1 : Math.min(w / STAGE.w, Math.max(h, 520) / STAGE.h) });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return fit;
}

const ARROW = { up: '↑', down: '↓' };

// The answer's size follows its length: a two-word answer fills the card.
const headlineSize = (text) => (text.length <= 12 ? 80 : text.length <= 20 ? 62 : text.length <= 27 ? 50 : 42);

function Card({ card, onGo, apart }) {
  const { item, box, phase, slide } = card;
  const leaving = phase === 'leave';
  const state = [phase !== 'in' && phase, slide && 'slide'].filter(Boolean).join(' ');
  const style = { left: box.x, top: box.y, width: box.w, height: box.h, order: item.order };
  const hidden = leaving ? { 'aria-hidden': true } : null;

  if (item.role === 'slip') {
    return (
      <div className={`trv-card slip ${state}`} style={style} {...hidden}>
        Rests on<b>{item.source[0]}</b>
        {item.source[1]}
      </div>
    );
  }
  if (item.role === 'film') {
    const { film } = item;
    return (
      <div
        className={`trv-card film ${state}`}
        style={{ ...style, backgroundImage: `url(${import.meta.env.BASE_URL}videos/session/${film.frame}.webp)` }}
        {...hidden}
      >
        <span className="trv-card__tag">On film · {film.at}</span>
        <span className="trv-card__who">{film.who}</span>
        <span className="trv-card__line">{film.line}</span>
      </div>
    );
  }
  if (item.role === 'edge') {
    return (
      <div className={`trv-card edge ${state}`} style={style} {...hidden}>
        <span className="trv-card__tag">Nobody has said</span>
        <span className="trv-card__hd">{item.text}</span>
      </div>
    );
  }

  const question = QUESTIONS[item.q];
  const unit = UNITS[item.u];
  const cell = cellOf(item.q, item.u);
  const isSubject = item.role === 'subject';
  const headline = cell ? cell.h : 'Not said.';
  const body = cell ? cell.b : `${unit.name}’s page does not say.`;
  const tag = isSubject
    ? `${unit.name} · ${unit.where}`
    : item.role === 'ques' || item.role === 'qfar'
      ? `${unit.name} · ${question.short}`
      : `In ${unit.name}`;
  const classes = ['trv-card', item.role, !cell && 'none', (item.q + item.u) % 2 && 'alt', state].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      // An answer shown in parts needs the room: its headline steps down.
      style={{ ...style, '--hs': `${cell?.parts ? Math.min(headlineSize(headline), 56) : headlineSize(headline)}px` }}
      data-arrow={item.role === 'ques' ? ARROW[item.dir] : undefined}
      tabIndex={isSubject || leaving ? -1 : 0}
      aria-current={isSubject ? 'true' : undefined}
      onClick={isSubject || leaving ? undefined : () => onGo(item.q, item.u)}
      {...hidden}
    >
      <span className="trv-card__city">{unit.name}</span>
      <span className="trv-card__src">{cell ? 'from the unit’s own page' : 'an open place'}</span>
      <span className="trv-card__tag">{tag}</span>
      <span className="trv-card__hd">{headline}</span>
      {isSubject && cell?.parts ? (
        // One surface, cut where the answer has parts. Staying opens the
        // seams; what holds for every part stays fused beneath them.
        <span className={`trv-parts${apart ? ' apart' : ''}${cell.all ? ' has-all' : ''}`}>
          <span className="trv-parts__row">
            {cell.parts.map((part) => (
              <span key={part} className="trv-part">
                {part}
              </span>
            ))}
          </span>
          {cell.all ? <span className="trv-parts__all">{cell.all}</span> : null}
        </span>
      ) : (
        <span className="trv-card__bd">{body}</span>
      )}
    </button>
  );
}

/** The whole, small. It is never on the stage; this is where it lives. */
function Matrix({ q, u, depth, seen, trail, onGo }) {
  const points = trail
    .slice(-7)
    .map(([i, j]) => `${j * 22 + 11},${i * 36 + 18}`)
    .join(' ');
  return (
    <div className="trv-matrix" style={{ '--units': UNITS.length }}>
      <span />
      {UNITS.map((unit) => (
        <span key={unit.id} className="trv-matrix__col" title={unit.name}>
          {unit.id}
        </span>
      ))}
      {QUESTIONS.map((question, i) => (
        <React.Fragment key={question.slug}>
          <span className={`trv-matrix__lab${i === q ? ' on' : ''}`}>{question.short}</span>
          {UNITS.map((unit, j) => {
            const here = i === q && j === u;
            const classes = [
              'trv-matrix__cell',
              !question.cells[j] && 'none',
              here && 'on',
              isNeighbour(i, j, q, u, depth) && 'nb',
              seen[`${i}:${j}`] && 'seen',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={unit.id}
                type="button"
                className={classes}
                aria-label={`${question.question} ${unit.name}`}
                aria-current={here ? 'true' : undefined}
                onClick={() => onGo(i, j)}
              >
                <span className="trv-matrix__dot" />
              </button>
            );
          })}
        </React.Fragment>
      ))}
      <svg
        className="trv-matrix__trail"
        width={UNITS.length * 22}
        height={QUESTIONS.length * 36}
        viewBox={`0 0 ${UNITS.length * 22} ${QUESTIONS.length * 36}`}
        aria-hidden="true"
      >
        <polyline points={points} />
      </svg>
    </div>
  );
}

/** The last moves, as words. */
function Way({ trail }) {
  const recent = trail.slice(-6);
  return (
    <div className="trv-way">
      <div className="trv-way__t">Your way here</div>
      {recent.map(([i, j], n) => {
        const unit = UNITS[j];
        const question = QUESTIONS[i];
        const from = recent[n - 1];
        const dq = from ? i - from[0] : 0;
        const du = from ? j - from[1] : 0;
        let arrow = '·';
        let words = `${unit.name}, ${question.short.toLowerCase()}`;
        if (from && dq && du) arrow = '↘';
        else if (from && du) [arrow, words] = [du > 0 ? '→' : '←', unit.name];
        else if (from) [arrow, words] = [dq > 0 ? '↓' : '↑', question.short];
        return (
          // The trail only grows, so its position from the end is stable.
          <div key={trail.length - recent.length + n} className="trv-way__st">
            <i>{arrow}</i>
            {words}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The control: the same question in the toolbox's own tree, with the
 * pages a reader has to open today to piece the answer together.
 */
function AsPublished({ question }) {
  const hit = new Set(question.pages);
  const pages = TOOLBOX_TREE.filter((entry) => hit.has(entry.id));
  return (
    <div className="trv-docs">
      <nav aria-label="The toolbox as published">
        {TOOLBOX_TREE.map((entry) =>
          entry.level ? (
            <div key={entry.level} className="trv-docs__lv">
              {entry.level}
            </div>
          ) : (
            <div key={entry.id} className={`trv-docs__it${entry.sub ? ' sub' : ''}${hit.has(entry.id) ? ' hit' : ''}`}>
              {entry.label}
            </div>
          )
        )}
      </nav>
      <div className="trv-docs__page">
        <div className="trv-docs__crumb">Neoflix toolbox · as it is published, in its own order</div>
        <h3>{question.question}</h3>
        <p>
          The toolbox has no page for this question. To answer it, a reader opens {pages.length} pages and puts the
          pieces together:
        </p>
        <ol>
          {pages.map((entry) => (
            <li key={entry.id}>
              {entry.label}
              {entry.id.startsWith('u-') ? <small>one unit’s answer</small> : null}
            </li>
          ))}
        </ol>
        <p className="trv-docs__back">Switch back: the same pieces, arriving around the one you are on.</p>
      </div>
    </div>
  );
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const inWords = (n) => NUMBER_WORDS[n] ?? String(n);

export default function Travelling() {
  const [state, dispatch] = useReducer(reducer, null, () => init(placeAt(window.location.search) || START));
  const [published, setPublished] = useState(false);
  const { scale, flow } = useFit();
  const stageRef = useRef(null);
  const { q, u, depth, held, step, trail, seen, cards, serial, leaves } = state;

  const go = (nq, nu) => dispatch({ type: 'go', q: nq, u: nu, now: performance.now() });

  // New cards are painted once where they start, then sent to their slot.
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => dispatch({ type: 'settle' }));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [serial]);

  // Cards that have left are removed once their fade is over.
  useEffect(() => {
    if (!leaves) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'sweep', before: performance.now() - LEAVE_MS + 40 }), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaves]);

  // Staying goes deeper. Every move starts the clock again.
  useEffect(() => {
    if (held || published) return undefined;
    const timers = DEPTHS.map((level, i) =>
      i === 0
        ? null
        : setTimeout(() => dispatch({ type: 'depth', depth: i + 1, only: 'raise', now: performance.now() }), level.after)
    );
    return () => timers.forEach(clearTimeout);
  }, [step, held, published]);

  // A place has an address. It follows the reader without filling the
  // history: Back leaves the interface, the trail is the way back in it.
  useEffect(() => {
    if (step === 0) return;
    try {
      window.history.replaceState(window.history.state, '', window.location.pathname + addressOf(q, u));
    } catch {
      // A sandboxed frame may refuse; the address is a convenience.
    }
  }, [step, q, u]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest?.('textarea,input') || event.metaKey || event.ctrlKey || event.altKey) return;
      const here = stateRef.current;
      if (event.key === 'ArrowRight') go(here.q, here.u + 1);
      else if (event.key === 'ArrowLeft') go(here.q, here.u - 1);
      else if (event.key === 'ArrowDown') go(here.q + 1, here.u);
      else if (event.key === 'ArrowUp') go(here.q - 1, here.u);
      else if (event.key === ' ' && !event.target.closest?.('button')) {
        // Space brings the next depth now.
        dispatch({ type: 'depth', depth: here.depth + 1, only: 'raise', now: performance.now() });
      } else return;
      event.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // One gesture, one step (see WHEEL in world.js). A native listener:
  // React's wheel events are passive and could not stop the page.
  const stateRef = useRef(state);
  stateRef.current = state;
  const idleRef = useRef(published || flow);
  idleRef.current = published || flow;
  useEffect(() => {
    const stage = stageRef.current;
    let sum = [0, 0];
    let last = 0;
    let spent = false;
    const onWheel = (event) => {
      if (idleRef.current) return;
      event.preventDefault();
      const now = Date.now();
      if (now - last > WHEEL.gap) {
        spent = false;
        sum = [0, 0];
      }
      last = now;
      if (spent) return;
      sum[0] += event.deltaX;
      sum[1] += event.deltaY;
      const ax = Math.abs(sum[0]);
      const ay = Math.abs(sum[1]);
      if (Math.max(ax, ay) < WHEEL.threshold) return;
      spent = true;
      const here = stateRef.current;
      if (ax > ay) go(here.q, here.u + (sum[0] > 0 ? 1 : -1));
      else go(here.q + (sum[1] > 0 ? 1 : -1), here.u);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  const question = QUESTIONS[q];
  const unit = UNITS[u];
  const cell = cellOf(q, u);
  const lines = tracks(q, u, depth);

  return (
    <div className={`trv${flow ? ' flow' : ''}`} style={{ '--s': scale }}>
      <div className="trv-fit">
        <div className="trv-stage" ref={stageRef}>
          <aside className="trv-side">
            <h1>Neoflix</h1>
            <div className="trv-side__sub">
              {inWords(QUESTIONS.length)} questions, {inWords(UNITS.length)} units
            </div>
            <Matrix q={q} u={u} depth={depth} seen={seen} trail={trail} onGo={go} />
            <Way trail={trail} />
            <div className="trv-side__hint">
              <b>← →</b> another unit, <b>↑ ↓</b> another question. Arrows, a swipe, or a click.
              <br />
              <b>Moving</b> goes sideways. <b>Staying</b> goes deeper; <b>Space</b> brings it now.
            </div>
            <div className="trv-side__note">
              A design study. Answers are shortened from each unit’s own page in the Neoflix toolbox; film lines are the
              film’s subtitles.
            </div>
          </aside>

          <div className="trv-head">
            <b>{String(q + 1).padStart(2, '0')}</b>
            <h2>{question.question}</h2>
            <span>the question is the same anywhere</span>
          </div>
          <div className="trv-sr" aria-live="polite">
            {unit.name}: {cell ? `${cell.h} ${cell.b}` : 'Not said.'}
          </div>

          <div className="trv-switch" role="group" aria-label="View">
            <button type="button" aria-pressed={!published} onClick={() => setPublished(false)}>
              Travelling
            </button>
            <button type="button" aria-pressed={published} onClick={() => setPublished(true)}>
              As published
            </button>
          </div>

          {published ? (
            <AsPublished question={question} />
          ) : (
            <>
              <svg className="trv-tracks" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} aria-hidden="true">
                {lines.map((line) => (
                  <path
                    key={line.key}
                    d={line.d}
                    // The dashes pass with the world: a step right sends them left.
                    style={{ strokeDashoffset: line.axis === 'row' ? u * DASH_FLOW.row : line.axis === 'column' ? q * DASH_FLOW.column : 0 }}
                  />
                ))}
                {depth >= DEPTHS.length ? <circle cx={TERMINUS.x} cy={TERMINUS.y} r="7" /> : null}
              </svg>
              <div className="trv-field">
                {cards.map((card) => (
                  <Card key={card.id} card={card} onGo={go} apart={depth >= SEAMS_OPEN_AT} />
                ))}
              </div>
              <div className="trv-meter" role="group" aria-label="Depth">
                {DEPTHS.map((level, i) => (
                  <button
                    key={level.name}
                    type="button"
                    className={i + 1 <= depth ? 'on' : undefined}
                    aria-pressed={i + 1 <= depth}
                    onClick={() => dispatch({ type: 'depth', depth: i + 1, hold: true, now: performance.now() })}
                  >
                    {level.name}
                  </button>
                ))}
                <i>{depth < DEPTHS.length && !held ? 'stay …' : ''}</i>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
