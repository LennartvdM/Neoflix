/**
 * The map: the whole library as one graph, on demand.
 *
 * The pages never show the whole index (ontology.js). The map is where
 * it lives, for the reader who asks for it: three bands, the way the
 * site's material is built: the evidence (the six papers, on their
 * years), the films (which connect a finding to a practice), the
 * toolbox (every page as a dot, in the five steps of the loop). The
 * edges are the library's own links (system/graph.js). Where you are is
 * marked; the route you've taken (this browser's trail, localStorage
 * only) is drawn through what you've opened; what the page you're on
 * connects to is lit. Hover anything to light its connections; click to
 * go there.
 *
 * Layout is fixed (no force simulation): the same record is always in
 * the same place, so the map can be learned.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { catalog, graph, stillFor } from '../system/library';
import { LOOP } from '../system/catalog';
import { useTrail } from '../system/state';
import { labelOf } from './Page';

const W = 1200;
const H = 660;
const YEAR_X = { 2022: 170, 2023: 300, 2024: 600, 2025: 900, 2026: 1030 };
const Y = { paper: 120, film: 320, guide: 470 };

function layout() {
  const at = {};
  const byYear = {};
  catalog.list('paper').forEach((p) => (byYear[p.year] = byYear[p.year] || []).push(p));
  Object.entries(byYear).forEach(([y, ps]) => ps.forEach((p, i) => { at[p.key] = { key: p.key, kind: 'paper', x: (YEAR_X[y] ?? 1030) + (i - (ps.length - 1) / 2) * 120, y: Y.paper }; }));
  catalog.list('film').forEach((f, i) => { at[f.key] = { key: f.key, kind: 'film', x: 170 + (i * 860) / 5, y: Y.film }; });
  const steps = LOOP.map((l, si) => {
    const gs = catalog.list('guidance').filter((g) => g.phase === l.id && !g.divider);
    const cx = 170 + (si * 860) / 4;
    const cols = 7;
    gs.forEach((g, i) => { at[g.key] = { key: g.key, kind: 'guidance', x: cx + ((i % cols) - (cols - 1) / 2) * 18, y: Y.guide + Math.floor(i / cols) * 18 }; });
    return { id: l.id, name: l.name, x: cx, y: Y.guide + Math.ceil(gs.length / cols) * 18 + 16, n: gs.length };
  });
  const edges = graph.edges.filter((e) => at[e.a] && at[e.b] && e.kind !== 'loop');
  return { at, steps, edges };
}
const curve = (a, b) => {
  const my = (a.y + b.y) / 2;
  return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
};

export default function LibraryMap({ here, onGo, onClose }) {
  const L = useMemo(layout, []);
  const trail = useTrail();
  const [hover, setHover] = useState(null);
  const focus = hover || here;
  const near = focus ? graph.neighbours(focus) : null;
  const route = trail.filter((k) => L.at[k]).slice(-14);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const tip = hover && L.at[hover];
  const rec = hover && catalog.get(hover);
  return (
    <motion.div
      className="map"
      role="dialog"
      aria-label="The map of the library"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="map__sheet"
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 10 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        onMouseLeave={() => setHover(null)}
      >
        <header className="map__head">
          <span className="phead__num">map</span>
          <h2>The library, all of it</h2>
          <span className="map__legend"><i data-k="paper" />Papers <i data-k="film" />Films <i data-k="guidance" />Toolbox pages <i data-k="trail" />Your route</span>
          <button type="button" className="map__x" onClick={onClose}>Close <kbd>Esc</kbd></button>
        </header>
        <div className="map__plot" data-focus={focus ? '' : undefined}>
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <text className="map__band" x="20" y={Y.paper + 4}>The evidence</text>
            <text className="map__band" x="20" y={Y.film + 4}>The films</text>
            <text className="map__band" x="20" y={Y.guide + 4}>The toolbox</text>
            {Object.entries(YEAR_X).map(([y, x]) => <text key={y} className="map__tick" x={x} y={Y.paper - 62} textAnchor="middle">{y}</text>)}
            {L.steps.map((s) => <text key={s.id} className="map__tick" x={s.x} y={s.y} textAnchor="middle">{s.name} · {s.n}</text>)}
            {L.edges.map((e, i) => {
              const hot = focus && (e.a === focus || e.b === focus);
              return <path key={i} className="map__edge" data-kind={e.kind} data-hot={hot ? '' : undefined} style={{ '--d': `${0.15 + i * 0.006}s` }} d={curve(L.at[e.a], L.at[e.b])} />;
            })}
            {route.length > 1 && <path className="map__route" pathLength="1" d={route.map((k, i) => `${i ? 'L' : 'M'}${L.at[k].x},${L.at[k].y}`).join(' ')} />}
          </svg>
          {Object.values(L.at).map((n) => {
            const r = catalog.get(n.key);
            const hot = focus && (n.key === focus || near.has(n.key));
            return (
              <button
                key={n.key}
                type="button"
                className={`map__node map__node--${n.kind}`}
                data-hot={hot ? '' : undefined}
                data-here={n.key === here ? '' : undefined}
                data-visited={trail.includes(n.key) ? '' : undefined}
                style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}
                onMouseEnter={() => setHover(n.key)}
                onFocus={() => setHover(n.key)}
                onClick={() => onGo(n.key)}
                aria-label={labelOf(n.key)}
              >
                {n.kind === 'paper' && <b>{r.n}</b>}
                {n.kind === 'film' && <img src={stillFor(r)} alt="" />}
                {n.kind !== 'guidance' && <span>{r.kind === 'paper' ? r.short : r.name}</span>}
              </button>
            );
          })}
          {tip && (
            <div className="map__tip" style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%` }}>
              <small>{rec.kind === 'guidance' ? LOOP.find((l) => l.id === rec.phase)?.name || 'The toolbox' : rec.kind === 'paper' ? `Paper ${rec.n} · ${rec.year}` : `Film ${rec.order + 1}`}</small>
              {rec.kind === 'film' ? rec.claim : rec.kind === 'paper' ? rec.short : labelOf(rec.key)}
              <em>{graph.neighbours(rec.key).size} connections</em>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
