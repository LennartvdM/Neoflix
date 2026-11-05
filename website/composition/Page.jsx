/**
 * One page of the atlas, drawn from the ontology (ontology.js): what the
 * reader needs, big; at most three things they could want, small and to
 * one side; nothing else.
 *
 * The visual language is the owner's Talent naar de Top deck
 * (Vragenlijst-Executive-Search): a running head (a numbered pill and the
 * chapter), Space Grotesk for display and Inter for reading, white cards
 * on the pale ground, the films dark.
 */
import React, { useMemo, useState } from 'react';
import { catalog, graph, lib, stillFor, clipFor } from '../system/library';
import { LOOP, loopName } from '../system/catalog';
import { urlFor, keyForPath } from '../system/urls';
import { usePins, togglePin } from '../system/state';
import { planRecord } from '../system/modules/plans';
import { MODULES, SessionFilmButton } from '../system/modules';
import { FrontContext } from '../system/modules/front';
import { Here } from '../system/ui/nav';
import { shortAuthors, doiUrl } from '../pages/publications/records';
import { publicationPdfs } from '../pages/publications/content';
import { TAGLINE } from '../pages/home/content';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import { assetUrl } from '../lib/utils/assetUrl';
import { prefersReducedMedia } from '../lib/utils/reducedMedia';
import { canonicalUrl } from '../shared/routeMeta';
import { buildOntology } from './ontology';
import { CHAPTERS } from './tour';

const ONTOLOGY = buildOntology({ catalog, graph });

export const labelOf = (key) => {
  const r = catalog.get(key);
  if (!r) return '';
  if (r.kind === 'paper') return `Paper ${r.n} · ${r.short}`;
  if (r.kind === 'film') return `Film · ${r.name}`;
  return `${r.number ? `${r.number} ` : ''}${r.id === '' ? 'Welcome to the toolbox' : r.title}`;
};

const MODULE_TITLE = { inpractice: 'In the unit', found: 'What it found', summary: 'Asked, and what changed', text: null };

/* ── the things a page can show ────────────────────────────────────────── */

function Film({ k, big, quiet, onPick }) {
  const r = catalog.get(k);
  const [reduced] = useState(prefersReducedMedia);
  return (
    <a className={`card card--film${big ? ' card--big' : ''}`} href={urlFor(k)} onClick={(e) => { e.preventDefault(); onPick(k); }} data-id={k}>
      <span className="card__media">
        {big && !reduced
          ? <video src={clipFor(r)} poster={stillFor(r)} autoPlay muted loop playsInline preload="auto" />
          : <img src={stillFor(r)} alt="" draggable={false} />}
      </span>
      <span className="card__cap">
        <span className="card__eyebrow">Film {r.order + 1} of 6</span>
        <strong>{r.name}</strong>
        {big && !quiet && <span className="card__line">{r.claim}</span>}
      </span>
    </a>
  );
}

function Paper({ k, big, onPick }) {
  const r = catalog.get(k);
  return (
    <a className={`card card--paper${big ? ' card--big' : ''}`} href={urlFor(k)} onClick={(e) => { e.preventDefault(); onPick(k); }} data-id={k}>
      <span className="card__stat">{r.n}</span>
      <span className="card__eyebrow">{big ? `${r.journal} · ${r.year}` : r.year}</span>
      <strong className="card__title">{r.short}</strong>
      <span className="card__line">{r.found}</span>
    </a>
  );
}

function Guide({ k, big, ordinal, onPick }) {
  const r = catalog.get(k);
  return (
    <a className={`card card--guide${big ? ' card--big' : ''}`} href={urlFor(k)} onClick={(e) => { e.preventDefault(); onPick(k); }} data-id={k}>
      <span className="card__eyebrow">{ordinal ? `Step ${ordinal}` : loopName(r.phase) || 'The toolbox'}</span>
      <strong className="card__title">{r.number && <em>{r.number}</em>}{r.id === '' ? 'Welcome to the toolbox' : r.title}</strong>
      {r.excerpt && <span className="card__line">{r.excerpt}</span>}
    </a>
  );
}

function Step({ phase, onPick }) {
  const i = LOOP.findIndex((l) => l.id === phase);
  const n = catalog.list('guidance').filter((g) => g.phase === phase && !g.divider).length;
  return (
    <button type="button" className="card card--step" onClick={() => onPick(`head:${phase}`)}>
      <span className="card__stat">{i + 1}</span>
      <strong className="card__title">{LOOP[i].name}</strong>
      <span className="card__eyebrow">{n} pages</span>
    </button>
  );
}

