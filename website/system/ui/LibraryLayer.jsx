/**
 * The library, present during the introduction and the elaboration.
 *
 * The homepage film and /neoflix still tell the story in order. This
 * layer sits over both, small at first, and assembles itself as the
 * reader ripens (system/ripeness.js):
 *
 *   arrived    a single "Skip ahead" — nobody has to sit through anything
 *   curious    the six films as chips, filling in as they're seen
 *   oriented   + the paths and a search field
 *   ready      + the library itself: the map, your trail, "Open the library"
 *
 * It lives outside the page slide (like the navbar), so it carries across
 * from the intro to the elaboration without restarting, and hands over to
 * the library's own chrome when the reader gets there.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { FILMS } from '../content/films';
import { PATHS } from '../content/paths';
import { stillFor, catalog } from '../library';
import { urlFor } from '../urls';
import { useRipeness, noteIntent, noteSeen, noteDepth, noteHurry, noteIntroDone, openFully, LEVELS } from '../ripeness';
import { useTrail } from '../state';
import MapGraph from './MapGraph';
import '../system.css';
import '../layer.css';

// The homepage is the space itself now (website/space); the layer stays on
// the long read.
const TIERS = { '/neoflix': 'argument', '/contact': 'argument' };
const EASE = [0.32, 0.72, 0, 1];
const grow = { initial: { opacity: 0, width: 0 }, animate: { opacity: 1, width: 'auto' }, exit: { opacity: 0, width: 0 }, transition: { duration: 0.5, ease: EASE } };

/* Watch the page underneath for the signals ripeness reads. */
function useSignals(tier) {
  useEffect(() => {
    if (!tier) return undefined;
    const cleanups = [];
    const observe = (ids, onSeen, { threshold = 0.5, dwell = 1500 } = {}) => {
      const timers = new Map();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) timers.set(e.target.id, setTimeout(() => onSeen(e.target.id), dwell));
          else clearTimeout(timers.get(e.target.id));
        });
      }, { threshold });
      // The page is a lazy chunk inside the slide: find its sections once they exist.
      let tries = 0;
      const attach = () => {
        const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
        if (els.length || tries > 20) els.forEach((el) => io.observe(el));
        else { tries += 1; setTimeout(attach, 250); }
      };
      attach();
      cleanups.push(() => { io.disconnect(); timers.forEach(clearTimeout); });
    };
    if (tier === 'intro') {
      observe(['reel', 'worldmap'], () => noteIntroDone(), { dwell: 800 });
    } else {
      observe(FILMS.map((f) => f.anchor), (id) => { const f = FILMS.find((x) => x.anchor === id); if (f) noteSeen(f.id); });
      // Depth and speed of reading the elaboration.
      let last = { t: 0, y: 0 };
      let lastHurry = 0;
      const onScroll = (e) => {
        const el = e.target;
        if (!(el instanceof Element) || !el.querySelector?.('#time-sensitive')) return;
        const max = el.scrollHeight - el.clientHeight;
        if (max > 0) noteDepth(el.scrollTop / max);
        const now = performance.now();
        const v = Math.abs(el.scrollTop - last.y) / Math.max(1, now - last.t);
        if (last.t && v > 4 && now - lastHurry > 6000) { lastHurry = now; noteHurry(); }
        last = { t: now, y: el.scrollTop };
      };
      document.addEventListener('scroll', onScroll, { capture: true, passive: true });
      cleanups.push(() => document.removeEventListener('scroll', onScroll, { capture: true }));
    }
    return () => cleanups.forEach((c) => c());
  }, [tier]);
}

