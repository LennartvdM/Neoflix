# The ontology (draft, 2026-11)

The site's material was organised by *where it was published*: six
films, six papers, 68 toolbox pages. Readers don't think in those
containers. They come with a question ("does this work?", "how do I
start?", "what do I do as the chair?") and the answer is spread across
all three. This draft names what the material is actually made of, so
pages can be assembled from meaning. The data is
`system/content/ontology.js`; `scripts/system-check.mjs` fails the build
on a broken link in it.

## The categories

| Category | What it is | Count (draft) | Replaces / pulls apart |
|---|---|---|---|
| **claim** | A sentence of the argument, in two movements: *in the moment* (what goes wrong) and *watching it back* (what changes) | 6 | The film's `claim`, the tour stop's headline, the homepage headline: three copies of one sentence. A film now *illustrates* a claim. |
| **finding** | One measured statement from one paper, with its figure ("8 / 20", "93%", "101 / 125") and where it was measured | 10 | Numbers retyped inside films' findings, tour text and paper summaries. Said once, cited everywhere. |
| **concept** | An idea that needs *explaining*, not proving: the first minutes, one shared picture, tunnel vision, memory against a recording, safe to look, doing the same thing differently, the loop, plan-do-check-act, closed vocal cords, real consent | 10 | Nothing: this category didn't exist. Each concept has an **explainer**, a slot for an abstract moving illustration (placeholders now). |
| **practice** | Something a unit does (a verb): start small, find pioneers, obtain consent, record, preview, chair, turn a finding into a change, research, review with another unit, make it routine | 10 | The toolbox's 68 pages as the unit of action. A practice gathers the 1–3 pages that document it, sits in a step of the loop, and is done by roles. |
| **role** | Who arrives: starting it in your unit, being recorded, chairing sessions, asking a research question | 4 | Nothing: the site addressed everyone the same. A role is an entry: what it needs, in order. |
| **unit** | Where it's done: Leiden (since 2009), Vienna, Philadelphia, Melbourne | 4 | The success-story pages, as places findings come from. |

## How they link

```
film ──illustrates──▶ claim ──rests on──▶ finding ──from──▶ paper
                        │                    └──at──▶ unit
                        ├──explained by──▶ concept ⇢ explainer (animation slot)
                        └──leads to──▶ practice ──documented in──▶ toolbox pages
                                          ├──in──▶ step of the loop
                                          └──done by──▶ role ──needs──▶ practices
```

What that does to a page, in the tiers already in use (`ontology.js` in
this folder): **need** = the claim, its film (feathered), its
explainer; **under** = its findings (not whole papers: the finding is
what it rests on; the paper is where the finding comes from);
**want** = the practices it leads to; **adjacent** = the claims beside
it. A toolbox page's need becomes its practice; a paper's need its
findings.

## What's wired so far

- The data and its integrity check.
- Explainers are **intermissions**, not page furniture (the owner:
  "the animations need to hit the edges, like an intermission so it
  doesn't feel all cluttered"). An intermission is its own page in the
  story (`INTERMISSIONS` in `tour.js`): the explainer takes the whole
  screen, edge to edge and under the frosted sidebar, with only the
  concept's name and one sentence on it (`Intermission.jsx`). Three for
  now, at the turns of the argument: *memory against a recording*
  (after Focus), *one shared picture* (after Team), *the loop* (before
  the toolbox). They're breaths, not places: not in the sidebar's list,
  not counted in "n of 17". The stage is a placeholder (a deep, cool
  field with slow shapes) with the animation brief (`motion`) written
  faintly in the corner for whoever makes the real one.

Not yet: pages aren't assembled from claims and findings (they still
read films.js and papers.js), and roles have no entry point.

## Content to rewrite (proposals, not done)

1. **One home per sentence.** The six claims live in `CLAIMS`; films.js,
   the tour and the homepage should read them, not retype them.
2. **Numbers only in findings.** Tour text ("8 of 20 infants…", "101 of
   125…") should cite a finding instead of restating the figure.
3. **Films' practice links.** `films.js` sends Urgency and others to
   "Who is this for?"; the practices in `CLAIMS.leadsTo` are the
   proposed replacement (Urgency → start safe, simple and small).
4. **Concepts need their own short texts** (two or three sentences
   each), written for the explainer, not lifted from the toolbox.
5. **The toolbox stays in GitBook** (CLAUDE.md rule 1). Practices point
   at its pages; they don't rewrite them.

## Open questions for the owner

- Are these six claims the argument, or is one missing (e.g. *it takes
  a culture, not a camera*)?
- Is "role" the right entry, or is it the reader's *situation* ("we
  have cameras but nobody comes")?
- Which concepts deserve a real animation first? Suggested: memory
  against a recording, one shared picture, the loop.
- Units: is the map of four units a category worth its own pages, or
  context only?
