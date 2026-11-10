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
// The places keep their distance from the subject (some 50 to 80 px), so
// a stretch of track shows between any two of them. Move a slot and the
// line through its middle (TRACK, below) has to move with it.
export const SLOTS = {
  subject: { x: 430, y: 200, w: 480, h: 400 },
  near: { x: 990, y: 176, w: 270, h: 250 },
  far: { x: 1330, y: 206, w: 230, h: 190 }, // cropped by the stage's edge
  passed: { x: 286, y: 236, w: 196, h: 300 }, // half behind the subject
  up: { x: 430, y: 84, w: 340, h: 70 },
  down: { x: 430, y: 650, w: 270, h: 80 },
  downFar: { x: 446, y: 780, w: 230, h: 70 },
  slip: [
    { x: 700, y: 574, w: 100, h: 96 },
    { x: 810, y: 574, w: 100, h: 96 },
  ],
  film: { x: 990, y: 450, w: 270, h: 250 },
  edge: { x: 1000, y: 730, w: 330, h: 90 },
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

// The depth at which the place you are on comes apart into its parts:
// with what it rests on, because both are what the answer is made of.
export const SEAMS_OPEN_AT = 3;

/**
 * The tracks: the graph around the place you are on, drawn as broad
 * dashed lines. They are what you travel along. One line runs through
 * the units (the row), one through the questions (the column); each
 * passes through the middle of every slot on it, so a card moving from
 * slot to slot moves along its line, and what comes up when you stay
 * comes out along a line too.
 *
 * A line runs on, off the stage, only where the world does: at the last
 * unit there is nothing to the right, so no line goes there. Two spurs
 * leave the subject: to the film moment, and to what nobody has said,
 * where the line stops on the stage (the one place a track ends).
 *
 * Row segments are written left to right and column segments top to
 * bottom, so one dash offset per axis makes every dash flow the same way.
 */
const TRACK = {
  // row
  passed: 'M262 388 L670 400',
  near: 'M670 400 C860 400 950 301 1125 301',
  beyondNear: 'M1125 301 L1480 298',
  // column
  beyondUp: 'M640 -30 C615 30 600 70 600 119',
  up: 'M600 119 C600 230 670 290 670 400',
  down: 'M670 400 C670 520 565 590 565 690',
  beyondDown: 'M565 690 C565 790 565 860 590 930',
  // spurs
  film: 'M670 400 C880 430 990 520 1125 575',
  edge: 'M670 400 C740 610 870 740 978 762',
};
// Where the edge spur stops.
export const TERMINUS = { x: 978, y: 762 };

// How far the dashes flow per step, per axis: about one step of the world.
export const DASH_FLOW = { row: 372, column: 248 };

/** The lines on the stage for the place (q, u) at a depth. */
export function tracks(q, u, depth) {
  const lastQ = QUESTIONS.length - 1;
  const lastU = UNITS.length - 1;
  const out = [];
  const line = (key, axis) => out.push({ key, axis, d: TRACK[key] });
  if (u > 0) line('passed', 'row');
  if (u < lastU) line('near', 'row');
  if (u < lastU - 1) line('beyondNear', 'row');
  if (q > 1) line('beyondUp', 'column');
  if (q > 0) line('up', 'column');
  if (q < lastQ) line('down', 'column');
  if (q < lastQ - 1) line('beyondDown', 'column');
  if (depth >= 3 && cellOf(q, u)?.film) line('film', null);
  if (depth >= 4) line('edge', null);
  return out;
}

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
