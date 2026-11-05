/**
 * The session film, cut up (system/content/session-film.js).
 *
 *   Moment       one cut, carried by a page whose subject it shows: the
 *                lines said, who said them, and a way to play the film
 *                from that second. A film quote is the moment, so it's
 *                dark like the films.
 *   Transcript   the whole film as a page: its scenes (each with a framed
 *                still), every line with its
 *                time (click to play from there), the cuts other pages
 *                carry marked.
 */
import React, { useEffect, useRef, useState } from 'react';
import { SESSION_FILM, SCENES, LINES, MOMENTS, FRAMES, frameSrc, linesOf } from '../system/content/session-film';
import { mmss } from '../system/library';
import { assetUrl } from '../lib/utils/assetUrl';

/**
 * A keyframe. Feathered in a moment (it dissolves into the dark card and
 * the words sit on it); framed in the transcript (a record of the scene).
 */
function Still({ n, className }) {
  const f = FRAMES[n];
  if (!f) return null;
  return <img className={className} src={assetUrl(frameSrc(n))} alt={f.alt} width="720" height="406" loading="lazy" decoding="async" />;
}

/** One player for the film, opened at a second. */
function usePlayer() {
  const [at, setAt] = useState(null);
  const ref = useRef(null);
  useEffect(() => { if (at != null) ref.current?.showModal(); }, [at]);
  const dialog = at == null ? null : (
    <dialog ref={ref} className="filmdialog" onClose={() => setAt(null)} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <iframe title={SESSION_FILM.title} src={`${SESSION_FILM.src}&autoplay=1#t=${at}s`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      <button type="button" className="filmdialog__close" onClick={() => ref.current.close()} aria-label="Close">✕</button>
    </dialog>
  );
  return [setAt, dialog];
}

function Line({ l, onPlay }) {
  return (
    <p className="fline" data-who={l.who === 'vo' ? 'vo' : l.who === 'footage' ? 'footage' : 'person'}>
      {onPlay && <button type="button" className="fline__t" onClick={() => onPlay(l.t)} aria-label={`Play from ${mmss(l.t)}`}>{mmss(l.t)}</button>}
      {l.who !== 'vo' && <b>{l.who === 'footage' ? 'On the recording' : l.who}</b>}
      <span>{l.text}</span>
    </p>
  );
}

export function Moment({ id }) {
  const m = MOMENTS.find((x) => x.id === id);
  const [play, dialog] = usePlayer();
  if (!m) return null;
  // On a page, the people speak; the narrator is left to the film.
  const lines = linesOf(m).filter((l) => l.who !== 'vo');
  return (
    <figure className="moment">
      <Still n={m.frame} className="moment__still" />
      <figcaption>
        <span className="moment__tag">In the session film · {mmss(m.from)}</span>
        <strong>{m.title}</strong>
      </figcaption>
      <div className="moment__lines">{lines.map((l, i) => <Line key={i} l={l} />)}</div>
      <button type="button" className="moment__play" onClick={() => play(m.from)}>▶ Watch this moment</button>
      {dialog}
    </figure>
  );
}

export function Transcript() {
  const [play, dialog] = usePlayer();
  const cut = (t) => MOMENTS.find((m) => t >= m.from && t < m.to && m.id !== 'why');
  return (
    <div className="pg pg--transcript">
      <header className="phead">
        <span className="phead__num">▶</span>
        <h2>The session film, transcribed</h2>
        <span className="phead__meta">{mmss(SESSION_FILM.length)}</span>
      </header>
      <div className="tr">
        <p className="eyebrow">Neoflix · Record, Reflect, Refine</p>
        <h1 className="title">Ruben’s MIST procedure, from the head camera to session #20.</h1>
        <p className="prose prose--lead">The film the six clips are cut from. Every line, with its time: click a time to play from there. The stretches marked are the moments other pages quote.</p>
        <p className="rd__source">{SESSION_FILM.source}</p>
        <button type="button" className="moment__play moment__play--light" onClick={() => play(0)}>▶ Play the whole film</button>
        {SCENES.map((s, i) => (
          <section key={s.id} className="tr__scene">
            <div className="tr__head">
              <button type="button" className="tr__frame" onClick={() => play(s.from)} aria-label={`Play ${s.name} from ${mmss(s.from)}`}><Still n={s.frame} /></button>
              <div>
                <h3 className="rd__h"><em>{i + 1}</em>{s.name}<small>{mmss(s.from)}</small></h3>
                <p className="tr__says">{s.says}</p>
              </div>
            </div>
            {LINES.filter((l) => l.t >= s.from && l.t < s.to).map((l, j) => {
              const m = cut(l.t);
              return <div key={j} className="tr__row" data-cut={m ? m.id : undefined} title={m ? `Quoted elsewhere: ${m.title}` : undefined}><Line l={l} onPlay={play} /></div>;
            })}
          </section>
        ))}
      </div>
      {dialog}
    </div>
  );
}