function Thing({ k, big, ordinal, onPick }) {
  if (k.startsWith('step:')) return <Step phase={k.slice(5)} onPick={onPick} />;
  const kind = k.slice(0, k.indexOf(':'));
  if (kind === 'film') return <Film k={k} big={big} onPick={onPick} />;
  if (kind === 'paper') return <Paper k={k} big={big} onPick={onPick} />;
  return <Guide k={k} big={big} ordinal={ordinal} onPick={onPick} />;
}

/** What the reader could want: small, one line each, to one side. */
function Wants({ want, onPick, onPath, title = 'You might also want' }) {
  if (!want.length) return null;
  return (
    <aside className="wants" aria-label={title}>
      <p className="wants__h">{title}</p>
      {want.map((w) => (
        <a
          key={w.key}
          className="want"
          href={w.path ? `/paths/${w.path}` : urlFor(w.key)}
          data-id={w.key}
          onClick={(e) => { e.preventDefault(); if (w.path) onPath(w.path); else onPick(w.key); }}
        >
          <span className="want__why">{w.why}</span>
          <strong>{w.title}</strong>
          {w.line && <span className="want__line">{w.line}</span>}
          <i aria-hidden="true">→</i>
        </a>
      ))}
    </aside>
  );
}

/* ── the running head ─────────────────────────────────────────────────── */

function Head({ num, title, meta }) {
  return (
    <header className="phead">
      {num != null && <span className="phead__num">{String(num).padStart(2, '0')}</span>}
      <h2>{title}</h2>
      {meta && <span className="phead__meta">{meta}</span>}
    </header>
  );
}

/* ── a record's title block ───────────────────────────────────────────── */

