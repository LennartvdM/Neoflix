/**
 * places.js — the world the travelling interface moves through: a grid
 * of places, one per question per unit.
 *
 * Node-safe (plain data, no Vite-only imports), so a build script can
 * read it too.
 *
 * WHOSE WORDS THESE ARE
 * - `h` (the answer in a few words) and `b` (one to three sentences) were
 *   shortened by Claude from each unit's own page in
 *   docs-content/level-1-fundamentals/4.-learning-from-success-stories/
 *   and, for Vienna's "what changed", from paper 6. They are NOT the
 *   researcher's wording, and the sidebar says so. Keep that label, or
 *   replace them with the pages' own sentences, before this is shown as
 *   anything but a design study.
 * - `film.line` is the session film's own subtitle, verbatim
 *   (system/content/session-film.js). `film.frame` names a still in
 *   public/videos/session/<frame>.webp.
 *
 * A `null` cell is a unit that has not answered. It is still a place:
 * it can be travelled to and renders "Not said."
 *
 * `under` = what the question rests on, as [source, short name].
 * `edge`  = what nobody has said.
 * `pages` = ids in TOOLBOX_TREE where the published toolbox holds
 *           pieces of the answer (the "As published" view).
 *
 * The full list the eight questions were picked from (twenty-four, with
 * the toolbox pages each draws on) is in travelling/README.md.
 */

export const UNITS = [
  { id: "L", slug: "leiden", name: "Leiden", where: "the Netherlands" },
  { id: "V", slug: "vienna", name: "Vienna", where: "Austria" },
  { id: "P", slug: "philadelphia", name: "Philadelphia", where: "USA" },
  { id: "M", slug: "melbourne", name: "Melbourne", where: "Australia" },
];

