/**
 * The film — the one witness reached by a door instead of hung in the
 * stream (blueprint, "Witness"). A door opens it in place, at the second
 * it names; closing returns the reader exactly where they were, because
 * nothing underneath moved.
 *
 * The overlay portals into the route slide, not document.body (CLAUDE.md
 * rule 11), so it leaves with the page during a route transition.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SHOWCASE_FILM_SRC } from '../showcaseFilm';

const FilmContext = createContext(null);

/** `open(seconds)` — or null outside a FilmProvider. */
export function useFilm() {
  return useContext(FilmContext);
}

export function FilmProvider({ children }) {
  const [at, setAt] = useState(null);
  const [host, setHost] = useState(null);
  const open = useCallback((seconds = 0) => setAt(seconds), []);
  const close = useCallback(() => setAt(null), []);

  useEffect(() => {
    if (at == null) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [at, close]);

  return (
    <FilmContext.Provider value={open}>
      <span ref={(el) => setHost(el?.closest('[data-route-slide]') || null)} hidden />
      {children}
      {at != null &&
        host &&
        createPortal(
          <div className="film-door" role="dialog" aria-modal="true" aria-label="Neoflix film" onClick={close}>
            <div className="film-door__frame" onClick={(e) => e.stopPropagation()}>
              <iframe
                title="Neoflix — six minutes on the unit in Leiden"
                src={`${SHOWCASE_FILM_SRC}&autoplay=1#t=${Math.max(0, at)}s`}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            </div>
            <button type="button" className="film-door__close" onClick={close}>
              Back to where you were ✕
            </button>
          </div>,
          host
        )}
    </FilmContext.Provider>
  );
}
