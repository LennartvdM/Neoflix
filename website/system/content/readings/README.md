# system/content/readings — the papers, read on the site

One file per paper, in one of two kinds:

- **reading** (open licence: narrative CC BY, practicalguidance CC BY-NC,
  drivingresearch CC BY, internationalcollab CC BY): the paper's own words,
  **verbatim**, in its own sections, a passage per paragraph. Only PDF
  artefacts were removed (line breaks, line-break hyphens, page headers,
  footers and page numbers). Front matter, references, table bodies and
  back matter are left out and listed in `omitted`. A paragraph the PDF
  breaks across a page or column is stored as two passages, the second
  with `"continues": true`; the page shows them as one.
- **synopsis** (publisher's licence: providers, recordreflectrefine): notes
  written for the site **in our own words**, with key figures. No sentence
  or distinctive phrase of the paper is reproduced.

Everything we add is a separate layer, never mixed into the author's
text: `notes` (gloss, context, link, guide; shown in the margin),
`intermissions` (a concept's explainer after a section), `morsels`
(exact sentences other pages may quote, tagged with what they support).

**Her words are not to be edited here.** These are the PhD work of the
lead author; she will direct this herself. To change what the site says
about a paper, change the notes, not the passages.

Check a reading against its PDF after any edit:

```bash
python3 scripts/verify-reading.py system/content/readings/*.json
```

It fails if a passage's words (letters and digits, in order) aren't the
PDF's, allowing only page furniture or text held elsewhere in the reading
(a floated caption, a box, a heading) inside a broken paragraph. It does
not check punctuation. `scripts/system-check.mjs` checks the layer on
every build (notes and morsels on real passages, morsels exact
substrings, links that land, open licence for a verbatim reading).
`scripts/build-readings.mjs` writes the index the atlas uses.
