import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import useTransitionNavigate from '../lib/hooks/useTransitionNavigate';
import { assetUrl } from '../lib/utils/assetUrl';

const NAV_LINKS = [
  { label: 'Neoflix', to: '/neoflix' },
  { label: 'Publications', to: '/publications' },
  { label: 'Contact', to: '/contact' },
  { label: 'Toolbox', to: '/toolbox' },
];

const BLOB_HEIGHT_FULL = 32;
const BLOB_HEIGHT_FLAT = 8;
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

  const handleNavClick = (e, to, section) => {
    e.preventDefault();
    const targetPath = to.split('#')[0] || '/';
    // For links that deep-link into a ScrollSnap section on Home, hand the
    // section id to ScrollSnap's restore key before navigating — ScrollSnap
    // reads this on mount to jump to the right slide.
    if (section) {
      try { sessionStorage.setItem('scrollsnap:return-section', section); } catch {}
    }
    if (targetPath === location.pathname) {
      navigate(to);
    } else {
      // Direction-aware slide. useTransitionNavigate publishes the
      // navbar-index delta into TransitionContext and RouteSlider
      // turns that into a horizontal Framer Motion slide on the
      // content subtree only — the navbar itself keeps rendering live.
      transitionNavigate(to);
    }
  };

  const navRef = useRef(null);
  const blobContainerRef = useRef(null);
  const linkRefs = useRef([]);
  const [blob, setBlob] = useState(null);
  const [blobOpacity, setBlobOpacity] = useState(0.5);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [traveling, setTraveling] = useState(false);
  const [blobHeight, setBlobHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [isCompactMobile, setIsCompactMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 600 : false));
  const [menuOpen, setMenuOpen] = useState(false);
  const settleTimeout = useRef(null);
  const prevIdx = useRef(null);
  const height = useMotionValue(0);
  const prevBlob = useRef({ left: null, width: null });
  const navCellHeight = isMobile ? 26 : NAV_CELL_HEIGHT;

  const isActive = (to) => {
    if (to === '/neoflix') {
      return location.pathname === '/neoflix' && location.hash !== '#collab';
    }
    if (to === '/contact') {
      return location.pathname === '/contact';
    }
    return location.pathname === to;
  };

  const handleMouseEnter = (idx) => {
    const el = linkRefs.current[idx];
    if (el && blobContainerRef.current) {
      const containerRect = blobContainerRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setBlob({
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
      });
      setHoveredIdx(idx);
      setBlobOpacity(1.0);
      if (settleTimeout.current) clearTimeout(settleTimeout.current);
      settleTimeout.current = setTimeout(() => {}, 80);
      if (hoverTimer) clearInterval(hoverTimer);
    }
  };

  const handleMouseLeave = () => {
    setBlob(null);
    setBlobOpacity(0.5);
    setHoveredIdx(null);
    if (hoverTimer) clearInterval(hoverTimer);
    if (settleTimeout.current) clearTimeout(settleTimeout.current);
  };

  useEffect(() => () => { if (hoverTimer) clearInterval(hoverTimer); if (settleTimeout.current) clearTimeout(settleTimeout.current); }, [hoverTimer]);

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      setIsCompactMobile(width < 600);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (hoveredIdx !== null && prevIdx.current !== null && hoveredIdx !== prevIdx.current) {
      setTraveling(true);
      setBlobHeight(blob?.height || 0);
      setTimeout(() => {
        setBlobHeight(blob?.height ? blob.height * 0.50 : 0);
        setTimeout(() => {
          setBlobHeight(blob?.height || 0);
          setTraveling(false);
        }, 90);
      }, 1);
    } else if (blob?.height) {
      setBlobHeight(blob.height);
    }
    prevIdx.current = hoveredIdx;
  }, [hoveredIdx, blob?.height]);

  useEffect(() => {
    if (!blob) return;
    if (
      prevBlob.current.left !== null &&
      (prevBlob.current.left !== blob.left || prevBlob.current.width !== blob.width)
    ) {
      animate(height, [blob.height, 0, blob.height], {
        times: [0, 0.5, 1],
        duration: 0.18,
        ease: [0.42, 0, 0.58, 1],
      });
    } else {
      height.set(blob.height);
    }
    prevBlob.current = { left: blob.left, width: blob.width };
  }, [blob?.left, blob?.width, blob?.height]);

  useEffect(() => {
    const updateVar = () => {
      try {
        const navEl = navRef.current;
        const h = isCompactMobile ? 0 : (navEl?.getBoundingClientRect()?.height || 60);
        document.documentElement.style.setProperty('--nav-h', `${Math.round(h)}px`);
      } catch {}
    };
    updateVar();
    window.addEventListener('resize', updateVar);
    return () => window.removeEventListener('resize', updateVar);
  }, [isCompactMobile]);

  useEffect(() => {
    if (isMobile) return;
    const activeIdx = NAV_LINKS.findIndex(link => isActive(link.to));
    if (activeIdx === -1) {
      setBlob(null);
      return;
    }
    const el = linkRefs.current[activeIdx];
    const container = blobContainerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setBlob({
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
      });
      setBlobOpacity(0.5);
      setHoveredIdx(null);
    }
  }, [location.pathname, location.hash, isMobile]);

  if (isCompactMobile) return null;

  return (
    <nav ref={navRef} data-app-navbar className="fixed inset-x-0 top-0 z-40 bg-white flex items-center justify-between" style={{ height: 60, borderBottom: '1px solid rgba(28, 54, 100, 0.08)', boxShadow: '0 1px 2px rgba(28, 54, 100, 0.05), 0 2px 8px -2px rgba(28, 54, 100, 0.06)' }}>
      {/* Logo */}
      <div className="flex items-center h-full pl-6 pr-4">
        <FaviconLogo onClick={() => {
          if (location.pathname === '/') {
            // ScrollSnap owns the Home scroll container (window never
            // scrolls with the fixed RouteSlider layout). Dispatch
            // the event ScrollSnap already listens for instead of
            // addressing window.
            window.dispatchEvent(new Event('scrollsnap:go-to-top'));
          } else {
            transitionNavigate('/');
          }
        }} />
      </div>

      {/* Nav links */}
      <div className="flex flex-1 justify-end items-center h-full" style={{ paddingRight: isMobile ? 12 : 64 }}>
        <div
          ref={blobContainerRef}
          className="relative flex items-center"
          onMouseLeave={handleMouseLeave}
          style={{ alignItems: 'center', height: '60px', position: 'relative', gap: isMobile ? '1.5rem' : '3.75rem' }}
        >
          {/* Animated blob */}
          <AnimatePresence>
            {!isMobile && blob && (
              <motion.div
                key="blob"
                initial={{ opacity: 0, x: blob.left, width: blob.width, height: NAV_CELL_HEIGHT }}
                animate={{
                  opacity: blobOpacity,
                  x: blob.left,
                  width: blob.width,
                  height: traveling ? navCellHeight * 0.75 : navCellHeight,
                  transition: {
                    opacity: { duration: 0.18 },
                    x: { type: 'spring', stiffness: 360, damping: 50, mass: 1.2, velocity: 6 },
                    width: { type: 'spring', stiffness: 360, damping: 50, mass: 1.2, velocity: 6 },
                    height: { duration: 0.18, ease: [0.42, 0, 0.58, 1] },
                  },
                }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                className="absolute flex items-center"
                style={{
                  left: 0,
                  borderRadius: '9999px',
                  background: '#d1d5db',
                  boxShadow: '0 0 0 1px var(--edge-3)',
                  zIndex: 1,
                  pointerEvents: 'none',
                  margin: 'auto 0',
                  willChange: 'transform, width, opacity',
                }}
              />
            )}
          </AnimatePresence>

          {/* Nav link items */}
          {NAV_LINKS.map((link, idx) => {
            const active = isActive(link.to);
            const isToolbox = link.label === 'Toolbox';
            return (
              <div
                key={link.to}
                ref={el => linkRefs.current[idx] = el}
                className="relative flex items-center justify-center"
                onMouseEnter={!isMobile ? () => handleMouseEnter(idx) : undefined}
                onFocus={!isMobile ? () => handleMouseEnter(idx) : undefined}
                tabIndex={-1}
                style={{ minHeight: navCellHeight, height: navCellHeight, zIndex: 2 }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      key="active-pill"
                      className="absolute inset-0 z-20 rounded-full bg-[#529c9c]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      style={{
                        boxShadow: '0 0 0 1px rgba(31, 95, 88, 0.5), 0 2px 8px 0 rgba(82,156,156,0.10)',
                        pointerEvents: 'none',
                        height: navCellHeight,
                        minHeight: navCellHeight,
                        maxHeight: navCellHeight,
                      }}
                    />
                  )}
                </AnimatePresence>
                <a
                  href={link.to}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => handleNavClick(e, link.to, link.section)}
                  className={`relative z-30 flex items-center justify-center rounded-full transform-gpu transition duration-200 ease-out
                    hover:scale-105 focus:scale-105
                    ${active ? 'text-white' : isToolbox ? 'text-white' : 'text-[#232324]'}
                    ${isToolbox && !active ? 'bg-[#232324] ring-1 ring-white/20' : ''}
                  `}
                  style={{
                    pointerEvents: 'auto',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    fontSize: isMobile ? 16 : 18,
                    padding: isMobile ? '6px 10px' : '8px 24px',
                    height: navCellHeight,
                    lineHeight: navCellHeight + 'px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {link.label}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
