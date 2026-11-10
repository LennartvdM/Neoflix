# website/travelling/ — units and questions as places you move between

`/travelling`. Four units' answers to the same eight questions, laid out
as a grid of places. The reader is on one place and sees only what
stands around it. Ported 2026-11 from the owner's single-file prototype
(`neoflix-travelling.html`, the demonstrator hand-off); the interface
logic is his and is the part to keep.

**A train, not a drone.** It should travel, and it must not feel like
Prezi (one camera move over a world that already lies there whole):

1. **Moving goes sideways. Staying goes deeper.** A step moves the world
   one place past you. Only when you stop does the place come up: what
   lies further on, what it rests on, where it stops.
2. **There is no camera.** The reader stays put. Nothing zooms. What is
   ahead is small and faint, grows when you reach it, shrinks behind you.
3. **The world exists only around you.** Two steps ahead, one behind. The
   whole is never on the stage; it is the small matrix in the sidebar.
4. **One gesture is one step.** Pagination, momentum swallowed.
5. **A neighbour's reason is always legible.** Two axes, one meaning
   each: the same question in another unit (left/right), the same unit on
   another question (up/down).
6. **One dark object: where you are.** Everything else is light.

## The pieces

| | |
|---|---|
| `places.js` | The words: units, questions, each unit's answer, what a question rests on, what nobody has said. Node-safe. Read its header on whose words these are. |
| `world.js` | The rules, no drawing: slots, depths and their timings, the wheel thresholds, `around(q, u, depth)` (what stands where), addresses. Node-safe. **Tune the feel here.** |
| `Travelling.jsx` | Draws it and listens: the card lifecycle, keys, wheel, the matrix, "Your way here", the "As published" control. |
| `travelling.css` | The look. Every class is prefixed `trv-`. |

It has its own chrome, so `App.jsx` renders it outside the navbar and
the page slide, like the composition. Its address is in
`shared/routeMeta.js` (canonical points at `/`, so it stays out of the
sitemap).

## Roles and slots

Every card is one place (question × unit) in one role. A place keeps the
same DOM element as its role changes, so the CSS transitions on
left/top/width/height carry it from slot to slot.

| Role | Which place | Look |
|---|---|---|
| `subject` | where you are | dark card, big headline, the unit's name huge and faint behind it |
| `near` | same question, next unit | white card, headline and body |
| `far` | same question, two units on | faded, cropped by the stage edge |
| `passed` | same question, previous unit | tucked half behind the subject's left edge |
| `ques` up / down | same unit, previous / next question | small card, teal label |
| `qfar` | same unit, two questions on | faded |
| `slip` ×2 | what the question rests on | tucked under the subject's bottom edge (under = rests on) |
| `film` | a session-film moment (Leiden only) | a frame feathered into a dark card |
| `edge` | what nobody has said | words only, no card |

A place a unit has not answered is still a place: "Not said." in a ghost
card, and you can travel to it.

### Seams: what is inside a card

Between cards the language is overlap: over = part of it, under = what
it rests on, separate = elsewhere (the owner, 2026-11: the overlaps are
the more intuitive language and stay). **Seams are only for what is
inside one card**: an answer that has parts (`parts` in `places.js`:
three moments of consent, two hospitals, three changes) is one surface
cut where the parts meet. Fused on arrival, it reads as one block; at
"Underneath" the seams open from a hairline and the corners round as
the gap grows. What holds for every part (`all`) stays fused beneath
them, so the parts are teeth on one spine. After the owner's Splits
sandbox (talentexecutive, `splits.js`: a layout is a tree of seams, each
open or fused). This is plain CSS, enough for a row on a spine; the
hollow corners where a tooth meets the spine stay square, which the
real engine would round.

Depth by staying (`DEPTHS` in `world.js`): the ways on at once; `far`
and `qfar` after 1.2 s; `slip` and `film` after 3 s; `edge` after 5.2 s.
Every move resets it. Space brings the next depth now; the four pills
set it by hand (for presenting) and stop the clock until the next move.

Entering and leaving: on a **move** a new card comes in from one step
away in the direction of travel, and one no longer wanted is carried
three quarters of a step the other way while it fades; no scaling. On
**staying** a new card comes out from behind the middle of the subject.

A place has an address: `/travelling?q=the-staffs-say&unit=vienna`. It
follows the reader with `replaceState`, so Back leaves the interface.

## Traps

- **Cards are appended, never re-sorted.** Moving a DOM node restarts its
  transitions. A place that returns while its old card is still fading
  gets a second card (ids are `key#serial`).
- **The stage is 1440×900 design coordinates, scaled as one piece.** Slots
  are plain numbers; don't make them responsive one by one. Below 900 px
  wide it falls back to a stack that is not designed, only made not to
  break.
