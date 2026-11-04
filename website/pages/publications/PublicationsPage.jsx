/**
 * /publications — native React. Uses the shared BlogPage layout;
 * content lives in data/publicationsPage.js and is unchanged. Video
 * backdrop is mounted at AppShell level (SharedVideoBackdrop).
 *
 * Desktop (BlogPage) and mobile are separate chunks; the width branch is
 * stable on first render, so only one is fetched per device.
 */
import React, { Suspense, lazy } from 'react';
import useTabletLayout from '../../lib/hooks/useTabletLayout';
import { sections, bundle } from './content';

const BlogPage = lazy(() => import('../../shared/BlogPage'));
const MobilePublicationsPage = lazy(() => import('./PublicationsPhone'));

export default function PublicationsPage() {
  const { width } = useTabletLayout();
  const mobile = width > 0 && width < 600;

  // Only this route passes a bundle; /neoflix shares BlogPage and has
  // no papers to hand over, so the download simply doesn't render there.
  return (
    <Suspense fallback={null}>
      {mobile ? (
        <MobilePublicationsPage sections={sections} bundle={bundle} />
      ) : (
        <BlogPage sections={sections} bundle={bundle} pageTitle="Publications" />
      )}
    </Suspense>
  );
}
