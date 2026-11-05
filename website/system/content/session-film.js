/**
 * The session film: Neoflix's own explainer (6:44), the one the six
 * clips are cut from. The owner's production, so it can be cut up and
 * quoted freely.
 *
 * From the owner's context package for the film (2026-11,
 * neoflix_video_context: storyboard.json and its subtitles): the English
 * narration (the on-screen cards, checked against speech recognition) and
 * the film's official English subtitles of the Dutch dialogue, times
 * ±0.5 s, speakers as identified on screen. `LINES` are those cues, joined
 * into turns where one speaker runs on, text unedited. `SCENES` are the
 * package's eleven sequences. `FRAMES` are keyframes from it
 * (public/videos/session/pNNN.webp, 720 px wide) with its shot notes as
 * alt text. `MOMENTS` are the cuts other pages carry: a stretch of lines
 * (from–to seconds) tagged with what it shows, each with a frame.
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
  length: 404.52, // 6:44
  src: SESSION_FILM_SRC, // one home for the URL (films.js); keeps dnt=1
  source: 'From the owner’s context package: narration from the on-screen cards checked against speech recognition, dialogue in the film’s official English subtitles; times ±0.5 s.',
};

// who: 'vo' (the narrator, also on screen as text cards), 'footage' (the
// replayed procedure recording, Ruben speaking on it), 'Room' (a silence
// the subtitles name), or who speaks. `end`: when the turn ends.
export const LINES = [
  { t: 5.8, end: 7.4, who: "Ruben", text: "Yes, it's working." },
  { t: 9.5, end: 19, who: "vo", text: "Neoflix transforms medical procedure reviews through point of view recordings, creating a platform for healthcare teams to learn and improve together." },
  { t: 21.5, end: 25.0, who: "footage", text: "Alright, we're going to intubate [Patient]." },
  { t: 25, end: 31.5, who: "vo", text: "The system captures procedures from the caregiver's perspective, providing clear insight into clinical practices." },
  { t: 34, end: 40.5, who: "vo", text: "At its core, Neoflix follows a structured approach: Record, Reflect, Refine." },
  { t: 41, end: 44, who: "vo", text: "This process ensures learning opportunities aren't overlooked." },
  { t: 44.5, end: 48.7, who: "Ruben", text: "Good morning. I recorded some footage last night. Could you retrieve it for me?" },
  { t: 48.8, end: 50.6, who: "Colleague", text: "Of course, was there anyone else?" },
  { t: 51, end: 56.5, who: "vo", text: "Before joining his colleagues, Ruben reviews his recording to gather observations and insights." },
  { t: 57.2, end: 60.9, who: "Colleague", text: "I'm curious. What do you remember about the procedure?" },
  { t: 61, end: 65, who: "vo", text: "Ruben's openness about his experience sets the tone for honest discussion." },
  { t: 66.8, end: 73.9, who: "Ruben", text: "I found it difficult to get the catheter right. I could see everything clearly, however actually inserting the catheter was tough." },
  { t: 74.5, end: 81.5, who: "vo", text: "The video highlights Ruben's struggle with positioning the catheter, providing an example for the team to discuss and build on." },
  { t: 82.0, end: 89.4, who: "Ruben", text: "It kept moving backward. I couldn't manage to get it ventral. It just wouldn't stay forward." },
  { t: 89.5, end: 95.1, who: "Colleague", text: "Right, do you have any questions for your colleagues about the footage?" },
  { t: 95.2, end: 98.6, who: "Ruben", text: "Yeah, I'm curious how they handle this, if they've ever had the same issue, and how they fixed it." },
  { t: 99, end: 104, who: "vo", text: "Ruben identifies key points for peer discussion, helping structure the team review." },
  { t: 112, end: 114.5, who: "vo", text: "The session begins with a familiar routine." },
  { t: 114.8, end: 129.9, who: "Facilitator", text: "Great to see everyone here. Let's get started with the Neoflix. Feel free to ask questions, please do, actually, but keep them specific and to the point. Try to describe the situation clearly, and avoid making judgments." },
  { t: 130.5, end: 135, who: "vo", text: "Simple ground rules help everyone focus on learning from each other's experiences." },
  { t: 135.2, end: 136.7, who: "Participant", text: "What was the setting?" },
  { t: 136.8, end: 152.9, who: "Ruben", text: "It was during the evening shift. I was on with the nurse and the assistant. We talked things through beforehand, and then I started the MIST procedure. So, the ward was actually calm, there weren't many distractions." },
  { t: 156.5, end: 160, who: "vo", text: "Establishing the clinical picture helps the team tailor their feedback." },
  { t: 161.5, end: 168.6, who: "Participant", text: "I noticed how the nurse remained in the background and didn't involve herself with the baby, very professional." },
  { t: 169.0, end: 177.0, who: "Ruben", text: "Yeah, that was nice. It helped me feel like I had time to finish the procedure, rather than having to stop halfway through." },
  { t: 177.2, end: 182.3, who: "Participant", text: "Did you agree on when to say something if the saturations dropped?" },
  { t: 182.5, end: 184.0, who: "Ruben", text: "No, we didn't set a specific threshold." },
  { t: 185.8, end: 191.5, who: "Ruben", text: "But I did ask them to keep me updated on the baby's condition. They did a great job at that." },
  { t: 191.5, end: 194.5, who: "vo", text: "The discussion begins by recognizing effective teamwork." },
  { t: 195.0, end: 197.0, who: "footage", text: "(…fully inserted) (…perfect, thanks.)" },
  { t: 199.2, end: 201.0, who: "footage", text: "(…oxygen has been capped off)" },
  { t: 202.0, end: 211.9, who: "Senior nurse", text: "Alright, let me say something here. How can it be that you just didn't stop? Clearly the saturations were already at 60%. The baby wasn't doing well at all." },
  { t: 212.0, end: 213.8, who: "Room", text: "[awkward silence]" },
  { t: 217.2, end: 225.4, who: "Facilitator", text: "Can I interrupt quickly?" },
  { t: 220, end: 224.5, who: "vo", text: "Even experienced professionals can sometimes drift from constructive feedback principles." },
  { t: 225.5, end: 235.6, who: "Facilitator", text: "Currently you're levying feedback at the person, which isn't what we agreed to. Could you consider rephrasing your question, using the feedback guidelines?" },
  { t: 237, end: 240, who: "vo", text: "The facilitator keeps the focus on actionable insights." },
  { t: 240.8, end: 252.5, who: "Senior nurse", text: "Alright, let's see. Personally, I'm used to stopping earlier when the baby desaturates. Is there a particular reason to wait longer in this situation?" },
  { t: 252.8, end: 255.0, who: "Ruben", text: "Yeah, I also had some trepidations myself." },
  { t: 255, end: 258.5, who: "vo", text: "A shift in phrasing turns a critique into an opportunity for improvement." },
  { t: 259.0, end: 268.0, who: "footage", text: "(…let's see if the curve helps.) (…perfect.) (…it inserted straight away) (…alright, stop there)" },
  { t: 270.0, end: 272.0, who: "Facilitator", text: "Anyone have a question about this?" },
  { t: 272.1, end: 277.9, who: "Colleague", text: "Yeah, I do. I noticed you used a curve, and it worked really well. Do you do that often?" },
  { t: 278.0, end: 279.2, who: "Ruben", text: "Yeah, I've been doing it since then." },
  { t: 279.2, end: 282.0, who: "Colleague", text: "I wonder if others use that too." },
  { t: 282, end: 285, who: "vo", text: "Ruben's catheter bend highlights practical problem solving." },
  { t: 285.5, end: 288.3, who: "Participant", text: "The task division was really clear." },
  { t: 289.5, end: 292, who: "vo", text: "Colleagues build on each other's technical insights." },
  { t: 292.8, end: 299.6, who: "Participant", text: "Yeah, I noticed that too. I also liked how much focus there was on the baby's comfort. And that a dose of propofol was given." },
  { t: 300.5, end: 303.0, who: "Facilitator", text: "Thanks, those are great points." },
  { t: 303, end: 306, who: "vo", text: "The team consolidates specific technical takeaways." },
  { t: 306.5, end: 309.1, who: "Facilitator", text: "Any tips?" },
  { t: 309.2, end: 315.6, who: "Participant", text: "Yeah, while we're on the subject of communication, I think there could be more clarity about the exact dose." },
  { t: 316, end: 319, who: "vo", text: "Constructive feedback can still be incisive." },
  { t: 319.8, end: 322.2, who: "Ruben", text: "Yeah, that wasn't very clear, I realize that now." },
  { t: 322.5, end: 325, who: "vo", text: "Team input shapes future medical procedures." },
  { t: 325.8, end: 332.0, who: "Ruben", text: "For me the key takeaway is the catheter bend. I'll definitely do that next time, you saw how much easier it made things." },
  { t: 333, end: 338.5, who: "vo", text: "Through thoughtful discussion and shared experiences, teams find ways to improve their daily practice." },
  { t: 340.0, end: 365.2, who: "Facilitator", text: "So, we can conclude that this was a really good procedure, with attention to the baby, comfort, the task division, this is about bringing people along in your perspective through communicating out loud, and that bend in the catheter: a successful procedure." },
  { t: 365.5, end: 368, who: "vo", text: "The facilitator wraps up the session." },
  { t: 368.0, end: 377.6, who: "Facilitator", text: "Now, we'll evaluate your views on this session. You can do that by scanning the QR code. Submit your feedback through the Google Form." },
  { t: 379, end: 386, who: "vo", text: "Each session ends with a QR code, allowing participants to share feedback and shape the program's ongoing improvement." },
  { t: 386.0, end: 389.6, who: "Facilitator", text: "Thank you all. This concludes this session." },
  { t: 390.5, end: 399, who: "vo", text: "These regular conversations about real clinical situations help build practical skills and stronger working relationships." },
];

/** The film's parts: the package's sequences. `from`/`to` in seconds; `frame` a keyframe. */
export const SCENES = [
  { id: 'A', name: "Opening and the kit", from: 0, to: 9, frame: 3, says: "Logo card, then the recording kit and Ruben switching on his head camera in the NICU." },
  { id: 'B', name: "What Neoflix is", from: 9, to: 44, frame: 13, says: "Narrated intro over POV footage from an incubator-side procedure. A clinician writes the session agenda on a whiteboard." },
  { id: 'C', name: "The morning after", from: 44, to: 51, frame: 17, says: "Ruben walks the neonatology corridor and asks a colleague to retrieve last night's footage." },
  { id: 'D', name: "Reflect: Ruben reviews his recording", from: 51, to: 110, frame: 32, says: "In an office, Ruben and a colleague watch the MIST footage. He explains the catheter kept moving backward and picks questions for the team." },
  { id: 'E', name: "Session setup and ground rules", from: 110, to: 135, frame: 44, says: "Corridor b-roll, then the meeting room. The facilitator opens session #20 and sets the ground rules." },
  { id: 'F', name: "Setting the clinical picture", from: 135, to: 202, frame: 61, says: "Ruben describes the evening shift. Colleagues praise how the nurse stayed in the background and kept him updated." },
  { id: 'G', name: "Critique, interruption, rephrase", from: 202, to: 270, frame: 78, says: "A senior nurse aims her criticism at Ruben. The facilitator steps in and she rephrases it as a question." },
  { id: 'H', name: "The catheter curve", from: 270, to: 303, frame: 109, says: "A colleague asks about the curve Ruben put in the catheter. The team praises task division, comfort care and propofol use." },
  { id: 'I', name: "Tips and takeaways", from: 303, to: 340, frame: 126, says: "A tip about stating the exact dose. Ruben names the catheter bend as his key takeaway." },
  { id: 'J', name: "Wrap-up and QR evaluation", from: 340, to: 390, frame: 145, says: "The facilitator summarises, puts up a QR code for the Google Form and closes the session." },
  { id: 'K', name: "Closing", from: 390, to: 404.52, frame: 158, says: "Closing narration cards and the Neoflix end card." },
];


