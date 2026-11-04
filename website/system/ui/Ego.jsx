/**
 * A record's own neighbourhood, drawn: the record in the centre, what it
 * rests on, what shows it and what sits next to it around it. Where the
 * reader came from is marked — the link they just followed.
 */
import React from 'react';
import { parseKey } from '../catalog';
import { catalog, graph } from '../library';
import Shape from './Shape';
import { RecordLink } from './nav';

const ORDER = { paper: 0, film: 1, guidance: 2 };

export function neighboursFor(key) {
  const r = catalog.get(key);
  const out = [];
  const push = (k, rel) => { if (k && k !== key && !out.some((o) => o.k === k)) out.push({ k, rel }); };
  graph.papersOf(key).forEach((p) => push(p.key, 'evidence'));
  graph.filmsOf(key).forEach((f) => push(f.key, 'film'));
  graph.guidanceOf(key).slice(0, 4).forEach((g) => push(g.key, 'practice'));
  if (r.kind === 'guidance') {
    const same = catalog.list('guidance').filter((g) => g.phase === r.phase && g.key !== key && !g.divider);
    const i = same.findIndex((g) => g.order > r.order);
    const around = i < 0 ? same.slice(-3) : same.slice(Math.max(0, i - 2), i + 1);
    around.slice(0, out.length ? 3 : 5).forEach((g) => push(g.key, 'sibling'));
  }
  return out.sort((a, b) => ORDER[parseKey(a.k).kind] - ORDER[parseKey(b.k).kind]);
}

export default function Ego({ k, from }) {
  const ns = neighboursFor(k);
  if (from && catalog.has(from) && from !== k && !ns.some((n) => n.k === from)) ns.unshift({ k: from, rel: 'from' });
  const cx = 220, cy = 150, rx = 150, ry = 112;
  const pts = ns.map((n, i) => {
    const a = (-90 + ((i + 0.5) * 360) / Math.max(ns.length, 1)) * (Math.PI / 180);
    return { ...n, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  return (
    <div className="ego">
      <svg viewBox="0 0 440 300" aria-hidden="true">
        <ellipse className="ego__ring" cx={cx} cy={cy} rx={rx} ry={ry} />
        {pts.map((p, i) => (
          <path
            key={p.k}
            className="ego__edge"
            data-kind={parseKey(p.k).kind}
            data-weak={p.rel === 'sibling' ? '' : undefined}
            data-from={p.k === from ? '' : undefined}
            pathLength="1"
            style={{ '--d': `${0.15 + i * 0.06}s` }}
            d={`M${cx},${cy} Q${(cx + p.x) / 2 + (p.y - cy) * 0.15},${(cy + p.y) / 2 - (p.x - cx) * 0.15} ${p.x},${p.y}`}
          />
        ))}
      </svg>
      <span className="ego__node ego__node--center" style={{ left: cx, top: cy }}>
        <Shape k={k} size="xl" />
      </span>
      {pts.map((p, i) => (
        <RecordLink
          key={p.k}
          k={p.k}
          className="ego__node"
          data-side={p.x < cx - 60 ? 'l' : p.x > cx + 60 ? 'r' : p.y < cy ? 't' : 'b'}
          data-from={p.k === from ? '' : undefined}
          style={{ left: p.x, top: p.y, '--d': `${0.3 + i * 0.06}s` }}
        >
          <Shape k={p.k} />
          <span className="ego__name">{p.k === from && <em>You came from · </em>}{catalog.label(p.k)}</span>
        </RecordLink>
      ))}
    </div>
  );
}
