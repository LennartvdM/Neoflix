/**
 * /neoflix — native React. Uses the shared BlogPage layout; content
 * lives in data/neoflixPage.js and is unchanged.
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

const BlogPage = lazy(() => import('../../shared/BlogPage'));
const MobileNeoflixPage = lazy(() => import('./NeoflixPhone'));

export default function NeoflixPage({ scrollTo }) {
  const { width } = useTabletLayout();
  const mobile = width > 0 && width < 600;

  return (
    <Suspense fallback={null}>
      {mobile ? (
        <MobileNeoflixPage sections={sections} scrollTo={scrollTo} />
      ) : (
        <BlogPage sections={sections} scrollTo={scrollTo} pageTitle="Neoflix" />
      )}
    </Suspense>
  );
}
