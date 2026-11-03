# website/pages/neoflix/

`/neoflix` — the argument, at article depth. `/contact` renders the same page,
landed on its sign-off.

| | |
|---|---|
| `NeoflixPage.jsx` | Picks the surface: laptop or phone |
| `NeoflixDesktop.jsx` | The laptop page as a board: the six beats as rows, the toolbox's five parts as columns (each beat's doors hang as pegs in the part they lead to), the six papers as threads down the right; then "Four units that record" and the sign-off |
| `neoflix-board.css` | The little that composition needs beyond the hooks |
| `NeoflixPhone.jsx` | The phone version, including its own hero text |
| `content.js` | The older chapter prose — now read only by the phone page |
| `backdrop.js` | Which blurred clip plays behind each section |

**The laptop page's words are not in this folder.** Each beat's claim,
in-practice line, findings, clip caption, film timecode, instrument and exits
come from `../../shared/argument.js`, which the homepage reads too. Inside its
row a beat's modules are sized by their weight (claim length, how many
findings and how heavy) and packed densely; a beat's pegs land in the loop
column their planned toolbox part belongs to (`loopPartOf`). So every row has
its own shape, and empty cells stay empty — the asymmetry comes from the
content, not from per-beat design. A beat opens in place to its instrument,
which spreads across the board.

Instruments (the narrowing frame, twenty rows, the retyped sentence) live in
`../../shared/board/instruments.jsx`. They are scrubbed with the pointer (or
arrow keys), and are first sketches meant to be replaced in place.
