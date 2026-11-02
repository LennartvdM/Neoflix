import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import MedicalCarousel from './StoryCarousel';
import { useBackdropBands } from '../../../shared/backdrop/useBackdrop';
import { VIDEO_CONTROLS_HIDDEN_CSS } from './story.styles';
import './story-desktop.css';

// The homepage story sections on a laptop/desktop: a large clip on one
// side; the headline and the three captions as plain type on the other.
//
// This replaced the 2024 Framer-era composition (still used for landscape
// tablets — StoryLandscapeTabletLayout.jsx), which framed the active caption
// in an opaque grey card, ran decorative punch-out rails to the screen edge
// and zoomed white "targeting" outlines onto whatever was hovered. Layout is
// plain CSS grid here: no JS measuring, no absolute offsets.
//
// Structure comes from two tonal bands, the descendants of the 2024 ones:
// a "shelf" at the clip's height running from the clip to the screen edge,
// and a "lane" behind the current caption that travels between captions
// and runs out to the opposite edge. They are drawn in the BACKDROP layer
// (useBackdropBands), not here — only there can their blend modes act on
// the footage. This component just measures where they go.
//
// What did NOT change is the clip transition. StoryCarousel is a deck of
// cards — the incoming clip is already fully opaque underneath while the
// outgoing one fades off the top — so the backdrop never shows through a
// half-faded pair the way a symmetric crossfade would. `settle` only adds
// a slow zoom-to-rest on the card being revealed.

// Headline lines as story.data.js describes them. `line1suffix` (the
// reflection story's " ") keeps line 1 and the highlight on one line;
// without it they break.
function Headline({ header }) {
  return (
    <>
      {header.line1}
      {header.line1suffix ?? <br />}
      <span className="story-desk__accent">{header.line2highlight}</span>
      {header.line2suffix}
      <br />
      {header.line3}
      {header.line4 && (
        <>
          <br />
          {header.line4}
        </>
      )}
    </>
  );
}

// Where the bands go, in section px. Offsets (not getBoundingClientRect)
// so the entrance transforms and the route slide don't skew the numbers.
function measureBands(grid, media, list) {
  if (!grid || !media || !list || !grid.offsetParent) return null;
  const W = grid.offsetParent.clientWidth;
  const gx = grid.offsetLeft;
  const gy = grid.offsetTop;
  const rows = Array.from(list.children).map((li) => ({
    top: gy + li.offsetTop,
    height: li.offsetHeight,
  }));
  return {
    W,
    media: {
      top: gy + media.offsetTop,
      height: media.offsetHeight,
      left: gx + media.offsetLeft,
      right: gx + media.offsetLeft + media.offsetWidth,
    },
    text: { left: gx + list.offsetLeft, right: gx + list.offsetLeft + list.offsetWidth },
    rows,
  };
}

// How far the lane reaches past the caption text on its inner end.
const LANE_INSET = 24;

