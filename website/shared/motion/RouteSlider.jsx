import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTransitionState } from './TransitionContext';
import { getNavIndexForPath } from '../../lib/hooks/useNavIndex';
import useTabletLayout from '../../lib/hooks/useTabletLayout';

/**
 * RouteSlider — scoped page-transition wrapper.
 *
 * Replaces RouteTransition.jsx (which leaned on the browser's View
 * Transitions API). This version is a plain, subtree-local Framer
 * Motion animation: the navbar, backdrop, and anything else outside
 * this wrapper keep rendering live through the slide.
 *
 * Pattern: give each rendered Routes instance a key tied to
 * `location.pathname`. AnimatePresence holds onto the outgoing child
 * with its previously-rendered content until its exit animation
 * completes, while the incoming child mounts and plays its entry
 * animation. We use `mode="sync"` so both run simultaneously — the old
 * slides out one side while the new slides in from the other, matching
 * the spec the old CSS keyframes were implementing.
 *
 * Direction comes from TransitionContext, published by
 * useTransitionNavigate right before navigation. `isSliding` flips to
 * true when a new child mounts and back to false on `onExitComplete`;
 * page-level internal fades can gate on it to avoid firing their mount
 * animations during the slide.
 *
 * Each route wrapper is position:absolute inset:0 inside a
 * position:fixed container — that pins the animated rect to the
 * viewport so old and new stack cleanly while transforming on X.
 */

const SLIDE_DURATION = 0.45;
const EASE = [0.4, 0, 0.2, 1];

export default function RouteSlider({ children }) {
  const location = useLocation();
  const { direction, isSliding, setIsSliding } = useTransitionState();
  const { width } = useTabletLayout();
  const navSurface = width > 0 && width < 600 ? 'mobile' : 'desktop';

  // Capture the direction at the moment each slide starts. Framer Motion
  // reads variant args at animation start, and `direction` in context
  // can change mid-flight if the user clicks another nav link before
  // the current slide finishes — we want each running slide to keep
  // its own direction.
  const directionAtStart = useRef(direction);
  directionAtStart.current = direction;

  const rendered =
    typeof children === 'function' ? children(location) : children;

  // Key the animated wrapper on navbar slot, not the raw pathname. Pages
  // that share a slot (e.g. every /toolbox/:slug route) thus share a key,
  // so intra-slot navigation is a plain prop update on the child Routes
  // rather than an AnimatePresence swap. That kills the stale-slide flash
  // on sidebar clicks inside the toolbox and preserves per-route state
  // (sidebar scroll position, open/collapsed sections, etc).
  const slotKey = getNavIndexForPath(location.pathname, navSurface);

  // Flip sliding on whenever a transition is starting. AnimatePresence's
  // `onExitComplete` flips it back off.
  useEffect(() => {
    if (direction !== 0) {
      setIsSliding(true);
    }
  }, [location.pathname, direction, setIsSliding]);

  // prefers-reduced-motion swaps pages instantly instead of sliding a
  // full viewport of content sideways — the site's largest motion.
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion
    ? {
        enter: { x: 0 },
        center: { x: 0, transition: { duration: 0 } },
        exit: { x: 0, transition: { duration: 0 } },
      }
    : {
        enter: (dir) => ({
          x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
        }),
        center: {
          x: 0,
          transition: { duration: SLIDE_DURATION, ease: EASE },
        },
        exit: (dir) => ({
          x: dir > 0 ? '-100%' : dir < 0 ? '100%' : 0,
          transition: { duration: SLIDE_DURATION, ease: EASE },
        }),
      };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <AnimatePresence
        mode="sync"
        initial={false}
        custom={directionAtStart.current}
        onExitComplete={() => setIsSliding(false)}
      >
        <motion.div
          key={slotKey}
          // Portal target for page-level overlays that must escape a
          // subtree's stacking context but still belong to the page —
          // the docs sidebar's active-row tab uses this. Anchoring them
          // here means they slide out with the page instead of hanging
          // over the incoming one (see DocsSidebar.jsx).
          data-route-slide=""
          custom={directionAtStart.current}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{
            position: 'absolute',
            inset: 0,
            // Only promote to a compositor layer DURING the slide. Leaving
            // will-change:transform on permanently kept the entire page's
            // content subtree composited at rest, which drops subpixel/
            // ClearType anti-aliasing and renders all text faintly soft —
            // a site-wide "veiled" look. Releasing it to `auto` when idle
            // lets text re-render crisp.
            willChange: isSliding ? 'transform' : 'auto',
          }}
        >
          {rendered}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
