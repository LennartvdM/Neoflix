import React, { useRef, useEffect } from 'react';
import MedicalCarousel from './StoryCarousel';
import AutoFitHeading from './AutoFitHeading';
import { VIDEO_CONTROLS_HIDDEN_CSS, HEADLINE_FONT_SIZE, HEADLINE_LINE_HEIGHT } from './story.styles';

export default function MedicalDesktopLayout({
  sectionRef,
  layoutKey,
  sectionState,
  isTabletLayout,
  isLandscapeTablet,
  isRotating,
  // config
  blurVideos,
  headlines,
  mainVideos,
  PunchOutBand,
  header,
  // visibility
  headerVisible,
  videoVisible,
  captionsVisible,
  // measurements
  headerHeight,
  collectionTop,
  videoAndCaptionTop,
  navbarHeight,
  // interaction
  isPaused,
  hoveredIndex,
  interactionsEnabled,
  // state
  currentVideo,
  barKey,
  outlineFullOpacity,
  highlightOutlineFullOpacity,
  disableTransitions,
  // derived
  safeVideoHover,
  safeHoveredIndex,
  shouldTransition,
  shouldAnimate,
  isActive,
  isVideoLeft,
  bandWidth,
  bandHeight,
  cutoutWidth,
  gap,
  videoHeight,
  videoContainerWidth,
  captionContainerWidth,
  videoOffscreenTransform,
  captionOffscreenTransform,
  isNudging,
  gantryFrameStyle,
  // refs
  videoContainerRef,
  headerRef,
  videoAnchorRef,
  captionRef,
  contentAnchorRef,
  // handlers
  handleHover,
  handleHoverEnd,
  handleBarEnd,
  handleVideoHover,
  onCarouselReady,
  handleTabletCarouselChange,
  handleLandscapeTabletCaptionClick,
  handleLandscapeTabletTouchStart,
  handleLandscapeTabletTouchEnd,
  navigateToSection,
}) {
  const lineRef = useRef(null);
  const lineCircle1Ref = useRef(null);
  const lineCircle2Ref = useRef(null);
  const lineRafRef = useRef(null);

  // Sync mask circles on the horizontal line with SectionDotNav arrow
  // buttons. The buttons only move when the page scrolls (the dot nav
  // tracks the active carousel) or the viewport resizes, and ScrollSnap
  // announces every dot-nav write via 'scrollsnap:dotnav-sync'. Reacting
  // to that event replaces the previous free-running rAF loop, which
  // did a document-wide querySelectorAll plus three getBoundingClientRect
  // calls per frame, per mounted section, for the whole session.
  useEffect(() => {
    const lineRendered =
      sectionState !== 'idle' && sectionState !== 'cleaned' &&
      !isTabletLayout && !isLandscapeTablet;
    if (!lineRendered) return undefined;

    const refs = [lineCircle1Ref, lineCircle2Ref];
    // Self-settling sync: run per-frame while the measured geometry is
    // still moving (the section's entrance animation translates the
    // line for a couple of seconds after mount — a one-shot sync left
    // the punch-outs stranded where the buttons USED to be), then go
    // to sleep once positions have been stable, and wake on the dot
    // nav's scroll broadcasts or a resize.
    let stableFrames = 0;
    let lastKey = '';
    const sync = () => {
      const svg = lineRef.current;
      if (!svg) {
        lineRafRef.current = null;
        return;
      }
      const sRect = svg.getBoundingClientRect();
      const buttons = document.querySelectorAll('.arrow-btn');
      let key = `${sRect.left.toFixed(1)},${sRect.top.toFixed(1)}`;
      for (let i = 0; i < refs.length; i++) {
        const circleEl = refs[i].current;
        const btn = buttons[i];
        if (!circleEl || !btn) continue;
        if (btn.classList.contains('arrow-hidden')) {
          circleEl.setAttribute('r', '0');
          key += ',h';
          continue;
        }
        const bRect = btn.getBoundingClientRect();
        circleEl.setAttribute('cx', bRect.left + bRect.width / 2 - sRect.left);
        circleEl.setAttribute('cy', bRect.top + bRect.height / 2 - sRect.top);
        // The 1.1 factor pre-covers the button's :hover scale(1.1), so
        // the punch-out never lags a hover that happens between events.
        circleEl.setAttribute('r', (Math.max(bRect.width, bRect.height) / 2) * 1.1 + 2);
        key += `,${bRect.left.toFixed(1)},${bRect.top.toFixed(1)}`;
      }
      if (key === lastKey) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
        lastKey = key;
      }
      // ~12 stable frames (~200ms) means everything has settled;
      // stop looping and wait for the next wake event.
      lineRafRef.current = stableFrames < 12 ? requestAnimationFrame(sync) : null;
    };
    const wake = () => {
      stableFrames = 0;
      if (!lineRafRef.current) lineRafRef.current = requestAnimationFrame(sync);
    };

    wake();
    window.addEventListener('scrollsnap:dotnav-sync', wake);
    window.addEventListener('resize', wake, { passive: true });
    // The caption card (this svg's positioning parent) slides 200px on
    // its own internal timing (captionsVisible), and other content
    // staggers in too — none of which raises a scroll or resize. CSS
    // transition/animation lifecycle events are the universal "something
    // is moving" signal, so any of them re-wakes the tracking loop; it
    // goes back to sleep ~200ms after geometry stops changing.
    const motionEvents = ['transitionrun', 'transitionstart', 'transitionend', 'animationstart', 'animationend'];
    for (const type of motionEvents) {
      document.addEventListener(type, wake, { capture: true, passive: true });
    }
    return () => {
      if (lineRafRef.current) cancelAnimationFrame(lineRafRef.current);
      lineRafRef.current = null;
      window.removeEventListener('scrollsnap:dotnav-sync', wake);
      window.removeEventListener('resize', wake);
      for (const type of motionEvents) {
        document.removeEventListener(type, wake, { capture: true });
      }
    };
  }, [sectionState, isTabletLayout, isLandscapeTablet]);

  // Horizontal centring of the two halves.
  //
  // Both halves hang off the same 50% line with a symmetric 20px offset,
  // but they are NOT the same width: the video column is 480 and the
  // caption column 444. A symmetric split therefore leaves 480-444 = 36px
  // more empty space on the caption side, putting the composition's centre
  // 18px left of the viewport's (measured: 454px left void vs 490px right
  // at 1908px wide, and it never scales with the viewport because it is a
  // pure width difference). Transferring half the difference across the
  // axis centres the pair while preserving the 40px gutter between them.
  //
  // The header frame joins the video side here too — it used to hang at
  // gap/2 (16px), leaving the headline inset 4px from the card it labels.
  //
  // Tablet layouts keep the old split: their columns are sized differently
  // (captions can be WIDER than the video there), so this correction
  // doesn't apply.
  const axisSkew = isTabletLayout || isLandscapeTablet ? 0 : (480 - 444) / 2;
  const videoAxis = `calc(50% + ${20 - axisSkew}px)`;
  const captionAxis = `calc(50% + ${20 + axisSkew}px)`;
  return (
    <div
      key={layoutKey}
      ref={sectionRef}
      className="h-screen w-full relative overflow-hidden"
      style={{
        opacity: sectionState === 'idle' || sectionState === 'cleaned' ? 0 : 1,
        transition: 'opacity 0.3s ease',
        paddingTop: isTabletLayout ? 16 : 0
      }}
    >
      <style>{VIDEO_CONTROLS_HIDDEN_CSS}</style>
      {/* Full-bleed blur-video deck was removed — MedicalSection.jsx now
          publishes its current carousel index through useBackdropTarget
          so the single site-wide BackdropProvider renders it. One
          backdrop layer for the whole site means no more duplicate
          decks sliding side-by-side during route transitions. */}
      {/* Header on tablet: render above the carousel */}
      {isTabletLayout && (
        <div
          ref={headerRef}
          data-testid="header-frame-tablet"
          className="header-frame-tablet"
          style={{
            position: 'relative',
            width: 'min(92vw, clamp(260px, 60vh, 480px))',
            background: 'none',
            zIndex: 20,
            opacity: headerVisible ? 1 : 0,
            margin: '0 auto 24px',
            transition: shouldTransition ? (headerVisible ? 'opacity 1.2s ease' : 'none') : 'none'
          }}
        >
          <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.2,
              color: '#fff',
              margin: 0,
              textShadow: [
                '0 4px 32px rgba(0,0,0,0.22)',
                '0 2px 16px rgba(0,0,0,0.18)',
                '0 1px 2px rgba(0,0,0,0.12)',
                '0 0px 1px rgba(0,0,0,0.18)',
                '0 0px 8px rgba(82,156,156,0.10)'
              ].join(', '),
              textAlign: 'left',
              width: '100%'
            }}>
              <span style={{ opacity: headerVisible ? 1 : 0, transition: shouldTransition ? 'opacity 1.2s ease' : 'none' }}>{header.line1}</span>
              {header.line1suffix ? (
                <span style={{ opacity: headerVisible ? 1 : 0, transition: shouldTransition ? 'opacity 1.2s ease 0.6s' : 'none' }}>{header.line1suffix}</span>
              ) : (
                <br />
              )}
              <span style={{ opacity: headerVisible ? 1 : 0, color: '#48c1c4', transition: shouldTransition ? 'opacity 1.2s ease 0.6s' : 'none' }}>{header.line2highlight}</span>
              <span style={{ opacity: headerVisible ? 1 : 0, transition: shouldTransition ? 'opacity 1.2s ease 0.6s' : 'none' }}>{header.line2suffix}</span>
              <br />
              <span style={{ opacity: headerVisible ? 1 : 0, transition: shouldTransition ? 'opacity 1.2s ease 0.6s' : 'none' }}>{header.line3}</span>
              {header.line4 && (
                <>
                  <br />
                  <span style={{ opacity: headerVisible ? 1 : 0, transition: shouldTransition ? 'opacity 1.2s ease 0.6s' : 'none' }}>{header.line4}</span>
                </>
              )}
            </h2>
          </div>
        </div>
      )}
      {/* Foreground content: flex row (desktop) or column (tablet) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: isTabletLayout ? 'auto' : bandHeight,
        display: 'flex',
        flexDirection: isTabletLayout ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isTabletLayout ? 32 : 0,
        zIndex: 20,
      }}>
        {/* Spacer (centered) */}
        <div
          data-testid="spacer"
          className="spacer"
          style={{
            position: 'absolute',
            left: '50%',
            top: collectionTop,
            width: 40,
            height: headerHeight + gap + videoHeight,
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 0, 0)',
            pointerEvents: 'none',
            zIndex: 10,
            display: isTabletLayout ? 'none' : 'block',
          }}
        />
        {/* Video Anchor (now contains cookiecutter and video container) */}
        <div
          ref={videoAnchorRef}
          data-testid="video-anchor"
          data-dot-nav-target
          style={{
            position: isTabletLayout ? 'relative' : 'absolute',
            ...(isTabletLayout
              ? {}
              : isVideoLeft
                ? { left: videoAxis }
                : { right: videoAxis }),
            top: isTabletLayout ? 'auto' : videoAndCaptionTop,
            width: videoContainerWidth,
            maxWidth: isTabletLayout ? '90vw' : 480,
            height: isTabletLayout ? 'auto' : videoHeight,
            aspectRatio: isTabletLayout ? '3 / 2' : undefined,
            opacity: 1,
            pointerEvents: 'none',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: isTabletLayout ? '0 auto' : undefined,
          }}
        >
          {/* PunchOutBand: sibling to video container */}
          {shouldTransition && (
            <div style={{
              position: 'absolute',
              ...(isVideoLeft ? { left: 0 } : { right: 0 }),
              top: 0,
              width: bandWidth,
              height: bandHeight,
              zIndex: 1,
              pointerEvents: 'none',
              transition: isNudging
                ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
                : 'transform 1.5s cubic-bezier(0.4,0,0.2,1), opacity 1.5s ease',
              transform: safeVideoHover
                ? 'translateY(-12px)'
                : videoVisible
                  ? 'translateX(0)'
                  : videoOffscreenTransform,
              opacity: videoVisible ? 0.4 : 0,
              mixBlendMode: 'screen'
            }}>
              <PunchOutBand
                bandColor="#edf2f8"
                bandHeight={bandHeight}
                bandWidth={bandWidth}
              />
            </div>
          )}
          {/* Gantry Frame: contains only the video container now */}
          {shouldTransition && (
            <div
              className="video-gantry-frame"
              data-section-inactive={!shouldTransition}
              style={{
                ...gantryFrameStyle,
                position: isTabletLayout ? 'relative' : 'absolute',
                ...(isTabletLayout
                  ? {}
                  : isVideoLeft
                    ? { left: 0 }
                    : { right: 0 }),
                top: isTabletLayout ? 'auto' : 0,
                zIndex: 3,
                pointerEvents: 'auto'
              }}
            >
            {/* Targeting Outline Animation */}
            <div
              className="target-outline"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: '3px solid white',
                borderRadius: 16,
                pointerEvents: 'none',
                boxSizing: 'border-box',
                transform: safeVideoHover ? 'scale(1)' : 'scale(1.08)',
                opacity: safeVideoHover ? (outlineFullOpacity ? 0.9 : 0.4) : 0,
                transition: shouldTransition ? [
                  safeVideoHover
                    ? 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
                    : 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                  outlineFullOpacity
                    ? 'opacity 0.1s cubic-bezier(.4,2,.6,1)'
                    : safeVideoHover
                    ? 'opacity 0.2s cubic-bezier(.4,0,.2,1) 0.2s'
                    : 'opacity 0.13s'
                ].join(', ') : 'none',
                zIndex: 10
              }}
            />
            {/* Video Frame (no hover transform or border) */}
            <div
              data-testid="video-frame"
              className="video-frame"
              style={{
                position: isTabletLayout ? 'relative' : 'absolute',
                left: isTabletLayout ? 'auto' : 0,
                top: isTabletLayout ? 'auto' : 0,
                width: '100%',
                height: isTabletLayout ? 'auto' : '100%',
                aspectRatio: isTabletLayout ? '3 / 2' : undefined,
                zIndex: 3,
                background: 'none',
                borderRadius: 16,
                overflow: 'hidden',
                border: 'none',
                boxShadow: '0 0 0 1px var(--edge-1d)',
                opacity: shouldTransition ? (videoVisible ? 1 : 0) : 0, // Always hide when not transitioning
                transition: shouldTransition ? 'opacity 1.5s ease' : 'none !important'
              }}
              ref={videoContainerRef}
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
                enableTouchNavigation={isLandscapeTablet}
                onTouchChange={handleTabletCarouselChange}
                sectionActive={sectionState === 'entering' || sectionState === 'active'}
                onCarouselClick={navigateToSection}
              />
            </div>
          </div>
          )}
        </div>
        {/* Video Anchor (positioning reference) */}
        <div
          data-testid="video-anchor-ref"
          style={{
            position: 'absolute',
            ...(isVideoLeft
              ? { left: videoAxis }
              : { right: videoAxis }),
            top: videoAndCaptionTop,
            width: 480,
            height: videoHeight,
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        {/* Caption Anchor with entrance animation */}
        <div
          className="caption-anchor"
          style={{
            position: isTabletLayout ? 'relative' : 'absolute',
            ...(isTabletLayout
              ? {}
              : isVideoLeft
                ? { right: captionAxis }
                : { left: captionAxis }),
            top: isTabletLayout ? 'auto' : videoAndCaptionTop,
            width: captionContainerWidth,
            maxWidth: isTabletLayout ? '90vw' : 444,
            height: isTabletLayout ? 'auto' : videoHeight,
            display: 'flex',
            alignItems: isTabletLayout ? 'stretch' : 'center',
            justifyContent: isTabletLayout ? 'flex-start' : 'center',
            zIndex: 20,
            transition: shouldTransition ? (captionsVisible ? 'opacity 0.5s ease' : 'none') : 'none',
            opacity: captionsVisible ? 1 : 0,
            margin: isTabletLayout ? '0 auto' : undefined,
          }}
        >
          {/* Caption Section (centered inside caption anchor) */}
          <div
            ref={captionRef}
            className="MedicalSection-caption-area flex flex-col items-start justify-center"
            data-testid="MedicalSection-caption-area"
            style={{
              maxWidth: isTabletLayout ? '100%' : 520,
              width: isTabletLayout ? '100%' : 'auto',
              marginLeft: 0,
              paddingLeft: 0,
            }}
          >
            <div style={{ position: 'relative', display: 'grid', gridTemplateRows: `repeat(${headlines.length}, 1fr)`, width: 'auto', marginLeft: 0, paddingLeft: 0 }}>
              {sectionState !== 'idle' && sectionState !== 'cleaned' && (
                <>
                  {/* Targeting outline container */}
                  <div
                    className="absolute"
                    style={{
                      top: 0,
                      left: '50%',
                      width: isTabletLayout ? '100%' : 444,
                      height: `calc(100% / ${headlines.length})`,
                      transform: `translateX(-50%) translateY(${currentVideo * 100}%)`,
                      willChange: 'transform',
                      zIndex: 5,
                      pointerEvents: 'none',
                      transition: shouldTransition ? 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                      display: isTabletLayout ? 'none' : undefined, // Only hide for portrait tablet
                    }}
                  >
                    {/* Targeting outline */}
                    <div
                      className="absolute inset-0 transition-all duration-700 ease"
                      style={{
                        border: '3px solid white',
                        borderRadius: 10,
                        mixBlendMode: 'screen',
                        transform: safeHoveredIndex === currentVideo ? 'scale(1)' : 'scale(1.08, 1.3)',
                        transition: shouldTransition ? [
                          safeHoveredIndex === currentVideo
                            ? 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
                            : 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                          highlightOutlineFullOpacity
                            ? 'opacity 0.1s cubic-bezier(.4,2,.6,1)'
                            : safeHoveredIndex === currentVideo
                            ? 'opacity 0.33s cubic-bezier(.4,0,.2,1) 0.2s'
                            : 'opacity 0.13s'
                        ].join(', ') : 'none',
                        opacity: (safeHoveredIndex === currentVideo || (isLandscapeTablet && hoveredIndex === null)) ? (highlightOutlineFullOpacity ? 0.9 : 0.4) : 0
                      }}
                    />
                    {/* Highlighter rectangle with horizontal line */}
                    <div
                      className="absolute rounded-xl pointer-events-none"
                      style={{
                        top: 0,
                        height: '100%',
                        width: isTabletLayout ? '100%' : 444,
                        left: 0,
                        paddingLeft: 24,
                        paddingRight: 24,
                        background: (safeHoveredIndex === currentVideo || (isLandscapeTablet && hoveredIndex === null)) ? 'rgba(228,228,228,1)' : 'rgba(232,232,232,1)',
                        borderRadius: 10,
                        boxShadow: (safeHoveredIndex === currentVideo || (isLandscapeTablet && hoveredIndex === null)) ? '1px 1px 2px 0px rgba(0,0,0,0.5)' : '1px 1px 2px 0px rgba(0,0,0,0.25)',
                        opacity: captionsVisible ? 1 : 0,
                        transform: captionsVisible ? 'translate3d(0,0,0)' : (isVideoLeft ? 'translateX(-200px)' : 'translateX(200px)'),
                        transition: shouldTransition
                          ? `color 0.25s, box-shadow 0.25s, background 0.25s, opacity 1.2s ease, transform 1.2s cubic-bezier(0.4,0,0.2,1)`
                          : 'none',
                        zIndex: 30
                      }}
                    >
                      <div
                        className="absolute pointer-events-none overflow-hidden"
                        style={{
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 10,
                        }}
                      >
                        {/* Loading Bar */}
                        <div
                          key={barKey}
                          className="absolute left-0 bottom-0 h-[5px]"
                          style={{
                            background: 'rgba(82,156,156,1)',
                            animation: `grow-overflow 7000ms linear forwards`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                            width: '115%',
                          }}
                          onAnimationEnd={handleBarEnd}
                        />
                      </div>
                      {/* Horizontal line - SVG with mask to punch out arrow buttons */}
                      {!(isTabletLayout || isLandscapeTablet) && (
                        <svg
                          ref={lineRef}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: isVideoLeft ? 0 : '100%',
                            width: isVideoLeft ? '100vw' : '100vw',
                            height: 80,
                            pointerEvents: 'none',
                            transform: isVideoLeft ? 'translateY(-50%) translateX(-100%)' : 'translateY(-50%)',
                            overflow: 'visible',
                          }}
                        >
                          <defs>
                            <mask id="desktop-line-mask">
                              <rect width="100%" height="100%" fill="white" />
                              <circle ref={lineCircle1Ref} cx="0" cy="0" r="0" fill="black" />
                              <circle ref={lineCircle2Ref} cx="0" cy="0" r="0" fill="black" />
                            </mask>
                          </defs>
                          <rect
                            x="0"
                            y="37.5"
                            width="100%"
                            height="5"
                            fill="#e0e0e0"
                            opacity="0.2"
                            style={{ mixBlendMode: 'screen' }}
                            mask="url(#desktop-line-mask)"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </>
              )}
              {headlines.map((headline, i) => (
                <button
                  key={i}
                  onMouseEnter={interactionsEnabled && !isLandscapeTablet ? () => handleHover(i) : undefined}
                  onMouseLeave={interactionsEnabled && !isLandscapeTablet ? handleHoverEnd : undefined}
                  onClick={interactionsEnabled ? () => navigateToSection?.(i) : undefined}
                  onTouchStart={interactionsEnabled && isLandscapeTablet ? () => handleLandscapeTabletTouchStart(i) : undefined}
                  onTouchEnd={interactionsEnabled && isLandscapeTablet ? handleLandscapeTabletTouchEnd : undefined}
                  className={`relative ${isVideoLeft ? 'text-left' : 'text-right'} py-3 rounded-xl`}
                  style={{
                    display: 'block',
                    maxWidth: isTabletLayout ? '100%' : 480,
                    minWidth: isTabletLayout ? '0px' : 320,
                    width: '100%',
                    paddingLeft: 24,
                    paddingRight: 24,
                    zIndex: 40,
                    cursor: interactionsEnabled ? 'pointer' : 'default',
                    opacity: captionsVisible ? 1 : 0,
                    transform: captionsVisible ? 'translate3d(0,0,0)' : captionOffscreenTransform,
                    transition: shouldTransition
                      ? (captionsVisible
                        ? `transform 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 600}ms, opacity 1.2s ease ${i * 600}ms`
                        : 'none')
                      : 'none'
                  }}
                >
                  <p className={`m-0 ${isVideoLeft ? 'text-left' : 'text-right'} text-2xl leading-tight`} style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '-0.5px',
                    color:
                      safeHoveredIndex === i
                        ? '#2D6A6A'
                        : currentVideo === i
                        ? '#2a2323'
                        : '#bdbdbd',
                    mixBlendMode:
                      safeHoveredIndex === i
                        ? 'normal'
                        : currentVideo === i
                        ? 'normal'
                        : 'screen',
                    transition: shouldTransition ? 'color 0.6s, transform 0.3s' : 'none',
                    transform: safeHoveredIndex === i ? 'translateY(-1px)' : 'translateY(0)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}>
                    {headline.firstLine}
                    <br />
                    {headline.secondLine}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Header Frame with entrance animation */}
      <div
        ref={headerRef}
        data-testid="header-frame"
        className="header-frame"
        style={{
          position: 'absolute',
          ...(isVideoLeft
            ? { left: videoAxis }
            : { right: videoAxis }),
          top: collectionTop,
          width: cutoutWidth,
          background: 'none',
          zIndex: 20,
          transition: shouldTransition ? (headerVisible ? 'opacity 2.25s ease' : 'none') : 'none',
          opacity: headerVisible ? 1 : 0,
        }}
      >
        <div style={{ width: cutoutWidth, display: 'flex', alignItems: isVideoLeft ? 'flex-end' : 'flex-start', justifyContent: isVideoLeft ? 'flex-end' : 'flex-start', marginRight: 0 }}>
          <h2 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: isLandscapeTablet ? HEADLINE_FONT_SIZE.landscapeTablet : HEADLINE_FONT_SIZE.desktop,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: HEADLINE_LINE_HEIGHT,
            color: '#fff',
            margin: 0,
            marginBottom: 32,
            textShadow: [
              '0 4px 32px rgba(0,0,0,0.22)',
              '0 2px 16px rgba(0,0,0,0.18)',
              '0 1px 2px rgba(0,0,0,0.12)',
              '0 0px 1px rgba(0,0,0,0.18)',
              '0 0px 8px rgba(82,156,156,0.10)'
            ].join(', '),
            alignSelf: isVideoLeft ? 'flex-end' : 'flex-start',
            paddingLeft: 0,
            textAlign: isVideoLeft ? 'right' : 'left',
            width: '100%',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}>
            <span
              style={{
                transition: shouldTransition ? 'opacity 2.25s ease' : 'none',
                opacity: headerVisible ? 1 : 0,
              }}
            >
              {header.line1}
            </span>
            {header.line1suffix ? (
              <span
                style={{
                  transition: shouldTransition ? 'opacity 2.25s ease 1.125s' : 'none',
                  opacity: headerVisible ? 1 : 0,
                }}
              >
                {header.line1suffix}
              </span>
            ) : (
              <br />
            )}
            <span
              style={{
                transition: shouldTransition ? 'opacity 2.25s ease 1.125s' : 'none',
                opacity: headerVisible ? 1 : 0,
                color: '#48c1c4'
              }}
            >
              {header.line2highlight}
            </span>
            <span
              style={{
                transition: shouldTransition ? 'opacity 2.25s ease 1.125s' : 'none',
                opacity: headerVisible ? 1 : 0,
              }}
            >
              {header.line2suffix}
            </span>
            <br />
            <span
              style={{
                transition: shouldTransition ? 'opacity 2.25s ease 1.125s' : 'none',
                opacity: headerVisible ? 1 : 0,
              }}
            >
              {header.line3}
            </span>
            {header.line4 && (
              <>
                <br />
                <span
                  style={{
                    transition: shouldTransition ? 'opacity 2.25s ease 1.125s' : 'none',
                    opacity: headerVisible ? 1 : 0,
                  }}
                >
                  {header.line4}
                </span>
              </>
            )}
          </h2>
        </div>
      </div>
    </div>
  );
}
