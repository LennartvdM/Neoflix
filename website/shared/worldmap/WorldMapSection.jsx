import React from 'react';
import WorldMap from './WorldMap';

// Slide 4: full-bleed worldmap. The shared <WorldMap> handles the Framer
// mount and city-marker click → /toolbox/... slide-routing.
// The map is a pale sea, so it marks itself as a light slide for the
// home slide nav (ScrollSnap reads data-nav-tone).
export default function WorldMapSection() {
  return (
    <div data-nav-tone="dark" className="w-full h-full">
      <WorldMap className="w-full h-full" />
    </div>
  );
}
