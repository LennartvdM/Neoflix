/**
 * Walking a path: the slideshow, running on top of the library. One step
 * at a time, ← and → move along it, and the record underneath is still a
 * full record with everything it connects to.
 */
import React, { useEffect } from 'react';
import { catalog } from '../library';
import { useGo, AppLink } from './nav';
import { urlFor } from '../urls';

export default function PathBar({ path, k }) {
  const go = useGo();
  const i = path ? path.steps.indexOf(k) : -1;
  const prev = path?.steps[i - 1];
  const next = path?.steps[i + 1];
  useEffect(() => {
    if (i < 0) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' && next) go(next, { path: path.id });
      if (e.key === 'ArrowLeft' && prev) go(prev, { path: path.id });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  if (i < 0) return null;
  const n = path.steps.length;
  return (
    <div className="pathbar" role="navigation" aria-label={`Path: ${path.name}`}>
      <div className="pathbar__in">
        <AppLink to={`/paths/${path.id}`} className="pathbar__name"><span className="sys-label">Path</span><strong>{path.name}</strong></AppLink>
        <div className="pathbar__chain" style={{ '--done': `calc((100% - 12px) * ${i / Math.max(n - 1, 1)})` }}>
          <span className="pathbar__done" />
          {path.steps.map((s, j) => (
            <a
              key={s}
              href={urlFor(s, { path: path.id })}
              data-done={j < i ? '' : undefined}
              aria-current={j === i ? 'step' : undefined}
              onClick={(e) => { e.preventDefault(); go(s, { path: path.id }); }}
            >
              <span>{j + 1}. {catalog.label(s)}</span>
            </a>
          ))}
          <span className="pathbar__here" style={{ left: `calc(6px + (100% - 12px) * ${i / Math.max(n - 1, 1)})` }} />
        </div>
        <div className="pathbar__nav">
          <span className="pathbar__count">{i + 1} / {n}</span>
          <button type="button" disabled={!prev} onClick={() => go(prev, { path: path.id })} aria-label="Previous step">←</button>
          {next ? (
            <button type="button" className="pathbar__next" onClick={() => go(next, { path: path.id })}>Next <em>{catalog.label(next)}</em> →</button>
          ) : (
            <AppLink to={`/paths/${path.id}`} className="pathbar__next">Path complete →</AppLink>
          )}
          <AppLink to={urlFor(k)} className="pathbar__leave" title="Leave the path">✕</AppLink>
        </div>
      </div>
    </div>
  );
}
