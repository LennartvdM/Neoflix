import React, { lazy, Suspense } from 'react';
import ScrollSnap from '../../shared/motion/ScrollSnap';
import SectionManager from '../../shared/motion/SectionManager';
import Footer from '../../shared/Footer';

// Eagerly load the intro section for fast initial paint
import IntroSection from './intro/IntroSection';
// The closing slide: two doors out (and six small ones, the clips).
import HomeExit from './HomeExit';

// Lazy load heavy sections to reduce initial bundle
const MedicalSection = lazy(() => import('./story/StorySection'));

const LazySection = ({ component: Component, ...props }) => (
  <Suspense fallback={<div style={{ width: '100%', height: '100%', background: '#1c3424' }} />}>
    <Component {...props} />
  </Suspense>
);

// Both story sections are the same component with different content
// (see medical/MedicalSection.data.js). They used to be two four-line
// files whose whole body was <MedicalSection variant="v2" />, which cost
// an extra chunk each and named the sections after their position
// instead of their subject.
const LazyPressure = (props) => <LazySection component={MedicalSection} story="pressure" {...props} />;
const LazyReflection = (props) => <LazySection component={MedicalSection} story="reflection" {...props} />;

const sections = [
  { name: 'intro', component: IntroSection },
  { name: 'pressure', component: LazyPressure },
  { name: 'reflection', component: LazyReflection },
  { name: 'exit', component: HomeExit },
];

// NOTE: the backdrop's HOME_CELLS array (backdrop/BackdropProvider.jsx)
// mirrors this sections list by position. Adding, removing or reordering
// a section here means updating HOME_CELLS to match.
export default function DesktopHome() {
  // Footer sits inside ScrollSnap so scrolling past the last section reveals
  // it. Its scroll-snap-align:end makes it a reachable snap target without
  // becoming its own full slide.
  return (
    <ScrollSnap>
      <SectionManager sections={sections} />
      <Footer />
    </ScrollSnap>
  );
}
