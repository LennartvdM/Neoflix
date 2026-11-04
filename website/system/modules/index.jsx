/**
 * The modules — the building blocks every record is assembled from.
 * Rules (when a module appears, its width, its place, its reason) live
 * in ./plans.js; this file only draws them. Each component gets
 * ({ record, plan }) and reads the library itself.
 */
import React, { useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { LOOP, loopName, parseKey } from '../catalog';
import { catalog, graph, stillFor, clipFor, mmss } from '../library';
import { SESSION_FILM_SRC } from '../content/films';
import { urlFor } from '../urls';
import { canonicalUrl } from '../../shared/routeMeta';
import { shortAuthors, doiUrl } from '../../pages/publications/records';
import { getPage, loadPages, pagesReady } from '../../pages/toolbox/docsIndex';
import DocsNode from '../../pages/toolbox/DocsNode';
import { prefersReducedMedia } from '../../lib/utils/reducedMedia';
import { checksFor, setChecks } from '../state';
import Shape, { KindLabel } from '../ui/Shape';
import MapGraph from '../ui/MapGraph';
import { Here, RecordLink, AppLink, useGo } from '../ui/nav';
import { FrontContext } from './front';
import '../../pages/toolbox/docs.css';

export const MODULE_NAMES = {
  thread: 'The thread you followed',
  map: 'The library',
  pathcards: 'Start with a path',
  text: 'In the toolbox',
  loopbrowse: 'Guidance, by step of the loop',
  paperlist: 'Papers',
  film: 'On film',
  findings: 'The evidence',
  sequence: 'Read on',
  loop: 'Where this sits in the loop',
  found: 'What it found',
  summary: 'Asked, and what changed',
  practice: 'How to do it',
  abstract: 'Abstract',
  player: 'The film',
  inpractice: 'In the NICU',
  paths: 'On a path',
  cite: 'Cite',
};

const Pips = ({ phase }) => (
  <span className="pips" aria-hidden="true">{LOOP.map((l) => <i key={l.id} data-on={l.id === phase ? '' : undefined} />)}</span>
);

/* ── thread ─────────────────────────────────────────────────────────── */
function Thread({ record, plan }) {
  const { from, thread } = plan.data;
  const fromKind = parseKey(from).kind;
  return (
    <div className="thread">
      <RecordLink k={from} className="thread__end">
        <Shape k={from} />
        <span><KindLabel kind={fromKind}>where you were</KindLabel><strong>{catalog.label(from)}</strong></span>
      </RecordLink>
      <span className="thread__line"><i /></span>
      <span className="thread__end thread__end--here">
        <Shape k={record.key} />
        <span><KindLabel kind={record.kind}>here</KindLabel><strong>{catalog.label(record.key)}</strong></span>
      </span>
      <p className="thread__text">{thread.text}</p>
      {(thread.film || thread.paper) && (
        <p className="thread__via">
          {thread.film && <>Through the film <RecordLink k={`film:${thread.film}`}>{catalog.get(`film:${thread.film}`).name}</RecordLink></>}
          {thread.film && thread.paper && ' · '}
          {thread.paper && <RecordLink k={`paper:${thread.paper}`}>Paper {catalog.get(`paper:${thread.paper}`).n}, {catalog.get(`paper:${thread.paper}`).year}</RecordLink>}
        </p>
      )}
    </div>
  );
}

// The record header already carries the title; a page whose text opens
// by repeating it (as heading) drops that first heading.
const flat = (n) => (n?.value || '') + (n?.children || []).map(flat).join('');
const same = (a, b) => a.toLowerCase().replace(/^[\d.\s]+/, '').trim() === b.toLowerCase().trim();
function withoutTitle(ast, title) {
  const kids = ast?.children || [];
  const first = kids.findIndex((n) => n.type === 'heading');
  if (first < 0 || first > 1 || !same(flat(kids[first]), title)) return ast;
  return { ...ast, children: kids.filter((_, i) => i !== first) };
}

/* ── text: the toolbox page itself ─────────────────────────────────────
   One bundle for the whole toolbox (CLAUDE.md rule 12): loaded on first
   need, then every page is instant. The module renders at once from the
   manifest and only its body waits. */
function Text({ record }) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    if (pagesReady()) return undefined;
    let live = true;
    loadPages().then(() => live && rerender()).catch(() => {});
    return () => { live = false; };
  }, []);
  const page = getPage(record.id);
  const go = useGo();
  const box = useRef(null);
  const [done, setDone] = useState(0);

  // Task-list items become a checklist the reader can work through; the
  // ticks are kept in this browser only (system/state.js).
  useEffect(() => {
    const el = box.current;
    if (!el || !record.tasks) return undefined;
    const items = [...el.querySelectorAll('li[data-task]')];
    const saved = checksFor(record.id);
    items.forEach((li, i) => li.toggleAttribute('data-done', saved.includes(i)));
    setDone(items.filter((li) => li.hasAttribute('data-done')).length);
    const onClick = (e) => {
      const li = e.target.closest('li[data-task]');
      if (!li || e.target.closest('a') || li.closest('li[data-task]') !== li) return;
      li.toggleAttribute('data-done');
      const now = items.map((x, i) => (x.hasAttribute('data-done') ? i : -1)).filter((i) => i >= 0);
      setChecks(record.id, now);
      setDone(now.length);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [page, record.id, record.tasks]);

  // Toolbox links inside the text carry the thread too.
  const onClickCapture = (e) => {
    const a = e.target.closest('a[data-internal]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/toolbox')) return;
    e.preventDefault();
    e.stopPropagation();
    const slug = href.replace(/^\/toolbox\/?/, '').split('#')[0];
    if (catalog.has(`guidance:${slug}`)) go(`guidance:${slug}`);
  };

  return (
    <div className="mod-text">
      {record.tasks > 0 && (
        <div className="checkbar"><span style={{ '--p': done / record.tasks }} /><em>{done} of {record.tasks} done</em></div>
      )}
      <div className="docs-body" ref={box} onClickCapture={onClickCapture} aria-busy={page ? undefined : 'true'}>
        {page ? <DocsNode node={withoutTitle(page.ast, record.title)} /> : <p className="sys-muted">{record.excerpt || 'Loading…'}</p>}
      </div>
    </div>
  );
}

