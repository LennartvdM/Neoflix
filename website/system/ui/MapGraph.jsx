/**
 * The map: the whole library as one structure, in three bands —
 *   evidence (the papers, on their years) · the films · the guidance
 *   (by step of the loop).
 * Films sit in the middle because they are what connects a finding to a
 * practice. Hovering a record lights what it connects to; a path can be
 * drawn as a route (`route`), the reader's own trail in ink (`trail`),
 * and anything not matching a search dimmed (`dim`).
 *
 * Layout is fixed and deterministic (no force simulation): the same
 * record is always in the same place, so the map can be learned.
 */
import React, { useMemo, useState } from 'react';
import { LOOP } from '../catalog';
import { catalog, graph } from '../library';
import Shape from './Shape';
import { RecordLink } from './nav';

const W = 1136;
const H = 560;
const X0 = 190;
const X1 = 1060;
const YEAR_X = { 2022: 190, 2023: 330, 2024: 625, 2025: 920, 2026: 1060 };

function layout() {
  const nodes = [];
  const byYear = {};
  catalog.list('paper').forEach((p) => (byYear[p.year] = byYear[p.year] || []).push(p));
  Object.entries(byYear).forEach(([y, ps]) =>
    ps.forEach((p, i) => nodes.push({ key: p.key, kind: 'paper', x: (YEAR_X[y] ?? X1) + (i - (ps.length - 1) / 2) * 135, y: 92, d: 0.05 * p.n }))
  );
  catalog.list('film').forEach((f, i) => nodes.push({ key: f.key, kind: 'film', x: X0 + (i * (X1 - X0)) / 5, y: 262, d: 0.25 + 0.06 * i }));
  const clusters = [];
  LOOP.forEach((step, si) => {
    const gs = catalog.list('guidance').filter((g) => g.phase === step.id);
    const cx = X0 + (si * (X1 - X0)) / 4;
    const cols = 6;
    gs.forEach((g, i) => nodes.push({ key: g.key, kind: 'guidance', x: cx + ((i % cols) - (cols - 1) / 2) * 17, y: 410 + Math.floor(i / cols) * 17, d: 0.55 + 0.006 * i + 0.05 * si }));
    clusters.push({ name: step.name, x: cx, y: 410 + Math.ceil(gs.length / cols) * 17 + 14 });
  });
  const at = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const edges = graph.edges.filter((e) => at[e.a] && at[e.b]);
  return { nodes, at, edges, clusters };
}
const curve = (a, b) => {
  const my = (a.y + b.y) / 2 + 8;
  return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
};

export default function MapGraph({ route = null, routeSteps = null, trail = [], dim = null, mini = false }) {
  const L = useMemo(layout, []);
  const [hover, setHover] = useState(null);
  const near = hover ? graph.neighbours(hover) : null;
  const tr = trail.filter((k) => L.at[k]);
  const steps = routeSteps?.filter((k) => L.at[k]) || [];
  const tipNode = hover && L.at[hover];
  const tipRecord = hover && catalog.get(hover);

  return (
    <div
      className={`map${mini ? ' map--mini' : ''}`}
      data-focus={hover ? '' : undefined}
      data-route={route ? '' : undefined}
      data-dim={dim ? '' : undefined}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <text className="map__band" x="0" y="96">Evidence</text>
        <text className="map__band" x="0" y="266">Films</text>
        <text className="map__band" x="0" y="414">Guidance</text>
        <line className="map__rule" x1="150" y1="92" x2="1100" y2="92" />
        {Object.entries(YEAR_X).map(([y, x]) => (
          <text key={y} className="map__tick" x={x} y="46" textAnchor="middle">{y}</text>
        ))}
        <path className="map__rule" fill="none" d={`M${YEAR_X[2024] - 220},64 V58 H${YEAR_X[2024] + 220} V64`} />
        {L.clusters.map((c) => (
          <text key={c.name} className="map__tick" x={c.x} y={c.y} textAnchor="middle">{c.name}</text>
        ))}
        {L.edges.map((e, i) => {
          const hot = hover && (e.a === hover || e.b === hover);
          const out = dim && (dim(e.a) || dim(e.b));
          return <path key={i} className="map__edge" pathLength="1" data-hot={hot ? '' : undefined} data-out={out ? '' : undefined} style={{ '--d': `${0.7 + i * 0.012}s` }} d={curve(L.at[e.a], L.at[e.b])} />;
        })}
        {steps.length > 1 && <path className="map__route" data-kind={route} d={steps.map((k, i) => `${i ? 'L' : 'M'}${L.at[k].x},${L.at[k].y}`).join(' ')} />}
        {tr.length > 1 && <path className="map__trail" pathLength="1" d={tr.map((k, i) => `${i ? 'L' : 'M'}${L.at[k].x},${L.at[k].y}`).join(' ')} />}
      </svg>
      {L.nodes.map((n) => {
        const hot = hover && (n.key === hover || near.has(n.key));
        return (
          <RecordLink
            key={n.key}
            k={n.key}
            className={`map__node map__node--${n.kind}`}
            aria-label={catalog.label(n.key)}
            data-hot={hot ? '' : undefined}
            data-out={dim && dim(n.key) ? '' : undefined}
            data-onroute={steps.includes(n.key) ? '' : undefined}
            data-visited={tr.includes(n.key) ? '' : undefined}
            style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%`, '--d': `${n.d}s` }}
            onMouseEnter={() => setHover(n.key)}
            onFocus={() => setHover(n.key)}
          >
            <Shape k={n.key} />
            {n.kind !== 'guidance' && <span className="map__name">{catalog.label(n.key)}</span>}
          </RecordLink>
        );
      })}
      {tipNode && (
        <div className="map__tip" style={{ left: `${(tipNode.x / W) * 100}%`, top: `${(tipNode.y / H) * 100}%` }}>
          <small>{tipRecord.kind === 'guidance' ? `Guidance · ${LOOP.find((l) => l.id === tipRecord.phase)?.name || ''}` : tipRecord.kind === 'paper' ? `Paper ${tipRecord.n} · ${tipRecord.year}` : 'Film'}</small>
          {tipRecord.title}
        </div>
      )}
    </div>
  );
}
