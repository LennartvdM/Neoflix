/**
 * Any record — a toolbox page, a paper, a film, and the library's front
 * (the toolbox root) — assembled from modules.
 *
 * Nothing about the layout is written per page: modules/plans.js decides
 * which modules this record calls for and where, given what it holds and
 * how the reader arrived (?from=); assemble.js lays them out; the header
 * and the local graph are the same for every kind.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loopName, parseKey } from '../catalog';
import { catalog, lib } from '../library';
import { keyForPath } from '../urls';
import { planRecord } from '../modules/plans';
import { assemble } from '../assemble';
import { Assembly } from '../modules';
import { FrontContext } from '../modules/front';
import { resolveSlug } from '../../pages/toolbox/docsIndex';
import { publicationPdfs } from '../../pages/publications/content';
import { assetUrl } from '../../lib/utils/assetUrl';
import useDownloadGuard from '../../lib/hooks/useDownloadGuard';
import { shortAuthors, doiUrl } from '../../pages/publications/records';
import { visit, togglePin, usePins, useTrail, useMyPath } from '../state';
import Shell from './Shell';
import Ego from '../ui/Ego';
import { KindLabel } from '../ui/Shape';
import { AppLink } from '../ui/nav';

export function useActivePath(params, key) {
  const mine = useMyPath();
  const id = params.get('path');
  if (!id) return null;
  const p = id === 'mine' ? (mine ? { id: 'mine', name: 'Your path', steps: mine.steps } : null) : catalog.path(id);
  return p && p.steps.includes(key) ? p : null;
}

function PdfButton({ id }) {
  const pdf = publicationPdfs[id];
  const guard = useDownloadGuard(pdf?.src);
  if (!pdf) return null;
  return (
    <a className="sys-btn sys-btn--solid" href={assetUrl(pdf.src)} download aria-disabled={guard.cooling || undefined} onClick={guard.onClick}>
      {guard.cooling ? `Ready again in ${guard.secondsLeft}s` : `Author PDF · ${pdf.pages} pages`}
    </a>
  );
}

function Header({ record, from }) {
  const pins = usePins();
  const pinned = pins.includes(record.key);
  const front = record.key === 'guidance:';
  let label = null;
  let sub = null;
  if (record.kind === 'guidance') {
    label = <KindLabel kind="guidance">{[loopName(record.phase), record.number && `Toolbox ${record.number}`].filter(Boolean).join(' · ')}</KindLabel>;
    sub = record.excerpt && <p className="standfirst">{record.excerpt}</p>;
  } else if (record.kind === 'paper') {
    label = <KindLabel kind="paper" name={`Paper ${record.n}`}>{record.journal} · {record.year}</KindLabel>;
    sub = (
      <p className="rec__meta">
        {shortAuthors(record)}
        {record.doi && <> · <a className="sys-link" href={doiUrl(record)} target="_blank" rel="noopener noreferrer">doi.org/{record.doi}</a></>}
      </p>
    );
  } else {
    label = <KindLabel kind="film">{record.name}{record.at != null ? ` · in the session film at ${Math.floor(record.at / 60)}:${String(record.at % 60).padStart(2, '0')}` : ''}</KindLabel>;
    sub = <p className="standfirst">{record.caption}</p>;
  }
  if (front) {
    return (
      <header className="rec rec--front">
        <div>
          <span className="sys-label">Library</span>
          <h1>Video review for neonatal teams: the guidance, the papers it rests on, and the films it came from.</h1>
        </div>
        <p className="standfirst">Recorded and reviewed at the NICU of Leiden University Medical Center since 2009. Every record connects; follow a path, or follow a thread.</p>
      </header>
    );
  }
  return (
    <header className="rec">
      <div className="rec__text">
        {label}
        <h1>{record.title}</h1>
        {sub}
        <div className="rec__actions">
          <button type="button" className={`sys-btn${pinned ? ' sys-btn--on' : ''}`} aria-pressed={pinned} onClick={() => togglePin(record.key)}>
            {pinned ? '✓ In your session pack' : '+ Add to session pack'}
          </button>
          {record.kind === 'paper' && <PdfButton id={record.id} />}
        </div>
      </div>
      <Ego k={record.key} from={from} />
    </header>
  );
}

function crumbsFor(record) {
  if (record.kind === 'guidance') return record.key === 'guidance:' ? [] : [[loopName(record.phase), `/search?kind=guidance&phase=${record.phase}`], [record.title]];
  if (record.kind === 'paper') return [['Papers', '/search?kind=paper'], [`Paper ${record.n}`]];
  return [['Films', '/search?kind=film'], [record.name]];
}

export default function RecordPage() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const key = keyForPath(pathname, { resolveSlug });
  const record = key ? catalog.get(key) : null;
  const from = params.get('from');
  const path = useActivePath(params, key);
  const trail = useTrail();
  const [route, setRoute] = useState(null);

  useEffect(() => { if (record) visit(record.key); }, [record]);

  const items = useMemo(() => (record ? assemble(planRecord(record, { from }, lib)) : []), [record, from]);

  if (!record) return <NotInLibrary />;
  return (
    <Shell current={record.key} path={path} crumbs={crumbsFor(record)}>
      <FrontContext.Provider value={{ route, setRoute, trail }}>
        <Header record={record} from={from && catalog.has(from) ? from : null} />
        <Assembly items={items} record={record} animateKey={`${pathname}?${from || ''}`} />
      </FrontContext.Provider>
    </Shell>
  );
}

export function NotInLibrary() {
  return (
    <Shell crumbs={[['Not found']]}>
      <header className="rec rec--front">
        <div><span className="sys-label">Library</span><h1>That isn’t in the library.</h1></div>
        <p className="standfirst"><AppLink to="/toolbox" className="sys-link">Go to the library’s front</AppLink> or search for what you were looking for.</p>
      </header>
    </Shell>
  );
}
