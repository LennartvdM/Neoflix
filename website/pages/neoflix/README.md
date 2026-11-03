# website/pages/neoflix/

`/neoflix` — the argument, at article depth. `/contact` renders the same page,
landed on its sign-off.

| | |
|---|---|
| `NeoflixPage.jsx` | Picks the surface: laptop or phone |
| `NeoflixDesktop.jsx` | The laptop page: six beats, then "Four units that record" and the sign-off — a composition of the board's hooks (`../../shared/board/`) |
| `neoflix-board.css` | The little that composition needs beyond the hooks |
| `NeoflixPhone.jsx` | The phone version, including its own hero text |
| `content.js` | The older chapter prose — now read only by the phone page |
| `backdrop.js` | Which blurred clip plays behind each section |

**The laptop page's words are not in this folder.** Each beat's claim,
in-practice line, proofs, clip caption, film timecode, instrument and exits
come from `../../shared/argument.js`, which the homepage reads too. Every beat
has the same skeleton in the same order — orientation, claim, witness, proof,
instrument, exits — and a hook with nothing in it simply doesn't render: the
page's asymmetry comes from the content, not from per-beat design.

Instruments (the narrowing frame, twenty rows, the retyped sentence) live in
`../../shared/board/instruments.jsx`; they are first sketches meant to be
replaced in place.
