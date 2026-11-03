# website/pages/home/

The homepage. Four full-screen slides that snap as you scroll: the intro, the
two story sections, and a closing slide with the ways out.

| | |
|---|---|
| `Home.jsx` | Picks the surface — laptop or phone — and loads only that one |
| `HomeDesktop.jsx` | The laptop version: the list of slides, in order |
| `HomePhone.jsx` | The phone version. Its six clip panels read their sentences from `../../shared/argument.js` |
| `content.js` | `TAGLINE` — the sentence under the logo. It has exactly one home; never retype it elsewhere. |
| `intro/` | The opening slide: the logo animation and the "Record / Reflect / Refine" words |
| `story/` | The two story sections — see below |
| `HomeExit.jsx` | The closing slide: "Read how Leiden did it", the six clips as doors to their beats, "Run your first session" |

The film and the world map are no longer slides here: they hang on `/neoflix`
where the argument uses them (beat 5's film door, "Four units that record").

## The two story sections

They're one component rendered twice with different content, keyed in
`story/story.data.js`:

- **`pressure`** — the problem. Urgency, coordination, tunnel vision.
- **`reflection`** — the answer. Sharpened skills, cohesion, shared understanding.

That name is used end to end: the slide list in `HomeDesktop.jsx`, the `story`
prop, `STORIES` in the data file, and the backdrop's `medical-<story>` keys.

**The six captions are not written here.** They are the beats' claims in
`../../shared/argument.js`, split into two lines automatically; the answer
captions also show each beat's `homeProof`. Desktop and phone both read them.
Only the two headlines ("In the moment…", "Yet, reflection…") are written
twice — `header` in `story/story.data.js` and `chapterHeader` in
`HomePhone.jsx`.

Adding, removing or reordering a slide in `HomeDesktop.jsx` means updating
`HOME_CELLS` in `../../shared/backdrop/BackdropProvider.jsx` to match; it mirrors
the slide list by position.
