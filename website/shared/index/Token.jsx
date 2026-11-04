/**
 * A thing's token — the one building block every interface on the site
 * uses to name a beat, a loop part or a paper. Same shape everywhere: a
 * beat is a chip of its clip, a paper its number in a ring, a loop part a
 * segment of the loop. Pages arrange them differently; the token itself
 * never changes, which is what lets the eye follow a thing across pages
 * (and what the carry between pages flies).
 *
 * `anchor` marks the token as that thing's landing place on this page:
 * a carry from elsewhere ends here.
 */
import React from 'react';
import { BEATS, LOOP, PAPERS } from '../argument';
import { parseToken } from './relations';
import './index.css';

export default function Token({ t, size = 's', anchor = false, className = '', ...rest }) {
  const { kind, id } = parseToken(t);
  const common = {
    'data-token': t,
    ...(anchor ? { 'data-token-anchor': t } : {}),
    'aria-hidden': rest['aria-label'] ? undefined : 'true',
    ...rest,
  };
  if (kind === 'beat') {
    const beat = BEATS.find((b) => b.id === id);
    return (
      <span
        className={`ix-tok ix-tok--beat ix-tok--${size} ${className}`}
        style={{ backgroundImage: beat ? `url(${beat.clip.still})` : undefined }}
        {...common}
      />
    );
  }
  if (kind === 'paper') {
    return (
      <span className={`ix-tok ix-tok--paper ix-tok--${size} ${className}`} {...common}>
        {PAPERS[id]?.n}
      </span>
    );
  }
  if (kind === 'loop') {
    const i = LOOP.findIndex((l) => l.id === id);
    return (
      <span className={`ix-tok ix-tok--loop ix-tok--${size} ${className}`} data-i={i} {...common}>
        {LOOP.map((l, j) => (
          <span key={l.id} className="ix-tok__pip" data-self={j === i ? 'true' : undefined} />
        ))}
      </span>
    );
  }
  return null;
}
