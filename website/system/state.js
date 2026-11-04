/**
 * The reader's own state: the trail (records visited), the session pack
 * (records pinned) and checklist ticks. It lives in this browser's
 * localStorage only — never a cookie, never sent anywhere (CLAUDE.md
 * rule 8) — and every read and write survives storage being blocked.
 */
import { useSyncExternalStore } from 'react';

const listeners = new Set();
const cache = new Map();
function read(key, fallback) {
  if (cache.has(key)) return cache.get(key);
  let value = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) value = JSON.parse(raw);
  } catch { /* storage blocked: keep the fallback */ }
  cache.set(key, value);
  return value;
}
function write(key, value) {
  cache.set(key, value);
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* in-memory only */ }
  listeners.forEach((l) => l());
}
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

const TRAIL = 'neoflix:trail';
const PINS = 'neoflix:pack';
const EMPTY = [];

export const useTrail = () => useSyncExternalStore(subscribe, () => read(TRAIL, EMPTY), () => EMPTY);
export const usePins = () => useSyncExternalStore(subscribe, () => read(PINS, EMPTY), () => EMPTY);

export function visit(key) {
  const t = read(TRAIL, EMPTY);
  if (t[t.length - 1] !== key) write(TRAIL, [...t, key].slice(-16));
}
export const clearTrail = () => write(TRAIL, EMPTY);
export function togglePin(key) {
  const p = read(PINS, EMPTY);
  write(PINS, p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);
}
export function movePin(i, d) {
  const p = [...read(PINS, EMPTY)];
  if (!p[i + d]) return;
  [p[i], p[i + d]] = [p[i + d], p[i]];
  write(PINS, p);
}
export function setPins(keys) { write(PINS, keys); }

export const checksFor = (id) => read(`neoflix:check:${id}`, EMPTY);
export const setChecks = (id, list) => write(`neoflix:check:${id}`, list);

const MINE = 'neoflix:mine';
export const useMyPath = () => useSyncExternalStore(subscribe, () => read(MINE, null), () => null);
export const saveMyPath = (steps) => write(MINE, { steps: [...new Set(steps)] });
