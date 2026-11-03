/**
 * The six papers as one line of work — what /publications and the paper
 * pages say about each, beyond the bibliographic facts in records.js.
 * From the content blueprint's Drafts tab; first-draft copy, structure
 * settled. Figures checked against the PDFs on 2026-11-03.
 *
 * Keyed by the same ids as records.js / content.js.
 */

export const ARC_INTRO = {
  headline: 'What we asked, in the order we asked it.',
  body: [
    'First we asked what was already known about recording emergency care, and described what our own unit had been doing since 2009. Then we asked our colleagues what it was like to be recorded and reviewed, and turned their answers into a roadmap.',
    'Then we counted what nine months of sessions actually found, and wrote down how to run them safely. One of the things the video could not explain became a study of its own. And from 2022 to 2024 we asked whether two units could learn from each other’s recordings. They could.',
  ],
};

export const ARC = {
  narrative: {
    short: 'Narrative review',
    asked: 'What is known about recording emergency care and reviewing it with the people who were there, and what has to be in place for it to work?',
    found: 'Video review improves guideline adherence, documentation, clinical care and teamwork, but is still rarely routine. It needs the team’s trust, a proper consent procedure, confidentiality and equipment that works.',
    changed: 'Set out what the unit had done since 2009 and what came next: open the sessions to nurses, add sound, try eye-tracking.',
    lifted: { figure: '2009', text: 'Leiden has recorded stabilizations at birth since then.' },
  },
  providers: {
    short: 'What it is like',
    asked: 'What is it like to be recorded and reviewed? 28 doctors and nurses were interviewed.',
    found: 'Five themes: added value, preconditions, adjustment, experiences, and embedding it for the long term while keeping it safe.',
    changed: 'The roadmap the toolbox follows.',
    lifted: { figure: '28', text: 'colleagues interviewed.' },
  },
  recordreflectrefine: {
    short: 'Record, reflect, refine',
    asked: 'Record three procedures for nine months and review them every other week: what do you find, and what do you do about it?',
    found: '18 sessions, about 17 people each, and 120 things to improve in seven themes, from sterility to parents’ perspective.',
    changed: 'Each one taken through plan, do, check, act, and checked on video.',
    lifted: { figure: '120', text: 'things to improve; 84 of them were colleagues doing the same thing differently.' },
  },
  practicalguidance: {
    short: 'The guideline',
    asked: 'How do you run video review so that people keep coming?',
    found: '101 of 125 staff attended at least once and 99% of 179 questionnaires were positive, given a clear path to consent, preparation, a defined chair and a protected room.',
    changed: 'The unit’s guideline rewritten around those conditions.',
    lifted: { figure: '101 of 125', text: 'staff came to at least one session.' },
  },
  drivingresearch: {
    short: 'The vocal cords',
    asked: 'Could we see the vocal cords of a preterm infant at birth, and were they closed?',
    found: 'Ultrasound worked in all 20 infants under 30 weeks. In infants who were not breathing, the cords were closed 93% of the time while they were ventilated.',
    changed: 'A question from a review session became evidence that ventilation at birth has to reckon with the cords.',
    lifted: { figure: '93%', text: 'of the time the cords were closed during ventilation.' },
  },
  internationalcollab: {
    short: 'Two units',
    asked: 'Can two units in two countries review each other’s recordings, and does anyone change anything?',
    found: 'Five joint sessions with Vienna between December 2022 and March 2024, about eight people from each unit; 19 differences, 7 of which led to a change or a new insight.',
    changed: 'A roadmap for sessions across units.',
    lifted: { figure: '19', text: 'differences found; 7 led to a change or a new insight.' },
  },
};
