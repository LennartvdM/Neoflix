import React, { useRef, useEffect, memo } from "react";
import { assetUrl } from "../../../lib/utils/assetUrl";
import IllustrationClip from "../../../shared/IllustrationClip";

const AUTOPLAY_MS = 6600; // 6.6 seconds

// Default slides if no videos prop is provided
const defaultSlides = [
  { id: "0", video: assetUrl("/videos/urgency.mp4"), alt: "Medical urgency demonstration" },
  { id: "1", video: assetUrl("/videos/coordination.mp4"), alt: "Medical team coordination" },
  { id: "2", video: assetUrl("/videos/focus.mp4"), alt: "Medical focus and precision" },
];

const headlines = [
  {
    firstLine: "Medical interventions demand",
    secondLine: "precision and urgency."
  },
  {
    firstLine: "Which makes coordination within",
    secondLine: "teams vital for success."
  },
  {
    firstLine: "Task‑driven focus can lead to",
    secondLine: "tunnel vision and misalignment."
  }
];

/*
IMPORTANT: This is NOT a crossfade - it's a sequential card removal system.
State 0: A=100%, B=100% (stacked on top of each other)
State 1: A=0%, B=100% (remove top card A)
State 2: A=0%, B=0% (remove card B, reveal base C)

DO NOT "fix" this to crossfade between A and B.
The stacking is intentional to avoid ugly transitions.
*/

// `settle`: the card that becomes current eases from a slight zoom down to
// rest while the card above it fades away. It only moves the layer that is
// already fully opaque underneath, so the deck still never shows the
// backdrop through a half-faded pair.
const SETTLE_SCALE = 1.045;
const SETTLE_TRANSITION = 'transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)';

const MedicalCarousel = memo(function MedicalCarousel({ current, hoveredIndex, isActive, videoHover, setVideoHover, interactionsEnabled, videos, enableTouchNavigation, onTouchChange, sectionActive = true, onCarouselClick, onReady, maxWidth = '480px', settle = false }) {
  const settleStyle = (idx) => (settle
    ? { transform: idx === current ? 'scale(1)' : `scale(${SETTLE_SCALE})`, transition: SETTLE_TRANSITION }
    : null);
  const [deckLoaded, setDeckLoaded] = React.useState(false);

  // Use videos prop if provided, otherwise fallback to default slides
  const videoSlides = videos || defaultSlides;

  // Defer loading of lower deck videos - load top video first, then rest after a grace period
  useEffect(() => {
    const timer = setTimeout(() => setDeckLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Which clips decode: the topmost visible one (current) and the base (2).
  // Clip 0 is on top, covering 1 and 2; clip 1 covers 2. No need to decode
  // what nobody can see. When the section is off-screen, nothing decodes.
  const shouldPlay = (idx) => sectionActive && (idx === current || idx === 2);

  // Real readiness signal. The parent gates interaction on this instead of a
  // fixed timer that just hopes the footage finished loading. Each clip reports
  // when it has a frame up (or has failed); once all three are settled we tell
  // the parent the carousel is genuinely ready.
  const onReadyFiredRef = useRef(false);
  const readyIdxRef = useRef(new Set());
  const markReady = (idx) => {
    if (onReadyFiredRef.current) return;
    readyIdxRef.current.add(idx);
    if (readyIdxRef.current.has(0) && readyIdxRef.current.has(1) && readyIdxRef.current.has(2)) {
      onReadyFiredRef.current = true;
      onReady?.();
    }
  };

  useEffect(() => {
    // Failsafe: never leave interaction wedged off if a clip never settles.
    const failsafe = setTimeout(() => {
      if (!onReadyFiredRef.current) {
        onReadyFiredRef.current = true;
        onReady?.();
      }
    }, 15000);
    return () => clearTimeout(failsafe);
  }, []);

  return (
    <div 
      className="inline-flex flex-row items-center mx-auto w-full relative" 
      style={{
        position: 'relative', 
        minHeight: '0px',
        minWidth: '0px',
        maxWidth,
        width: '100%',
        height: 'auto',
        aspectRatio: '3 / 2',
        cursor: interactionsEnabled ? 'pointer' : 'default'
      }}
      onMouseEnter={() => interactionsEnabled && setVideoHover?.(true)}
      onMouseLeave={() => interactionsEnabled && setVideoHover?.(false)}
      onClick={onCarouselClick ? () => onCarouselClick(current) : undefined}
      role={onCarouselClick ? 'link' : undefined}
    >
      {/* Static base video (focus) as persistent background */}
      <div
        className="absolute inset-0 flex items-center justify-center z-0"
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <IllustrationClip
          src={deckLoaded ? videoSlides[2].video : undefined}
          play={shouldPlay(2)}
          preload="metadata"
          onReady={() => markReady(2)}
          className="w-full h-full object-cover"
          style={{
            outline: 'none',
            transition: 'outline 0.2s',
            background: 'none',
            opacity: 1,
            ...settleStyle(2),
          }}
        />
      </div>

      {/* Overlay videos that stack and remove sequentially */}
      {[0, 1].map((i) => {
        // Calculate opacity based on current state
        let opacity = 1;
        if (current === 0) {
          // State 0: Both videos at 100%
          opacity = 1;
        } else if (current === 1) {
          // State 1: First video at 0%, second at 100%
          opacity = i === 0 ? 0 : 1;
        } else {
          // State 2: Both videos at 0%
          opacity = 0;
        }

        return (
          <div
            key={videoSlides[i].id}
            className="absolute inset-0 flex items-center justify-center transition-opacity" // Remove duration-700, use style transition below
            style={{ 
              pointerEvents: i === current ? 'auto' : 'none', 
              background: 'none', 
              borderRadius: '16px', 
              overflow: 'hidden',
              zIndex: 2 - i, // Reverse the z-index so urgency (0) is on top of coordination (1)
              opacity: opacity,
              transition: 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)' // Slower fade
            }}
          >
            <IllustrationClip
              src={i === 0 || deckLoaded ? videoSlides[i].video : undefined}
              play={shouldPlay(i)}
              preload="metadata"
              onReady={() => markReady(i)}
              className="w-full h-full object-cover"
              style={{
                outline: 'none',
                transition: 'outline 0.2s',
                background: 'none',
                opacity: 1, // The clip itself is always at full opacity
                willChange: settle ? 'opacity, transform' : 'opacity',
                ...settleStyle(i),
              }}
            />
          </div>
        );
      })}
      {/* Touch navigation overlay for landscape tablets */}
      {enableTouchNavigation && (
        <>
          <button
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); onTouchChange?.((current - 1 + videoSlides.length) % videoSlides.length); }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '15%', background: 'transparent', border: 'none', zIndex: 99, cursor: 'pointer' }}
          />
          <button
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); onTouchChange?.((current + 1) % videoSlides.length); }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '15%', background: 'transparent', border: 'none', zIndex: 99, cursor: 'pointer' }}
          />
        </>
      )}
    </div>
  );
});

export default MedicalCarousel;