#!/usr/bin/env python3
"""Check a paper's reading against its PDF: are these her words, unchanged?

usage: python3 scripts/verify-reading.py system/content/readings/<id>.json
       (the PDF is found in public/papers/ from the reading's "pdf" field)

For a verbatim reading (kind "reading"), every passage's letters and
digits, in order, must occur in the PDF's text. A passage may be
interrupted in the PDF (a page break, a column, a figure caption floated
into the middle of a paragraph): then each piece must match exactly, and
whatever the PDF puts between the pieces must be page furniture (the
journal's running header, DOI line, page number) or text that is in the
reading as its own passage. Anything else fails, naming the passage. Line
breaks, line-break hyphens and spacing are ignored; words and their order
are not.

Also: notes and morsels sit on passages that exist, and a morsel's quote
is an exact substring of its passage. A synopsis (our own words) skips the
verbatim check. Needs `pdftotext` (poppler).
"""
import json, os, re, subprocess, sys

def stream(s):
    s = s.replace('­', '').replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff').replace('ﬃ', 'ffi')
    return re.sub(r'[^a-z0-9]', '', s.lower())

def explained(gap, P, allp):
    """Is everything the PDF puts inside a passage something else? It must
    be made entirely of: long runs of other text in this reading (a floated
    caption, a box, a section heading; 12+ chars), text that recurs on
    several pages (the running header/footer: 20+ chars, 3+ times in the
    PDF), and page numbers right next to that header. A missing word or
    number is none of these."""
    pieces = []
    k = 0
    while k < len(gap):
        best = 0
        for L in range(len(gap) - k, 11, -1):
            piece = gap[k:k + L]
            if piece in allp or (L >= 20 and P.count(piece) >= 3):
                best = L; break
        if best:
            kind = 'text' if gap[k:k + best] in allp else 'furniture'
            pieces.append((kind, gap[k:k + best])); k += best; continue
        m = re.match(r'\d{1,4}', gap[k:])
        if m:
            pieces.append(('digits', m.group())); k += len(m.group()); continue
        return False
    # page numbers only beside the running header
    for i, (kind, _) in enumerate(pieces):
        if kind == 'digits':
            near = [pieces[j][0] for j in (i - 1, i + 1) if 0 <= j < len(pieces)]
            if 'furniture' not in near: return False
    return True

def main(path):
    r = json.load(open(path))
    here = os.path.dirname(os.path.abspath(__file__))
    passages = [p for s in r['sections'] for p in s['passages']]
    ids = {p['id'] for p in passages}
    bad = 0
    if r.get('kind') == 'reading':
        pdf = os.path.join(here, '..', 'public', 'papers', r['pdf'])
        texts = [stream(subprocess.run(['pdftotext', *m, pdf, '-'], capture_output=True, text=True).stdout) for m in ([], ['-raw'])]
        # everything the reading holds: passages, section titles, caption labels
        allp = ' '.join([stream(p.get('label', '') + ' ' + p['text']) for p in passages] + [stream(p['text']) for p in passages] + [stream(x['title']) for x in r['sections']])
        for p in passages:
            t = stream(p['text'])
            if not t or any(t in P for P in texts): continue
            P = texts[1]
            i, segs, ok = 0, [], True
            while i < len(t):
                lo, hi = 8, len(t) - i
                if t[i:i + lo] not in P: ok = False; break
                while lo < hi:
                    mid = (lo + hi + 1) // 2
                    if t[i:i + mid] in P: lo = mid
                    else: hi = mid - 1
                segs.append((P.find(t[i:i + lo]), lo)); i += lo
            if ok:
                for (a, la), (b, lb) in zip(segs, segs[1:]):
                    gap = P[a + la:b] if b > a + la else ''
                    if b < a + la or not explained(gap, P, allp):
                        ok = False; break
            if not ok:
                bad += 1; print(f'FAIL {p["id"]}: not the PDF\'s words in order')
    for kind in ('notes', 'morsels'):
        for x in r.get(kind, []):
            if x.get('at') not in ids: bad += 1; print(f'FAIL {kind[:-1]} on unknown passage {x.get("at")}')
    for m in r.get('morsels', []):
        p = next((p for p in passages if p['id'] == m.get('at')), None)
        if p and m['quote'] not in p['text']: bad += 1; print(f'FAIL morsel on {m["at"]} is not an exact substring')
    print(f'{r["id"]}: {len(passages)} passages, {len(r.get("notes", []))} notes, {len(r.get("morsels", []))} morsels — ' + ('OK' if not bad else f'{bad} problems'))
    return bad

if __name__ == '__main__':
    sys.exit(1 if sum(main(p) for p in sys.argv[1:]) else 0)
