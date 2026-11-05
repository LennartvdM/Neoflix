/**
 * The ontology: what Neoflix's material *is*, below the three kinds of
 * page it happens to be published as (films, papers, toolbox pages).
 *
 * Draft, 2026-11. Pure structure: it names the categories the site's
 * content is really made of, and links them, so pages can be assembled
 * from meaning instead of from where something was published. Nothing
 * here is shown yet except the explainer placeholders; see
 * composition/ONTOLOGY.md for why each category exists and what it
 * replaces.
 *
 *   claim      a sentence of the argument. Six, in two movements: what
 *              goes wrong in the moment, what watching it back changes.
 *              A film *illustrates* a claim; it isn't the claim.
 *   finding    one measured statement from one paper, said once, with
 *              its number. Claims rest on findings; the story cites them.
 *   concept    an idea that has to be *explained*, not proven (memory
 *              versus a recording, the loop, psychological safety…).
 *              Each has an explainer: a slot for an abstract animation,
 *              with a brief. Placeholders for now.
 *   practice   something a unit does (a verb): obtain consent, preview,
 *              chair a session… Documented by toolbox pages, done in a
 *              step of the loop, by roles.
 *   role       who someone is when they arrive: the person starting it,
 *              a clinician being recorded, the chair, a researcher.
 *   unit       where it's done: Leiden, Vienna, Philadelphia, Melbourne.
 *
 * Links are typed and written once, on the side that owns them. Keys
 * point at the catalogue (`film:`, `paper:`, `guidance:`) or at this
 * file (`claim:`, `finding:`, `concept:`, `practice:`, `role:`,
 * `unit:`). Node-safe; system-check.mjs fails the build on a broken
 * link.
 */

export const MOVEMENTS = [
  { id: 'moment', name: 'In the moment', says: 'What goes wrong when the work is urgent, shared and absorbing.' },
  { id: 'back', name: 'Watching it back', says: 'What recording and reviewing it together changes.' },
];

export const CLAIMS = [
  { id: 'urgency', movement: 'moment', text: 'Some work has to be done right now, and right the first time.', film: 'film:urgency', restsOn: ['finding:not-breathing'], explainedBy: ['concept:first-minutes'], leadsTo: ['practice:start-small'] },
  { id: 'coordination', movement: 'moment', text: 'It takes several people doing different things at the same time.', film: 'film:coordination', restsOn: ['finding:commands'], explainedBy: ['concept:shared-picture'], leadsTo: ['practice:find-pioneers'] },
  { id: 'focus', movement: 'moment', text: 'Everyone is watching their own hands; afterwards nobody can say exactly what happened.', film: 'film:focus', restsOn: ['finding:recall'], explainedBy: ['concept:tunnel-vision', 'concept:memory-vs-recording'], leadsTo: ['practice:record'] },
  { id: 'skills', movement: 'back', text: 'If you record it, you can watch what happened instead of remembering it.', film: 'film:skills', restsOn: ['finding:120-things', 'finding:cords-closed'], explainedBy: ['concept:memory-vs-recording'], leadsTo: ['practice:preview', 'practice:act-on-a-finding'] },
  { id: 'team', movement: 'back', text: 'If you watch it with the people who were there, everyone sees the same thing for once.', film: 'film:team', restsOn: ['finding:attendance', 'finding:positive', 'finding:felt-safe'], explainedBy: ['concept:shared-picture', 'concept:safe-to-look'], leadsTo: ['practice:consent', 'practice:chair'] },
  { id: 'perspectives', movement: 'back', text: 'If you watch it with people who do it differently, you notice what you do.', film: 'film:perspectives', restsOn: ['finding:19-differences', 'finding:84-of-120'], explainedBy: ['concept:variation'], leadsTo: ['practice:review-across-units'] },
];