export default function StoryDesktopLayout({
  story,
  sectionRef,
  sectionState,
  headlines,
  mainVideos,
  header,
  headerVisible,
  videoVisible,
  captionsVisible,
  navbarHeight,
  isPaused,
  interactionsEnabled,
  currentVideo,
  barKey,
  safeVideoHover,
  safeHoveredIndex,
  shouldTransition,
  isVideoLeft,
  videoContainerRef,
  headerRef,
  videoAnchorRef,
  handleHover,
  handleHoverEnd,
  handleBarEnd,
  handleVideoHover,
  onCarouselReady,
  navigateToSection,
}) {
  const mounted = sectionState !== 'idle' && sectionState !== 'cleaned';
  // NB: `isVideoLeft` is inverted relative to the screen — the story whose
  // orientation is 'video-left' (reflection) shows its clip on the RIGHT.
  // The original layout anchored the clip's opposite edge to the centre
  // line, which is where the name came from. Preserve what visitors see.
  const mediaSide = isVideoLeft ? 'end' : 'start';

  const gridRef = useRef(null);
  const listRef = useRef(null);
  const [geom, setGeom] = useState(null);
  const measure = useCallback(() => {
    setGeom(measureBands(gridRef.current, videoAnchorRef.current, listRef.current));
  }, [videoAnchorRef]);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (gridRef.current) ro.observe(gridRef.current);
    if (videoAnchorRef.current) ro.observe(videoAnchorRef.current);
    // Inter swaps in after first paint and re-wraps the captions.
    document.fonts?.ready?.then(measure);
    return () => ro.disconnect();
  }, [measure, videoAnchorRef]);

  let bands = null;
  if (geom && mounted) {
    const row = geom.rows[currentVideo] || geom.rows[0];
    const { media, text, W } = geom;
    const start = mediaSide === 'start';
    bands = {
      visible: videoVisible,
      items: [
        // From the screen edge to (just under) the clip's far corner, so
        // its rounded end is always hidden behind the clip.
        start
          ? { id: 'shelf', role: 'shelf', top: media.top, height: media.height, left: 0, right: W - media.right + 24, inner: 'right' }
          : { id: 'shelf', role: 'shelf', top: media.top, height: media.height, left: media.left + 24, right: 0, inner: 'left' },
        start
          ? { id: 'lane', role: 'lane', top: row.top, height: row.height, left: text.left - LANE_INSET, right: 0, inner: 'left' }
          : { id: 'lane', role: 'lane', top: row.top, height: row.height, left: 0, right: W - text.right - LANE_INSET, inner: 'right' },
      ],
    };
  }
  useBackdropBands(`medical-${story}`, bands);

  return (
    <div
      ref={sectionRef}
      className="story-desk h-screen w-full relative overflow-hidden"
      data-media-side={mediaSide}
      data-animate={shouldTransition ? 'true' : 'false'}
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <style>{VIDEO_CONTROLS_HIDDEN_CSS}</style>
      <div className="story-desk__scrim" aria-hidden="true" />

      <div ref={gridRef} className="story-desk__grid" style={{ paddingTop: navbarHeight }}>
        <div
          ref={videoAnchorRef}
          className="story-desk__media"
          data-visible={videoVisible ? 'true' : 'false'}
          data-dot-nav-target
        >
          <div
            ref={videoContainerRef}
            className="story-desk__frame"
            data-hover={safeVideoHover ? 'true' : 'false'}
          >
            <MedicalCarousel
              current={currentVideo}
              onReady={onCarouselReady}
              hoveredIndex={safeHoveredIndex}
              isActive={safeHoveredIndex === currentVideo || isPaused}
              videoHover={safeVideoHover}
              setVideoHover={handleVideoHover}
              interactionsEnabled={interactionsEnabled}
              videos={mainVideos}
              sectionActive={sectionState === 'entering' || sectionState === 'active'}
              onCarouselClick={navigateToSection}
              maxWidth="none"
              settle
            />
            <span className="story-desk__ring" aria-hidden="true" />
            <span className="story-desk__cta" aria-hidden="true">
              Read more <span className="story-desk__arrow">→</span>
            </span>
          </div>
        </div>

        <div className="story-desk__text">
          <h2
            ref={headerRef}
            className="story-desk__headline"
            data-visible={headerVisible ? 'true' : 'false'}
          >
            <Headline header={header} />
          </h2>

          <ol ref={listRef} className="story-desk__captions" data-visible={captionsVisible ? 'true' : 'false'}>
            {headlines.map((headline, i) => {
              const isCurrent = currentVideo === i;
              return (
                <li key={headline.sectionTarget || i} style={{ '--i': i }}>
                  <button
                    type="button"
                    className="story-desk__caption"
                    aria-current={isCurrent ? 'true' : undefined}
                    data-hovered={safeHoveredIndex === i ? 'true' : 'false'}
                    disabled={!interactionsEnabled}
                    onMouseEnter={interactionsEnabled ? () => handleHover(i) : undefined}
                    onMouseLeave={interactionsEnabled ? handleHoverEnd : undefined}
                    onFocus={interactionsEnabled ? () => handleHover(i) : undefined}
                    onBlur={interactionsEnabled ? handleHoverEnd : undefined}
                    onClick={interactionsEnabled ? () => navigateToSection?.(i) : undefined}
                  >
                    <span className="story-desk__copy">
                      {headline.firstLine}
                      <br />
                      {headline.secondLine}
                      <span className="story-desk__arrow" aria-hidden="true"> →</span>
                    </span>
                    {/* The progress line also drives autoplay: its
                        animationend advances the deck (handleBarEnd). */}
                    {isCurrent && mounted && (
                      <span className="story-desk__track" aria-hidden="true">
                        <span
                          key={barKey}
                          className="story-desk__fill"
                          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                          onAnimationEnd={handleBarEnd}
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
