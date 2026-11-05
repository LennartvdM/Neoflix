# Inventory — all the material, before the ontology (2026-11-05)

What exists, where it lives, how big it is, and whether the live site
uses it. Counted from the repository, not remembered. Next step (not
done here): find the ontology in it; the draft is
`website/system/content/ontology.js` / `website/composition/ONTOLOGY.md`.

## At a glance

| Material | Amount | Where | Live? |
|---|---|---|---|
| Foreground film clips | 6 (≈3.4 MB) | `website/public/videos/*.mp4` | yes |
| Blurred backdrop loops | 6 (≈1.4 MB) | `website/public/videos/blur*.mp4` | /neoflix, /publications |
| Phone clips | 6 + intro montage (9.6 MB) | `website/public/videos/mobile/` | old phone homepage (not routed) |
| Stills / posters | 13 webp + 8 jpg/png | `videos/stills/`, `videos/mobile/*_poster.*` | yes |
| The session film | 1 (Vimeo, 6:44), transcribed: 64 turns (±0.5 s), 11 sequences, 11 quotable moments, 18 keyframes | `system/content/session-film.js`, stills in `public/videos/session/` (from the owner's context package) | yes: moments on pages, a transcript page |
| Toolbox videos | 3 (GoPro on the resuscitation table, putting on the eye-tracking glasses ×2) | `docs-content/.gitbook/assets` → `public/docs-assets` (95 MB total) | inside a few toolbox pages |
| Papers | 6 PDFs + a zip bundle (24 MB) | `website/public/papers/` | yes |
| Publisher screenshots | 6 | `website/public/previews/` | /publications |
| Toolbox | 75 markdown files, ≈22,700 words | `docs-content/` (GitBook mirror) | yes |
| Toolbox images & files | 6 images, 1 PowerPoint | `docs-content/.gitbook/assets` | yes |
| Site-written prose | ≈9,900 words across 12 files | see "Words" below | partly |
| World map | 1 interactive map, 4 units | `website/framer-map/` (compiled Framer) | toolbox / old homepage |
| Fonts | Inter, Montserrat, Space Grotesk | `website/public/fonts/` | yes |

## Moving image

**The six films** are the spine of everything. Each has a clip, a still
and a blurred twin, and each has gone by several names:

| Film | Desktop clip | Backdrop loop | Phone clip | /neoflix section | In the session film |
|---|---|---|---|---|---|
| Urgency | `urgency.mp4` | `blururgency.mp4` | `mobile/urgency.mp4` | time-sensitive | 0:12 |
| Coordination | `coordination.mp4` | `blurcoordination.mp4` | `mobile/coordination.mp4` | like-a-dance | 0:20 |
| Focus | `focus.mp4` | `blurfocus.mp4` | `mobile/tunnelvision.mp4` | cost | — |
| Skills | `skills.mp4` | `blurskills.mp4` | `mobile/reflection.mp4` | sharpening | 1:06 |
| Team | `team.mp4` | `blurteam.mp4` | `mobile/cohesion.mp4` | team-dynamics | 3:35 |
| Perspectives | `perspectives.mp4` | `blurperspectives.mp4` | `mobile/alignment.mp4` | perspectives | — |

Also: `mobile/neoflix_intro_blur_montage.mp4` (the old phone intro, 9.6 MB,
already optimal; CLAUDE.md rule 7), and the session film on Vimeo (one
long recording the clips are cut from; `dnt=1`). The toolbox has three
raw clips of its own: a GoPro switched on at the resuscitation table, and
two of a clinician putting on Tobii eye-tracking glasses. Media rules
(re-encoding, stills, posters) are in CLAUDE.md rule 7.

## The papers

Six studies, 2022–2026, each held in up to five places:

| # | Short | Journal, year | PDF | Abstract in repo | Notes (asked / found / changed) | /publications text |
|---|---|---|---|---|---|---|
| 1 | Narrative review | Frontiers in Pediatrics 2022 | ✓ | ✓ (open licence) | ✓ | ✓ |
| 2 | What it is like (providers' perspective, 28 interviews) | Arch Dis Child F&N 2024 | ✓ | — | ✓ | ✓ |
| 3 | Record, reflect, refine (120 improvements) | Pediatric Research 2024 | ✓ | ✓ | ✓ | ✓ |
| 4 | The guideline (101/125 attended) | BMJ Open Quality 2024 | ✓ | ✓ | ✓ | ✓ |
| 5 | The vocal cords (93% closed) | Resuscitation 2024 | ✓ | — | ✓ | ✓ |
| 6 | Two units (Leiden–Vienna, 19 differences) | Children 2026 | ✓ | ✓ | ✓ | ✓ |

Places: bibliographic facts and abstracts `pages/publications/records.js`
(≈1,600 words); the library's notes `system/content/papers.js` (≈320);
the /publications page's own narrative, a preface and one section per
paper `pages/publications/content.js` (≈1,400); PDFs and the zip bundle
`public/papers/`; publisher screenshots `public/previews/`.

## The toolbox (GitBook mirror, CLAUDE.md rule 1)

75 markdown files, ≈22,700 words, in a welcome and three levels:

| Part | Pages | Words | What's in it |
|---|---|---|---|
| Welcome | 7 | ≈4,000 | Who it's for, quick-start (14-item checklist), FAQs (1,170 words, the longest page), what Neoflix is, how it works, a success story |
| Level 1 · Fundamentals | 20 | ≈7,700 | 1 Preproduction (beyond the procedure, use cases, history, unburdening), 2 Planning (pioneer team, buy-in, tips), 3 Safe, simple & small (7-item checklist), 4 Success stories (Leiden, Vienna, Philadelphia, Melbourne) |
| Level 2 · In action | 42 | ≈9,700 | Record: 5 consent, 6 equipment (fixed, mobile, wearable, monitoring, motion-detecting), 7 footage (steady, audio, light), 8 during the intervention, 9 after it · Reflect: 10 previewing (8 questions), 11 the session (getting the most, safe environment, tasks of the chair: 10-item checklist, insights) · Refine: 12–16 improving care, the approach (protocol change, research, variety, training), education, research, implementing practices |
| Level 3 · Growth | 4 | ≈1,060 | 17 continuous improvement, 18 expanding (join the network) |

Shape of it: 5 section dividers ("RECORD", "LEVEL 3: GROWTH"…) are pages
too; 5 pages carry checklists (42 items); 15 images; 121 internal links
(74 of them the table of contents). Thin pages: 9 under 100 words
(8.1, 9.1–9.3, the RECORD divider and the intros of chapters 7, 8, 9
and 11). Plus the toolbox's own README and table of contents. The site links only 14 of
the 74 toolbox pages to anything (via the films); the other 60 are
reachable by structure alone.

## Words the site wrote itself

The argument, the six beats, exists **six times**, in drifting words:

| Version | Where | Example (the Focus beat) |
|---|---|---|
| Old homepage headlines | `pages/home/story/story.data.js` | "Task-driven focus can lead to tunnel vision and misalignment." |
| Phone homepage panels (≈1,200 words) | `pages/home/HomePhone.jsx` | same sentences, phone shape |
| /neoflix long read (≈590 words + contact) | `pages/neoflix/content.js` | "But this comes at a cost" |
| Film records | `system/content/films.js` (claim, caption, in practice, findings, links) | "Everyone is watching their own hands. Afterwards, nobody can say exactly what happened." |
| The story (17 stops, chapters, doors, intermissions) | `website/composition/tour.js` | "Everyone is watching their own hands." |
| Ontology draft (claims) | `system/content/ontology.js` | "Everyone is watching their own hands; afterwards nobody can say exactly what happened." |

Also: the tagline (one home, `TAGLINE` in `pages/home/content.js`);
3 paths with blurbs (`system/content/paths.js`); route titles and
descriptions for search engines (`shared/routeMeta.js`, ≈1,000 words);
the contact section (info@neoflix.care); the ontology draft's findings,
concepts (with animation briefs), practices, roles and units.

**Numbers repeated by hand** (they should live once, as findings): 8 of
20 not breathing; 93% cords closed; 120 improvements / 84 by colleagues
doing it differently; 101 of 125 attended / 80 recorded; 177 of 179
positive; 28 interviews; 19 differences / 7 changes; recorded since
2009, intubations and lines since 2021; 25 beds, 600–650 admissions.

## Structure that already exists (data, not prose)

| | Count | Where |
|---|---|---|
| Records (the library's catalogue) | 86: 74 toolbox pages (5 dividers), 6 papers, 6 films | `system/catalog.js` |
| Links between records | 24: 10 film↔paper (evidence), 14 film↔toolbox (practice) | `system/content/films.js` → `system/graph.js` |
| Loop | 5 steps: before you record, record, reflect, refine, keep going | `system/catalog.js` |
| Paths | 3: why record at all (6), your first session (7), the evidence (6) | `system/content/paths.js` |
| The story | 17 stops in 4 chapters + 3 intermissions | `composition/tour.js` |
| The atlas | 284 pages (the story down, depth to the right) | `composition/atlas.js` |
| Page ontology | need / want (≤3) / adjacent / under / over | `composition/ontology.js` |
| Library modules | 18 (text, findings, practice, film, cite, …) | `system/modules/` |
| Ontology draft | 6 claims, 10 findings, 10 concepts, 10 practices, 4 roles, 4 units | `system/content/ontology.js` |
| Reader state (localStorage only) | trail, pack, checklist ticks, ripeness, place in the story | `system/state.js`, `system/ripeness.js` |

## Interfaces built so far (material too: they're ways of telling it)

| | Status |
|---|---|
| The composition: atlas, sidebar, scenes, intermissions, map | live, homepage and every record (`website/composition/`) |
| /neoflix long read (the six beats as one scrolling page) | live (`shared/BlogPage.jsx`) |
| /publications (the six papers with backdrop loops) | live |
| /pack (your session pack) | live |
| The space (zoomable plane, camera tour) | in the tree, not routed (`website/space/`) |
| The old homepage (scroll-snapped story, video backdrop) | in the tree, not routed (`pages/home/`) |
| The repository prototype (records, paths, graph) | built outside the repo earlier this session; not kept |
| The Talent naar de Top deck (Vragenlijst-Executive-Search) | the source of the current visual language |

## What this suggests for the ontology (observations, not decisions)

1. The **six beats** are the one thing told everywhere, six times, with
   three or four names per beat (Focus = cost = tunnel vision =
   misalignment). One canonical claim each, with the old phrasings kept
   as variants, would let every surface read one source.
2. **Findings** are the most reused material and have no home of their
   own yet; every number above is typed in two to four places.
3. The toolbox is **most of the words** (≈22,700 of ≈33,000) and the
   least connected: 60 of 74 pages link to nothing outside the toolbox.
   It reads as practice; it isn't wired as practice.
4. **Papers are described four ways** (abstract, notes, /publications
   narrative, the story's text). The notes' asked / found / changed is
   the most usable shape.
5. **Material that has no category yet**: the toolbox's own videos (eye
   tracking, the GoPro), the PowerPoint for introducing Neoflix to a
   team, the four units and their map, the FAQ (questions people
   actually ask), the history of video recording in healthcare.
6. **Gaps**: no material for parents (though paper 3 invited them), no
   people (who the team is), no audio, no explainer animations yet
   (10 briefs exist). The session film is transcribed since, with keyframes; see `system/content/session-film.js`.
