/**
 * The argument — the six beats, one per clip. This is the blueprint's
 * grid ("Neoflix — content blueprint", Brief tab) as data, and the one
 * place a beat's words live:
 *
 *   - the homepage captions are each beat's `claim` (pages/home/story)
 *   - /neoflix renders every hook of every beat (pages/neoflix)
 *   - paper pages point back to the beat they prove (`paper` ids)
 *
 * Three layers per beat, kept apart: `claim` is universal (true on any
 * workfloor), `inPractice` is neonatal, `proofs` are Leiden with a source.
 * Figures are written as the papers report them (blueprint voice rule 4)
 * and were checked against the PDFs on 2026-11-03.
 *
 * Copy is first-draft and expected to change; the structure is what's
 * settled. A hook with nothing in it doesn't render — leave a field out
 * rather than filling it with something weaker.
 *
 * Section ids are the old /neoflix anchors, kept so existing links (the
 * homepage captions, search results) still land on the right beat.
 */
import { assetUrl } from '../lib/utils/assetUrl';

// Paper keys → short labels used in citations. Order is publication order.
export const PAPERS = {
  narrative: { n: 1, year: 2022 },
  providers: { n: 2, year: 2024 },
  recordreflectrefine: { n: 3, year: 2024 },
  practicalguidance: { n: 4, year: 2024 },
  drivingresearch: { n: 5, year: 2024 },
  internationalcollab: { n: 6, year: 2026 },
};

const clip = (name) => ({
  video: assetUrl(`/videos/${name}.mp4`),
  blur: assetUrl(`/videos/blur${name}.mp4`),
  still: assetUrl(`/videos/stills/${name}.webp`),
});

export const ACTS = {
  problem: { headline: 'In the moment, only the patient matters.' },
  answer: { headline: 'Yet, reflection strengthens the next.' },
};