/* ── front-page modules ─────────────────────────────────────────────── */
function Map() {
  const { route, trail } = useContext(FrontContext);
  const path = route ? catalog.path(route) : null;
  return (
    <>
      <div className="legend">
        <span><Shape k="paper:narrative" /> Paper</span>
        <span><span className="sh sh--film sh--legend" /> Film</span>
        <span><span className="sh sh--guidance" /> Guidance</span>
        <span className="sys-muted">Hover to see what connects; click to open.</span>
      </div>
      <MapGraph route={route} routeSteps={path?.steps} trail={trail} />
    </>
  );
}

export function PathCards({ paths = catalog.paths }) {
  const { setRoute } = useContext(FrontContext);
  return (
    <div className="pathcards">
      {paths.map((p) => (
        <article key={p.id} className="pathcard" onMouseEnter={() => setRoute?.(p.id)} onMouseLeave={() => setRoute?.(null)}>
          <div className="pathcard__top">
            <span className="sys-label"><b data-kind={parseKey(p.steps[0]).kind}>Path</b> · {p.steps.length} steps</span>
            <h3>{p.name}</h3>
            <p>{p.blurb}</p>
          </div>
          <ol>
            {p.steps.map((s) => <li key={s}><RecordLink k={s} path={p.id}>{catalog.label(s)}</RecordLink></li>)}
          </ol>
          <RecordLink k={p.steps[0]} path={p.id} className="pathcard__go"><span>Begin</span><span aria-hidden="true">→</span></RecordLink>
        </article>
      ))}
    </div>
  );
}

function LoopBrowse() {
  return (
    <div className="loopbrowse">
      {LOOP.map((l) => {
        const gs = catalog.list('guidance').filter((g) => g.phase === l.id);
        return (
          <div key={l.id}>
            <h4><Pips phase={l.id} /> {l.name} <small>{gs.length}</small></h4>
            <ul>{gs.filter((g) => !g.divider).slice(0, 4).map((g) => <li key={g.key}><RecordLink k={g.key}>{g.title}</RecordLink></li>)}</ul>
            <AppLink to={`/search?kind=guidance&phase=${l.id}`} className="sys-link">All {gs.length} →</AppLink>
          </div>
        );
      })}
    </div>
  );
}

function PaperList() {
  return (
    <ul className="rows">
      {catalog.list('paper').map((p) => (
        <li key={p.key}>
          <RecordLink k={p.key} className="row">
            <Shape k={p.key} />
            <span><strong>{p.short}</strong><small>{p.journal}, {p.year}</small></span>
          </RecordLink>
        </li>
      ))}
    </ul>
  );
}

