/**
 * The session film: Neoflix's own explainer (6:44), the one the six
 * clips are cut from. The owner's production, so it can be cut up and
 * quoted freely.
 *
 * Transcript as supplied by the owner (2026-11): the English narration
 * and the official English subtitles of the Dutch dialogue, read from the
 * video frames and checked by eye; speakers as seen on screen; times
 * approximate (±1 s). `LINES` is that transcript, line by line and
 * unedited. `SCENES` are its parts. `MOMENTS` are the cuts other pages
 * carry: a stretch of lines (from–to seconds) tagged with what it shows,
 * so a page can quote it and play the film from that second.
 *
 * The case it follows: Ruben records a MIST procedure (surfactant through
 * a thin catheter) on an evening shift, reviews the footage with a
 * colleague, and brings it to session #20, where a facilitator keeps the
 * feedback on behaviour, not the person.
 *
 * Node-safe; system-check.mjs checks moment ranges and tags.
 */
import { SESSION_FILM_SRC } from './films.js';

export const SESSION_FILM = {
  title: 'Neoflix: Record, Reflect, Refine',
  length: 404, // 6:44
  src: SESSION_FILM_SRC, // one home for the URL (films.js); keeps dnt=1
  source: 'Transcript supplied by the owner: narration and official English subtitles read from the frames (OCR), checked by eye; times ±1 s.',
};

