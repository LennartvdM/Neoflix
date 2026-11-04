/**
 * A record's shape — one per kind, the same everywhere on the site:
 * a film is a chip of its clip, a paper its number in a disc, guidance a
 * dot. Colour repeats the kind but never carries it alone (the shapes
 * differ), so it reads in greyscale and for colour-blind readers.
 */
import React from 'react';
import { parseKey } from '../catalog';
import { catalog, stillFor } from '../library';

export default function Shape({ k, size = 's', className = '' }) {
  const { kind } = parseKey(k);
  const r = catalog.get(k);
  if (!r) return null;
  const cls = `sh sh--${kind} sh--${size} ${className}`;
  if (kind === 'film') return <span className={cls} style={{ backgroundImage: `url(${stillFor(r)})` }} aria-hidden="true" />;
  if (kind === 'paper') return <span className={cls} aria-hidden="true">{r.n}</span>;
  return <span className={cls} aria-hidden="true" />;
}

export function KindLabel({ kind, name: own, children }) {
  const name = own || { guidance: 'Guidance', paper: 'Paper', film: 'Film' }[kind] || kind;
  return (
    <span className="sys-label">
      <b data-kind={kind}>{name}</b>
      {children ? <> · {children}</> : null}
    </span>
  );
}