/* ── films ──────────────────────────────────────────────────────────── */
function Clip({ film, big }) {
  const [reduced] = useState(prefersReducedMedia);
  if (reduced) return <img className="clip" src={stillFor(film)} alt="" />;
  return (
    <video
      className="clip"
      src={clipFor(film)}
      poster={stillFor(film)}
      muted
      loop
      playsInline
      preload="metadata"
      autoPlay={big}
      onMouseEnter={(e) => !big && e.currentTarget.play().catch(() => {})}
      onMouseLeave={(e) => !big && e.currentTarget.pause()}
    />
  );
}

export function SessionFilmButton({ at }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (open) ref.current?.showModal(); }, [open]);
  if (at == null) return null;
  return (
    <>
      <button type="button" className="playbtn" onClick={() => setOpen(true)}>▶ Watch in the session film, from {mmss(at)}</button>
      {open && (
        <dialog ref={ref} className="filmdialog" onClose={() => setOpen(false)} onClick={(e) => e.target === ref.current && ref.current.close()}>
          <iframe title="The session film" src={`${SESSION_FILM_SRC}&autoplay=1#t=${at}s`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          <button type="button" className="filmdialog__close" onClick={() => ref.current.close()} aria-label="Close">✕</button>
        </dialog>
      )}
    </>
  );
}

function Film({ plan }) {
  const keys = plan.data.films;
  const lead = catalog.get(plan.data.lead || keys[0]);
  const rest = keys.filter((k) => k !== lead.key);
  return (
    <div className="mod-film">
      <RecordLink k={lead.key} className="clipbox"><Clip film={lead} /></RecordLink>
      <p className="filmline"><strong>{lead.name}.</strong> {lead.claim}</p>
      {rest.length > 0 && (
        <div className="filmrow">
          {rest.map((k) => {
            const f = catalog.get(k);
            return <RecordLink key={k} k={k}><img src={stillFor(f)} alt="" /><span>{f.name}</span></RecordLink>;
          })}
        </div>
      )}
    </div>
  );
}

function Player({ record }) {
  return (
    <div className="mod-player">
      <div className="clipbox clipbox--big"><Clip film={record} big /></div>
      <div className="mod-player__under">
        <p className="sys-muted">{record.caption}</p>
        <SessionFilmButton at={record.at} />
      </div>
    </div>
  );
}

const InPractice = ({ record }) => <p className="lead">{record.inPractice}</p>;

/* ── evidence and practice ──────────────────────────────────────────── */
function Findings({ plan }) {
  const { findings, lead } = plan.data;
  const seen = new Set();
  const list = [...findings].sort((a, b) => (b.paper === lead) - (a.paper === lead)).filter((f) => !seen.has(f.text) && seen.add(f.text));
  return (
    <ul className="findings">
      {list.map((f) => {
        const p = catalog.get(`paper:${f.paper}`);
        return (
          <li key={f.text} data-emph={f.paper === lead ? '' : undefined}>
            <RecordLink k={p.key} aria-label={`Paper ${p.n}`}><Shape k={p.key} /></RecordLink>
            <span>{f.text}<small>Paper {p.n} · {p.short}, {p.year}</small></span>
          </li>
        );
      })}
    </ul>
  );
}

function Practice({ record, plan }) {
  const lead = plan.data?.lead;
  const list = [...graph.guidanceOf(record.key)].sort((a, b) => (b.key === lead) - (a.key === lead));
  return (
    <ul className="rows">
      {list.map((g) => (
        <li key={g.key} data-emph={g.key === lead ? '' : undefined}>
          <RecordLink k={g.key} className="row row--guidance">
            <Pips phase={g.phase} />
            <span><strong>{g.title}</strong><small>{loopName(g.phase)}{g.tasks ? ` · checklist of ${g.tasks}` : ''}</small></span>
          </RecordLink>
        </li>
      ))}
    </ul>
  );
}

/* ── papers ─────────────────────────────────────────────────────────── */
const Found = ({ record }) => <p className="found">{record.found}</p>;

function Summary({ record }) {
  return (
    <dl className="summary">
      {record.asked && <div><dt>Asked</dt><dd>{record.asked}</dd></div>}
      {record.changed && <div><dt>Changed</dt><dd>{record.changed}</dd></div>}
      <p className="sys-muted">Written for this library; not part of the paper.</p>
    </dl>
  );
}

