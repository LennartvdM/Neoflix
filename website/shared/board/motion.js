// Motion primitives for the board's hooks. Motion belongs to the hook,
// never to the page (blueprint, "Where the motion lives"): a proof always
// settles the same way, a witness always reveals the same way. Every hook
// must also read correctly if none of this ever fires — so each primitive
// starts from the resting state when motion is reduced or unavailable.
import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Whether `ref` is on screen. `once` latches true on first entry (proofs
 * settle once and never re-animate); otherwise it tracks (witness clips
 * pause when they leave).
 */
export function useInView(ref, { once = false, threshold = 0.25, rootMargin = '0px' } = {}) {
  const [inView, setInView] = useState(() => prefersReducedMotion() && once);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, threshold, rootMargin]);
  return inView;
}

/**
 * Scroll progress through `ref`, 0 → 1, written to the element as the CSS
 * custom property `--p` (so most instruments are pure CSS) and handed to
 * `onProgress` for the few that need JS. "Through" means: 0 when the
 * element's top reaches the top of the viewport, 1 when its bottom reaches
 * the bottom — the span over which a sticky child stays pinned.
 *
 * Scroll events don't bubble, but they do reach a capturing listener on
 * the document, so this works for any scroll container on the page.
 * Reduced motion pins progress at `rest` (the instrument's resting state).
 */
export function useScrollProgress(ref, { onProgress, rest = 1 } = {}) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const write = (p) => {
      el.style.setProperty('--p', p.toFixed(4));
      cb.current?.(p);
    };
    if (prefersReducedMotion()) {
      write(rest);
      return undefined;
    }
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = Math.max(1, r.height - vh);
      write(Math.min(1, Math.max(0, -r.top / span)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, rest]);
}

/**
 * A figure that counts up once when `run` turns true: "101 of 125" counts
 * the 101, "93%" the 93. Years and anything without a leading number are
 * returned as they are (counting to 2009 is not information).
 */
export function useCountUp(figure, run, duration = 1100) {
  const match = /^(\d[\d,.]*)(.*)$/.exec(figure || '');
  const target = match ? Number(match[1].replace(/,/g, '')) : null;
  const countable = target != null && !(target >= 1900 && target <= 2100) && !prefersReducedMotion();
  const [value, setValue] = useState(countable ? 0 : null);
  useEffect(() => {
    if (!countable || !run) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [countable, run, target, duration]);
  if (!countable || value == null) return figure;
  return `${value}${match[2]}`;
}