export const FINDINGS = [
  { id: 'not-breathing', paper: 'paper:drivingresearch', text: '8 of 20 infants born before 30 weeks were not breathing at birth.', figure: '8 / 20', unit: 'unit:leiden' },
  { id: 'cords-closed', paper: 'paper:drivingresearch', text: 'In infants who were not breathing, the vocal cords were closed a median 93% of the time they were ventilated.', figure: '93%', unit: 'unit:leiden', explainedBy: ['concept:closed-cords'] },
  { id: 'commands', paper: 'paper:recordreflectrefine', text: 'Intubation commands meant different things to different people; a short film of what each asks for removed the confusion.', unit: 'unit:leiden' },
  { id: '120-things', paper: 'paper:recordreflectrefine', text: '18 sessions over nine months found 120 things to improve, in seven themes.', figure: '120', unit: 'unit:leiden' },
  { id: '84-of-120', paper: 'paper:recordreflectrefine', text: 'Of those 120, 84 were colleagues doing the same thing differently.', figure: '84 / 120', unit: 'unit:leiden', explainedBy: ['concept:variation'] },
  { id: 'recall', paper: 'paper:narrative', text: 'Recall bias and incomplete notes limit what a debrief can learn.', explainedBy: ['concept:memory-vs-recording'] },
  { id: 'attendance', paper: 'paper:practicalguidance', text: 'In nine months, 101 of the unit’s 125 doctors and nurses came to at least one session, and 80 had themselves recorded.', figure: '101 / 125', unit: 'unit:leiden' },
  { id: 'positive', paper: 'paper:practicalguidance', text: '177 of 179 questionnaires afterwards were positive.', figure: '177 / 179', unit: 'unit:leiden' },
  { id: 'felt-safe', paper: 'paper:providers', text: 'In 28 interviews, colleagues said it felt safe because consent was real and judgment was not allowed.', figure: '28', unit: 'unit:leiden', explainedBy: ['concept:safe-to-look'] },
  { id: '19-differences', paper: 'paper:internationalcollab', text: 'Five joint sessions with Vienna found 19 differences in how the units work; 7 led to a change or a new insight.', figure: '19 → 7', unit: 'unit:vienna', explainedBy: ['concept:variation'] },
];

/**
 * Concepts, each with an explainer: a slot for an abstract moving
 * illustration. `brief` is what it must show (one idea, no text needed
 * to follow it); `motion` the gist of the movement. Placeholders: the
 * site draws an empty, labelled frame where each will go.
 */
export const CONCEPTS = [
  { id: 'first-minutes', name: 'The first minutes', brief: 'Time at birth is a narrowing window: the actions that matter are packed into minutes and can’t be redone.', motion: 'A band of time that closes from both ends while small marks (actions) crowd into it.' },
  { id: 'shared-picture', name: 'One shared picture', brief: 'Each person holds a partial picture of the same event; watching it together merges them into one.', motion: 'Several fragments, each lit from a different side, slide into one image.' },
  { id: 'tunnel-vision', name: 'Tunnel vision', brief: 'Concentrating on your own task narrows what you see of everyone else’s.', motion: 'A wide field contracting to a bright circle around one pair of hands; the rest dims.' },
  { id: 'memory-vs-recording', name: 'Memory against a recording', brief: 'Memory reconstructs; a recording keeps the sequence. Watching back replaces the story you tell with what happened.', motion: 'A timeline that reshuffles and loses pieces when remembered, against the same timeline held still.' },
  { id: 'safe-to-look', name: 'Safe to look', brief: 'People only look honestly at their own work when consent is real and judgment is off the table.', motion: 'Figures stepping into a lit circle only once its boundary (consent, no blame) closes.' },
  { id: 'variation', name: 'Doing the same thing differently', brief: 'Most improvements aren’t errors: they’re colleagues (or units) doing the same task in different ways, invisible until seen side by side.', motion: 'Two sequences of the same steps, offset, their differences lighting up as they align.' },
  { id: 'the-loop', name: 'The loop', brief: 'Record, reflect, refine, keep going: each turn feeds the next; a change is checked on the next recording.', motion: 'A circuit of four stations with a token passing round, leaving a mark that the next pass checks.' },
  { id: 'pdca', name: 'Plan, do, check, act', brief: 'A finding becomes a change only when it’s planned, tried, checked on video, and kept or dropped.', motion: 'One finding as a dot taken through four quadrants and returned changed.' },
  { id: 'closed-cords', name: 'Closed vocal cords', brief: 'Air pushed in at birth can meet closed vocal cords; the breath doesn’t get through.', motion: 'An airway in section, a pulse of air stopping at a closed gate, then passing when it opens.' },
  { id: 'consent', name: 'Real consent', brief: 'Consent is a process, not a form: everyone recorded can say no, see it first, and have it deleted.', motion: 'A recording that can only move forward through gates each person opens.' },
];

