/**
 * The camera over the space.
 *
 * A camera is { x, y, k }: the world point at the centre of the viewport,
 * and the zoom. A screen point is (world − camera) · k + viewport centre.
 *
 * Moving between two records is a flight, not a cut: the camera rises
 * far enough to show both ends, travels, and comes down (van Wijk & Nuij,
 * "Smooth and efficient zooming and panning", 2003, the same curve as
 * d3's interpolateZoom). The reader sees where they went from where they
 * were, which is the whole point of having a space at all.
 */
const RHO = Math.SQRT2;

function zoomPath(a, b) {
  // views as [cx, cy, width-in-world]
  const [ux0, uy0, w0] = a;
  const [ux1, uy1, w1] = b;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  if (d2 < 1e-6) {
    const S = Math.log(w1 / w0) / RHO;
    const f = (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(RHO * t * S)];
    f.S = Math.abs(S);
    return f;
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d2) / (2 * w0 * RHO ** 2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d2) / (2 * w1 * RHO ** 2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / RHO;
  const f = (t) => {
    const s = t * S;
    const c0 = Math.cosh(r0);
    const u = (w0 / (RHO ** 2 * d1)) * (c0 * Math.tanh(RHO * s + r0) - Math.sinh(r0));
    return [ux0 + u * dx, uy0 + u * dy, (w0 * c0) / Math.cosh(RHO * s + r0)];
  };
  f.S = Math.abs(S);
  return f;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createCamera(apply) {
  let cam = { x: 0, y: 0, k: 0.1 };
  let raf = 0;
  let moving = false;
  const listeners = new Set();
  const vw = () => window.innerWidth;

  const set = (next, { motion = false } = {}) => {
    cam = next;
    apply(cam, motion);
    listeners.forEach((l) => l(cam));
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (moving) { moving = false; apply(cam, false); }
  };

  /** Fly to a camera. `duration` is a cap; short hops are quicker. */
  function fly(to, { duration = 1400, instant = false, onDone } = {}) {
    stop();
    if (instant || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      set(to);
      onDone?.();
      return;
    }
    const W = vw();
    const path = zoomPath([cam.x, cam.y, W / cam.k], [to.x, to.y, W / to.k]);
    const ms = Math.max(380, Math.min(duration, 260 + path.S * 520));
    const t0 = performance.now();
    moving = true;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      const [x, y, w] = path(ease(t));
      set({ x, y, k: W / w }, { motion: t < 1 });
      if (t < 1) raf = requestAnimationFrame(tick);
      else { raf = 0; moving = false; set(to); onDone?.(); }
    };
    raf = requestAnimationFrame(tick);
  }

  return {
    get: () => cam,
    set: (next) => { stop(); set(next); },
    /** Nudge without stopping a pan in progress (wheel, drag). */
    nudge: (next) => { if (raf) { cancelAnimationFrame(raf); raf = 0; } set(next, { motion: true }); },
    settle: () => { moving = false; apply(cam, false); },
    fly,
    stop,
    isFlying: () => !!raf,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

/** World → screen for a camera, in a viewport of W×H. */
export const toScreen = (cam, W, H, x, y) => [(x - cam.x) * cam.k + W / 2, (y - cam.y) * cam.k + H / 2];
/** Screen → world. */
export const toWorld = (cam, W, H, sx, sy) => [(sx - W / 2) / cam.k + cam.x, (sy - H / 2) / cam.k + cam.y];

/**
 * The camera that puts a world rectangle in a frame (a part of the
 * viewport, e.g. the space left of the reading sheet), filling `fill` of
 * it, never closer than `maxK`.
 */
export function cameraFor(rect, frame, { fill = 0.62, maxK = 1.1, minK = 0.02 } = {}) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const fw = frame.x1 - frame.x0;
  const fh = frame.y1 - frame.y0;
  const k = Math.max(minK, Math.min(maxK, (fw * fill) / rect.w, (fh * fill) / rect.h));
  const fx = (frame.x0 + frame.x1) / 2;
  const fy = (frame.y0 + frame.y1) / 2;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return { x: cx - (fx - W / 2) / k, y: cy - (fy - H / 2) / k, k };
}
