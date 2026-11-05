/**
 * A paper, read on the site (system/content/readings).
 *
 * Two kinds, kept strictly apart:
 *   reading    an open-licence paper in its own words, verbatim, a page
 *              per section. Everything we add sits in a separate layer
 *              beside it: notes in the margin (a gloss, context, a link,
 *              what a unit could do), intermissions between sections,
 *              and a faint mark on the sentences other pages quote. The
 *              author's text is never edited here.
 *   synopsis   a paper under the publisher's licence: our notes on it,
 *              in our own words, said to be ours, with its key figures.
 *
 * Loaded on demand (system/readings.js): the full text arrives with the
 * first page of a paper, then every page of it is instant.
 */
import React, { useEffect, useState } from 'react';
import { catalog } from '../system/library';
import { readings, loadReading } from '../system/readings';
import { entry } from '../system/content/ontology';
import { assetUrl } from '../lib/utils/assetUrl';
import { doiUrl } from '../pages/publications/records';

const NOTE_TYPE = { gloss: 'Gloss', context: 'Context', link: 'Connects to', guide: 'For your unit' };

/** A link chip in a note: records open; ontology entries say what they are. */
function Chip({ k, onPick }) {
  const [kind, id] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
  if (catalog.has(k)) {
    const r = catalog.get(k);
    const label = r.kind === 'paper' ? `Paper ${r.n} · ${r.short}` : r.kind === 'film' ? `Film · ${r.name}` : `${r.number ? `${r.number} ` : ''}${r.title}`;
    return <button type="button" className="rchip" data-kind={r.kind} onClick={() => onPick(k)}>{label}</button>;
  }
  const e = entry(k);
  if (!e) return null;
  // A practice opens its first toolbox page; a claim its film; a finding its paper.
  const go = kind === 'practice' ? e.pages?.[0] : kind === 'claim' ? e.film : kind === 'finding' ? e.paper : null;
  const label = kind === 'finding' ? (e.figure ? `${e.figure}` : 'A finding') : e.name || e.text;
  return go
    ? <button type="button" className="rchip" data-kind={kind} onClick={() => onPick(go)} title={e.text || e.brief || ''}>{label}</button>
    : <span className="rchip" data-kind={kind} title={e.brief || e.text || ''}>{label}</span>;
}

/** A passage's text, with the sentences other pages quote marked faintly. */
function Marked({ text, quotes }) {
  if (!quotes.length) return text;
  const parts = [];
  let rest = text;
  let k = 0;
  for (const q of quotes) {
    const i = rest.indexOf(q);
    if (i < 0) continue;
    parts.push(rest.slice(0, i));
    parts.push(<mark key={k += 1} className="morsel" title="Quoted elsewhere on the site">{q}</mark>);
    rest = rest.slice(i + q.length);
  }
  parts.push(rest);
  return parts;
}

function Passage({ p, notes, quotes, onPick }) {
  let body;
  if (p.kind === 'heading') body = <h3 className="rd__h">{p.text}</h3>;
  else if (p.kind === 'caption') body = <p className="rd__caption"><Marked text={p.text} quotes={quotes} /></p>;
  else if (p.kind === 'list-item') body = <p className="rd__p rd__li"><Marked text={p.text} quotes={quotes} /></p>;
  else body = <p className="rd__p"><Marked text={p.text} quotes={quotes} /></p>;
  return (
    <div className="rd__row" data-id={p.id}>
      <div className="rd__text">{body}</div>
      <div className="rd__margin">
        {notes.map((n, i) => (
          <aside key={i} className="rnote" data-type={n.type}>
            <b>{NOTE_TYPE[n.type] || 'Note'}</b>
            <span>{n.text}</span>
            {n.links?.length > 0 && <span className="rnote__links">{n.links.map((k) => <Chip key={k} k={k} onPick={onPick} />)}</span>}
          </aside>
        ))}
      </div>
    </div>
  );
}

export default function Reading({ node, onPick }) {
  const meta = readings[node.paper];
  const paper = catalog.get(`paper:${node.paper}`);
  const [r, setR] = useState(null);
  useEffect(() => {
    let live = true;
    loadReading(node.paper).then((x) => live && setR(x));
    return () => { live = false; };
  }, [node.paper]);

  const synopsis = meta?.kind === 'synopsis';
  const sIndex = synopsis ? 0 : meta.sections.findIndex((s) => s.id === node.section);
  const head = (
    <header className="phead">
      <span className="phead__num">{String(paper.n).padStart(2, '0')}</span>
      <h2>Paper {paper.n} · {paper.short}</h2>
      <span className="phead__meta">{synopsis ? 'Notes, in our words' : `Section ${sIndex + 1} of ${meta.sections.length}`}</span>
    </header>
  );
  const source = (
    <p className="rd__source">
      {synopsis
        ? <>Under the publisher’s licence, so not reproduced here. </>
        : <>The paper’s own words, unchanged ({meta.licence}). The notes in the margin are ours. </>}
      {paper.doi && <a href={doiUrl(paper)} target="_blank" rel="noopener noreferrer">The paper at the publisher ↗</a>}
      {meta.pdf && <> · <a href={assetUrl(`/papers/${meta.pdf}`)} download>Author PDF</a></>}
    </p>
  );

  if (!r) {
    return <div className="pg pg--paper">{head}<div className="rd"><p className="prose">Opening the paper…</p></div></div>;
  }
  const notesAt = (id) => (r.notes || []).filter((n) => n.at === id);
  const quotesAt = (id) => (synopsis ? [] : (r.morsels || []).filter((m) => m.at === id).map((m) => m.quote));

  if (synopsis) {
    return (
      <div className="pg pg--paper">
        {head}
        <div className="rd">
          <p className="eyebrow">{paper.journal}, {paper.year}</p>
          <h1 className="title">{paper.title}</h1>
          <p className="rd__disclaimer">{r.disclaimer}</p>
          {source}
          {r.keyFacts?.length > 0 && (
            <div className="rd__facts">
              {r.keyFacts.map((f, i) => <div key={i} className="rd__fact"><strong>{f.figure}</strong><span>{f.text}</span></div>)}
            </div>
          )}
          {r.sections.map((s) => (
            <section key={s.id} className="rd__section">
              <h3 className="rd__h">{s.title}</h3>
              {s.passages.map((p) => <Passage key={p.id} p={p} notes={notesAt(p.id)} quotes={[]} onPick={onPick} />)}
            </section>
          ))}
        </div>
      </div>
    );
  }

  const sec = r.sections.find((s) => s.id === node.section) || r.sections[0];
  return (
    <div className="pg pg--paper">
      {head}
      <div className="rd">
        {sIndex === 0 && (
          <>
            <p className="eyebrow">{paper.journal}, {paper.year}</p>
            <h1 className="title title--long">{paper.title}</h1>
            {source}
          </>
        )}
        <h2 className="rd__title">{sec.title}</h2>
        {sIndex !== 0 && source}
        {sec.passages.map((p) => <Passage key={p.id} p={p} notes={notesAt(p.id)} quotes={quotesAt(p.id)} onPick={onPick} />)}
      </div>
    </div>
  );
}
