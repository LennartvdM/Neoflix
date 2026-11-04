# website/pages/home/

The homepage. Five full-screen slides that snap as you scroll: the intro, two
story sections, the showcase video, and the world map.

| | |
|---|---|
| `Home.jsx` | Picks the surface — laptop or phone — and loads only that one |
| `HomeDesktop.jsx` | The laptop version: the list of slides, in order |
| `HomePhone.jsx` | The phone version, including `MOBILE_PANELS` |
| `content.js` | `TAGLINE` — the sentence under the logo. It has exactly one home; never retype it elsewhere. |
| `intro/` | The opening slide: the logo animation and the "Record / Reflect / Refine" words |
| `story/` | The two story sections — see below |
| `VimeoSection.jsx` | The showcase video slide |

The world map slide comes from `../../shared/worldmap/`, because the Toolbox
uses the same map.

## The two story sections

They're one component rendered twice with different content, keyed in
`story/story.data.js`:

- **`pressure`** — the problem. Urgency, coordination, tunnel vision.
- **`reflection`** — the answer. Sharpened skills, cohesion, shared understanding.

That name is used end to end: the slide list in `HomeDesktop.jsx`, the `story`
prop, `STORIES` in the data file, and the backdrop's `medical-<story>` keys.

**The headlines in `story/story.data.js` are repeated in `MOBILE_PANELS` in
`HomePhone.jsx`**, in a different shape. Change one and the other is now
wrong — the site will say different things depending on the device. Both files
carry a warning comment.

Adding, removing or reordering a slide in `HomeDesktop.jsx` means updating
`HOME_CELLS` in `../../shared/backdrop/BackdropProvider.jsx` to match; it mirrors
the slide list by position.