// speaker: 'vo' (the narrator, also on screen as text cards), 'footage'
// (the replayed procedure recording), or who speaks.
export const LINES = [
  { t: 6, who: 'Ruben', text: 'Yes, it’s working.' },
  { t: 9, who: 'vo', text: 'Neoflix transforms medical procedure reviews through point-of-view recordings, creating a platform for healthcare teams to learn and improve together.' },
  { t: 22, who: 'footage', text: 'Alright, we’re going to intubate [Patient].' },
  { t: 25, who: 'vo', text: 'The system captures procedures from the caregiver’s perspective, providing clear insight into clinical practices.' },
  { t: 34, who: 'vo', text: 'At its core, Neoflix follows a structured approach: Record, Reflect, Refine. This process ensures learning opportunities aren’t overlooked.' },
  { t: 44, who: 'Ruben', text: 'Good morning. I recorded some footage last night. Could you retrieve it for me?' },
  { t: 48, who: 'Colleague', text: 'Of course. Was there anyone else?' },
  { t: 51, who: 'vo', text: 'Before joining his colleagues, Ruben reviews his recording to gather observations and insights.' },
  { t: 57, who: 'Colleague', text: 'I’m curious. What do you remember about the procedure?' },
  { t: 61, who: 'vo', text: 'Ruben’s openness about his experience sets the tone for honest discussion.' },
  { t: 67, who: 'Ruben', text: 'I found it difficult to get the catheter right. I could see everything clearly, however actually inserting the catheter was tough.' },
  { t: 76, who: 'vo', text: 'The video highlights Ruben’s struggle with positioning the catheter, to discuss and build on.' },
  { t: 82, who: 'Ruben', text: 'It kept moving backward. I couldn’t manage to get it ventral. It just wouldn’t stay forward.' },
  { t: 90, who: 'Colleague', text: 'Right, do you have any questions for your colleagues about the footage?' },
  { t: 94, who: 'Ruben', text: 'Yeah, I’m curious how they handle this, if they’ve ever had the same issue, and how they fixed it.' },
  { t: 100, who: 'vo', text: 'Ruben identifies key points for peer discussion, helping structure the team review.' },
  { t: 112, who: 'vo', text: 'The session begins with a familiar routine.' },
  { t: 115, who: 'Facilitator', text: 'Great to see everyone here. Let’s get started with the Neoflix. Feel free to ask questions — please do, actually — but keep them specific and to the point. Try to describe the situation clearly, and avoid making judgments.' },
  { t: 132, who: 'vo', text: 'Simple ground rules help everyone focus on learning from each other’s experiences.' },
  { t: 135, who: 'Participant', text: 'What was the setting?' },
  { t: 137, who: 'Ruben', text: 'It was during the evening shift. I was on with the nurse and the assistant. We talked things through beforehand, and then I started the MIST procedure. So, the ward was actually calm; there weren’t many distractions.' },
  { t: 156, who: 'vo', text: 'Establishing the clinical picture helps the team tailor their feedback.' },
  { t: 161, who: 'Participant', text: 'I noticed how the nurse remained in the background and didn’t involve herself with the baby. Very professional.' },
  { t: 168, who: 'Ruben', text: 'Yeah, that was nice. It helped me feel like I had time to finish the procedure, rather than having to stop halfway through.' },
  { t: 177, who: 'Participant', text: 'Did you agree on when to say something if the saturations dropped?' },
  { t: 182, who: 'Ruben', text: 'No, we didn’t set a specific threshold. But I did ask them to keep me updated on the baby’s condition. They did a great job at that.' },
  { t: 193, who: 'vo', text: 'The discussion begins by recognizing effective teamwork.' },
  { t: 195, who: 'footage', text: '…fully inserted. …perfect, thanks. …oxygen has been capped off.' },
  { t: 202, who: 'Senior nurse', text: 'Alright, let me say something here. How can it be that you just didn’t stop? Clearly the saturations were already at 60%. The baby wasn’t doing well at all.' },
  { t: 214, who: 'vo', text: 'Even experienced professionals can sometimes drift from constructive feedback principles.' },
  { t: 217, who: 'Facilitator', text: 'Can I interrupt quickly? Currently you’re levying feedback at the person, which isn’t what we agreed to. Could you consider rephrasing your question, using the feedback guidelines?' },
  { t: 240, who: 'vo', text: 'The facilitator keeps the focus on actionable insights.' },
  { t: 240, who: 'Senior nurse', text: 'Alright, let’s see… Personally, I’m used to stopping earlier when the baby desaturates. Is there a particular reason to wait longer in this situation?' },
  { t: 252, who: 'Ruben', text: 'Yeah, I also had some trepidations myself…' },
  { t: 256, who: 'vo', text: 'A shift in phrasing turns a critique into an opportunity for improvement.' },
  { t: 259, who: 'footage', text: '…let’s see if the curve helps. …perfect. …it inserted straight away. …alright, stop there.' },
  { t: 270, who: 'Facilitator', text: 'Anyone have a question about this?' },
  { t: 272, who: 'Colleague', text: 'Yeah, I do. I noticed you used a curve, and it worked really well. Do you do that often?' },
  { t: 278, who: 'Ruben', text: 'Yeah, I’ve been doing it since then.' },
  { t: 280, who: 'Colleague', text: 'I wonder if others use that too.' },
  { t: 284, who: 'vo', text: 'Ruben’s catheter bend highlights practical problem solving.' },
  { t: 286, who: 'Participant', text: 'The task division was really clear.' },
  { t: 290, who: 'vo', text: 'Colleagues build on each other’s technical insights.' },
  { t: 292, who: 'Participant', text: 'Yeah, I noticed that too. I also liked how much focus there was on the baby’s comfort, and that a dose of propofol was given.' },
  { t: 300, who: 'Facilitator', text: 'Thanks, those are great points. Any tips?' },
  { t: 305, who: 'vo', text: 'The team consolidates specific technical takeaways.' },
  { t: 309, who: 'Participant', text: 'Yeah, while we’re on the subject of communication, I think there could be more clarity about the exact dose.' },
  { t: 317, who: 'vo', text: 'Constructive feedback can still be incisive.' },
  { t: 319, who: 'Ruben', text: 'Yeah, that wasn’t very clear, I realize that now.' },
  { t: 323, who: 'vo', text: 'Team input shapes future medical procedures.' },
  { t: 325, who: 'Ruben', text: 'For me the key takeaway is the catheter bend. I’ll definitely do that next time — you saw how much easier it made things.' },
  { t: 333, who: 'vo', text: 'Through thoughtful discussion and shared experiences, teams find ways to improve their daily practice.' },
  { t: 340, who: 'Facilitator', text: 'So, we can conclude that this was a really good procedure, with attention to the baby, comfort, the task division… This is about bringing people along in your perspective through communicating out loud, and that bend in the catheter: a successful procedure.' },
  { t: 367, who: 'vo', text: 'The facilitator wraps up the session.' },
  { t: 368, who: 'Facilitator', text: 'Now, we’ll evaluate your views on this session. You can do that by scanning the QR code. Submit your feedback through the Google Form.' },
  { t: 379, who: 'vo', text: 'Each session ends with a QR code, allowing participants to share feedback and shape the program’s ongoing improvement.' },
  { t: 386, who: 'Facilitator', text: 'Thank you all. This concludes this session.' },
  { t: 390, who: 'vo', text: 'These regular conversations about real clinical situations help build practical skills and stronger working relationships.' },
];