export const QUESTIONS = [
  {
    slug: "what-is-recorded",
    short: "What is recorded",
    question: "What do you record?",
    cells: [
      {
        h: "Every birth, hands only.",
        b: "Two fixed cameras film each stabilization: hands and infant, no sound. Intubations, surfactant and lines are filmed with a room camera or glasses, with faces and sound.",
        film: { frame: "p003", at: "0:05", who: "Ruben", line: "Yes, it’s working." },
      },
      {
        h: "The longest list.",
        b: "Delivery-room care, breathing support, lines, punctures, surgery. Fixed cameras and glasses, with faces and sound.",
      },
      {
        h: "The bed, from above.",
        b: "A bird’s-eye view of the resuscitation bed, a wide angle and the monitor, with sound. Mobile and eye-tracking devices on the unit.",
      },
      {
        h: "One camera, on magnets.",
        b: "A single action camera fixed to the resuscitaire, with a wide lens that also takes in the monitor. It overheats.",
      },
    ],
    under: [["Paper 1", "Narrative review"], ["Toolbox 6", "Recording equipment"]],
    edge: "Outside a neonatal unit. No one has described theirs.",
    pages: ["w-quick", "c3.3", "c5.2", "c6", "u-P", "u-V", "u-M", "u-L"],
  },
  {
    slug: "the-familys-say",
    short: "The family’s say",
    question: "Does the family have to agree?",
    cells: [
      {
        h: "Not asked.",
        b: "Recording is for quality of care, so no consent is asked. If family are visible, they are asked before the video is reviewed.",
      },
      {
        h: "An opt-out.",
        b: "Parents are not asked, but receive a questionnaire that lets them opt out.",
      },
      {
        h: "Inside admission consent.",
        b: "Parents consent on admission, with an opt-out. Use after 28 or 45 days means asking again.",
      },
      {
        h: "Waived.",
        b: "A waiver since 2019 for teaching and quality. Research and conferences are asked for separately.",
      },
    ],
    under: [["Toolbox 3.1", "Safe"], ["FAQ", "No time to ask?"]],
    edge: "Where the patient is an adult, and awake.",
    pages: ["c3.1", "w-faq", "u-P", "u-V", "u-M", "u-L"],
  },
  {
    slug: "the-staffs-say",
    short: "The staff’s say",
    question: "Do the staff have to agree?",
    cells: [
      {
        h: "Three times.",
        b: "Before recording, after it, and before a session. Anyone can say no at any of the three, and the video is then not used.",
      },
      {
        h: "Verbally.",
        b: "Verbal consent from the staff involved.",
      },
      {
        h: "They are told.",
        b: "Staff are informed. No consent is needed to record or review; it is needed to teach with the video outside the unit.",
      },
      {
        h: "A word, then a signature.",
        b: "A verbal yes before filming and a firmer one before review. The session’s sign-in sheet doubles as agreement to its rules.",
      },
    ],
    under: [["Paper 2", "What it is like"], ["Paper 4", "The guideline"]],
    edge: "Whether asking three times is what fills the room.",
    pages: ["c2.3", "c3.1", "c5", "c5.1", "c5.3", "w-faq", "u-P", "u-V", "u-M", "u-L"],
  },
  {
    slug: "the-family-sees-it",
    short: "The family sees it",
    question: "Can the family see it?",
    cells: [
      {
        h: "Yes, and they keep a copy.",
        b: "Parents can watch the hands-only recording of their child’s birth and ask for a copy. What they say goes into the sessions.",
      },
      {
        h: "Yes.",
        b: "Recordings are also used for review with parents.",
      },
      {
        h: "No.",
        b: "Videos are not shown to parents.",
      },
      {
        h: "No.",
        b: "Recordings are not shared with parents.",
      },
    ],
    under: [["den Boer 2021", "Parents who watched"], ["Toolbox 13.3", "Parents’ view"]],
    edge: "What Vienna’s parents said.",
    pages: ["c3.1", "c13.3", "w-faq", "u-P", "u-V", "u-M", "u-L"],
  },
  {
    slug: "kept-for",
    short: "Kept for",
    question: "How long is it kept?",
    cells: [
      {
        h: "Until the session.",
        b: "Recordings with faces are deleted after use. Hands-only recordings stay in the medical record.",
      },
      null,
      {
        h: "28 days, or 45.",
        b: "Deleted after 28 days at one hospital and 45 at the other, unless parents consent to longer.",
      },
      {
        h: "Seven years.",
        b: "Kept under a project number for seven years, as the state requires.",
      },
    ],
    under: [["Toolbox 3.2", "Simple"], ["den Boer 2018", "No court case yet"]],
    edge: "Whether a recording can be used in court.",
    pages: ["c3.2", "c9.1", "c9.3", "w-faq", "u-P", "u-M", "u-L"],
  },
  {
    slug: "the-first-look",
    short: "The first look",
    question: "Who sees it first?",
    cells: [
      {
        h: "The people in it.",
        b: "They watch it with the coordinator before anyone else does, and decide whether it goes to a session.",
        film: { frame: "p023", at: "0:57", who: "Colleague", line: "I’m curious. What do you remember about the procedure?" },
      },
      null,
      {
        h: "Whoever wants to.",
        b: "Staff can watch their own recordings alone, or come to a session.",
      },
      {
        h: "One to one.",
        b: "Ten private coaching sessions so far, and a study of them under way.",
      },
    ],
    under: [["Toolbox 10.1", "Seven questions"], ["Paper 4", "The guideline"]],
    edge: "What Melbourne’s coaching study found.",
    pages: ["c10", "c10.1", "u-P", "u-M"],
  },
  {
    slug: "the-room",
    short: "The room",
    question: "Who is in the room?",
    cells: [
      {
        h: "Doctors and nurses, together.",
        b: "Thirty minutes every other week, at the nurses’ handover. About seventeen people, the recorded staff among them.",
        film: { frame: "p047", at: "1:54", who: "Facilitator", line: "Keep them specific and to the point. Try to describe the situation clearly, and avoid making judgments." },
      },
      {
        h: "Everyone who gives care.",
        b: "Review with staff of all disciplines. How often is not said.",
      },
      {
        h: "The fellows run it.",
        b: "Unit-wide review six times a year, led by fellows.",
      },
      {
        h: "Doctors and nurses, apart.",
        b: "Sessions for junior doctors and for nurses are held separately. A few are mixed.",
      },
    ],
    under: [["Paper 4", "The guideline"], ["Toolbox 11.1", "The session"]],
    edge: "Together or apart. No one has compared.",
    pages: ["c2.3", "c11.1", "w-faq", "u-P", "u-V", "u-M", "u-L"],
  },
  {
    slug: "what-changed",
    short: "What changed",
    question: "What changed because of it?",
    cells: [
      {
        h: "Gloves, words, a time-out.",
        b: "Sterile gloves moved away from the sink. Intubation commands got one meaning. A time-out before procedures. Each was checked on a later recording.",
        film: { frame: "p131", at: "5:25", who: "Ruben", line: "For me the key takeaway is the catheter bend. I’ll definitely do that next time." },
      },
      {
        h: "What it saw in Leiden.",
        b: "After five joint sessions: more CO₂ detectors at intubation, ultrasound training for line tips, a new draping checklist.",
      },
      null,
      null,
    ],
    under: [["Paper 3", "Record, reflect, refine"], ["Paper 6", "Two units"]],
    edge: "What Philadelphia and Melbourne changed.",
    pages: ["c12", "c13", "c13.3", "c18"],
  },
];

