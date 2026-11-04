/**
 * The seven hooks (content blueprint, "The seven hooks"). A page is a
 * composition of these and nothing else; each comes in up to three sizes
 * — line, panel, screen — set by the weight of its content.
 *
 *   Claim        the general sentence + the neonatal "in practice" line
 *   Proof        what Leiden found: a figure, plain words, a source
 *   Witness      the specific: a clip with caption, or a quote
 *   Instrument   the claim made into something you move through (rare)
 *   Instruction  Do this / Why / What Leiden does (toolbox)
 *   Exit         a door one layer deeper or across the axis
 *   Orientation  where you are; pinned while you're inside the beat
 *
 * Every hook is complete at rest. Motion (motion.js) is added on top and
 * a hook must still read correctly if it never fires.
 */
import React, { useRef } from 'react';
import IllustrationClip from '../IllustrationClip';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { useInView } from './motion';
import { useFilm } from './FilmDoor';
import Token from '../index/Token';
import useCarry from '../index/useCarry';
import './hooks.css';

/* ── Layout ──────────────────────────────────────────────────────────── */

/** One row of the grid: the stream (1–9) and, beside it, the margin (10–12). */
export function Block({ children, margin, wide = false, gap, className = '' }) {
  return (
    <div className={`board-block${gap ? ` board-block--gap-${gap}` : ''} ${className}`.trim()}>
      <div className={wide ? 'board-block__wide' : 'board-block__stream'}>{children}</div>
      {margin && <aside className="board-block__margin">{margin}</aside>}
    </div>
  );
}

/* ── 1 · Claim ───────────────────────────────────────────────────────── */

export function Claim({ universal, inPractice, size = 'screen', as: Tag = 'h2' }) {
  if (size === 'line') {
    return <p className="hook-claim hook-claim--line">{universal}</p>;
  }
  return (
    <div className="hook-claim hook-claim--screen">
      <Tag className="hook-claim__universal">{universal}</Tag>
      {inPractice && <p className="hook-claim__practice">{inPractice}</p>}
    </div>
  );
}

/* ── 2 · Proof ───────────────────────────────────────────────────────── */