export const BEATS = [
  {
    id: 'time-sensitive',
    n: 1,
    name: 'Urgency',
    act: 'problem',
    clip: clip('urgency'),
    claim: 'Some work has to be done right now, and right the first time.',
    inPractice: 'Some babies are born before they can breathe on their own. There are a few minutes to fix that.',
    proofs: [
      { size: 'panel', text: 'In one of our studies, 8 of 20 infants born before 30 weeks were not breathing at birth.', paper: 'drivingresearch' },
      { size: 'line', text: 'Leiden’s unit has 25 beds and 600–650 admissions a year.', paper: 'recordreflectrefine' },
    ],
    witness: { caption: 'The delivery room, the wide shot.', film: 12 },
    exits: [
      { slug: 'welcome/who-is-this-for', plan: 'Start here · who this is for' },
      { slug: 'level-1-fundamentals/2.-planning-your-initiative', plan: '1.2 Decide what you are for' },
    ],
    papers: ['drivingresearch'],
  },
  {
    id: 'like-a-dance',
    n: 2,
    name: 'Coordination',
    act: 'problem',
    clip: clip('coordination'),
    claim: 'It takes several people doing different things at the same time.',
    inPractice: 'Five or six people around one small baby: airway, lines, monitor, drugs, the clock.',
    proofs: [
      {
        size: 'panel',
        text: 'Intubation commands meant different things to different people. A short film of what each command asks for fixed it; later sessions showed the confusion gone.',
        paper: 'recordreflectrefine',
      },
    ],
    witness: { caption: 'A head camera clipped on before the procedure.', film: 20 },
    exits: [
      { slug: 'level-1-fundamentals/2.-planning-your-initiative/2.1-pioneer-team', plan: '1.3 The pioneer team' },
      { slug: 'level-1-fundamentals/2.-planning-your-initiative/2.2-gaining-team-buy-in', plan: '1.4 Bringing the unit along' },
    ],
    papers: ['recordreflectrefine'],
  },
  {
    id: 'cost',
    n: 3,
    name: 'Focus',
    act: 'problem',
    clip: clip('focus'),
    claim: 'Everyone is watching their own hands. Afterwards, nobody can say exactly what happened.',
    inPractice: 'A stabilization is talked through afterwards, from memory and from notes written later.',
    proofs: [
      { size: 'line', text: 'Recall bias and incomplete notes limit what a debrief can learn.', paper: 'narrative' },
    ],
    instrument: 'narrowing-frame',
    exits: [
      { slug: 'level-2-in-action/8.-recording-during-the-intervention', plan: '2.3 In the room' },
      { slug: 'level-2-in-action/7.-creating-footage', plan: '2.4 Footage you can use' },
    ],
    papers: ['narrative'],
  },
  {
    id: 'sharpening',
    n: 4,
    name: 'Skills',
    act: 'answer',
    clip: clip('skills'),
    claim: 'If you record it, you can watch what happened instead of remembering it.',
    inPractice: 'Leiden has recorded every stabilization at birth since 2009, and intubations and lines since 2021.',
    proofs: [
      {
        size: 'panel',
        figure: '120',
        text: 'things worth changing came out of nine months of sessions:',
        breakdown: [
          ['84', 'colleagues doing the same thing differently'],
          ['20', 'something to teach'],
          ['10', 'a protocol or piece of equipment'],
          ['6', 'a question for research'],
        ],
        paper: 'recordreflectrefine',
      },
      { size: 'line', text: 'One finding became a study of its own: in infants who weren’t breathing, the vocal cords were closed 93% of the time they were ventilated.', paper: 'drivingresearch' },
    ],
    witness: { caption: 'Previewing the footage at the monitor.', film: 66 },
    instrument: 'twenty-rows',
    exits: [
      { slug: 'level-2-in-action/11.-lets-neoflix/11.4-unlocking-insights', plan: '3.5 What to look for' },
      { slug: 'level-2-in-action/13.1-the-neoflix-approach', plan: '4.2 Four kinds of change' },
    ],
    papers: ['recordreflectrefine', 'drivingresearch'],
  },
  {
    id: 'team-dynamics',
    n: 5,
    name: 'Team',
    act: 'answer',
    clip: clip('team'),
    claim: 'If you watch it with the people who were there, everyone sees the same thing for once.',
    inPractice: 'Thirty minutes, every other week, doctors and nurses together, one person chairing.',
    proofs: [
      { size: 'panel', text: 'In nine months, 101 of the unit’s 125 doctors and nurses came to at least one session, and 80 had themselves recorded.', paper: 'practicalguidance' },
      { size: 'line', text: '177 of 179 questionnaires afterwards were positive.', paper: 'practicalguidance' },
      { size: 'line', text: 'In 28 interviews, colleagues said it felt safe because consent was real and judgment was not allowed.', paper: 'providers' },
    ],
    witness: { caption: 'A session: the room watches, then talks.', film: 215 },
    instrument: 'retyped-sentence',
    film: true,
    exits: [
      { slug: 'level-2-in-action/11.-lets-neoflix/11.1-getting-the-most-out-of-your-neoflix-session', plan: '3.2 Running a session' },
      { slug: 'level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair', plan: '3.3 The chair' },
      { slug: 'level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment', plan: '3.4 The rules' },
      { slug: 'level-2-in-action/5.-preparation-and-consent', plan: '1.6 Consent' },
    ],
    papers: ['practicalguidance', 'providers'],
  },
  {
    id: 'perspectives',
    n: 6,
    name: 'Perspectives',
    act: 'answer',
    clip: clip('perspectives'),
    claim: 'If you watch it with people who do it differently, you notice what you do.',
    inPractice: 'Leiden and Vienna reviewed each other’s recordings.',
    proofs: [
      { size: 'panel', text: 'In five joint sessions between December 2022 and March 2024, the two units found 19 differences in how they work; 7 led to a change or a new insight.', paper: 'internationalcollab' },
      { size: 'line', text: 'Parents were invited to watch their own child’s stabilization and say what they needed.', paper: 'recordreflectrefine' },
    ],
    witness: { caption: 'Four units that record.' },
    exits: [
      { slug: 'level-1-fundamentals/4.-learning-from-success-stories', plan: '5.2 Four units' },
      { slug: 'level-3-growth/18.-expanding-your-video-program', plan: '5.3 Reviewing across units' },
    ],
    papers: ['internationalcollab'],
  },
];

export const beatById = (id) => BEATS.find((b) => b.id === id) || null;

/** Beats a paper proves, for the paper's "back to the beat" door. */
export const beatsForPaper = (paperId) => BEATS.filter((b) => b.papers.includes(paperId));

/**
 * A claim as two caption lines, broken at the word boundary nearest the
 * middle — the homepage captions' shape, derived rather than retyped.
 */
export function captionLines(sentence) {
  const words = sentence.split(' ');
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/**
 * The loop — the toolbox's five parts, the board's other axis. A beat's
 * exits hang in the column of the part their planned toolbox page belongs
 * to (`plan` numbering from the blueprint's toolbox outline: 1.x is Before
 * you record, 2.x Record, …; "Start here" sits at the start of the loop).
 */
export const LOOP = [
  { id: 'before', name: 'Before you record' },
  { id: 'record', name: 'Record' },
  { id: 'reflect', name: 'Reflect' },
  { id: 'refine', name: 'Refine' },
  { id: 'keep', name: 'Keep going' },
];

export function loopPartOf(plan) {
  if (/^start here/i.test(plan || '')) return 'before';
  const n = Number(/^(\d)\./.exec(plan || '')?.[1]);
  return LOOP[n - 1]?.id || null;
}
