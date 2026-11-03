/**
 * /neoflix — picks the surface. Laptops get NeoflixDesktop (the essay in
 * three acts, on the shared BlogPage layout); phones get NeoflixPhone.
 *
 * Also serves /contact via App.jsx — that route passes `scrollTo="contact"`
 * so the same page lands on the contact section. The video backdrop is
 * mounted once at AppShell level (SharedVideoBackdrop) and crossfades
 * based on the active section, independent of route slides.
 *
 * Desktop (BlogPage) and mobile are separate chunks; the width branch is
 * stable on first render, so only one is fetched per device.
 */
import React, { Suspense, lazy } from 'react';
import useTabletLayout from '../../lib/hooks/useTabletLayout';
import { sections } from './backdrop';
// The laptop page (three acts, the toolbox route, the film and the map)
// lives in NeoflixDesktop.jsx; phones get their own page.
const NeoflixDesktop = lazy(() => import('./NeoflixDesktop'));
const MobileNeoflixPage = lazy(() => import('./NeoflixPhone'));

export default function NeoflixPage({ scrollTo }) {
  const { width } = useTabletLayout();
  const mobile = width > 0 && width < 600;

  return (
    <Suspense fallback={null}>
      {mobile ? (
        <MobileNeoflixPage sections={sections} scrollTo={scrollTo} />
      ) : (
        <NeoflixDesktop scrollTo={scrollTo} />
      )}
    </Suspense>
  );
}
