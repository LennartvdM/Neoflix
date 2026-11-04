/**
 * /pack: the session pack — the records the reader pinned, in their
 * order, put together for the room: checklists to work through, the
 * evidence to quote, the film moments to cue. Printable, and shareable
 * as a link (?items=…) that needs no account and stores nothing.
 */
import React, { useEffect, useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import { loopName } from '../catalog';
import { catalog, stillFor, mmss } from '../library';
import { usePins, togglePin, movePin, setPins, saveMyPath } from '../state';
import { getPage, loadPages, pagesReady } from '../../pages/toolbox/docsIndex';
import DocsNode from '../../pages/toolbox/DocsNode';
import { shortAuthors } from '../../pages/publications/records';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { urlFor } from '../urls';
import { KindLabel } from '../ui/Shape';
import { RecordLink } from '../ui/nav';
import Shell from './Shell';

function Body({ r }) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  useEffect(() => { if (r.kind === 'guidance' && !pagesReady()) loadPages().then(rerender).catch(() => {}); }, [r.kind]);
  if (r.kind === 'guidance') {
    const page = r.tasks ? getPage(r.id) : null;
    return page ? <div className="docs-body"><DocsNode node={page.ast} /></div> : <p className="lead">{r.excerpt}</p>;
  }
  if (r.kind === 'paper') {
    return (
      <>
        <p className="found found--sm">{r.found}</p>
        <p className="sys-muted">{shortAuthors(r)} ({r.year}). {r.title}. <em>{r.journal}</em>.{r.doi ? ` doi.org/${r.doi}` : ''}</p>
      </>
    );
  }
  return (
    <div className="pack__film">
      <img src={stillFor(r)} alt="" />
      <div><p className="lead">{r.claim}</p><p className="sys-muted">{r.at != null ? `In the session film at ${mmss(r.at)}. ` : ''}{r.inPractice}</p></div>
    </div>
  );
}

export default function PackPage() {
  const { search } = useLocation();
  const shared = new URLSearchParams(search).get('items');
  const pins = usePins();
  const navigate = useTransitionNavigate();
  const keys = (shared ? shared.split(',') : pins).filter((k) => catalog.has(k));
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/pack?items=${keys.map(encodeURIComponent).join(',')}` : '';
  return (
    <Shell crumbs={[['Session pack']]}>
      <header className="rec rec--front">
        <div>
          <span className="sys-label">Session pack · {keys.length} records</span>
          <h1>{shared ? 'A session pack someone shared' : 'Your session pack'}</h1>
        </div>
        <div>
          <p className="standfirst">Records put together for the room, in order: checklists to work through, the evidence to quote, the film moments to cue.</p>
          <div className="rec__actions noprint">
            {shared ? (
              <button type="button" className="sys-btn sys-btn--solid" onClick={() => setPins(keys)}>Make this my pack</button>
            ) : (
              <button type="button" className="sys-btn" disabled={!keys.length} onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copy share link</button>
            )}
            <button type="button" className="sys-btn" disabled={!keys.length} onClick={() => { saveMyPath(keys); navigate(urlFor(keys[0], { path: 'mine' })); }}>Walk it as a path</button>
            <button type="button" className="sys-btn sys-btn--solid" disabled={!keys.length} onClick={() => window.print()}>Print</button>
          </div>
        </div>
      </header>
      {!keys.length && <p className="lead pack__empty">Nothing here yet. Use <strong>+ Add to session pack</strong> on any record.</p>}
      <ol className="pack">
        {keys.map((k, i) => {
          const r = catalog.get(k);
          return (
            <li key={k} className="pack__item">
              <span className="pack__n">{i + 1}</span>
              <div>
                <KindLabel kind={r.kind} name={r.kind === 'paper' ? `Paper ${r.n}` : undefined}>{r.kind === 'guidance' ? loopName(r.phase) : r.kind === 'paper' ? r.journal : r.name}</KindLabel>
                <h2><RecordLink k={k}>{r.kind === 'paper' ? r.short : r.title}</RecordLink></h2>
                <Body r={r} />
                {!shared && (
                  <div className="pack__tools noprint">
                    <button type="button" className="sys-btn" disabled={i === 0} onClick={() => movePin(i, -1)} aria-label="Move up">↑</button>
                    <button type="button" className="sys-btn" disabled={i === keys.length - 1} onClick={() => movePin(i, 1)} aria-label="Move down">↓</button>
                    <button type="button" className="sys-btn" onClick={() => togglePin(k)}>Remove</button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}
