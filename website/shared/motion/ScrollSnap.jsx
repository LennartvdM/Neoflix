import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useViewport } from '../../lib/hooks/useViewport';
import HeroScrollCue from './HeroScrollCue';
import { useBackdropPublisher } from '../backdrop/useBackdrop';
import './section-dot-nav.css';

const NAV_FALLBACK = 60;

const BREAKPOINT_WIDTH = 1024; // Align with desktop breakpoint for Tailwind (lg)

// Single source of truth for rotation timing - all components should respect this
const ROTATION_SETTLE_MS = 400;

const ScrollSnap = ({ children }) => {
  const containerRef = useRef(null);
  const sectionsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const resizeTimeoutRef = useRef(null);
  const isResizingRef = useRef(false);
  const preservedSectionIndexRef = useRef(null); // Preserve discrete section index during rotation
  const frozenHeightRef = useRef(null); // Store pre-rotation height to freeze sections
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [isRotating, setIsRotating] = useState(false); // Track rotation state for CSS
  const { isTablet } = useViewport();
  const [currentBreakpoint, setCurrentBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth >= BREAKPOINT_WIDTH ? 'desktop' : 'tablet';
  });
  const [dotNavReady, setDotNavReady] = useState(false);
  // The dot nav tracks the active section's carousel per scroll frame.
  // Its position is written imperatively to this ref (never through
  // React state) — routing it through setState re-rendered this whole
  // component on every animation frame for the duration of every
  // scroll, and re-targeted a 0.4s `top` transition 60×/s so it never
  // settled. Tracking the real position 1:1 needs no transition at all.
  const dotNavRef = useRef(null);
  // Cached offsetTop/offsetHeight per section, refreshed alongside the
  // section list. Reading them live inside the scroll handler forced
  // ~12 synchronous layout reads per scroll event.
  const sectionMetricsRef = useRef([]);

  // The backdrop's Home y-stack translates based on this container's
  // scrollTop/clientHeight. Published imperatively from inside the
  // scroll handler below (not via a hook prop) so 60fps scroll ticks
  // don't force re-renders of this component.
  const { setHomeScrollProgress } = useBackdropPublisher();

  // Publish continuous scroll progress (scrollTop / clientHeight) to the
  // backdrop on every rAF-coalesced scroll tick. Kept separate from the
  // discrete-section listener below so progress updates don't wait on
  // React state batching, and so this effect doesn't tangle with
  // section-index logic.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let raf = 0;
    const read = () => {
      const h = container.clientHeight;
      if (h) setHomeScrollProgress(container.scrollTop / h);
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(read);
    };
    read(); // seed
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [setHomeScrollProgress]);

  const navHeight = useCallback(() => {
    if (typeof window === 'undefined') return NAV_FALLBACK;
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : NAV_FALLBACK;
  }, []);

  const snapToActiveSection = useCallback(() => {
    const container = containerRef.current;
    const activeSection = sectionsRef.current[currentIndexRef.current];
    if (!container || !activeSection) return;

    // Sections now start at y=0, no navbar offset needed
    const destination = activeSection.offsetTop;
    container.scrollTo({ top: destination, behavior: 'auto' });
  }, []);

  const refreshSections = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    sectionsRef.current = Array.from(container.querySelectorAll('section[id]'));
    sectionMetricsRef.current = sectionsRef.current.map((section) => ({
      top: section.offsetTop,
      height: section.offsetHeight,
    }));
    const count = sectionsRef.current.length;
    setSectionCount(count);

    const clamped = Math.max(0, Math.min(currentIndexRef.current, count - 1));
    currentIndexRef.current = clamped;
    setCurrentIndex(clamped);
  }, []);

  // Note: scheduleResnap removed - rotation handler is now the single source of truth
  // for scroll position restoration. This prevents racing between multiple handlers.

  const scrollToIndex = useCallback(
    (nextIndex) => {
      const container = containerRef.current;
      if (!container) return;

      const clamped = Math.max(0, Math.min(nextIndex, sectionsRef.current.length - 1));
      const target = sectionsRef.current[clamped];
      if (!target) return;

      setCurrentIndex(clamped);
      currentIndexRef.current = clamped;
      // Sections now start at y=0, no navbar offset needed
      const destination = target.offsetTop;
      container.scrollTo({ top: destination, behavior: 'auto' });
    },
    []
  );

  // UNIFIED rotation/resize handler - single source of truth for scroll preservation
  // Consolidates all resize events into one handler with consistent timing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let settleTimeout = null;
    let isHandlingRotation = false;

    const startRotation = () => {
      // Debounce rapid-fire events (resize can fire many times during rotation)
      if (isHandlingRotation) return;
      isHandlingRotation = true;

      // Store pre-rotation state
      isResizingRef.current = true;
      preservedSectionIndexRef.current = currentIndexRef.current;

      // Freeze current height BEFORE rotation changes it
      // This is the key fix: we store the actual pixel value, not a CSS variable reference
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      frozenHeightRef.current = currentHeight;
      document.documentElement.style.setProperty('--frozen-viewport-height', `${currentHeight}px`);

      // Add rotation class and set state for CSS control
      document.documentElement.classList.add('is-resizing');
      setIsRotating(true);

      // Clear any pending settle timeout
      if (settleTimeout) clearTimeout(settleTimeout);
    };

    const endRotation = () => {
      // Schedule the settle - use single consistent timing
      if (settleTimeout) clearTimeout(settleTimeout);

      settleTimeout = setTimeout(() => {
        isResizingRef.current = false;
        isHandlingRotation = false;

        // Update viewport height to new post-rotation value
        const newHeight = window.visualViewport?.height ?? window.innerHeight;
        document.documentElement.style.setProperty('--app-viewport-height', `${newHeight}px`);

        // Clear frozen height - sections can now use live value
        frozenHeightRef.current = null;
        document.documentElement.style.removeProperty('--frozen-viewport-height');

        // Remove rotation class and state
        document.documentElement.classList.remove('is-resizing');
        setIsRotating(false);

        // Refresh section measurements with new layout
        refreshSections();

        // Restore to preserved section using double rAF for layout stability
        if (preservedSectionIndexRef.current !== null) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const targetIndex = Math.max(0, Math.min(
                preservedSectionIndexRef.current,
                sectionsRef.current.length - 1
              ));
              scrollToIndex(targetIndex);
              preservedSectionIndexRef.current = null;
            });
          });
        }
      }, ROTATION_SETTLE_MS);
    };

    const handleResizeEvent = () => {
      startRotation();
      endRotation();
    };

    // Single handler for all resize-like events
    window.addEventListener('resize', handleResizeEvent, { passive: true });
    window.addEventListener('orientationchange', handleResizeEvent, { passive: true });

    // visualViewport resize (mobile Safari) - but debounce to prevent double-firing
    let vpResizeTimeout = null;
    const handleVpResize = () => {
      if (vpResizeTimeout) clearTimeout(vpResizeTimeout);
      vpResizeTimeout = setTimeout(handleResizeEvent, 16); // ~1 frame
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVpResize);
    }

    // matchMedia orientation change (most reliable for tablets)
    let orientationQuery = null;
    const handleOrientationMedia = () => {
      startRotation();
      endRotation();
    };
    if (window.matchMedia) {
      orientationQuery = window.matchMedia('(orientation: portrait)');
      if (orientationQuery.addEventListener) {
        orientationQuery.addEventListener('change', handleOrientationMedia);
      } else if (orientationQuery.addListener) {
        orientationQuery.addListener(handleOrientationMedia);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResizeEvent);
      window.removeEventListener('orientationchange', handleResizeEvent);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVpResize);
      }
      if (settleTimeout) clearTimeout(settleTimeout);
      if (vpResizeTimeout) clearTimeout(vpResizeTimeout);
      if (orientationQuery) {
        if (orientationQuery.removeEventListener) {
          orientationQuery.removeEventListener('change', handleOrientationMedia);
        } else if (orientationQuery.removeListener) {
          orientationQuery.removeListener(handleOrientationMedia);
        }
      }
    };
  }, [scrollToIndex, refreshSections]);

  // Align dot nav vertically to the carousel in sections that have one.
  // Writes the position straight to the nav element and then announces
  // it: MedicalDesktopLayout keeps SVG punch-out circles glued to the
  // arrow buttons and listens for this event instead of running its own
  // per-frame polling loop.
  const dotNavRafRef = useRef(null);
  const updateDotNavPosition = useCallback(() => {
    const nav = dotNavRef.current;
    if (!nav) return;
    const activeSection = sectionsRef.current[currentIndexRef.current];
    // Light slides (intro, showcase, world map) mark themselves with
    // data-nav-tone="dark"; everything else is footage, where the nav is
    // white. Without this the nav vanished white-on-white on light slides.
    nav.dataset.tone = activeSection?.querySelector('[data-nav-tone]')?.dataset.navTone || 'light';
    const target = activeSection?.querySelector('[data-dot-nav-target]');
    const rect = target?.getBoundingClientRect();
    if (rect && rect.height !== 0) {
      nav.style.top = `${rect.top + rect.height / 2}px`;
    } else {
      nav.style.top = '50%';
    }
    window.dispatchEvent(new CustomEvent('scrollsnap:dotnav-sync'));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    refreshSections();

    const onScroll = () => {
      // Don't update during resize/orientation changes
      if (isResizingRef.current) return;

      // Determine which discrete section (0-4) is most visible, from
      // the offsets cached in refreshSections — no layout reads here.
      const viewportCenter = container.scrollTop + (container.clientHeight / 2);

      let closestIndex = 0;
      let closestDistance = Infinity;

      sectionMetricsRef.current.forEach((metrics, idx) => {
        if (!metrics) return;
        const sectionCenter = metrics.top + (metrics.height / 2);
        const distance = Math.abs(viewportCenter - sectionCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = idx;
        }
      });

      // Only update if we've actually changed sections (discrete state change)
      if (closestIndex !== currentIndexRef.current) {
        setCurrentIndex(closestIndex);
        currentIndexRef.current = closestIndex;
      }

      // Update dot nav position on scroll (carousel position changes as sections scroll)
      if (dotNavRafRef.current) cancelAnimationFrame(dotNavRafRef.current);
      dotNavRafRef.current = requestAnimationFrame(updateDotNavPosition);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll, { passive: true });
  }, [children, refreshSections, updateDotNavPosition]);

  // Restore the saved section synchronously during commit. Using
  // useLayoutEffect (not useEffect + setTimeout) is intentional: this
  // runs inside the view-transition's DOM-commit phase, BEFORE the NEW
  // snapshot is captured. If we scrolled asynchronously after paint,
  // the NEW snapshot would freeze the container at scrollTop=0 and the
  // visible jump to the saved section would animate underneath the
  // horizontal slide (the "V2 is also visible" bug).
  //
  // refreshSections() populates sectionsRef/currentIndexRef before we
  // read them — children render into the container above, so their DOM
  // is already present when this effect fires.
  useLayoutEffect(() => {
    const savedId = sessionStorage.getItem('scrollsnap:return-section');
    if (!savedId) return;

    const container = containerRef.current;
    const target = document.getElementById(savedId);
    if (container && target) {
      refreshSections();
      const destination = target.offsetTop;
      container.scrollTo({ top: destination, behavior: 'auto' });
      const idx = sectionsRef.current.findIndex((section) => section?.id === savedId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        currentIndexRef.current = idx;
      }
    }

    sessionStorage.removeItem('scrollsnap:return-section');
  }, [refreshSections]);

  // Initial viewport height setup only - resize is handled by unified rotation handler
  useEffect(() => {
    const setViewportHeight = () => {
      // Skip during rotation - the rotation handler manages height during transitions
      if (isResizingRef.current) return;

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--app-viewport-height',
        `${viewportHeight}px`
      );
    };

    const detectBreakpoint = () => {
      const width = window.innerWidth;
      return width >= BREAKPOINT_WIDTH ? 'desktop' : 'tablet';
    };

    // Breakpoint tracking only - no scroll manipulation
    const handleBreakpointChange = () => {
      // Skip during rotation - will be handled when rotation settles
      if (isResizingRef.current) return;

      const next = detectBreakpoint();
      if (next !== currentBreakpoint) {
        setCurrentBreakpoint(next);
      }
    };

    // Initial setup
    setViewportHeight();
    refreshSections();

    // Light listener just for breakpoint state (no scroll manipulation)
    window.addEventListener('resize', handleBreakpointChange, { passive: true });

    return () => {
      window.removeEventListener('resize', handleBreakpointChange);
    };
  }, [currentBreakpoint, refreshSections]);

  useEffect(() => {
    // Measure immediately + after a delay (for lazy-loaded/animated
    // sections). dotNavReady is a dependency because the nav element
    // mounts late — the first write has to wait for its ref to exist.
    updateDotNavPosition();
    const delayId = setTimeout(updateDotNavPosition, 500);
    return () => clearTimeout(delayId);
  }, [currentIndex, dotNavReady, updateDotNavPosition]);

  // Listen for home button click to scroll to top
  useEffect(() => {
    const handleGoToTop = () => scrollToIndex(0);
    window.addEventListener('scrollsnap:go-to-top', handleGoToTop);
    return () => window.removeEventListener('scrollsnap:go-to-top', handleGoToTop);
  }, [scrollToIndex]);

  // Delay-mount dot nav — invisible (white-on-white) on intro slide anyway
  useEffect(() => {
    if (currentIndex > 0) { setDotNavReady(true); return; }
    const id = setTimeout(() => setDotNavReady(true), 600);
    return () => clearTimeout(id);
  }, [currentIndex]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="relative w-full overflow-y-auto"
        data-current-index={currentIndex}
        data-section-count={sectionCount}
        data-rotating={isRotating ? 'true' : 'false'}
        style={{
          height: 'var(--app-viewport-height, 100svh)',
          width: '100%',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'none',
          // NO scrollPaddingTop - sections start at y=0 consistently
          // Content within sections must account for navbar offset
          // CRITICAL: Disable scroll-snap-type during rotation to prevent oscillation
          // Stays `y mandatory` for crisp snapping between slides 1-4. The
          // footer has scroll-snap-align: end so it's a reachable snap point
          // (its bottom aligns to viewport bottom) without becoming its own
          // full slide — user sees slide 4 tail + footer together.
          scrollSnapType: isRotating ? 'none' : 'y mandatory',
          scrollBehavior: isRotating ? 'auto' : 'smooth',
          // Prevent layout shifts during orientation changes
          willChange: 'scroll-position',
        }}
      >
        {children}

        {/* HeroScrollCue: positioned inside the scroll container so it scrolls with content.
            Absolutely positioned at the bottom of the first section (viewport height). */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'var(--frozen-viewport-height, var(--app-viewport-height, 100dvh))',
          pointerEvents: 'none',
        }}>
          <HeroScrollCue onClick={() => scrollToIndex(1)} />
        </div>
      </div>

      {/* ── SectionDotNav: right-side vertical dots + up/down arrows ──
          Styles: section-dot-nav.css. */}
      {dotNavReady && (<>

      <nav
        ref={dotNavRef}
        className="scrollsnap-dotnav fixed right-7 z-50 flex flex-col items-center"
        style={{
          gap: '10px',
          // `top` is written imperatively by updateDotNavPosition; it
          // tracks the carousel 1:1 per scroll frame, so it needs no
          // transition (a transition retargeted every frame never
          // settles and forces layout each tick).
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <button
          type="button"
          className={`arrow-btn up${currentIndex <= 0 ? ' arrow-hidden' : ''}`}
          onClick={() => scrollToIndex(currentIndex - 1)}
          aria-label="Scroll up"
        >
          <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
        </button>

        <div className="flex flex-col items-center">
          {Array.from({ length: sectionCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`arrow-dot${i === currentIndex ? ' active' : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to section ${i + 1}`}
              aria-current={i === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className={`arrow-btn down${currentIndex >= sectionCount - 1 ? ' arrow-hidden' : ''}`}
          onClick={() => scrollToIndex(currentIndex + 1)}
          aria-label="Scroll down"
        >
          {/* Keyed on the slide so its one-shot "there's more below"
              nudge replays on each arrival, then stays still. */}
          <svg key={currentIndex} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      </nav>
      </>)}

    </div>
  );
};

export default ScrollSnap;
