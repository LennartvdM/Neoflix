# website/pages/neoflix/

`/neoflix` — the long-form article about the programme. `/contact` renders the
same page, scrolled to the contact section.

| | |
|---|---|
| `NeoflixPage.jsx` | Picks the surface; the laptop version renders through `../../shared/BlogPage.jsx` |
| `NeoflixPhone.jsx` | The phone version, including its own hero text |
| `content.js` | All the section prose and titles — shared by both surfaces |
| `backdrop.js` | Which backdrop video plays behind each section |

Unlike the homepage, both surfaces read their prose from the same
`content.js`, so a wording change here only has to be made once. The phone
hero near the top of `NeoflixPhone.jsx` is the exception.
