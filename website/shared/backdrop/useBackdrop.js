import { useContext, useEffect } from 'react';
import { BackdropContext } from './context';

/**
 * Public API for publishing into the backdrop.
 *
 * Two shapes, matched to how callers actually produce their data:
 *
 *   useBackdropTarget(id, target) — declarative. Each render publishes
 *     the current target for this id. Passing `target === null`
 *     actively clears it; unmount does NOT clear (see note below).
 *     Use for state-driven contributions (a medical section publishes
 *     its current carousel index; a blog page publishes its active
 *     scroll-spy section). Re-publishes only when the target's shape
 *     actually changes, so inline object literals don't thrash.
 *
 *   useBackdropPublisher() — imperative. Returns stable setter functions
 *     for callers that publish from a scroll listener or a rAF tick and
 *     must not re-render on every update. ScrollSnap uses this to push
 *     Home's scroll progress from its existing scroll handler without
 *     re-rendering itself on every frame.
 *
 * Why unmount doesn't clear: route transitions run two concurrent
 * trees through AnimatePresence — the exiting page and the entering
 * page are both mounted for the slide's duration. When both publish to
 * the same id ('blog' for /neoflix, /publications, /contact), the new
 * page's mount-effect fires once and the old page's unmount-cleanup
 * fires at slide end. If cleanup nulled, it would wipe the new page's
 * value, leaving the backdrop blank. Separately, the BackdropProvider
 * crossfades for 2s but the page unmounts at ~0.45s — the exiting
 * HomeBackdrop still renders for the remaining 1.55s and would lose
 * its medical targets mid-fade. Both are fixed by leaving stale values
 * alone; the next publisher overwrites on mount, and callers that want
 * to actively blank a cell pass `target === null` explicitly.
 */

export function useBackdropTarget(id, target) {
  const { setTarget } = useContext(BackdropContext);
  // Break the target into primitive deps so callers can pass an inline
  // object literal on every render without re-firing the effect. Deck
  // arrays are stable references imported from decks.js, so reference
  // identity is the right comparison for the deck itself.
  const kind = target?.kind ?? null;
  const deck = target?.deck ?? null;
  const topIdx = target?.topIdx ?? null;
  useEffect(() => {
    if (kind === null) {
      setTarget(id, null);
    } else {
      setTarget(id, { kind, deck, topIdx });
    }
  }, [id, kind, deck, topIdx, setTarget]);
}

/**
 * useBackdropBands(id, bands) — tonal bands painted INSIDE a backdrop
 * cell, over its footage.
 *
 * Why they live here and not in the page: a mix-blend-mode only blends
 * with what is painted beneath it in the same isolated group, and the
 * page sits in a different one from this fixed backdrop layer (the home
 * sections carry `contain: content` and scroll inside a will-change
 * container). A `screen` band drawn in the page therefore blends with
 * transparency and renders as a flat translucent fill — which is what the
 * 2024 story bands did without anyone noticing. Drawn in the cell, a band
 * genuinely multiplies / soft-lights the moving footage.
 *
 * `bands`: null | { visible: boolean, items: Band[] } where each Band is
 *   { id, role, top, height, left, right, inner: 'left' | 'right' }
 * in px relative to the viewport-sized cell (the home sections are
 * viewport-sized too, so section coordinates can be passed straight
 * through). `role` picks the look from backdrop.css; `inner` is the end
 * that gets rounded — the other end runs off the screen edge. A change
 * of `top` alone animates, so a band can travel.
 */
export function useBackdropBands(id, bands) {
  const { setBands } = useContext(BackdropContext);
  const key = bands ? JSON.stringify(bands) : null;
  useEffect(() => {
    setBands(id, key ? JSON.parse(key) : null);
  }, [id, key, setBands]);
  // Unlike targets (see the note above), bands clear on unmount: each
  // publisher owns its id outright (blogBandsId gives every blog page its
  // own), so there is no successor to wipe out — and a left-over set of
  // visible bands would flash on the next visit before the new page
  // publishes its own.
  useEffect(() => () => setBands(id, null), [id, setBands]);
}

/**
 * The bands id for one blog-style page ('neoflix' | 'publications').
 * Each page publishes under its own id: both pages are mounted while one
 * slides out and the other in, and a shared id would let the departing
 * page's last publish overwrite the arriving one's.
 */
export function blogBandsId(page) {
  return `blog-${page}`;
}

export function useBackdropPublisher() {
  return useContext(BackdropContext);
}
