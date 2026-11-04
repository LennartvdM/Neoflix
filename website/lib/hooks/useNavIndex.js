/**
 * Maps the current route to its position in the active navigation surface,
 * so page transitions can pick a horizontal slide direction from the user's
 * visible mental model.
 *
 * Desktop navbar:
 *   0  Home
 *   1  Neoflix
 *   2  Publications
 *   3  Contact
 *   4  Toolbox
 *
 * Mobile dock:
 *   0  Neoflix
 *   1  Publications
 *   2  Home
 *   3  Toolbox
 */
import { useLocation } from 'react-router-dom';

export const DESKTOP_NAV_ORDER = [
  { index: 0, path: '/' },
  { index: 1, path: '/neoflix' },
  { index: 2, path: '/publications' },
  { index: 3, path: '/contact' },
  { index: 4, path: '/toolbox' },
];

export const MOBILE_DOCK_ORDER = [
  { index: 0, path: '/neoflix' },
  { index: 1, path: '/publications' },
  { index: 2, path: '/' },
  { index: 3, path: '/toolbox' },
];

export function getNavIndexForPath(pathname, surface = 'desktop') {
  if (!pathname) return surface === 'mobile' ? 2 : 0;

  if (surface === 'mobile') {
    if (pathname === '/toolbox' || pathname.startsWith('/toolbox/')) return 3;
    if (pathname === '/neoflix' || pathname.startsWith('/neoflix/') || pathname === '/contact') return 0;
    const match = MOBILE_DOCK_ORDER.find((n) => n.path === pathname);
    return match ? match.index : 2;
  }

  if (pathname === '/toolbox' || pathname.startsWith('/toolbox/')) return 4;
  if (pathname.startsWith('/neoflix/')) return 1;
  const match = DESKTOP_NAV_ORDER.find((n) => n.path === pathname);
  return match ? match.index : 0;
}

export default function useNavIndex(surface = 'desktop') {
  const location = useLocation();
  return getNavIndexForPath(location.pathname, surface);
}
