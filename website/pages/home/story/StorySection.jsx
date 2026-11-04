import React, { useCallback } from 'react';
import { useMedicalSection } from './useStorySection.jsx';
import MedicalMobileLayout from './StoryPhoneLayout';
import MedicalTabletLayout from './StoryTabletLayout';
import StoryDesktopLayout from './StoryDesktopLayout';
import StoryLandscapeTabletLayout from './StoryLandscapeTabletLayout';
import { useBackdropTarget } from '../../../shared/backdrop/useBackdrop';
import { MEDICAL_PRESSURE_DECK, MEDICAL_REFLECTION_DECK } from '../../../shared/backdrop/decks';
import useTransitionNavigate from '../../../lib/hooks/useTransitionNavigate';
import { useLit } from '../../../shared/index/IndexContext';

const DECK_BY_STORY = {
  pressure: MEDICAL_PRESSURE_DECK,
  reflection: MEDICAL_REFLECTION_DECK,
};

const MedicalSection = ({ inView, sectionRef, story = 'pressure' }) => {
  const state = useMedicalSection({ inView, story });
  const { currentVideo, hoveredIndex, interactionsEnabled, sectionTargets } = state;

  const transitionNavigate = useTransitionNavigate();
  // Each caption/video is a deep-link into the corresponding /neoflix
  // section. Captions and videos map 1:1 to the page's scroll anchors
  // (see data/neoflixSections.js section ids), turning the carousel into
  // a reverse-funnel entry point for the long-form article.
  const navigateToSection = useCallback((idx) => {
    const target = sectionTargets?.[idx];
    if (!target) return;
    transitionNavigate(`/neoflix#${target}`);
  }, [sectionTargets, transitionNavigate]);

  // Publish this story's current carousel top into Home's y-stack cell.
  // The two stories own independent cells; they can't clobber each
  // other, so each publishes unconditionally while mounted. Hover overrides the
  // carousel's current index when interactions are enabled.
  const safeHover = interactionsEnabled ? hoveredIndex : null;
  const topIdx = safeHover !== null ? safeHover : currentVideo;
  useBackdropTarget(`medical-${story}`, {
    kind: 'video',
    deck: DECK_BY_STORY[story],
    topIdx,
  });

  // The navbar index follows the film: the beat on screen is lit, with
  // the papers that prove it and the parts of the loop it leads to.
  useLit(inView && sectionTargets?.[topIdx] ? `beat:${sectionTargets[topIdx]}` : null);

  if (state.isMobile) {
    return <MedicalMobileLayout {...state} sectionRef={sectionRef} navigateToSection={navigateToSection} />;
  }

  if (state.isTabletLayout) {
    return <MedicalTabletLayout {...state} sectionRef={sectionRef} navigateToSection={navigateToSection} />;
  }

  // Landscape tablets keep the original Framer-era layout (scaled to 0.7,
  // touch handlers); a real pointer gets the editorial desktop layout.
  if (state.isLandscapeTablet) {
    return <StoryLandscapeTabletLayout {...state} sectionRef={sectionRef} navigateToSection={navigateToSection} />;
  }

  return <StoryDesktopLayout {...state} story={story} sectionRef={sectionRef} navigateToSection={navigateToSection} />;
};

export default MedicalSection;