/** Practices: what a unit does. `pages` are the toolbox pages that document it. */
export const PRACTICES = [
  { id: 'start-small', name: 'Start safe, simple and small', step: 'before', roles: ['role:initiator'], pages: ['guidance:level-1-fundamentals/3.-safe-simple-and-small', 'guidance:welcome/quick-start'], explainedBy: ['concept:the-loop'] },
  { id: 'find-pioneers', name: 'Find a few pioneers and win the team', step: 'before', roles: ['role:initiator'], pages: ['guidance:level-1-fundamentals/2.-planning-your-initiative/2.1-pioneer-team', 'guidance:level-1-fundamentals/2.-planning-your-initiative/2.2-gaining-team-buy-in'] },
  { id: 'consent', name: 'Obtain real consent', step: 'record', roles: ['role:initiator', 'role:clinician'], pages: ['guidance:level-2-in-action/5.-preparation-and-consent/5.1-obtain-consent', 'guidance:level-2-in-action/5.-preparation-and-consent/5.3-privacy-considerations'], explainedBy: ['concept:consent'] },
  { id: 'record', name: 'Record the procedure', step: 'record', roles: ['role:clinician'], pages: ['guidance:level-2-in-action/6.-recording-equipment', 'guidance:level-2-in-action/7.-creating-footage', 'guidance:level-2-in-action/8.-recording-during-the-intervention'] },
  { id: 'preview', name: 'Preview with the people filmed', step: 'reflect', roles: ['role:chair', 'role:clinician'], pages: ['guidance:level-2-in-action/10.-previewing', 'guidance:level-2-in-action/10.-previewing/10.1-questions-to-ask-during-previewing'] },
  { id: 'chair', name: 'Chair a session', step: 'reflect', roles: ['role:chair'], pages: ['guidance:level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair', 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment', 'guidance:level-2-in-action/11.-lets-neoflix/11.1-getting-the-most-out-of-your-neoflix-session'], explainedBy: ['concept:safe-to-look'] },
  { id: 'act-on-a-finding', name: 'Turn a finding into a change', step: 'refine', roles: ['role:chair', 'role:initiator'], pages: ['guidance:level-2-in-action/12.-improving-care-through-the-neoflix-approach', 'guidance:level-2-in-action/13.1-the-neoflix-approach/13.1-protocol-or-equipment-adjustment'], explainedBy: ['concept:pdca'] },
  { id: 'research', name: 'Take a question into research', step: 'refine', roles: ['role:researcher'], pages: ['guidance:level-2-in-action/13.1-the-neoflix-approach/13.2-input-for-research', 'guidance:level-2-in-action/15.-recordings-for-research'] },
  { id: 'review-across-units', name: 'Review with another unit', step: 'keep', roles: ['role:initiator', 'role:chair'], pages: ['guidance:level-3-growth/18.-expanding-your-video-program', 'guidance:level-1-fundamentals/4.-learning-from-success-stories'], explainedBy: ['concept:variation'] },
  { id: 'make-it-routine', name: 'Make it routine', step: 'keep', roles: ['role:initiator'], pages: ['guidance:level-3-growth/17.-continuous-improvement'], explainedBy: ['concept:the-loop'] },
];

/** Who arrives. `needs` is what they come for, in order. */
export const ROLES = [
  { id: 'initiator', name: 'Starting it in your unit', who: 'A consultant, nurse lead or manager who wants to begin.', needs: ['practice:start-small', 'practice:find-pioneers', 'practice:consent', 'practice:make-it-routine'] },
  { id: 'clinician', name: 'Being recorded', who: 'A doctor or nurse whose work will be filmed and reviewed.', needs: ['practice:consent', 'practice:preview', 'concept:safe-to-look'] },
  { id: 'chair', name: 'Chairing sessions', who: 'The person who runs the review and keeps it safe.', needs: ['practice:preview', 'practice:chair', 'practice:act-on-a-finding'] },
  { id: 'researcher', name: 'Asking a research question', who: 'Someone who wants the recordings to answer a question.', needs: ['practice:research', 'paper:drivingresearch'] },
];

/** Where it happens. */
export const UNITS = [
  { id: 'leiden', name: 'Leiden', country: 'the Netherlands', since: 2009, page: 'guidance:level-1-fundamentals/4.-learning-from-success-stories/nicu-in-leiden-the-netherlands' },
  { id: 'vienna', name: 'Vienna', country: 'Austria', page: 'guidance:level-1-fundamentals/4.-learning-from-success-stories/nicu-in-vienna-austria' },
  { id: 'philadelphia', name: 'Philadelphia', country: 'the United States', page: 'guidance:level-1-fundamentals/4.-learning-from-success-stories/nicu-in-philadelphia-pennsylvania-usa' },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', page: 'guidance:level-1-fundamentals/4.-learning-from-success-stories/nicu-in-melbourne-australia' },
];

const TABLES = { claim: CLAIMS, finding: FINDINGS, concept: CONCEPTS, practice: PRACTICES, role: ROLES, unit: UNITS };

/** One entry by key ('concept:the-loop'), or null. */
export function entry(key) {
  const i = String(key).indexOf(':');
  const table = TABLES[key.slice(0, i)];
  return table ? table.find((x) => x.id === key.slice(i + 1)) || null : null;
}

/** The claim a film illustrates. */
export const claimOfFilm = (filmKey) => CLAIMS.find((c) => c.film === filmKey) || null;

/** The concepts that explain a record or an entry (a film via its claim). */
export function conceptsFor(key) {
  if (key.startsWith('film:')) return (claimOfFilm(key)?.explainedBy || []).map(entry).filter(Boolean);
  if (key.startsWith('guidance:')) return [...new Set(PRACTICES.filter((p) => p.pages.includes(key)).flatMap((p) => p.explainedBy || []))].map(entry).filter(Boolean);
  if (key.startsWith('paper:')) return [...new Set(FINDINGS.filter((f) => f.paper === key).flatMap((f) => f.explainedBy || []))].map(entry).filter(Boolean);
  return (entry(key)?.explainedBy || []).map(entry).filter(Boolean);
}

/** Every key this file points at, with where it's pointed from (for the check). */
export function ontologyLinks() {
  const out = [];
  const at = (from, keys) => (keys || []).forEach((k) => out.push([from, k]));
  CLAIMS.forEach((c) => { at(`claim:${c.id}`, [c.film, ...c.restsOn, ...c.explainedBy, ...c.leadsTo]); });
  FINDINGS.forEach((f) => at(`finding:${f.id}`, [f.paper, f.unit, ...(f.explainedBy || [])].filter(Boolean)));
  PRACTICES.forEach((p) => at(`practice:${p.id}`, [...p.roles, ...p.pages, ...(p.explainedBy || [])]));
  ROLES.forEach((r) => at(`role:${r.id}`, r.needs));
  UNITS.forEach((u) => at(`unit:${u.id}`, [u.page]));
  return out;
}