/** Keyframes kept from the package: panel → time and its shot note (alt text). */
export const FRAMES = {
  3: { t: 7.5, alt: "Wide-angle POV selfie. Ruben, masked, in a NICU room with incubators, monitors and two colleagues behind him. Viewfinder overlay with running timecode." },
  13: { t: 32.0, alt: "Close-up. A young female clinician writes \"Sessie #20\" on a gridded whiteboard in black marker." },
  17: { t: 45.0, alt: "Neonatology corridor. Ruben walks toward camera carrying the camera kit past a wooden wall sign reading \"…natologie\". Colleague in the left foreground." },
  23: { t: 57.5, alt: "Office, two-shot. Ruben (left) faces a dark-haired colleague with a lanyard, desk and monitor behind, vertical blinds." },
  32: { t: 85.0, alt: "Insert: the monitor shows gloved hands working inside the incubator during insertion. A file browser of clips is on the second screen." },
  34: { t: 92.0, alt: "Ruben, chin in hand, studies the screen thoughtfully. His colleague is in the right foreground." },
  44: { t: 119.0, alt: "Meeting room. Two young female participants beside a PTZ conference camera. The projector shows a slide of Dutch bullet points (the feedback ground rules)." },
  47: { t: 120.5, alt: "Facilitator, slightly wider, mid-sentence." },
  61: { t: 153.5, alt: "Insert: the projector screen in a darkened view, playing the incubator footage with the Windows taskbar visible." },
  66: { t: 166.0, alt: "Participant (ponytail, right foreground) speaks about the nurse staying in the background." },
  70: { t: 178.5, alt: "Same wide. A participant asks whether they agreed a saturation threshold." },
  78: { t: 205.5, alt: "Closer on the senior nurse speaking, notepad and pen on the table." },
  109: { t: 277.0, alt: "A young blond colleague asks about the catheter curve, gesturing with one hand." },
  126: { t: 310.0, alt: "The participant with glasses and orange lanyard gives her tip, gesturing; a young woman listens on the left." },
  131: { t: 325.5, alt: "Ruben names his key takeaway. The woman with glasses writes notes in the foreground." },
  135: { t: 340.0, alt: "Trio across the table. The facilitator begins her summary." },
  145: { t: 374.5, alt: "Detail: the QR code full on the projector screen." },
  158: { t: 397.0, alt: "Narration card: white text, key words in mint green, over a faded teal-tinted shot." },
};