/** A source as a short cite that is also the door to it. */
export function Cite({ cite }) {
  const navigate = useTransitionNavigate();
  if (!cite) return null;
  const internal = cite.href?.startsWith('/');
  return (
    <a
      className="hook-cite"
      href={cite.href}
      {...(internal
        ? { onClick: (e) => { e.preventDefault(); navigate(cite.href); } }
        : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {cite.label}
    </a>
  );
}

/**
 * A finding, as a sentence: the figure set into the words at text size
 * (tabular numerals), then the source. Never a big number on its own —
 * the site reports what the papers found, it doesn't advertise it. The
 * proof settles into place once and rests; nothing counts.
 *
 * Sizes: `line` (a sentence, margin or stream), `panel` (a larger
 * sentence with a rule, and optionally its breakdown as a small table).
 */
export function Proof({ figure, text, cite, size = 'panel', breakdown }) {
  const ref = useRef(null);
  const settled = useInView(ref, { once: true, threshold: 0.4 });
  const panel = size !== 'line';
  return (
    <div ref={ref} className={`hook-proof hook-proof--${panel ? 'panel' : 'line'}`} data-settled={settled ? 'true' : 'false'}>
      <p className="hook-proof__text">
        {figure && <span className="hook-proof__figure">{figure}</span>}
        {figure && ' '}
        {text}
      </p>
      {breakdown && (
        <table className="hook-proof__breakdown">
          <tbody>
            {breakdown.map(([n, label]) => (
              <tr key={label}>
                <td className="hook-proof__n">{n}</td>
                <td>{label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Cite cite={cite} />
    </div>
  );
}

/* ── 3 · Witness ─────────────────────────────────────────────────────── */

const timecode = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** A clip with its caption (and, where it's on film, a door to that moment). */
export function Witness({ clip, caption, film, quote, role, size = 'panel', ratio = '3 / 2' }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, threshold: 0.2 });
  const onScreen = useInView(ref, { threshold: 0.15 });
  const openFilm = useFilm();
  if (quote) {
    return (
      <figure ref={ref} className="hook-witness hook-witness--quote" data-seen={seen ? 'true' : 'false'}>
        <blockquote>{quote}</blockquote>
        {role && <figcaption>{role}</figcaption>}
      </figure>
    );
  }
  return (
    <figure ref={ref} className={`hook-witness hook-witness--${size}`} data-seen={seen ? 'true' : 'false'}>
      <div className="hook-witness__frame" style={{ aspectRatio: ratio }}>
        <IllustrationClip src={clip.video} poster={clip.still} play={onScreen} preload="metadata" className="hook-witness__media" />
      </div>
      {(caption || film != null) && (
        <figcaption className="hook-witness__caption">
          {caption}
          {film != null && openFilm && (
            <button type="button" className="hook-witness__film" onClick={() => openFilm(film)}>
              On film · {timecode(film)} ▸
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/* ── 4 · Instrument ──────────────────────────────────────────────────── */
// Made per instance — see instruments.jsx. This wrapper only marks the
// hook so it reads as one wherever it hangs.
export function Instrument({ children, label }) {
  return (
    <div className="hook-instrument" aria-label={label}>
      {children}
    </div>
  );
}

/* ── 5 · Instruction ─────────────────────────────────────────────────── */

export function Instruction({ doThis, why, leiden, size = 'panel' }) {
  return (
    <div className={`hook-instruction hook-instruction--${size}`}>
      <p><span className="hook-instruction__label">Do this</span>{doThis}</p>
      {size !== 'line' && why && <p><span className="hook-instruction__label">Why</span>{why}</p>}
      {size !== 'line' && leiden && <p><span className="hook-instruction__label">What Leiden does</span>{leiden}</p>}
    </div>
  );
}

/* ── 6 · Exit ────────────────────────────────────────────────────────── */

/**
 * A door, never "read more": it names where it goes. Internal doors slide
 * like the navbar; doors that open in place (`onOpen`) say so by an
 * arrow that points into the page; doors to another site say so too.
 */
export function Exit({ href, label, onOpen, direction = 'down', token }) {
  const navigate = useTransitionNavigate();
  const go = useCarry();
  const arrow = onOpen ? '▸' : direction === 'across' ? '↗' : '→';
  if (onOpen) {
    return (
      <button type="button" className="hook-exit" onClick={onOpen}>
        <span>{label}</span>
        <span aria-hidden="true" className="hook-exit__arrow">{arrow}</span>
      </button>
    );
  }
  const internal = href?.startsWith('/');
  // An exit to a thing (a beat, a paper, a loop part) wears its token and
  // carries it to the thing's place on the next page.
  return (
    <a
      className="hook-exit"
      href={href}
      {...(internal
        ? {
            onClick: token
              ? (e) => go(e, token, href)
              : (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); navigate(href); },
          }
        : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {token && <Token t={token} />}
      <span>{label}</span>
      <span aria-hidden="true" className="hook-exit__arrow">{internal ? arrow : '↗'}</span>
    </a>
  );
}

export function Exits({ children }) {
  return <nav className="hook-exits">{children}</nav>;
}

/* ── 7 · Orientation ─────────────────────────────────────────────────── */

/**
 * One line, pinned at the top while the reader is inside its beat or
 * section, handing over at the boundary. On scroll pages it carries a
 * thumbnail of the beat's clip and a progress line (the beat's `--p`).
 */
export function Orientation({ children, still, number }) {
  return (
    <div className="hook-orientation">
      {still && <img className="hook-orientation__still" src={still} alt="" aria-hidden="true" />}
      {number != null && <span className="hook-orientation__n">{String(number).padStart(2, '0')}</span>}
      <span className="hook-orientation__label">{children}</span>
      <span className="hook-orientation__progress" aria-hidden="true" />
    </div>
  );
}
