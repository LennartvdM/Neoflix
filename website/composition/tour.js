/**
 * The tour: the story a newcomer is taken through, written for the space.
 *
 * Each stop says what to show (`at`) and what to say there; the
 * composition (composition/scene.js) turns `at` into weights, so every
 * stop is an arrangement of the whole screen. Scrolling moves along it
 * continuously: the screen holds on a stop while its words are read,
 * then re-assembles into the next, and the reader scrubs that, forward
 * or back.
 *
 * Two depths. A `core` stop is the argument: the screen dwells, the words
 * get room. A `skim` stop is something a newcomer only needs to know is
 * there (the papers, the toolbox's five columns): one line, a short hold,
 * on to the next. That is how the tour gets through 90 records in a few
 * minutes without pretending they're all equally important for a first
 * visit.
 *
 * The impatient and the returning aren't made to sit through it: the
 * `doors` take them to where they need to be (first stop, last stop, and
 * whenever they move faster than the story), and a reader who leaves
 * mid-tour picks it up where they left it.
 *
 * `at` is a record key, a list of keys (framed together), 'everything',
 * 'column:<loop id>' or 'region:<id>'. Figures are from system/content
 * (checked against the papers). Node-safe; system-check.mjs fails the
 * build when a stop points at a record that doesn't exist.
 */
export const CHAPTERS = [
  { id: 'moment', name: 'In the moment' },
  { id: 'back', name: 'Watching it back' },
  { id: 'evidence', name: 'The evidence' },
  { id: 'practice', name: 'Doing it yourself' },
];