/** The film's parts. `from`/`to` in seconds. */
export const SCENES = [
  { id: 'record', name: 'Record', from: 0, to: 44, says: 'A head camera on, a MIST procedure on an evening shift.' },
  { id: 'preview', name: 'Previewing the footage', from: 44, to: 112, says: 'The next morning Ruben watches it back with a colleague and picks what to ask the team.' },
  { id: 'open', name: 'The session opens', from: 112, to: 156, says: 'Session #20: the ground rules, then the setting.' },
  { id: 'teamwork', name: 'What went well', from: 156, to: 202, says: 'The discussion starts with the teamwork.' },
  { id: 'rephrase', name: 'Feedback on the person, rephrased', from: 202, to: 259, says: 'A senior nurse’s criticism, the facilitator steps in, the question asked again.' },
  { id: 'curve', name: 'The catheter curve', from: 259, to: 325, says: 'What made it work, and a tip about the dose.' },
  { id: 'close', name: 'Takeaway, summary, evaluation', from: 325, to: 404, says: 'Ruben’s takeaway, the facilitator’s summary, a QR code for feedback.' },
];

/**
 * Moments: cuts other pages carry. `from`–`to` select lines by time;
 * `tags` are the ontology keys and records they show. Order is how
 * strongly each one shows its tags.
 */
export const MOMENTS = [
  { id: 'remember', from: 57, to: 75, title: 'What do you remember?', tags: ['practice:preview', 'concept:memory-vs-recording', 'guidance:level-2-in-action/10.-previewing', 'claim:skills', 'film:skills'] },
  { id: 'questions-for-team', from: 90, to: 100, title: 'Choosing what to ask the team', tags: ['practice:preview', 'guidance:level-2-in-action/10.-previewing/10.1-questions-to-ask-during-previewing'] },
  { id: 'ground-rules', from: 115, to: 132, title: 'The ground rules', tags: ['practice:chair', 'concept:safe-to-look', 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment', 'guidance:level-2-in-action/11.-lets-neoflix/11.1-getting-the-most-out-of-your-neoflix-session'] },
  { id: 'teamwork', from: 161, to: 193, title: 'Starting with what went well', tags: ['claim:team', 'film:team', 'concept:shared-picture', 'practice:chair'] },
  { id: 'threshold', from: 177, to: 192, title: 'No agreed threshold', tags: ['claim:coordination', 'film:coordination', 'concept:shared-picture'] },
  { id: 'rephrase', from: 202, to: 256, title: 'From the person to the situation', tags: ['concept:safe-to-look', 'practice:chair', 'guidance:level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair', 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment', 'claim:team', 'film:team', 'paper:providers'] },
  { id: 'curve', from: 259, to: 284, title: 'The curve in the catheter', tags: ['concept:variation', 'claim:perspectives', 'film:perspectives', 'practice:act-on-a-finding', 'guidance:level-2-in-action/11.-lets-neoflix/11.4-unlocking-insights'] },
  { id: 'dose', from: 300, to: 322, title: 'A tip about the dose', tags: ['practice:act-on-a-finding', 'concept:pdca'] },
  { id: 'takeaway', from: 325, to: 366, title: 'The takeaway and the summary', tags: ['practice:act-on-a-finding', 'concept:the-loop', 'guidance:level-2-in-action/12.-improving-care-through-the-neoflix-approach', 'paper:recordreflectrefine'] },
  { id: 'evaluate', from: 368, to: 390, title: 'Every session is evaluated', tags: ['practice:make-it-routine', 'guidance:level-3-growth/17.-continuous-improvement', 'paper:practicalguidance'] },
  { id: 'why', from: 9, to: 43, title: 'Record, reflect, refine', tags: ['concept:the-loop', 'guidance:', 'guidance:welcome/neoflix/how-it-works'] },
];

/** The lines a moment covers. */
export const linesOf = (m) => LINES.filter((l) => l.t >= m.from && l.t < m.to);

/** The moments that show `key` (a record or ontology key), best first. */
export function momentsFor(key) {
  return MOMENTS.filter((m) => m.tags.includes(key)).sort((a, b) => a.tags.indexOf(key) - b.tags.indexOf(key));
}
