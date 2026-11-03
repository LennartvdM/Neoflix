/**
 * /neoflix on a laptop: the homepage story told at length, then handed
 * over to the toolbox. Three acts:
 *
 *   I   In the moment — the problem (urgency, coordination, cost)
 *   II  Reflection    — the answer (skills, team, perspectives)
 *   III In practice   — Record, Reflect, Refine: the film, the toolbox as
 *                       a route, the units already doing it, and the
 *                       invitation to join them
 *
 * Acts I and II are the six homepage captions, so their openers and each
 * chapter's opening statement come from the homepage's own data
 * (story.data.js) rather than being retyped: change a caption there and
 * the chapter that opens with it changes too. Act III is read from the
 * toolbox's compiled manifest (practice/toolbox.js). The chapters' prose
 * stays in content.js, shared with the phone page, which this file
 * doesn't touch.
 */
import React from 'react';
import BlogPage from '../../shared/BlogPage';
import { STORIES } from '../home/story/story.data';
import { TAGLINE } from '../home/content';
import { sections as chapters } from './content';
import {
  ToolboxBridge,
  FilmBlock,
  ToolboxPath,
  SuccessStories,
  SignOff,
} from './practice/Practice';
import { toolboxLinksIn, successStories, networkPage } from './practice/toolbox';

// Each essay chapter ends with the toolbox pages its prose links to.
// Built once per chapter at module level so the component identity is
// stable across renders.
const withBridge = (section) => {
  const pages = toolboxLinksIn(section.content);
  if (!pages.length) return section;
  const After = () => <ToolboxBridge pages={pages} />;
  return { ...section, After };
};

const essay = chapters.filter((s) => s.id !== 'contact').map(withBridge);
const contact = chapters.find((s) => s.id === 'contact');
const stories = successStories();
const network = networkPage();

const PRACTICE = [
  { id: 'film', title: 'The film', Component: FilmBlock },
  { id: 'the-toolbox', title: 'The toolbox', Component: ToolboxPath },
  { id: 'success-stories', title: 'Success stories', Component: SuccessStories },
];

const SECTIONS = [...essay, ...PRACTICE, { ...contact, Component: SignOff }];

const ACTS = [
  { id: 'in-the-moment', numeral: 'I', label: 'In the moment', story: 'pressure' },
  { id: 'reflection', numeral: 'II', label: 'Reflection', story: 'reflection' },
]
  .map((act) => ({
    ...act,
    header: STORIES[act.story].header,
    sectionIds: STORIES[act.story].sectionTargets,
  }))
  .concat({
    id: 'in-practice',
    numeral: 'III',
    label: 'In practice',
    // The site's own three words (the homepage intro's Record, Reflect,
    // Refine — and the three phases of the toolbox's Level 2), with the
    // accent on the one this whole page argues for.
    header: { line1: 'Record,', line1suffix: ' ', line2highlight: 'Reflect,', line2suffix: '', line3: 'Refine.' },
    sectionIds: PRACTICE.map((s) => s.id),
  });

const LEDES = {
  ...Object.fromEntries(
    Object.values(STORIES).flatMap((story) =>
      story.headlines.map((h) => [h.sectionTarget, `${h.firstLine} ${h.secondLine}`])
    )
  ),
  // The site's tagline (its one home is pages/home/content.js).
  film: TAGLINE,
  // The toolbox welcome page's own heading.
  'the-toolbox': 'Elevate your medical practice.',
  // Level 1, chapter 4's title, without its number.
  'success-stories': `${(stories.chapter?.title || 'Learning from success stories').replace(/^\d+\.\s*/, '')}.`,
  // The opening line of the toolbox's closing page, the network invitation.
  contact: network?.excerpt || undefined,
};

export default function NeoflixDesktop({ scrollTo }) {
  return (
    <BlogPage
      sections={SECTIONS}
      scrollTo={scrollTo}
      pageTitle="Neoflix"
      page="neoflix"
      acts={ACTS}
      ledes={LEDES}
    />
  );
}
