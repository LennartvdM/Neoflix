import React from 'react';
import IntroSlide from './IntroSlide.jsx';
import { useTabletLayout } from '../../../lib/hooks/useTabletLayout';
import { TAGLINE } from '../content';

const IntroSection = ({ inView }) => {
  const { isTablet, isTouchDevice, width } = useTabletLayout();

  // No backdrop publish needed. Under BackdropEngine, Home's 4-cell
  // y-stack is laid out by position — Intro is cell 0 (camo) by
  // construction. The engine translates the stack by
  // scrollContainer.scrollTop / viewportHeight, so the camo cell
  // already shows when the user is parked on (or scrolling toward)
  // the intro slide. Nothing for this component to signal.

  let variant = 'desktop';
  if (isTouchDevice && width < 600) {
    variant = 'mobile';
  } else if (isTablet) {
    variant = 'tablet';
  }

  return (
    // data-nav-tone: a light slide — the slide nav switches to navy ink.
    <div data-nav-tone="dark" style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* The visible headline is animated display type built from divs;
          this gives the desktop homepage a real document outline. */}
      <h1 className="sr-only">Neoflix — Record. Reflect. Refine. {TAGLINE}</h1>
      <IntroSlide
        variant={variant}
        backgroundColor="#F5F9FC"
        fullHeight={false}
        subtitle={TAGLINE}
        cyclePaused={!inView}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, #FFFFFF, #F5F9FC)',
        }}
      />
      {/* The clickable scroll cue lives in ScrollSnap's overlay; a second
          cue here stacked on top of it and doubled an SVG-mask animation
          loop for no visual gain. */}
    </div>
  );
};

export default IntroSection;