export default function LibraryLayer() {
  const { pathname } = useLocation();
  const tier = TIERS[pathname.replace(/(.)\/+$/, '$1')] || null;
  const navigate = useTransitionNavigate();
  const ripe = useRipeness();
  const trail = useTrail();
  const [hover, setHover] = useState(false);
  const [panel, setPanel] = useState(false);
  const [why, setWhy] = useState(false);
  const [q, setQ] = useState('');
  const hovered = useRef(false);
  useSignals(tier);
  useEffect(() => { if (!tier) setPanel(false); }, [tier]);

  const level = ripe.level;
  const reach = () => { if (!hovered.current) { hovered.current = true; noteIntent(); } setHover(true); };
  const go = (to) => { setPanel(false); navigate(to); };

  return (
    <div className="lyr">
    <AnimatePresence>
      {tier && (
        <motion.aside
          key="layer"
          className="lyr__in"
          data-level={LEVELS[level]}
          aria-label="The library"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.5, ease: EASE }}
          onMouseEnter={reach}
          onMouseLeave={() => setHover(false)}
          onFocus={reach}
        >
          <AnimatePresence>
            {(why || panel) && (
              <motion.div className="lyr__panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.35, ease: EASE }}>
                {why && (
                  <div className="lyr__why">
                    <strong>Why this much of the library is showing</strong>
                    {ripe.reasons.length ? <ul>{ripe.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : <p>You just arrived: only a way to skip ahead.</p>}
                    <p className="lyr__muted">It grows as you watch, read or hurry. Nothing leaves this browser.</p>
                  </div>
                )}
                {panel && (
                  <div className="lyr__map">
                    <div className="lyr__maphead"><strong>The library</strong><span className="lyr__muted">Your route so far is drawn in black.</span></div>
                    <MapGraph mini trail={trail} />
                    <button type="button" className="lyr__btn lyr__btn--solid" onClick={() => go('/')}>Open the library →</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="lyr__dock" layout transition={{ layout: { duration: 0.5, ease: EASE } }}>
            {/* curious+: the six films, filling in as they're seen */}
            <AnimatePresence initial={false}>
              {level >= 1 && (
                <motion.div key="films" className="lyr__films" {...grow}>
                  {FILMS.map((f) => {
                    const seen = ripe.seen.includes(f.id);
                    return (
                      <a key={f.id} href={urlFor(`film:${f.id}`)} className="lyr__film" data-seen={seen ? '' : undefined} title={`${f.name}${seen ? '' : ' (not seen yet)'}`} onClick={(e) => { e.preventDefault(); go(urlFor(`film:${f.id}`)); }}>
                        <span style={seen ? { backgroundImage: `url(${stillFor(f)})` } : undefined} />
                      </a>
                    );
                  })}
                  <em>{ripe.seen.length} of 6</em>
                </motion.div>
              )}
            </AnimatePresence>

            {/* oriented+: the paths and search */}
            <AnimatePresence initial={false}>
              {level >= 2 && (
                <motion.div key="paths" className="lyr__paths" {...grow}>
                  {PATHS.map((p) => (
                    <a key={p.id} href={urlFor(p.steps[0], { path: p.id })} onClick={(e) => { e.preventDefault(); go(urlFor(p.steps[0], { path: p.id })); }}>{p.name}</a>
                  ))}
                  <form className="lyr__search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`); }}>
                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search the library" />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* always: skip ahead (to the next tier, or straight to the toolbox) */}
            <div className="lyr__skip">
              {tier === 'intro' && (level >= 1 || hover) && (
                <button type="button" className="lyr__btn" onClick={() => go('/neoflix')}>The argument</button>
              )}
              <button type="button" className="lyr__btn lyr__btn--solid" onClick={() => go('/')}>
                {level === 0 && !hover ? 'Skip ahead →' : level >= 3 ? 'The library →' : 'The toolbox →'}
              </button>
              {level >= 3 && (
                <button type="button" className="lyr__icon" aria-expanded={panel} onClick={() => { setPanel((v) => !v); openFully(); }} title="Show the library here">▴</button>
              )}
              {level >= 1 && (
                <button type="button" className="lyr__icon" aria-pressed={why} onClick={() => setWhy((v) => !v)} title="Why is this showing?">?</button>
              )}
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
    </div>
  );
}
