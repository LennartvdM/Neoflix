/**
 * The six films — the clips the homepage plays — as records.
 *
 * A film is where a finding and a practice meet: each one is shown in
 * the session film, rests on findings from the papers, and leads to the
 * guidance that puts it into practice. Those links are written here,
 * once, and the library's graph (system/graph.js) is read off them.
 *
 * Node-safe: the build reads this file (routes, sitemap, checks), so no
 * assetUrl, no import.meta. `clip` is a file name; the React layer turns
 * it into URLs (system/media.js).
 *
 * `at` is where the moment sits in the session film, in seconds — only
 * where it is known. `findings` are sentences from the papers, checked
 * against the PDFs (2026-11-03); each names its paper. Copy is first
 * draft; the links are what's settled.
 */
// The session film the six clips come from (Vimeo, with Do Not Track on —
// keep dnt=1, CLAUDE.md rule 7). `at` below are seconds into it.
export const SESSION_FILM_SRC = 'https://player.vimeo.com/video/1031329353?h=055dbf5101&dnt=1';

export const FILMS = [
  {
    id: 'urgency',
    anchor: 'time-sensitive', // its section on /neoflix and the homepage caption's target
    name: 'Urgency',
    clip: 'urgency',
    claim: 'Some work has to be done right now, and right the first time.',
    caption: 'The delivery room, the wide shot.',
    inPractice: 'Some babies are born before they can breathe on their own. There are a few minutes to fix that.',
    at: 12,
    findings: [
      { paper: 'drivingresearch', text: 'In one of our studies, 8 of 20 infants born before 30 weeks were not breathing at birth.' },
      { paper: 'recordreflectrefine', text: 'Leiden’s unit has 25 beds and 600–650 admissions a year.' },
    ],
    guidance: ['welcome/who-is-this-for', 'level-1-fundamentals/2.-planning-your-initiative'],
  },
  {
    id: 'coordination',
    anchor: 'like-a-dance', // its section on /neoflix and the homepage caption's target
    name: 'Coordination',
    clip: 'coordination',
    claim: 'It takes several people doing different things at the same time.',
    caption: 'A head camera clipped on before the procedure.',
    inPractice: 'Five or six people around one small baby: airway, lines, monitor, drugs, the clock.',
    at: 20,
    findings: [
      { paper: 'recordreflectrefine', text: 'Intubation commands meant different things to different people. A short film of what each command asks for fixed it; later sessions showed the confusion gone.' },
    ],
    guidance: ['level-1-fundamentals/2.-planning-your-initiative/2.1-pioneer-team', 'level-1-fundamentals/2.-planning-your-initiative/2.2-gaining-team-buy-in'],
  },
  {
    id: 'focus',
    anchor: 'cost', // its section on /neoflix and the homepage caption's target
    name: 'Focus',
    clip: 'focus',
    claim: 'Everyone is watching their own hands. Afterwards, nobody can say exactly what happened.',
    caption: 'Inside the procedure.',
    inPractice: 'A stabilization is talked through afterwards, from memory and from notes written later.',
    at: null,
    findings: [
      { paper: 'narrative', text: 'Recall bias and incomplete notes limit what a debrief can learn.' },
    ],
    guidance: ['level-2-in-action/8.-recording-during-the-intervention', 'level-2-in-action/7.-creating-footage'],
  },
  {
    id: 'skills',
    anchor: 'sharpening', // its section on /neoflix and the homepage caption's target
    name: 'Skills',
    clip: 'skills',
    claim: 'If you record it, you can watch what happened instead of remembering it.',
    caption: 'Previewing the footage at the monitor.',
    inPractice: 'Leiden has recorded every stabilization at birth since 2009, and intubations and lines since 2021.',
    at: 66,
    findings: [
      { paper: 'recordreflectrefine', text: '120 things worth changing came out of nine months of sessions.' },
      { paper: 'drivingresearch', text: 'One finding became a study of its own: in infants who weren’t breathing, the vocal cords were closed 93% of the time they were ventilated.' },
    ],
    guidance: ['level-2-in-action/11.-lets-neoflix/11.4-unlocking-insights', 'level-2-in-action/13.1-the-neoflix-approach'],
  },
  {
    id: 'team',
    anchor: 'team-dynamics', // its section on /neoflix and the homepage caption's target
    name: 'Team',
    clip: 'team',
    claim: 'If you watch it with the people who were there, everyone sees the same thing for once.',
    caption: 'A session: the room watches, then talks.',
    inPractice: 'Thirty minutes, every other week, doctors and nurses together, one person chairing.',
    at: 215,
    findings: [
      { paper: 'practicalguidance', text: 'In nine months, 101 of the unit’s 125 doctors and nurses came to at least one session, and 80 had themselves recorded.' },
      { paper: 'practicalguidance', text: '177 of 179 questionnaires afterwards were positive.' },
      { paper: 'providers', text: 'In 28 interviews, colleagues said it felt safe because consent was real and judgment was not allowed.' },
    ],
    guidance: [
      'level-2-in-action/11.-lets-neoflix/11.1-getting-the-most-out-of-your-neoflix-session',
      'level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair',
      'level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment',
      'level-2-in-action/5.-preparation-and-consent',
    ],
  },
  {
    id: 'perspectives',
    anchor: 'perspectives', // its section on /neoflix and the homepage caption's target
    name: 'Perspectives',
    clip: 'perspectives',
    claim: 'If you watch it with people who do it differently, you notice what you do.',
    caption: 'Four units that record.',
    inPractice: 'Leiden and Vienna reviewed each other’s recordings.',
    at: null,
    findings: [
      { paper: 'internationalcollab', text: 'In five joint sessions between December 2022 and March 2024, the two units found 19 differences in how they work; 7 led to a change or a new insight.' },
      { paper: 'recordreflectrefine', text: 'Parents were invited to watch their own child’s stabilization and say what they needed.' },
    ],
    guidance: ['level-1-fundamentals/4.-learning-from-success-stories', 'level-3-growth/18.-expanding-your-video-program'],
  },
];
