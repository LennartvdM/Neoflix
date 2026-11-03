import React, { useEffect, useRef, useState } from 'react';
import './hero-scroll-cue.css';

// The "there is more below" cue at the foot of the desktop intro slide.
// Nothing else on the intro says the page scrolls, so this one keeps
// moving for as long as it's on screen — but gently, and on the
// compositor: a teal segment travelling down a hairline, the vertical
// twin of the story captions' progress line.
//
// Until 2026-11 this was a pair of masked SVG chevrons whose masks and
// gradient stops were rewritten from a requestAnimationFrame loop every
// frame, on top of two CSS bobs. Same job, now pure CSS.
export default function HeroScrollCue({ onClick }) {
  const [visible, setVisible] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const rootRef = useRef(null);

  // Appear shortly after the intro's subtitle lands.
  useEffect(() => {
    let id;
    const handleSubtitle = () => {
      clearTimeout(id);
      id = setTimeout(() => setVisible(true), 600);
    };
    window.addEventListener('intro:subtitle-shown', handleSubtitle);
    return () => {
      clearTimeout(id);
      window.removeEventListener('intro:subtitle-shown', handleSubtitle);
    };
  }, []);

  // The cue scrolls away with the intro; don't animate what nobody sees.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <button
      ref={rootRef}
      type="button"
      className="hero-scroll-cue"
      data-visible={visible ? 'true' : 'false'}
      data-running={onScreen ? 'true' : 'false'}
      onClick={onClick}
      aria-label="Scroll to next section"
    >
      <span className="hero-scroll-cue__label" aria-hidden="true">Scroll</span>
      <span className="hero-scroll-cue__track" aria-hidden="true">
        <span className="hero-scroll-cue__runner" />
      </span>
    </button>
  );
}
