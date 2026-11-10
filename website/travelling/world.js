/**
 * world.js — the rules of the travelling interface, without any drawing.
 *
 * Where a place is (its address), what stands around the place you are
 * on (`around`), and where on the stage each of those stands (`SLOTS`).
 * Travelling.jsx draws what this returns. Node-safe.
 *
 * Two axes, one meaning each, so a neighbour's reason is always legible:
 *   left / right  the same question in another unit
 *   up / down     the same unit on another question
 */

import { QUESTIONS, UNITS } from './places.js';

// The stage is drawn at this size and scaled as one piece.
export const STAGE = { w: 1440, h: 900 };

// Where each role stands, in stage coordinates.
export const SLOTS = {
  subject: { x: 430, y: 176, w: 520, h: 430 },
  near: { x: 986, y: 176, w: 300, h: 250 },
  far: { x: 1306, y: 206, w: 230, h: 190 }, // cropped by the stage's edge
  passed: { x: 286, y: 236, w: 196, h: 300 }, // half behind the subject
  up: { x: 430, y: 84, w: 340, h: 76 },
  down: { x: 430, y: 632, w: 300, h: 84 },
  downFar: { x: 446, y: 752, w: 262, h: 70 },
  slip: [
    { x: 736, y: 580, w: 100, h: 96 },
    { x: 846, y: 580, w: 100, h: 96 },
  ],
  film: { x: 986, y: 446, w: 300, h: 250 },
  edge: { x: 1000, y: 722, w: 330, h: 90 },
};

// One step of the world, in stage pixels: how far a card is carried in
// or out when you move.
export const PITCH = { x: 380, y: 250 };

/**
 * Depth, by staying. Each level names what comes up and after how long
 * (ms since arriving). Moving resets to the first.
 *
 * The timings are guesses that have not been felt on a real trackpad
 * yet; tune them here.
 */
export const DEPTHS = [
  { name: 'Next door', after: 0 }, // the ways on
  { name: 'Further on', after: 1200 }, // two steps ahead
  { name: 'Underneath', after: 3000 }, // what it rests on, the film moment
  { name: 'Where it stops', after: 5200 }, // what nobody has said
];

// Outward tethers, by what they hang from. Each runs off the stage.
export const TETHERS = {
  near: 'M1286 300 Q1380 292 1470 252',
  up: 'M770 122 Q960 110 1040 -24',
  down: 'M580 716 Q556 810 600 930',
  edge: 'M1330 768 Q1400 800 1470 870',
};

export const inWorld = (q, u) => q >= 0 && q < QUESTIONS.length && u >= 0 && u < UNITS.length;
export const cellOf = (q, u) => QUESTIONS[q].cells[u];
export const placeKey = (q, u) => `c:${q}:${u}`;

/**
 * Everything on the stage for the place (q, u) at a depth: the subject
 * and what has come up around it. A cell keeps its key whichever role it
 * is in, which is what lets one element travel from slot to slot.
 */
export function around(q, u, depth) {
  const question = QUESTIONS[q];
  const cell = cellOf(q, u);
  const lastQ = QUESTIONS.length - 1;
  const lastU = UNITS.length - 1;
  const out = [];
  const place = (role, slot, pq, pu, order, dir) =>
    out.push({ key: placeKey(pq, pu), role, slot, q: pq, u: pu, order, dir });

  place('subject', SLOTS.subject, q, u, 0);
  if (u < lastU) place('near', SLOTS.near, q, u + 1, 1);
  if (u > 0) place('passed', SLOTS.passed, q, u - 1, 2);
  if (q > 0) place('ques', SLOTS.up, q - 1, u, 3, 'up');
  if (q < lastQ) place('ques', SLOTS.down, q + 1, u, 4, 'down');
  if (depth >= 2) {
    if (u < lastU - 1) place('far', SLOTS.far, q, u + 2, 5);
    if (q < lastQ - 1) place('qfar', SLOTS.downFar, q + 2, u, 6);
  }
  if (depth >= 3) {
    question.under.slice(0, SLOTS.slip.length).forEach((source, i) => {
      out.push({ key: `s:${q}:${i}`, role: 'slip', slot: SLOTS.slip[i], source, order: 7 + i });
    });
    if (cell?.film) out.push({ key: `f:${q}:${u}`, role: 'film', slot: SLOTS.film, film: cell.film, order: 9 });
  }
  if (depth >= 4) out.push({ key: `e:${q}`, role: 'edge', slot: SLOTS.edge, text: question.edge, order: 10 });
  return out;
}

/** Is (i, j) one of the ways on from (q, u) at this depth? For the matrix. */
export function isNeighbour(i, j, q, u, depth) {
  const dj = Math.abs(j - u);
  const di = Math.abs(i - q);
  return (
    (i === q && (dj === 1 || (dj === 2 && j > u && depth >= 2))) ||
    (j === u && (di === 1 || (di === 2 && i > q && depth >= 2)))
  );
}

// ── addresses: a place can be linked to ─────────────────────────────
// /travelling?q=the-staffs-say&unit=vienna

export function addressOf(q, u) {
  return `?q=${QUESTIONS[q].slug}&unit=${UNITS[u].slug}`;
}

/** The place a query string names, or null if it names none. */
export function placeAt(search) {
  const params = new URLSearchParams(search || '');
  const q = QUESTIONS.findIndex((x) => x.slug === params.get('q'));
  const u = UNITS.findIndex((x) => x.slug === params.get('unit'));
  if (q < 0 && u < 0) return null;
  return { q: Math.max(q, 0), u: Math.max(u, 0) };
}

// Where a reader starts when the address names no place: a question all
// four units answer, each differently.
export const START = { q: 2, u: 0 };

/**
 * One gesture is one step. Wheel and trackpad deltas are summed until
 * `threshold` px, then one step is taken on the dominant axis, and
 * nothing more until the wheel has been quiet for `gap` ms, so inertia
 * does not carry a reader two places. Guesses, like the timings above.
 */
export const WHEEL = { threshold: 40, gap: 160 };
