/**
 * A page on the board. Scroll pages (`tone="dark"`) sit on the footage:
 * the backdrop shows the blurred twin of whichever beat is in view, so a
 * beat lives inside its own clip. Still pages (`tone="light"`) paint their
 * own calm page colour and have no choreography (blueprint, "The loop
 * stands still").
 *
 * Renders inside RouteSlider's fixed wrapper, so it owns its scroll
 * container. Lands on `scrollTo` or the URL hash at rest — a beat opened
 * from a search result arrives settled, not mid-animation.
 */
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import useScrollSpy from '../../lib/hooks/useScrollSpy';
import { useBackdropTarget } from '../backdrop/useBackdrop';
import { BLOG_DECK, blogIdxForSection } from '../backdrop/decks';
import { FilmProvider } from './FilmDoor';
import './board.css';

export default function BoardPage({ tone = 'dark', sectionIds = [], scrollTo, title, activeId, wide = false, children }) {
  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const target = scrollTo || (typeof window !== 'undefined' ? window.location.hash.slice(1) : '');
    let top = 0;
    const el = target && document.getElementById(target);
    if (el) top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top, behavior: 'instant' });
  }, [scrollTo]);

  // `activeId` (e.g. the beat being looked at on a board page) overrides
  // the scroll position as what the backdrop shows.
  const spied = useScrollSpy(sectionIds, 140, scrollRef);
  const active = activeId || spied;
  const idx = tone === 'dark' ? blogIdxForSection(active) : -1;
  useBackdropTarget('blog', idx >= 0 ? { kind: 'video', deck: BLOG_DECK, topIdx: idx } : null);

  // Overscroll and the slide's edges show the page colour, not white.
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = tone === 'light' ? 'var(--cool-page)' : '#1c3424';
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, [tone]);

  return (
    <div className="board board__scroller" data-tone={tone} ref={scrollRef}>
      {tone === 'dark' && <div className="board__scrim" aria-hidden="true" />}
      <FilmProvider>
        <main className={`board__page${wide ? ' board__page--wide' : ''}`}>
          {title && <h1 className="sr-only">{title}</h1>}
          {children}
        </main>
      </FilmProvider>
    </div>
  );
}
