/**
 * The engine: moves every element to where the magnet put it, on springs.
 *
 * Each element has a spring on its position and size, tuned a little
 * under critical damping, so an element arriving at its place overshoots
 * by a hair and settles: it clacks into place rather than easing in. An
 * element joining comes out of the one it clamps to; one leaving fades
 * where it is.
 *
 * Like the camera before it, it writes styles directly, every frame, with
 * no React render; React renders only when what an element says changes.
 *
 * Dragging: an element can be picked up (it follows the pointer, no
 * spring) and let go; where it lands is decided by the caller (magnet.js
 * `dockNear`) and held until the context changes.
 */
const K = 300; // stiffness
const C = 2 * Math.sqrt(K) * 0.74; // damping: a little under critical, for the clack

export function createEngine() {
  const els = new Map();
  const st = new Map(); // id -> { x, y, w, h, vx, vy, vw, vh }
  const written = new Map();
  let targets = new Map(); // id -> rect
  let parents = new Map(); // id -> parent id (where a newcomer comes from)
  const held = new Map(); // id -> rect: dropped by the reader
  let drag = null; // { id, x, y }
  let raf = 0;
  let last = 0;
  let reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* default */ }

  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const targetOf = (id) => held.get(id) || targets.get(id);

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    let moving = false;
    els.forEach((el, id) => {
      const t = targetOf(id);
      if (!t) {
        if (!el.hasAttribute('data-out')) { el.setAttribute('data-out', ''); st.delete(id); }
        return;
      }
      let s = st.get(id);
      if (!s) {
        // Joining: out of the element it clamps to (or where it is).
        const from = st.get(parents.get(id));
        const o = from ? { x: from.x + from.w / 2 - t.w * 0.3, y: from.y + from.h / 2 - t.h * 0.3, w: t.w * 0.6, h: t.h * 0.6 } : { x: t.x + t.w * 0.1, y: t.y + t.h * 0.1, w: t.w * 0.8, h: t.h * 0.8 };
        s = { ...o, vx: 0, vy: 0, vw: 0, vh: 0 };
        st.set(id, s);
        el.removeAttribute('data-out');
      }
      if (drag && drag.id === id) {
        s.x = drag.x - s.w / 2; s.y = drag.y - s.h / 2; s.vx = s.vy = 0;
        moving = true;
      } else if (reduced) {
        Object.assign(s, { x: t.x, y: t.y, w: t.w, h: t.h, vx: 0, vy: 0, vw: 0, vh: 0 });
      } else {
        // Semi-implicit Euler in small steps: stable at any frame rate.
        const n = Math.ceil(dt / (1 / 240));
        const h = dt / n;
        for (let i = 0; i < n; i += 1) {
          s.vx += (-K * (s.x - t.x) - C * s.vx) * h; s.x += s.vx * h;
          s.vy += (-K * (s.y - t.y) - C * s.vy) * h; s.y += s.vy * h;
          s.vw += (-K * (s.w - t.w) - C * s.vw) * h; s.w += s.vw * h;
          s.vh += (-K * (s.h - t.h) - C * s.vh) * h; s.h += s.vh * h;
        }
        const still = Math.abs(s.x - t.x) + Math.abs(s.y - t.y) + Math.abs(s.w - t.w) + Math.abs(s.h - t.h) < 0.4
          && Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vw) + Math.abs(s.vh) < 4;
        if (still) Object.assign(s, { x: t.x, y: t.y, w: t.w, h: t.h, vx: 0, vy: 0, vw: 0, vh: 0 });
        else moving = true;
      }
      write(el, id, s);
    });
    if (moving) raf = requestAnimationFrame(frame);
  }

  function write(el, id, s) {
    const r = [Math.round(s.x * 2) / 2, Math.round(s.y * 2) / 2, Math.max(0, Math.round(s.w)), Math.max(0, Math.round(s.h))];
    const p = written.get(id);
    if (p && p[0] === r[0] && p[1] === r[1] && p[2] === r[2] && p[3] === r[3]) return;
    written.set(id, r);
    el.style.transform = `translate3d(${r[0]}px, ${r[1]}px, 0)`;
    el.style.width = `${r[2]}px`;
    el.style.height = `${r[3]}px`;
  }

  return {
    register(id, el) {
      if (el) { els.set(id, el); written.delete(id); if (!targetOf(id)) el.setAttribute('data-out', ''); kick(); } else { els.delete(id); st.delete(id); written.delete(id); }
    },
    /** Where everything should be now; `from` maps an id to what it clamps to. */
    setTargets(next, from) {
      targets = next;
      if (from) parents = from;
      kick();
    },
    /** A new context: the reader's own placements are let go. */
    release() { held.clear(); kick(); },
    rectOf: (id) => { const s = st.get(id); return s ? { x: s.x, y: s.y, w: s.w, h: s.h } : null; },
    targetOf,
    visible: () => [...els.keys()].filter((id) => targetOf(id)).map((id) => ({ id, ...targetOf(id) })),
    pick(id, x, y) { drag = { id, x, y }; kick(); },
    move(x, y) { if (drag) { drag.x = x; drag.y = y; kick(); } },
    drop(rect) {
      if (!drag) return;
      if (rect) held.set(drag.id, rect);
      const s = st.get(drag.id);
      if (s) { s.vx = 0; s.vy = 0; }
      drag = null;
      kick();
    },
    dragging: () => drag?.id || null,
  };
}