- **The answers are shortened by Claude, not the researcher's wording**,
  and the sidebar says so. Keep that label or replace the sentences
  before this is more than a design study. Film lines are verbatim
  subtitles; never edit those.
- **No Google Fonts.** The prototype linked them; here the faces come
  from `shared/fonts.css`.

## Not yet verified

- **Never felt on a real trackpad or mouse.** The wheel threshold and
  gap (`WHEEL`) and the dwell timings (`DEPTHS`) are guesses.
- Rough spots carried over from the prototype: the `passed` card is
  large and mostly empty; cards leaving upward pass over the view switch
  for a moment; the drift on the ways on may distract more than it adds;
  8 × 4 may be too small a world to feel like travelling at all.

## Where next

1. Feel it on a trackpad and tune `WHEEL`, `DEPTHS`, the curve (`--ease`).
2. Lengthen the axes with more of the questions below, filled from
   `docs-content/`. Keep the unanswered places.
3. Decide what `passed` should be: narrower, or a stack that deepens
   with the trail.
4. Join it to the composition (`website/composition/`): `around` is the
   plane-shaped sibling of `atlas.js`'s `move`, and the roles are the
   ontology's need / adjacent / under / witness.

## The toolbox as twenty-four questions

Sorted by what a unit has to decide, in the order it has to decide it.
"In" lists where the published toolbox holds pieces of the answer (chapter
numbers as in `docs-content/SUMMARY.md`; "4" is the four unit pages).
"Open" is what no unit has said. **Bold** rows are in `places.js`.

| # | Question | In | Open |
|---|---|---|---|
| 1 | What is it for? | 1.1 (last third), 13, FAQ, 4 | |
| 2 | Is it worth the time? | 1.4, FAQ, 6 | What a programme costs in hours a week |
| 3 | Who starts it? | 2.1, 4 | What to do when the person who wants it is junior, or alone |
| 4 | How do the team and the management come along? | 2.2, 2.3, Quick-start, FAQ | A unit where it did not take |
| **5** | **Does the family have to agree?** | 3.1, 4, FAQ | Where the patient is an adult and awake |
| **6** | **Do the staff have to agree?** | 3.1, 5, 5.1, 5.3, 2.3, FAQ | Whether asking three times is what fills the room |
| 7 | Who can be recognized? | 3.3, 4, 5.3, 9.2 | |
| **8** | **Where does the file live, how long, can the family see it?** (two demo questions: "Can the family see it?", "How long is it kept?") | 3.2, 4, 9.1, 9.3, 13.3, FAQ | How long Vienna keeps them; whether a recording can be used in court |
| 9 | What if a mistake is on the recording? | FAQ, 8.3, 2.3 | |
| **10** | **What do you record first?** (demo: "What do you record?") | Quick-start, 3.3, 5.2, 6, 4 | |
| 11 | With what? | 6 and its five sub-pages, 7, 8.1, 8.2, 3.2, 4 | How to record the breathing monitor alongside ("MEER UITLEG") |
| 12 | Who presses record? | FAQ, 2.3, 4, 6.5 | A fix that worked |
| 13 | What happens to the file before the session? | 11.3, 9.2 | |
| **14** | **Who sees it first?** | 10, 10.1, 4 | What Melbourne's coaching study found |
| **15** | **Who is in the room, for how long, how often?** | 11.1, 2.3, 4, FAQ | Together or apart; nobody has compared |
| 16 | Who runs it, and by what rules? | 11.2, 11.3, Quick-start, 4 | |
| 17 | What do you look for? | 11.4, 10.1, 1.1, FAQ | |
| 18 | How do you know it felt safe? | 11.4 | What the other units ask, if anything |
| **19** | **What is done with what was said?** (demo: "What changed because of it?") | 12, 13 and its four sub-pages | What Philadelphia and Melbourne changed |
| 20 | How do you know a change held? | 13, 13.1 | Whether patients are better off |
| 21 | What else can a recording do? | 13.2–13.4, 14, 15, 16, 4 | |
| 22 | How does it stay alive? | 17, FAQ, Welcome | Whether any programme has stopped, and why |
| 23 | Can two units watch together? | 18 | Only one pair has done it |
| 24 | Does it work outside a neonatal unit? | 1.3, 1.4, preface | Everything; the toolbox fills this with five imagined cases |

The imagined cases, for whoever extends row 24: a knee-replacement team
reviewing a routine operation; trainee intensivists recording their own
intubations; specialists guiding an outback hospital by video and reviewing
afterwards; a low-resource and a high-resource hospital reviewing together
(all in 1.2); and the adult-ICU triple-consent story of Dr. van der Velde
and Nurse Jeroen (chapter 5). None of them happened.