export const TOUR = [
  {
    id: 'cover',
    at: 'everything',
    depth: 'core',
    title: 'Recording care, and watching it back together.',
    text: 'This is all of Neoflix, on one screen: six short films, the six papers behind them, and a toolbox for doing it in your own unit. Scroll, and the screen rearranges itself around each part of the story.',
    doors: true,
  },
  {
    id: 'urgency',
    chapter: 'moment',
    at: 'film:urgency',
    depth: 'core',
    title: 'Some babies are born before they can breathe on their own.',
    text: 'There are a few minutes to fix that, and it has to be right the first time. In one of the studies here, 8 of 20 infants born before 30 weeks weren’t breathing at birth.',
  },
  {
    id: 'coordination',
    chapter: 'moment',
    at: 'film:coordination',
    depth: 'core',
    title: 'Five or six people, one very small patient.',
    text: 'Airway, lines, monitor, drugs, the clock: everyone doing something different at the same moment. Even the words can mean different things to different people. In Leiden, the intubation commands did.',
  },
  {
    id: 'focus',
    chapter: 'moment',
    at: 'film:focus',
    depth: 'core',
    title: 'Everyone is watching their own hands.',
    text: 'So afterwards, nobody can say exactly what happened. The debrief runs on memory and on notes written later, and memory is not a recording.',
  },
  {
    id: 'skills',
    chapter: 'back',
    at: 'film:skills',
    depth: 'core',
    title: 'So record it.',
    text: 'Leiden has filmed every stabilisation at birth since 2009, and intubations and lines since 2021. Watching it back, you see what happened instead of what you remember.',
  },
  {
    id: 'team',
    chapter: 'back',
    at: 'film:team',
    depth: 'core',
    title: 'Then watch it together, with the people who were there.',
    text: 'Thirty minutes, every other week, doctors and nurses in one room and one person chairing. In nine months, 101 of the unit’s 125 doctors and nurses came at least once, and 177 of 179 questionnaires afterwards were positive.',
  },
  {
    id: 'perspectives',
    chapter: 'back',
    at: 'film:perspectives',
    depth: 'core',
    title: 'And with people who do it differently.',
    text: 'Leiden and Vienna reviewed each other’s recordings and found 19 differences in how they work; 7 led to a change or a new insight. You notice what you do when someone else does it another way.',
  },
  {
    id: 'papers',
    chapter: 'evidence',
    at: ['paper:narrative', 'paper:providers', 'paper:recordreflectrefine', 'paper:practicalguidance', 'paper:drivingresearch', 'paper:internationalcollab'],
    depth: 'skim',
    title: 'Every claim here rests on a paper.',
    text: 'Six studies, 2022 to 2026, each above the films it supports. You don’t need them to follow along; they’re here when you want to check.',
    open: 'paper:narrative',
  },
  {
    id: 'cords',
    chapter: 'evidence',
    at: 'paper:drivingresearch',
    depth: 'core',
    title: 'Sometimes a session asks a question nobody had asked.',
    text: 'Were a preterm baby’s vocal cords closed while the team was ventilating? Ultrasound in 20 infants under 30 weeks said yes: in those who weren’t breathing, a median 93% of the time.',
    open: 'paper:drivingresearch',
  },
  {
    id: 'toolbox',
    chapter: 'practice',
    at: 'region:practice',
    depth: 'skim',
    title: 'Below the films: how to do it yourself.',
    text: 'The toolbox: {pages} pages in five columns, in the order you’ll need them. Nobody reads it front to back, so here is the short version.',
    open: 'guidance:',
  },
  {
    id: 'before',
    chapter: 'practice',
    at: 'column:before',
    depth: 'skim',
    title: 'Before you record',
    text: 'Find a few trusted pioneers, set up real consent, and start safe, simple and small.',
    open: 'guidance:level-1-fundamentals/3.-safe-simple-and-small',
  },
  {
    id: 'record',
    chapter: 'practice',
    at: 'column:record',
    depth: 'skim',
    title: 'Record',
    text: 'Consent and case selection, which camera, steady footage and clear sound, and what to do with the files afterwards.',
    open: 'guidance:level-2-in-action/5.-preparation-and-consent',
  },
  {
    id: 'reflect',
    chapter: 'practice',
    at: 'column:reflect',
    depth: 'skim',
    title: 'Reflect',
    text: 'Preview the footage with the people who were filmed first. Then the session.',
    open: 'guidance:level-2-in-action/10.-previewing',
  },
  {
    id: 'safe',
    chapter: 'practice',
    at: 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment',
    depth: 'core',
    title: 'The one thing that decides whether it works.',
    text: 'It has to feel safe. In 28 interviews, staff said it did because consent was real and judgment was not allowed. Keeping it that way is the chair’s job.',
    open: 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment',
  },
  {
    id: 'refine',
    chapter: 'practice',
    at: 'column:refine',
    depth: 'skim',
    title: 'Refine',
    text: 'Take each finding through plan, do, check, act, and check the change on video.',
    open: 'guidance:level-2-in-action/12.-improving-care-through-the-neoflix-approach',
  },
  {
    id: 'keep',
    chapter: 'practice',
    at: 'column:keep',
    depth: 'skim',
    title: 'Keep going',
    text: 'Make it routine, then open it up to other units. And the loop starts again.',
    open: 'guidance:level-3-growth/17.-continuous-improvement',
  },
  {
    id: 'end',
    at: 'everything',
    depth: 'core',
    title: 'That’s the whole of it.',
    text: 'Films in the middle, the evidence above, the practice below. Nothing is ever off screen: open anything, and the rest makes room for it. What you have opened is marked in gold.',
    doors: true,
  },
];

/**
 * Where the impatient and the returning go instead. `path` walks one of
 * the library's paths (system/content/paths.js); 'look' leaves the
 * reader with everything on screen.
 */
export const DOORS = [
  { id: 'first-session', path: 'first-session', label: 'Start in your own unit', note: 'Your first session, step by step' },
  { id: 'evidence', path: 'evidence', label: 'Read the evidence', note: 'Six papers, in the order we asked' },
  { id: 'look', label: 'Look around on your own', note: 'Everything is on this screen; open what you like' },
];

/** Every record key a stop points at, for the build check. */
export function tourKeys() {
  const out = [];
  for (const s of TOUR) {
    if (Array.isArray(s.at)) out.push(...s.at);
    else if (s.at.includes(':') && !/^(column|region):/.test(s.at)) out.push(s.at);
    if (s.open) out.push(s.open);
  }
  return out;
}
