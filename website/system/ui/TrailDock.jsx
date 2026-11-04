/**
 * Your trail: the records you've visited, as a chain of their shapes.
 * Pinned records (the session pack) carry a dot. The trail can be saved
 * as a path of your own; the pack opens as a page for the room.
 */
import React, { useContext, useEffect, useRef } from 'react';
import { catalog } from '../library';
import { useTrail, usePins, clearTrail, saveMyPath } from '../state';
import Shape from './Shape';
import { Here, RecordLink, AppLink } from './nav';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { urlFor } from '../urls';

export default function TrailDock() {
  const trail = useTrail().filter((k) => catalog.has(k));
  const pins = usePins();
  const { current } = useContext(Here);
  const navigate = useTransitionNavigate();
  const chain = useRef(null);
  useEffect(() => {
    chain.current?.querySelector('[data-here]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [current, trail.length]);
  if (!trail.length && !pins.length) return null;
  return (
    <div className="dock" role="region" aria-label="Your trail">
      <span className="sys-label dock__label">Your trail</span>
      <div className="dock__chain" ref={chain}>
        {trail.map((k, i) => (
          <React.Fragment key={`${k}-${i}`}>
            {i > 0 && <i className="dock__link" />}
            <RecordLink k={k} className="dock__node" data-here={k === current ? '' : undefined} data-pinned={pins.includes(k) ? '' : undefined} data-name={catalog.label(k)} aria-label={catalog.label(k)}>
              <Shape k={k} size="xs" />
            </RecordLink>
          </React.Fragment>
        ))}
      </div>
      <div className="dock__actions">
        <AppLink to="/pack" className="sys-btn sys-btn--dark">Session pack <b>{pins.length}</b></AppLink>
        {trail.length > 1 && (
          <button type="button" data-save="" className="sys-btn sys-btn--ghost" onClick={() => { saveMyPath(trail); navigate(urlFor(trail[0], { path: 'mine' })); }}>
            Save trail as a path
          </button>
        )}
        <button type="button" className="sys-btn sys-btn--ghost" onClick={clearTrail} aria-label="Clear the trail" title="Clear the trail">✕</button>
      </div>
    </div>
  );
}
