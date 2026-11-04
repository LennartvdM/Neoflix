/**
 * Homepage strings that exist in one place on purpose.
 *
 * TAGLINE is the hero subtitle. It used to be pasted in three files
 * (IntroSection's prop plus two component defaults), which meant a
 * "change the tagline" edit could hit any one of them and miss the
 * others. Import it — never retype it.
 *
 * WHERE THE REST OF THE HOMEPAGE COPY LIVES (two surfaces, edit BOTH):
 *   Desktop headlines/copy → components/sections/medical/MedicalSection.data.js
 *   Mobile panels (same sentences, different shape)
 *                         → components/mobile/MobileHome.jsx (MOBILE_PANELS)
 * The desktop and mobile homepages are separate trees. A copy change
 * made in only one of them ships a site that says different things on
 * phone and laptop.
 *
 * SEO title/description for the homepage → data/routeMeta.js ('/').
 */
export const TAGLINE = 'Improve patient care through video reflection.';
