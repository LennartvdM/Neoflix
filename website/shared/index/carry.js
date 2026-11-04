/**
 * The carry: a thing travels to its place on the next page.
 *
 * Clicking a token (in the navbar index, a peg, a paper dot, a door) lifts
 * a copy of it and flies it to the token marked `data-token-anchor` for
 * the same thing on the page that arrives — across the page slide, which
 * keeps running underneath. The page changes; the thing you clicked is
 * the one constant, and lands where it lives.
 *
 * The ghost lives on <body>, deliberately outside the route slides (cf.
 * CLAUDE.md rule 11): it belongs to neither page. It chases the target's
 * live rect every frame, so a target still sliding in, or scrolled into
 * place by the arriving page's hash, is met where it actually is.
 *
 * Placeholder motion: a straight eased flight and a ring on arrival.
 */
import { SLIDE_DURATION } from '../motion/RouteSlider';
import { prefersReducedMotion } from '../board/motion';

const ease = (x) => 1 - Math.pow(1 - x, 3);

export function carry(sourceEl, t, slot) {
  if (!sourceEl || prefersReducedMotion()) return;
  const from = sourceEl.getBoundingClientRect();
  if (!from.width) return;

  const ghost = sourceEl.cloneNode(true);
  ghost.removeAttribute('data-token-anchor');
  ghost.removeAttribute('data-token');
  ghost.classList.add('ix-ghost');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    margin: '0',
    width: `${from.width}px`,
    height: `${from.height}px`,
    zIndex: '70',
    pointerEvents: 'none',
    transformOrigin: '0 0',
    transform: `translate(${from.left}px, ${from.top}px)`,
  });
  document.body.appendChild(ghost);

  const findTarget = () => {
    const hosts = slot != null
      ? document.querySelectorAll(`[data-route-slide][data-slot="${slot}"]`)
      : document.querySelectorAll('[data-route-slide]');
    for (const host of hosts) {
      const el = host.querySelector(`[data-token-anchor="${CSS.escape(t)}"]`);
      if (el && el !== sourceEl && el.getBoundingClientRect().width) return el;
    }
    return null;
  };

  const travel = SLIDE_DURATION * 1000 + 120;
  const born = performance.now();
  let start = null;
  let target = null;

  const land = (el) => {
    ghost.style.transition = 'opacity 0.22s ease';
    ghost.style.opacity = '0';
    setTimeout(() => ghost.remove(), 260);
    if (el) {
      el.setAttribute('data-arrived', '');
      setTimeout(() => el.removeAttribute('data-arrived'), 1100);
    }
  };

  const frame = (now) => {
    if (!target) {
      target = findTarget();
      if (!target) {
        if (now - born > 1600) return land(null);
        return requestAnimationFrame(frame);
      }
      start = now;
    }
    const p = Math.min(1, (now - start) / travel);
    const k = ease(p);
    const to = target.getBoundingClientRect();
    const x = from.left + (to.left - from.left) * k;
    // A little lift mid-flight so it reads as carried, not slid.
    const y = from.top + (to.top - from.top) * k - Math.sin(Math.PI * p) * 24;
    const sx = (from.width + (to.width - from.width) * k) / from.width;
    const sy = (from.height + (to.height - from.height) * k) / from.height;
    ghost.style.transform = `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
    if (p < 1) requestAnimationFrame(frame);
    else land(target);
  };
  requestAnimationFrame(frame);
}
