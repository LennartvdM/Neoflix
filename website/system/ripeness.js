/**
 * How ripe the reader is — how much of the library they're ready for.
 *
 * The site still has its three tiers: the introduction (the homepage
 * film), the elaboration (/neoflix), the toolbox (the library). The
 * library's interface is present during the first two from the start,
 * small, and assembles itself as the reader shows they're ready for more:
 *
 *   seen      films watched in the intro or read in the elaboration
 *   hurry     moving faster than the story (skipping a section within a
 *             second, scrolling fast): they want to get somewhere
 *   intent    reaching for the interface itself (hovering, opening it)
 *   depth     how far into the elaboration they've read
 *   library   they've been in the library before: fully ripe
 *
 * Ripeness only grows; it's kept in this browser (localStorage, no
 * cookie, nothing sent). Every level has its reasons in words, shown when
 * "Assembly" is on — the same honesty as the library's modules.
 */
import { useSyncExternalStore } from 'react';
import { visit } from './state';

const KEY = 'neoflix:ripeness';
const EMPTY = { seen: [], hurry: 0, intent: 0, depth: 0, introDone: false, library: false, open: false, peak: 0 };
const listeners = new Set();
let state = null;

function load() {
  if (state) return state;
  try { state = { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { state = { ...EMPTY }; }
  return state;
}
function save(next) {
  next.peak = Math.max(next.peak || 0, computeLevel(next).level);
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* in memory only */ }
  listeners.forEach((l) => l());
}
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export const LEVELS = ['arrived', 'curious', 'oriented', 'ready'];

/** Score → level, with the reasons for it. Pure. */
export function computeLevel(s) {
  const reasons = [];
  if (s.library) reasons.push('you have been in the library before');
  if (s.seen.length) reasons.push(`you have seen ${s.seen.length} of the 6 films`);
  if (s.hurry) reasons.push(s.hurry > 1 ? 'you are moving faster than the story' : 'you skipped ahead');
  if (s.intent) reasons.push('you reached for the library');
  if (s.depth >= 0.25) reasons.push(`you have read ${Math.round(s.depth * 100)}% of the argument`);
  if (s.introDone) reasons.push('you reached the end of the introduction');
  const score = s.seen.length + 2 * s.hurry + 2 * s.intent + (s.depth >= 0.25 ? 2 : 0) + (s.depth >= 0.6 ? 2 : 0) + (s.introDone ? 3 : 0);
  let level = score >= 7 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
  if (s.library || s.open) level = 3;
  level = Math.max(level, s.peak || 0);
  return { level, reasons, score };
}

export function useRipeness() {
  const s = useSyncExternalStore(subscribe, load, () => EMPTY);
  return { ...s, ...computeLevel(s) };
}

export function noteSeen(filmId) {
  const s = load();
  if (s.seen.includes(filmId)) return;
  visit(`film:${filmId}`); // a film watched in the intro is on your trail in the library
  save({ ...s, seen: [...s.seen, filmId] });
}
export function noteHurry() { const s = load(); save({ ...s, hurry: Math.min(s.hurry + 1, 4) }); }
export function noteIntent() { const s = load(); if (s.intent < 2) save({ ...s, intent: s.intent + 1 }); }
export function noteDepth(f) { const s = load(); if (f > s.depth + 0.05) save({ ...s, depth: Math.min(1, f) }); }
export function noteIntroDone() { const s = load(); if (!s.introDone) save({ ...s, introDone: true }); }
export function noteLibrary() { const s = load(); if (!s.library) save({ ...s, library: true }); }
export function openFully() { const s = load(); save({ ...s, open: true }); }
export function resetRipeness() { save({ ...EMPTY }); }
