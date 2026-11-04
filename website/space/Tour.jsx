/**
 * Story mode: the tour (tour.js) played over the space.
 *
 * Scroll position IS the camera's position along the tour. Each stop has
 * a hold (the camera stays, the words are read) and a travel (the camera
 * flies to the next stop, the words cross-fade at the midpoint). The
 * reader scrubs it with the wheel or trackpad, in either axis, forward or
 * back; letting go snaps to the nearest stop in the direction they were
 * going, so one flick is one stop. Keys and the bar jump stop to stop;
 * "Play" lets it run by itself.
 *
 * It never takes the space away. Drag, zoom, search or open a record and
 * the tour pauses where it is; "Resume" flies back and carries on.
 */
import React, { useEffect, useRef, useState } from 'react';
import { zoomPath } from './camera';

const HOLD = { core: 440, skim: 200 };
// While the camera holds on a stop, scrolling still moves it: a slow push
// in, so a scroll never does nothing.
const DRIFT = 1.05;
const clamp = (lo, v, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createTour({ camera, stops, camFor, onStop, onEnd }) {
  let cams = [];
  let paths = [];
  const start = [];
  const holds = [];
  const travels = [];
  let end = 0;
  let p = 0;
  let cur = -1;
  let raf = 0;
  let snapT = 0;
  let playT = 0;
  let dir = 1;
  let over = 0;
  let playing = false;
  let aim = 0; // the stop a key press or click is already heading for
  let W = 1;
  const listeners = new Set();

  function layout() {
    W = window.innerWidth;
    cams = stops.map((s, i) => camFor(s, i));
    paths = cams.slice(0, -1).map((a, i) => zoomPath([a.x, a.y, W / (a.k * DRIFT)], [cams[i + 1].x, cams[i + 1].y, W / cams[i + 1].k]));
    let acc = 0;
    stops.forEach((s, i) => {
      start[i] = acc;
      holds[i] = HOLD[s.depth] || HOLD.core;
      acc += holds[i];
      if (i < stops.length - 1) {
        // A long flight takes more scrolling than a hop next door.
        travels[i] = clamp(380, 300 + paths[i].S * 150, 900);
        acc += travels[i];
      }
    });
    end = acc;
  }

  const locate = (q) => {
    let i = stops.length - 1;
    while (i > 0 && start[i] > q) i -= 1;
    const u = q - start[i];
    if (u <= holds[i] || i === stops.length - 1) return { i, travel: false, t: 0, h: Math.min(1, u / holds[i]) };
    return { i, travel: true, t: Math.min(1, (u - holds[i]) / travels[i]) };
  };
  const camAt = (q) => {
    const l = locate(q);
    if (!l.travel) return { ...cams[l.i], k: cams[l.i].k * (1 + (DRIFT - 1) * l.h) };
    const [x, y, w] = paths[l.i](l.t);
    return { x, y, k: W / w };
  };
  const emit = () => {
    const l = locate(p);
    const near = l.travel && l.t >= 0.5 ? l.i + 1 : l.i;
    const opacity = l.travel ? Math.abs(1 - 2 * l.t) : 1;
    if (near !== cur) { cur = near; onStop?.(cur); }
    listeners.forEach((fn) => fn({ p, end, cur, opacity, playing }));
  };
  const apply = () => { camera.nudge(camAt(p)); emit(); };

  const stopTween = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const stopPlay = () => { clearTimeout(playT); if (playing) { playing = false; emit(); } };

  function tweenTo(target, { ms, onDone } = {}) {
    stopTween();
    const from = p;
    const dist = Math.abs(target - from);
    if (dist < 0.5) { p = target; apply(); camera.settle(); onDone?.(); return; }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduced ? 0 : ms ?? clamp(420, dist * 1.5, 1600);
    const t0 = performance.now();
    const tick = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      p = from + (target - from) * ease(t);
      apply();
      if (t < 1) raf = requestAnimationFrame(tick);
      else { raf = 0; camera.settle(); onDone?.(); }
    };
    raf = requestAnimationFrame(tick);
  }

  function arrived() {
    if (!playing) return;
    const s = stops[cur];
    const words = `${s.title} ${s.text}`.length;
    const dwell = clamp(3200, words * 48, 10000) * (s.depth === 'skim' ? 0.7 : 1);
    clearTimeout(playT);
    playT = setTimeout(() => { if (cur >= stops.length - 1) { playing = false; emit(); } else goTo(cur + 1, { keepPlaying: true }); }, dwell);
  }

  function goTo(i, { keepPlaying = false } = {}) {
    if (!keepPlaying) stopPlay();
    clearTimeout(snapT);
    i = clamp(0, i, stops.length - 1);
    aim = i;
    const l = locate(p);
    const from = l.travel && l.t >= 0.5 ? l.i + 1 : l.i;
    if (Math.abs(i - from) <= 1) { tweenTo(start[i], { onDone: arrived }); return; }
    // Further than next door: fly straight there instead of fast-
    // forwarding through every stop in between.
    stopTween();
    camera.fly(cams[i], { duration: 1800, onDone: () => { p = start[i]; apply(); camera.settle(); arrived(); } });
    cur = i;
    onStop?.(i);
    listeners.forEach((fn) => fn({ p: start[i], end, cur, opacity: 1, playing }));
  }

  // Letting go settles on a stop, in the direction the reader was going:
  // one flick is one stop, however hard the flick.
  function snap() {
    const l = locate(p);
    if (!l.travel) {
      if (dir > 0 && l.h > 0.3 && l.i < stops.length - 1) tweenTo(start[l.i + 1], { onDone: arrived });
      else camera.settle();
      return;
    }
    tweenTo(dir > 0 ? start[l.i + 1] : start[l.i], { ms: 620 + 520 * (dir > 0 ? 1 - l.t : l.t) });
  }

  return {
    layout,
    stops,
    get: () => ({ p, end, cur, playing }),
    holdOf: (i) => start[i],
    camOf: (i) => cams[i],
    /** Put the camera on stop i at once (arriving, resuming). */
    seek(i) { stopTween(); stopPlay(); p = start[clamp(0, i, stops.length - 1)]; over = 0; camera.set(camAt(p)); emit(); },
    /** Fly back to where the tour was and carry on from there. */
    resume(onDone) {
      const i = Math.max(0, cur);
      camera.fly(cams[i], { duration: 1400, onDone: () => { p = start[i]; apply(); camera.settle(); onDone?.(); } });
    },
    scroll(delta) {
      stopTween();
      stopPlay();
      if (!delta) return;
      dir = Math.sign(delta);
      if (delta > 0 && p >= end) {
        over += delta;
        if (over > 240) { over = 0; onEnd?.(); }
        return;
      }
      over = 0;
      p = clamp(0, p + delta, end);
      apply();
      clearTimeout(snapT);
      snapT = setTimeout(snap, 170);
    },
    // Pressing again while still moving goes one further than the stop
    // already being headed for.
    next() { const i = (raf || camera.isFlying() ? aim : locate(p).i) + 1; if (i >= stops.length) onEnd?.(); else goTo(i); },
    prev() { const l = locate(p); goTo(raf || camera.isFlying() ? aim - 1 : l.travel ? l.i : l.i - 1); },
    goTo,
    play() { if (cur >= stops.length - 1) return; playing = true; emit(); goTo(cur + 1, { keepPlaying: true }); },
    pause: () => { stopPlay(); },
    halt() { stopTween(); stopPlay(); clearTimeout(snapT); },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

/** The tour's state, for React, only re-rendering when the stop changes. */
export function useTourStop(tour) {
  const [s, setS] = useState(() => tour.get());
  useEffect(() => tour.subscribe((n) => setS((o) => (o.cur === n.cur && o.playing === n.playing ? o : { cur: n.cur, playing: n.playing }))), [tour]);
  return s;
}

/* ── the words ─────────────────────────────────────────────────────────── */

export function Narration({ tour, chapters, fill, hurried, onOpen, onDoor, doors, labelOf, hrefOf }) {
  const ref = useRef(null);
  const { cur } = useTourStop(tour);
  useEffect(() => tour.subscribe(({ opacity }) => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = opacity.toFixed(3);
    el.style.transform = `translateY(${((1 - opacity) * 14).toFixed(1)}px)`;
  }), [tour]);
  const s = tour.stops[Math.max(0, cur)];
  if (!s) return null;
  const chapter = chapters.find((c) => c.id === s.chapter);
  const n = chapter ? chapters.indexOf(chapter) + 1 : null;
  const showDoors = s.doors || hurried;
  return (
    <section className="narr" data-depth={s.depth} aria-live="polite">
      <div className="narr__in" ref={ref}>
        {chapter && <p className="narr__kick"><b>{n}</b>{chapter.name}</p>}
        <h2>{s.title}</h2>
        <p className="narr__text">{fill(s.text)}</p>
        {s.open && (
          <a className="narr__open" href={hrefOf(s.open)} onClick={(e) => { e.preventDefault(); onOpen(s.open); }}>
            Open {labelOf(s.open)} <span aria-hidden="true">→</span>
          </a>
        )}
        {showDoors && (
          <div className="narr__doors">
            <small>{s.doors ? (cur === 0 ? 'Or go straight to' : 'Where to next') : 'Moving fast? Go straight to'}</small>
            {doors.map((d) => (
              <button key={d.id} type="button" onClick={() => onDoor(d)}>
                <strong>{d.label}</strong><span>{d.note}</span>
              </button>
            ))}
          </div>
        )}
        {cur === 0 && <p className="narr__hint"><span className="narr__wheel" aria-hidden="true" />Scroll, or use the arrow keys</p>}
      </div>
    </section>
  );
}

/* ── the bar: where you are in the story, and the way out ─────────────── */

export function TourBar({ tour, chapters, onLeave }) {
  const mark = useRef(null);
  const { cur, playing } = useTourStop(tour);
  const [pos, setPos] = useState([]);
  useEffect(() => {
    const upd = () => setPos(tour.stops.map((_, i) => tour.holdOf(i) / Math.max(1, tour.get().end)));
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, [tour]);
  useEffect(() => tour.subscribe(({ p, end }) => {
    if (mark.current) mark.current.style.left = `${((p / Math.max(1, end)) * 100).toFixed(2)}%`;
  }), [tour]);
  // A chapter runs from its first stop to where the next one begins.
  const spans = chapters.map((c, j) => {
    const idx = tour.stops.map((s, i) => (s.chapter === c.id ? i : -1)).filter((i) => i >= 0);
    const next = chapters[j + 1] && tour.stops.findIndex((s) => s.chapter === chapters[j + 1].id);
    const endAt = next > 0 ? next : tour.stops.length - 1;
    return { ...c, a: pos[idx[0]] ?? 0, b: (pos[endAt] ?? 0) - 0.012, first: idx[0], on: idx.includes(cur) };
  });
  return (
    <nav className="hud tourbar" aria-label="The tour">
      <button type="button" className="tourbar__btn" onClick={() => tour.prev()} disabled={cur <= 0} aria-label="Previous stop">←</button>
      <button type="button" className="tourbar__btn tourbar__play" onClick={() => (playing ? tour.pause() : tour.play())} aria-label={playing ? 'Pause' : 'Play the tour'}>
        {playing ? <span className="ico-pause" /> : <span className="ico-play" />}
      </button>
      <div className="tourbar__track">
        {spans.map((c) => (
          <button key={c.id} type="button" className="tourbar__ch" data-on={c.on ? '' : undefined} style={{ left: `${c.a * 100}%`, width: `${Math.max(2, (c.b - c.a) * 100)}%` }} onClick={() => tour.goTo(c.first)}>
            <span>{c.name}</span>
          </button>
        ))}
        {tour.stops.map((s, i) => (
          <button key={s.id} type="button" className="tourbar__tick" data-depth={s.depth} data-past={i < cur ? '' : undefined} data-on={i === cur ? '' : undefined} style={{ left: `${(pos[i] ?? 0) * 100}%` }} onClick={() => tour.goTo(i)} aria-label={s.title} title={s.title} />
        ))}
        <span className="tourbar__mark" ref={mark} />
      </div>
      <span className="tourbar__n">{Math.max(0, cur) + 1} / {tour.stops.length}</span>
      <button type="button" className="tourbar__btn tourbar__btn--next" onClick={() => tour.next()} aria-label="Next stop">→</button>
      <button type="button" className="tourbar__leave" onClick={onLeave}>Leave the tour</button>
    </nav>
  );
}
