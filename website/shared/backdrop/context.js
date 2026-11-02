import { createContext } from 'react';

/**
 * Internal context for the backdrop module. Consumers never import
 * this directly — they use the hooks from useBackdrop.js. The value
 * is a stable API object populated by BackdropProvider.
 *
 * Shape (all setters are stable references — their identity never
 * changes across renders):
 *
 *   setTarget(id, target)        — publish or clear a target by id.
 *                                  target: null | { kind: 'video',
 *                                  deck: string[], topIdx: number }
 *   setHomeScrollProgress(p)     — publish Home's scroll container
 *                                  progress in cell-heights (0 at top,
 *                                  1 = one cell down, etc.)
 *   setBands(id, bands)          — publish or clear the tonal bands
 *                                  drawn over a cell's footage (see
 *                                  useBackdropBands).
 */
export const BackdropContext = createContext({
  setTarget: () => {},
  setHomeScrollProgress: () => {},
  setBands: () => {},
});
