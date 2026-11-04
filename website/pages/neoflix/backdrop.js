/**
 * Neoflix Product Page Data
 *
 * The product/philosophy sections (time-sensitive, dance, cost, skills,
 * team, perspectives) live in neoflixSections.js for the /neoflix
 * route. The academic publications live in publicationsPage.js for
 * /publications. This file adds the page's video mappings.
 */
import { assetUrl } from '../../lib/utils/assetUrl';

export { sections } from './content';

// Video backdrop mapping for product sections
export const sectionToVideo = {
  'time-sensitive': assetUrl('/videos/blururgency.mp4'),
  'like-a-dance': assetUrl('/videos/blurcoordination.mp4'),
  'cost': assetUrl('/videos/blurfocus.mp4'),
  'sharpening': assetUrl('/videos/blurskills.mp4'),
  'team-dynamics': assetUrl('/videos/blurteam.mp4'),
  'perspectives': assetUrl('/videos/blurperspectives.mp4'),
  'contact': assetUrl('/videos/blurcoordination.mp4'),
};

// Video deck sources for preloading
export const deckSources = [
  assetUrl('/videos/blurcoordination.mp4'),
  assetUrl('/videos/blurfocus.mp4'),
  assetUrl('/videos/blurperspectives.mp4'),
  assetUrl('/videos/blurskills.mp4'),
  assetUrl('/videos/blurteam.mp4'),
  assetUrl('/videos/blururgency.mp4'),
];

