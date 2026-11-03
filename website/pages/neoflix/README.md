# website/pages/neoflix/

`/neoflix` — the long-form article about the programme. `/contact` renders the
same page, scrolled to the contact section.

| | |
|---|---|
| `NeoflixPage.jsx` | Picks the surface: laptop or phone |
| `NeoflixDesktop.jsx` | The laptop page: the essay in three acts, on `../../shared/BlogPage.jsx` |
| `modules/` | One composition per chapter (`Chapters.jsx`) and per Act III part (`InPractice.jsx`), mapped by section id in `NeoflixDesktop.jsx`. A chapter without a module falls back to the standard card. |
| `practice/` | Act III — the film, the toolbox as a route, the success-story map, the sign-off — and the "In the toolbox" row under each chapter |
| `NeoflixPhone.jsx` | The phone version, including its own hero text |
| `content.js` | All the section prose and titles — shared by both surfaces |
| `backdrop.js` | Which backdrop video plays behind each section |

Unlike the homepage, both surfaces read their prose from the same
`content.js`, so a wording change here only has to be made once. The phone
hero near the top of `NeoflixPhone.jsx` is the exception.

The page is the homepage story told at length, in the same two acts. The act
openers ("In the moment, only the patient matters", "Yet, reflection
strengthens the next") and each chapter's opening statement are read from
`../home/story/story.data.js` — the homepage captions — not from
`content.js`. Change them there; both pages follow.

Act III and the chapter rows are read from the toolbox itself
(`practice/toolbox.js`, over the compiled docs manifest): page titles as the
toolbox sidebar shows them, and each page's opening sentence. Rename or
reorder something in GitBook and this page follows on the next build — there
is nothing to update here.

The chapter modules lift a few phrases out of the prose — the cast of roles in
*Like a dance*, the pull quote in *But this comes at a cost*, the lists in the
last two chapters. Each is matched against `content.js` at render time: reword
the sentence and the lifted phrase simply disappears rather than going stale.
The lists of candidate phrases are at the top of each module in
`modules/Chapters.jsx`.