function RecordWords({ record }) {
  const pins = usePins();
  const pinned = pins.includes(record.key);
  const [copied, setCopied] = useState(false);
  const cite = record.kind === 'paper'
    ? `${shortAuthors(record)} (${record.year}). ${record.title}. ${record.journal}.${record.doi ? ` https://doi.org/${record.doi}` : ''}`
    : `Neoflix toolbox. ${record.title}. Department of Neonatology, Leiden University Medical Center. ${canonicalUrl(urlFor(record.key))}`;
  let eyebrow;
  let sub = null;
  let title = record.title;
  if (record.key === 'guidance:') {
    eyebrow = 'The toolbox';
    title = 'Video review for neonatal teams, step by step';
  } else if (record.kind === 'guidance') {
    eyebrow = [loopName(record.phase), record.number].filter(Boolean).join(' · ') || 'The toolbox';
    sub = record.excerpt && <p className="prose prose--lead">{record.excerpt}</p>;
  } else if (record.kind === 'paper') {
    const pdf = publicationPdfs[record.id];
    eyebrow = `Paper ${record.n} · ${record.journal}, ${record.year}`;
    sub = (
      <p className="prose prose--meta">
        {shortAuthors(record)}
        {record.doi && <><br /><a href={doiUrl(record)} target="_blank" rel="noopener noreferrer">doi.org/{record.doi}</a></>}
        {pdf && <><br /><a href={assetUrl(pdf.src)} download>Author PDF, {pdf.pages} pages</a></>}
      </p>
    );
  } else {
    eyebrow = `Film ${record.order + 1} of 6`;
    title = record.claim;
    sub = (
      <>
        <p className="prose prose--lead">{record.caption}</p>
        <SessionFilmButton at={record.at} />
      </>
    );
  }
  return (
    <div className="words">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className={`title${title.length > 80 ? ' title--long' : ''}`}>{title}</h1>
      {sub}
      <div className="actions">
        <button type="button" data-on={pinned ? '' : undefined} onClick={() => togglePin(record.key)}>{pinned ? '✓ In your pack' : '+ Pack'}</button>
        {record.kind !== 'film' && <button type="button" onClick={() => { navigator.clipboard?.writeText(cite); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? 'Citation copied' : 'Cite'}</button>}
      </div>
    </div>
  );
}

/* ── the page ──────────────────────────────────────────────────────────── */

/**
 * `node` is an atlas node, or { kind: 'search', hits } for a search.
 * `search` is the search form, when searching; `resume` a "carry on"
 * offer for the first page.
 */
export default function Page({ node, onPick, onPath, onProbe, search, resume, onResume }) {
  const page = useMemo(() => ONTOLOGY.pageOf(node), [node]);
  const record = node.kind === 'record' ? catalog.get(node.key) : null;
  const plans = useMemo(() => {
    if (!record) return [];
    const all = planRecord(record, {}, lib);
    return page.modules.map((id) => all.find((p) => p.id === id)).filter(Boolean);
  }, [record, page]);

  // Links inside a record's text light the card they lead to, if it's here.
  const probe = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    const key = keyForPath(href.split('?')[0], { resolveSlug });
    if (key && catalog.has(key)) onProbe(key);
  };

  // The running head and the words.
  let head;
  let words;
  if (node.kind === 'search') {
    head = <Head title="Search" />;
    words = <div className="words">{search}</div>;
  } else if (node.kind === 'stop') {
    const s = node.stop;
    const ch = CHAPTERS.find((c) => c.id === s.chapter);
    const cover = node.index === 0;
    head = <Head num={node.index + 1} title={ch ? ch.name : cover ? 'Neoflix' : 'Where next'} meta={`${node.index + 1} / 17`} />;
    words = (
      <div className="words">
        <p className="eyebrow">{cover ? 'Neoflix, Leiden' : ch ? s.short : 'The end of the story'}</p>
        <h1 className={`title${cover ? ' title--hero' : ''}`}>{cover ? TAGLINE : s.title}</h1>
        <p className="prose prose--lead">{cover ? `${s.title} ${s.text}` : s.text.replace('{pages}', catalog.list('guidance').filter((g) => !g.divider).length)}</p>
        {cover && resume && <p className="prose">Welcome back. <a href={urlFor(resume.key || '')} onClick={(e) => { e.preventDefault(); onResume(); }}>Carry on with {resume.label} →</a></p>}
        {cover && <p className="hint">↓ Scroll for the story · → go deeper wherever you like</p>}
      </div>
    );
  } else if (node.kind === 'step') {
    head = <Head num={node.num} title={`Step ${node.num} of the loop`} />;
    words = (
      <div className="words">
        <p className="eyebrow">The toolbox</p>
        <h1 className="title">{node.label}</h1>
        <p className="prose prose--lead">Its chapters, in the order you’ll need them. Each opens to the right.</p>
      </div>
    );
  } else if (node.kind === 'path') {
    const p = catalog.path(node.pathId);
    head = <Head title="A path" meta={`${p.steps.length} steps`} />;
    words = (
      <div className="words">
        <p className="eyebrow">A path</p>
        <h1 className="title">{p.name}</h1>
        <p className="prose prose--lead">{p.blurb}</p>
      </div>
    );
  } else {
    const kindName = record.kind === 'film' ? 'Film' : record.kind === 'paper' ? 'The evidence' : 'The toolbox';
    head = <Head num={record.kind === 'paper' ? record.n : record.kind === 'film' ? record.order + 1 : null} title={kindName} meta={record.kind === 'guidance' ? loopName(record.phase) : null} />;
    words = <RecordWords record={record} />;
  }

  const want = <Wants want={page.want} onPick={onPick} onPath={onPath} title={page.layout === 'cover' ? 'Or take a path' : 'You might also want'} />;

  let main = null;
  if (page.layout === 'list') {
    const n = page.list.length;
    main = (
      <div className={`set set--${n <= 3 ? 'few' : n <= 6 ? 'some' : 'many'}`} data-ordered={page.ordered ? '' : undefined}>
        {page.list.map((k, i) => <Thing key={k} k={k} ordinal={page.ordered ? i + 1 : null} onPick={onPick} />)}
      </div>
    );
  } else if (page.layout === 'read') {
    main = (
      <div className="reading" onMouseOver={probe} onMouseOut={(e) => e.target.closest?.('a[href]') && onProbe(null)}>
        {page.figure && <Film k={page.figure} big quiet onPick={() => {}} />}
        <Here.Provider value={{ current: record.key, path: null }}>
          <FrontContext.Provider value={{ route: null, setRoute: () => {}, trail: [] }}>
            {plans.map((plan) => {
              const Cmp = MODULES[plan.id];
              return (
                <section key={plan.id} className={`card card--module mod--${plan.id}`}>
                  <div className="sys">
                    {MODULE_TITLE[plan.id] && <p className="eyebrow">{MODULE_TITLE[plan.id]}</p>}
                    {Cmp ? <Cmp record={record} plan={plan} /> : null}
                  </div>
                </section>
              );
            })}
          </FrontContext.Provider>
        </Here.Provider>
      </div>
    );
  } else if (page.figure) {
    main = <div className="figure"><Thing k={page.figure} big onPick={onPick} /></div>;
  }

  return (
    <div className={`pg pg--${page.layout}`}>
      {head}
      <div className="pg__body">
        <div className="pg__words">
          {words}
          {want}
        </div>
        <div className="pg__main">{main}</div>
      </div>
    </div>
  );
}
