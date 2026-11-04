/**
 * Paths: guided sequences through the library. The slideshow's calm —
 * one thing, then the next — running on top of a repository that keeps
 * everything else one click away.
 *
 * A step is a record key (`kind:id`, see system/catalog.js). Order is
 * the order a reader needs it. system-check.mjs fails the build if a
 * step names a record that doesn't exist.
 */
export const PATHS = [
  {
    id: 'why',
    name: 'Why record at all',
    blurb: 'The argument the homepage tells, one film at a time: what goes wrong in the moment, and what watching it back changes.',
    steps: ['film:urgency', 'film:coordination', 'film:focus', 'film:skills', 'film:team', 'film:perspectives'],
  },
  {
    id: 'first-session',
    name: 'Your first session',
    blurb: 'From the decision to record to the end of the first review session, in the order you will need it.',
    steps: [
      'guidance:welcome/quick-start',
      'guidance:level-2-in-action/5.-preparation-and-consent',
      'guidance:level-2-in-action/7.-creating-footage',
      'guidance:level-2-in-action/10.-previewing',
      'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment',
      'guidance:level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair',
      'guidance:level-2-in-action/11.-lets-neoflix/11.1-getting-the-most-out-of-your-neoflix-session',
    ],
  },
  {
    id: 'evidence',
    name: 'The evidence',
    blurb: 'What we asked, in the order we asked it, from the first review in 2022 to two units learning from each other.',
    steps: ['paper:narrative', 'paper:providers', 'paper:recordreflectrefine', 'paper:practicalguidance', 'paper:drivingresearch', 'paper:internationalcollab'],
  },
];
