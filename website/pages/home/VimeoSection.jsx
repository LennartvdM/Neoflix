import React, { useEffect, useRef, useState } from 'react';
import useDropPhysics from './intro/useDropPhysics.js';
import { useTabletLayout } from '../../lib/hooks/useTabletLayout';

// Vimeo embed for the showcase slide. dnt=1 tells the player not to set
// tracking cookies or report the session to Vimeo's analytics — without
// it, this iframe is the only thing on the site that drops cookies.
// One home for the session film's address: the library's film records
// open the same film at the moment each clip comes from.
import { SESSION_FILM_SRC as VIMEO_SRC } from '../../system/content/films.js';

// Same fill as the intro slide so the canvas around the player matches it.
const INTRO_FILL = 'linear-gradient(to top, #ffffff, var(--cool-page))';

// Drop tuning — same rigid-body sim as the intro logo, dialed down: a
// near-straight fall with one soft bounce and almost no tilt, so it reads
// as weighty rather than cartoony (intro logo runs bounciness 1 / wobble
// 0.75; here we drop those right down).
const DROP_START_Y = -480;
const DROP_GRAVITY = 2000;
const DROP_BOUNCINESS = 0.3;
const DROP_WOBBLE = 0.1;
const DROP_SNAP = 0.9;

const VimeoSection = ({ inView }) => {
  const { width } = useTabletLayout();
  const isMobile = width < 600;

  const dropRef = useRef(null);
  const iframeRef = useRef(null);
  // Captured once so a resize never re-runs the sim mid-rest.
  const halfWidthRef = useRef(
    typeof window !== 'undefined' ? Math.max(160, Math.round(window.innerWidth * 0.33)) : 320
  );
  const [armed, setArmed] = useState(false);

  // Fire the drop once, the first time the slide is at least half in view.
  useEffect(() => {
    if (!inView || armed) return;
    const id = setTimeout(() => setArmed(true), 60);
    return () => clearTimeout(id);
  }, [inView, armed]);

  // Pause the reel when the slide scrolls out of view so it doesn't keep
  // playing behind another slide. Talks to the Vimeo player's postMessage
  // API directly (no SDK): by the time playback matters the iframe has
  // loaded and is listening; on a not-yet-loaded iframe this is a no-op.
  useEffect(() => {
    if (inView) return;
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ method: 'pause' }),
      'https://player.vimeo.com'
    );
  }, [inView]);

  useDropPhysics(dropRef, {
    enabled: armed,
    bounciness: DROP_BOUNCINESS,
    wobble: DROP_WOBBLE,
    snap: DROP_SNAP,
    gravity: DROP_GRAVITY,
    startY: DROP_START_Y,
    halfWidth: halfWidthRef.current,
  });

  // ~2/3 of the screen, clamped so a 16:9 player never overflows vertically;
  // wider on phones where 2/3 of the width would be too small to watch.
  const playerWidth = isMobile
    ? '92vw'
    : 'min(66vw, calc((100vh - 160px) * 16 / 9))';

  return (
    <div
      // A light slide — the slide nav switches to navy ink.
      data-nav-tone="dark"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: INTRO_FILL,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        ref={dropRef}
        style={{
          width: playerWidth,
          aspectRatio: '16 / 9',
          transformOrigin: 'center bottom',
          // Off-screen start; useDropPhysics takes over once armed. Keep this
          // string constant so React never clobbers the sim's transforms.
          transform: `translateY(${DROP_START_Y}px)`,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: '#000',
          boxShadow: '0 0 0 1px var(--edge-2), 0 30px 70px -28px rgba(28, 54, 100, 0.45)',
        }}
      >
        <iframe
          ref={iframeRef}
          title="vimeo-player"
          src={VIMEO_SRC}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          allowFullScreen
          style={{ width: '100%', height: '100%', display: 'block', border: 0 }}
        />
      </div>
    </div>
  );
};

export default VimeoSection;