// The published toolbox's own tree, as far as these questions touch it.
export const TOOLBOX_TREE = [
  {"level": "Welcome"},
  {"id": "w-quick", "label": "Quick-start", "sub": false},
  {"id": "w-faq", "label": "FAQ’s", "sub": true},
  {"level": "Level 1: Fundamentals"},
  {"id": "c1", "label": "1. Preproduction", "sub": false},
  {"id": "c2", "label": "2. Planning your initiative", "sub": false},
  {"id": "c2.3", "label": "2.3 Resources", "sub": true},
  {"id": "c3", "label": "3. Safe, Simple & Small", "sub": false},
  {"id": "c3.1", "label": "3.1 Safe", "sub": true},
  {"id": "c3.2", "label": "3.2 Simple", "sub": true},
  {"id": "c3.3", "label": "3.3 Small", "sub": true},
  {"id": "c4", "label": "4. Learning from success stories", "sub": false},
  {"id": "u-P", "label": "NICU in Philadelphia", "sub": true},
  {"id": "u-V", "label": "NICU in Vienna", "sub": true},
  {"id": "u-M", "label": "NICU in Melbourne", "sub": true},
  {"id": "u-L", "label": "NICU in Leiden", "sub": true},
  {"level": "Level 2: In action"},
  {"id": "c5", "label": "5. Preparation and Consent", "sub": false},
  {"id": "c5.1", "label": "5.1 Obtain Consent", "sub": true},
  {"id": "c5.2", "label": "5.2 Case selection", "sub": true},
  {"id": "c5.3", "label": "5.3 Privacy Considerations", "sub": true},
  {"id": "c6", "label": "6. Recording equipment", "sub": false},
  {"id": "c7", "label": "7. Creating footage", "sub": false},
  {"id": "c8", "label": "8. Recording during the Intervention", "sub": false},
  {"id": "c9", "label": "9. After the Intervention", "sub": false},
  {"id": "c9.1", "label": "9.1 File Transfer and Backup", "sub": true},
  {"id": "c9.3", "label": "9.3 Metadata and Archiving", "sub": true},
  {"id": "c10", "label": "10. Previewing", "sub": false},
  {"id": "c10.1", "label": "10.1 Questions to ask during previewing", "sub": true},
  {"id": "c11", "label": "11. Let’s Neoflix", "sub": false},
  {"id": "c11.1", "label": "11.1 Getting the most out of your session", "sub": true},
  {"id": "c12", "label": "12. Improving Care", "sub": false},
  {"id": "c13", "label": "13. The Neoflix approach", "sub": false},
  {"id": "c13.3", "label": "Learning from variety", "sub": true},
  {"level": "Level 3: Growth"},
  {"id": "c17", "label": "17. Continuous Improvement", "sub": false},
  {"id": "c18", "label": "18. Expanding Your Video Program", "sub": false},
];
