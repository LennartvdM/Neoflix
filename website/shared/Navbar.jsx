/**
 * The navbar is the site's index, not a list of pages.
 *
 * Each page holds one of the site's three sets of things (shared/index):
 * Neoflix the six beats, Publications the six papers, the Toolbox the
 * five parts of the loop. So each link carries its set as tokens — the
 * same tokens the pages are built from. Wherever the reader is, the bar
 * lights the thing in front of them and what it relates to: on a paper,
 * the beats it proves; on a toolbox page, its part of the loop and the
 * beats that lead there; on the homepage, the beat that is playing.
 *
 * A token is also a way in: it carries itself to its place on its page.
 * Hovering one marks its mentions on the current page.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useTransitionNavigate from '../lib/hooks/useTransitionNavigate';
import { SLIDE_DURATION, SLIDE_EASE } from './motion/RouteSlider';
import { assetUrl } from '../lib/utils/assetUrl';
import Token from './index/Token';
import useCarry from './index/useCarry';
import { useIndexApi, useIndexState } from './index/IndexContext';
import { SETS, hrefFor, nameOf, relatedTo } from './index/relations';

const NAV_CELL_HEIGHT = 28;

function FaviconLogo({ onClick }) {
  const [spinKey, setSpinKey] = useState(0);

  const handleClick = () => {
    setSpinKey(k => k + 1);
    onClick?.();
  };

  return (
    <motion.div
      className="cursor-pointer"
      onClick={handleClick}
      whileHover={{ scale: 1.15, rotate: 8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <motion.img
        key={spinKey}
        src={assetUrl("/favicon.svg")}
        alt="Home"
        width="32"
        height="32"
        initial={spinKey > 0 ? { rotate: 0 } : false}
        animate={spinKey > 0 ? { rotate: 360 } : {}}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      />
      <span className="sr-only">Home</span>
    </motion.div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const transitionNavigate = useTransitionNavigate();
  const go = useCarry();
  const { lit, hover } = useIndexState();
  const indexApi = useIndexApi();
  const navRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [isCompactMobile, setIsCompactMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 600 : false));
  const navCellHeight = isMobile ? 26 : NAV_CELL_HEIGHT;

  const handleNavClick = (e, to) => {
    e.preventDefault();
    const targetPath = to.split('#')[0] || '/';
    if (targetPath === location.pathname) navigate(to);
    else transitionNavigate(to);
  };

  // /contact is the same page as /neoflix, landed on its sign-off.
  const isActive = (to) => {
    if (to === '/neoflix') return location.pathname === '/neoflix' || location.pathname === '/contact';
    if (to === '/publications') return location.pathname.startsWith('/publications');
    if (to === '/toolbox') return location.pathname.startsWith('/toolbox');
    return location.pathname === to;
  };

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsCompactMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const updateVar = () => {
      try {
        const h = isCompactMobile ? 0 : (navRef.current?.getBoundingClientRect()?.height || 60);
        document.documentElement.style.setProperty('--nav-h', `${Math.round(h)}px`);
      } catch {}
    };
    updateVar();
    window.addEventListener('resize', updateVar);
    return () => window.removeEventListener('resize', updateVar);
  }, [isCompactMobile]);

  if (isCompactMobile) return null;

  // What the bar lights: the thing being pointed at in the bar itself,
  // else the thing in front of the reader on the page.
  const focus = hover || lit;
  const related = focus ? relatedTo(focus) : null;
  const stateOf = (t) => (t === focus ? 'lit' : related?.has(t) ? 'related' : 'idle');

  return (
    <nav ref={navRef} data-app-navbar className="fixed inset-x-0 top-0 z-40 bg-white flex items-center justify-between" style={{ height: 60, borderBottom: '1px solid rgba(28, 54, 100, 0.08)', boxShadow: '0 1px 2px rgba(28, 54, 100, 0.05), 0 2px 8px -2px rgba(28, 54, 100, 0.06)' }}>
      <div className="flex items-center h-full pl-6 pr-4">
        <FaviconLogo onClick={() => {
          if (location.pathname === '/') {
            // ScrollSnap owns the Home scroll container; it listens for this.
            window.dispatchEvent(new Event('scrollsnap:go-to-top'));
          } else {
            transitionNavigate('/');
          }
        }} />
      </div>

      <div className="ix-bar" style={{ paddingRight: isMobile ? 12 : 40 }} onMouseLeave={() => indexApi?.setHover(null)}>
        {SETS.map((set) => {
          const active = isActive(set.to);
          const isToolbox = set.kind === 'loop';
          return (
            <div key={set.to} className="ix-set" data-kind={set.kind} data-here={active ? '' : undefined}>
              <div className="relative flex items-center justify-center" style={{ height: navCellHeight }}>
                <AnimatePresence>
                  {active && (
                    // One pill, shared across the links by layoutId: it
                    // travels to the new link in step with the page slide.
                    <motion.span
                      key="active-pill"
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 z-20 rounded-full bg-[#529c9c]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        layout: { duration: SLIDE_DURATION, ease: SLIDE_EASE },
                        opacity: { duration: 0.18, ease: 'easeOut' },
                      }}
                      style={{
                        boxShadow: '0 0 0 1px rgba(31, 95, 88, 0.5), 0 2px 8px 0 rgba(82,156,156,0.10)',
                        pointerEvents: 'none',
                        height: navCellHeight,
                      }}
                    />
                  )}
                </AnimatePresence>
                <a
                  href={set.to}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => handleNavClick(e, set.to)}
                  className={`relative z-30 flex items-center justify-center rounded-full transform-gpu transition duration-200 ease-out hover:scale-105 focus:scale-105
                    ${active || isToolbox ? 'text-white' : 'text-[#232324]'}
                    ${isToolbox && !active ? 'bg-[#232324] ring-1 ring-white/20' : ''}`}
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    fontSize: isMobile ? 16 : 17,
                    padding: isMobile ? '6px 10px' : '8px 18px',
                    height: navCellHeight,
                    lineHeight: navCellHeight + 'px',
                    userSelect: 'none',
                  }}
                >
                  {set.label}
                </a>
              </div>
              {!isMobile && (
                <div className="ix-set__tokens">
                  {set.tokens.map((t) => (
                    <a
                      key={t}
                      className="ix-item"
                      href={hrefFor(t)}
                      data-name={nameOf(t)}
                      data-state={stateOf(t)}
                      aria-label={nameOf(t)}
                      onMouseEnter={() => indexApi?.setHover(t)}
                      onFocus={() => indexApi?.setHover(t)}
                      onBlur={() => indexApi?.setHover(null)}
                      onClick={(e) => {
                        indexApi?.setHover(null);
                        go(e, t);
                      }}
                      tabIndex={0}
                    >
                      <Token t={t} size={set.kind === 'loop' ? 'seg' : 's'} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
