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
import { STORIES } from '../home/story/story.data';

// This page is the homepage story told at length: its six chapters are
// the six homepage captions, in the same two acts — the problem
// (`pressure`) and the answer (`reflection`). So the acts and each
// chapter's opening statement come from the homepage's own data rather
// than being retyped: an act opens on its homepage headline, a chapter on
// the caption that links to it (sectionTarget). Change a caption there and
// the chapter that opens with it changes too.
const ACTS = [
  { id: 'in-the-moment', numeral: 'I', label: 'In the moment', story: 'pressure' },
  { id: 'reflection', numeral: 'II', label: 'Reflection', story: 'reflection' },
].map((act) => ({
  ...act,
  header: STORIES[act.story].header,
  sectionIds: STORIES[act.story].sectionTargets,
}));

const LEDES = Object.fromEntries(
  Object.values(STORIES).flatMap((story) =>
    story.headlines.map((h) => [h.sectionTarget, `${h.firstLine} ${h.secondLine}`])
  )
);

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
        <BlogPage sections={sections} scrollTo={scrollTo} pageTitle="Neoflix" page="neoflix" acts={ACTS} ledes={LEDES} />
      )}
    </Suspense>
  );
}
