import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import useTabletLayout from '../../lib/hooks/useTabletLayout';
import { getNavIndexForPath } from '../../lib/hooks/useNavIndex';
import { carry } from './carry';
import { hrefFor } from './relations';

/**
 * Navigate to a thing and carry its token there. Returns a click handler
 * factory: `onClick={(e) => go(e, 'paper:providers')}`. The flying token
 * is the `[data-token]` inside the clicked element, or the element itself.
 * Modified clicks fall through to the browser.
 */
export default function useCarry() {
  const navigate = useTransitionNavigate();
  const { width } = useTabletLayout();
  const surface = width > 0 && width < 600 ? 'mobile' : 'desktop';
  return (e, t, href = hrefFor(t)) => {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return;
    e?.preventDefault();
    const el = e?.currentTarget;
    const source = el?.matches?.('[data-token]') ? el : el?.querySelector?.('[data-token]') || el;
    carry(source, t, getNavIndexForPath(href.split('#')[0] || '/', surface));
    navigate(href);
  };
}