function Abstract({ record }) {
  if (!record.abstract) {
    return <p className="sys-muted">This paper is under the publisher’s licence. <a className="sys-link" href={doiUrl(record)} target="_blank" rel="noopener noreferrer">Read the abstract at the publisher ↗</a></p>;
  }
  return (
    <details className="abstract">
      <summary><p>{record.abstract.slice(0, 360)}…</p><span className="sys-link">Read the whole abstract</span></summary>
      <p>{record.abstract}</p>
    </details>
  );
}

/* ── position: sequence, loop, paths ────────────────────────────────── */
function Sequence({ record }) {
  const list = catalog.list(record.kind);
  const i = list.findIndex((r) => r.key === record.key);
  const prev = list[i - 1];
  const next = list[i + 1];
  const word = record.kind === 'film' ? 'film' : 'page';
  return (
    <div className="sequence">
      {prev ? <RecordLink k={prev.key} className="sequence__a"><small>← Previous {word}</small><strong>{catalog.label(prev.key)}</strong></RecordLink> : <span />}
      {next ? <RecordLink k={next.key} className="sequence__a sequence__a--next"><small>Next {word} →</small><strong>{catalog.label(next.key)}</strong></RecordLink> : <span />}
    </div>
  );
}

function Loop({ record }) {
  return (
    <div className="loopmap">
      {LOOP.map((l) => {
        const gs = catalog.list('guidance').filter((g) => g.phase === l.id);
        const here = l.id === record.phase;
        return (
          <div key={l.id} data-here={here ? '' : undefined}>
            <h4>{l.name}<small>{gs.length}</small></h4>
            {here ? (
              <ul>{gs.map((g) => <li key={g.key} data-self={g.key === record.key ? '' : undefined}><RecordLink k={g.key}>{g.title}</RecordLink></li>)}</ul>
            ) : (
              <AppLink to={`/search?kind=guidance&phase=${l.id}`} className="loopmap__dots" aria-label={`${l.name}: ${gs.length} records`}>{gs.map((g) => <i key={g.key} />)}</AppLink>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Paths({ record, plan }) {
  return (
    <div className="onpaths">
      {plan.data.paths.map((id) => {
        const p = catalog.path(id);
        const i = p.steps.indexOf(record.key);
        return (
          <RecordLink key={id} k={record.key} path={id} className="onpath">
            <strong>{p.name}</strong><span>step {i + 1} of {p.steps.length}</span>
            <span className="onpath__mini">{p.steps.map((s, j) => <i key={s} data-on={j <= i ? '' : undefined} />)}</span>
          </RecordLink>
        );
      })}
    </div>
  );
}

function Cite({ record }) {
  const text = record.kind === 'paper'
    ? `${shortAuthors(record)} (${record.year}). ${record.title}. ${record.journal}.${record.doi ? ` https://doi.org/${record.doi}` : ''}`
    : `Neoflix toolbox. ${record.title}. Department of Neonatology, Leiden University Medical Center. ${canonicalUrl(urlFor(record.key))}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="cite">
      <p>{text}</p>
      <button type="button" className="sys-btn" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? 'Copied' : 'Copy citation'}</button>
    </div>
  );
}

export const MODULES = {
  thread: Thread,
  map: Map,
  pathcards: () => <PathCards />,
  text: Text,
  loopbrowse: LoopBrowse,
  paperlist: PaperList,
  film: Film,
  player: Player,
  inpractice: InPractice,
  findings: Findings,
  practice: Practice,
  found: Found,
  summary: Summary,
  abstract: Abstract,
  sequence: Sequence,
  loop: Loop,
  paths: Paths,
  cite: Cite,
};

/** Draw an assembled layout (system/assemble.js). */
export function Assembly({ items, record, animateKey }) {
  let n = 0;
  const one = (plan, span) => {
    n += 1;
    const Cmp = MODULES[plan.id];
    return (
      <section key={plan.id} className={`mod mod--${plan.id}`} data-emph={plan.emph ? '' : undefined} style={{ gridColumn: `span ${span}`, '--d': `${0.1 + n * 0.07}s` }}>
        <header className="mod__h">
          <h2>{MODULE_NAMES[plan.id]}</h2>
          <span className="mod__why"><b>{n}</b>{plan.reason}</span>
        </header>
        {Cmp ? <Cmp record={record} plan={plan} /> : null}
      </section>
    );
  };
  return (
    <div className="asm" key={animateKey}>
      {items.map((it, i) =>
        it.stack ? (
          <div key={`stack-${i}`} className="asm__stack" style={{ gridColumn: `span ${it.span}` }}>
            {it.stack.map((p) => one(p, 12))}
          </div>
        ) : (
          one(it.module, it.span)
        )
      )}
    </div>
  );
}
