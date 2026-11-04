/**
 * The frame every library page shares. It owns the scroll (pages render
 * inside RouteSlider's fixed wrapper), puts the library strip and the
 * path bar at the top and the trail at the bottom, and paints the calm
 * page colour instead of the footage backdrop.
 */
import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackdropTarget } from '../../shared/backdrop/useBackdrop';
import LibraryBar from '../ui/LibraryBar';
import PathBar from '../ui/PathBar';
import TrailDock from '../ui/TrailDock';
import { Here } from '../ui/nav';
import '../system.css';

export default function Shell({ current = null, path = null, crumbs, children }) {
  const { pathname, search } = useLocation();
  const scroller = useRef(null);
  useBackdropTarget('toolbox', null);
  useBackdropTarget('blog', null);
  // A new record starts at its top. Typing in search doesn't jump.
  useLayoutEffect(() => {
    if (pathname !== '/search') scroller.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);
  return (
    <Here.Provider value={{ current, path: path?.id || null }}>
      <div className="sys" ref={scroller}>
        <LibraryBar crumbs={crumbs} />
        {path && current && <PathBar path={path} k={current} />}
        <main className="sys__page">{children}</main>
        <TrailDock />
      </div>
    </Here.Provider>
  );
}