/** A frame's image path (under public/). */
export const frameSrc = (n) => `/videos/session/p${String(n).padStart(3, '0')}.webp`;

/**
 * Moments: cuts other pages carry. `from`–`to` select lines by time;
 * `tags` are the ontology keys and records they show. Order is how
 * strongly each one shows its tags.
 */
export const MOMENTS = [
  { id: 'remember', from: 57, to: 82, frame: 23, title: 'What do you remember?', tags: ['practice:preview', 'concept:memory-vs-recording', 'guidance:level-2-in-action/10.-previewing', 'claim:skills', 'film:skills'] },
  { id: 'questions-for-team', from: 89, to: 99, frame: 34, title: 'Choosing what to ask the team', tags: ['practice:preview', 'guidance:level-2-in-action/10.-previewing/10.1-questions-to-ask-during-previewing'] },
  { id: 'ground-rules', from: 114, to: 130, frame: 47, title: 'The ground rules', tags: ['practice:chair', 'concept:safe-to-look', 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment', 'guidance:level-2-in-action/11.-lets-neoflix/11.1-getting-the-most-out-of-your-neoflix-session'] },
  { id: 'teamwork', from: 161, to: 191, frame: 66, title: 'Starting with what went well', tags: ['claim:team', 'film:team', 'concept:shared-picture', 'practice:chair'] },
  { id: 'threshold', from: 177, to: 191, frame: 70, title: 'No agreed threshold', tags: ['claim:coordination', 'film:coordination', 'concept:shared-picture'] },
  { id: 'rephrase', from: 202, to: 255, frame: 78, title: 'From the person to the situation', tags: ['concept:safe-to-look', 'practice:chair', 'guidance:level-2-in-action/11.-lets-neoflix/11.3-tasks-of-the-chair', 'guidance:level-2-in-action/11.-lets-neoflix/11.2-a-safe-learning-environment', 'claim:team', 'film:team', 'paper:providers'] },
  { id: 'curve', from: 259, to: 282, frame: 109, title: 'The curve in the catheter', tags: ['concept:variation', 'claim:perspectives', 'film:perspectives', 'practice:act-on-a-finding', 'guidance:level-2-in-action/11.-lets-neoflix/11.4-unlocking-insights'] },
  { id: 'dose', from: 306, to: 322, frame: 126, title: 'A tip about the dose', tags: ['practice:act-on-a-finding', 'concept:pdca'] },
  { id: 'takeaway', from: 325, to: 365, frame: 131, title: 'The takeaway and the summary', tags: ['practice:act-on-a-finding', 'concept:the-loop', 'guidance:level-2-in-action/12.-improving-care-through-the-neoflix-approach', 'paper:recordreflectrefine'] },
  { id: 'evaluate', from: 368, to: 390, frame: 145, title: 'Every session is evaluated', tags: ['practice:make-it-routine', 'guidance:level-3-growth/17.-continuous-improvement', 'paper:practicalguidance'] },
  { id: 'why', from: 9, to: 44, frame: 13, title: 'Record, reflect, refine', tags: ['concept:the-loop', 'guidance:', 'guidance:welcome/neoflix/how-it-works'] },
];

/** The lines a moment covers. */
export const linesOf = (m) => LINES.filter((l) => l.t >= m.from && l.t < m.to);

/** The moments that show `key` (a record or ontology key), best first. */
export function momentsFor(key) {
  return MOMENTS.filter((m) => m.tags.includes(key)).sort((a, b) => a.tags.indexOf(key) - b.tags.indexOf(key));
}
