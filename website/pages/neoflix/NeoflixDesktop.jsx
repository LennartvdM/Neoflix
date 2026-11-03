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
import { successStories, networkPage } from './practice/toolbox';
import {
  TimeSensitive,
  LikeADance,
  TheCost,
  Sharpening,
  TeamDynamics,
  Perspectives,
} from './modules/Chapters';
import { FilmModule, ToolboxModule, StoriesModule, SignOffModule } from './modules/InPractice';

// Every chapter is its own composition (modules/), chosen for what it
// says — not one card template repeated. Keyed by content.js section id.
const MODULES = {
  'time-sensitive': TimeSensitive,
  'like-a-dance': LikeADance,
  cost: TheCost,
  sharpening: Sharpening,
  'team-dynamics': TeamDynamics,
  perspectives: Perspectives,
  contact: SignOffModule,
};

const essay = chapters.filter((s) => s.id !== 'contact');
const contact = chapters.find((s) => s.id === 'contact');
const stories = successStories();
const network = networkPage();

const PRACTICE = [
  { id: 'film', title: 'The film', Module: FilmModule },
  { id: 'the-toolbox', title: 'The toolbox', Module: ToolboxModule },
  { id: 'success-stories', title: 'Success stories', Module: StoriesModule },
];

// A section without a module (a chapter added to content.js later) falls
// back to BlogPage's standard rendering until it gets one.
const withModule = (section) => (MODULES[section.id] ? { ...section, Module: MODULES[section.id] } : section);

const SECTIONS = [...essay, ...PRACTICE, contact].filter(Boolean).map((s) => (s.Module ? s : withModule(s)));

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
