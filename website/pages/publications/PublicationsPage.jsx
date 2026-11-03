/**
 * /publications — picks the surface. Laptops get PublicationsDesktop (the
 * arc, on the board); phones get PublicationsPhone.
 *
 * Desktop and mobile are separate chunks; the width branch is
 * stable on first render, so only one is fetched per device.
 */
import React, { Suspense, lazy } from 'react';
import useTabletLayout from '../../lib/hooks/useTabletLayout';
import { sections, bundle } from './content';

const PublicationsDesktop = lazy(() => import('./PublicationsDesktop'));
const MobilePublicationsPage = lazy(() => import('./PublicationsPhone'));

export default function PublicationsPage() {
  const { width } = useTabletLayout();
  const mobile = width > 0 && width < 600;

  // The phone page receives the bundle directly; the desktop page reads it.
  return (
    <Suspense fallback={null}>
      {mobile ? (
        <MobilePublicationsPage sections={sections} bundle={bundle} />
      ) : (
        <PublicationsDesktop />
      )}
    </Suspense>
  );
}
