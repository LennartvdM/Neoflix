import React from 'react';
import useTransitionNavigate from '../lib/hooks/useTransitionNavigate';

/**
 * Site-wide footer: teal → dark-blue gradient, nav columns, signature +
 * funding line, back-to-top button.
 *
 * Navigation goes through useTransitionNavigate so the direction-aware
 * slide fires on Footer clicks the same way it does on Navbar clicks.
 * Using plain <Link> here would skip the direction logic and cause the
 * content to teleport — breaking the spatial mapping between navbar
 * slot order and slide direction.
 */
export default function Footer() {
  const transitionNavigate = useTransitionNavigate();
  const handleNav = (to) => (e) => {
    e.preventDefault();
    transitionNavigate(to);
  };

  // Footer only mounts inside ScrollSnap (Home). The page scrolls on
  // ScrollSnap's internal container, not `window`, so dispatch the event
  // ScrollSnap listens for. Addressing `window` here became a no-op once
  // the fixed RouteSlider layout landed (window never scrolls).
  const scrollTop = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('scrollsnap:go-to-top'));
    }
  };

  const linkClass =
    'text-[13px] leading-5 text-white/70 hover:text-white underline-offset-2 hover:underline transition-colors';
  const headingClass = 'text-sm font-medium text-white mb-3';

  return (
    <footer
      className="w-full"
      style={{
        background:
          'linear-gradient(180deg, rgb(72, 193, 196) 0%, rgb(21, 37, 54) 100%)',
        fontFamily: '"Inter", sans-serif',
        // Snap point: footer's bottom aligns to viewport bottom. Combined
        // with mandatory snap on the scroll container, scrolling past slide 4
        // snaps to this position, which shows the tail of slide 4 above the
        // footer instead of giving the footer its own full slide.
        scrollSnapAlign: 'end',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        {/* Top: brand + nav columns */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div>
            <div
              className="text-white font-bold"
              style={{ fontSize: 22, letterSpacing: '-0.05em' }}
            >
              Neoflix
            </div>
            <p className="text-[13px] leading-5 text-white/60 mt-2 max-w-xs">
              Revolutionizing reflection in medical care.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <div className={headingClass}>Project</div>
              <ul className="space-y-2">
                <li><a href="/" onClick={handleNav('/')} className={linkClass}>Home</a></li>
                <li><a href="/neoflix" onClick={handleNav('/neoflix')} className={linkClass}>Neoflix</a></li>
              </ul>
            </div>
            <div>
              <div className={headingClass}>Materials</div>
              <ul className="space-y-2">
                <li><a href="/publications" onClick={handleNav('/publications')} className={linkClass}>Publications</a></li>
                <li><a href="/toolbox" onClick={handleNav('/toolbox')} className={linkClass}>Toolbox</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-[13px] leading-5 text-white/70">
            <a
              href="/contact"
              onClick={handleNav('/contact')}
              className="hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              © 2024–2026 Neoflix
            </a>
            <a
              href="mailto:info@neoflix.care"
              className="hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              Created by <strong>Veerle Heesters</strong>
            </a>
            <a
              href="https://www.knaw.nl/en/funds-and-prizes/knaw-van-walree-fund"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              <span style={{ fontWeight: 400 }}>Supported by the </span>
              <span style={{ fontWeight: 700 }}>KNAW Van Walree Fund</span>
            </a>
            <a
              href="mailto:lennartvandermolen@gmail.com"
              className="hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              Developed by <strong>Lennart vd Molen</strong>
            </a>
          </div>

          <button
            type="button"
            onClick={scrollTop}
            aria-label="Back to top"
            className="self-start md:self-auto flex items-center justify-center transition-colors hover:bg-[rgba(21,37,54,0.78)]"
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              backgroundColor: 'rgba(21, 37, 54, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
