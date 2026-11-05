/**
 * One page of the atlas: its elements, clamped (magnet.js), at rest.
 *
 * A page is a context (contexts.js): a stop of the story shows its
 * subject big with what it connects to clamped round it; a record shows
 * its modules round its main one; a step of the loop its chapters; a
 * path its steps. Pages don't morph into each other (that was the
 * canvas, the Prezi feel); a new page slides in whole, and its elements
 * are already where they belong.
 *
 * The voice and the modules are as tall as what they say: rendered at
 * their width, measured before paint, then assembled.
 */
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { catalog, graph, lib, stillFor, clipFor } from '../system/library';
import { LOOP, loopName } from '../system/catalog';
import { urlFor, keyForPath } from '../system/urls';
import { usePins, togglePin } from '../system/state';
import { planRecord } from '../system/modules/plans';
import { MODULES, MODULE_NAMES, SessionFilmButton } from '../system/modules';
import { FrontContext } from '../system/modules/front';
import { Here } from '../system/ui/nav';
import { shortAuthors, doiUrl } from '../pages/publications/records';
import { publicationPdfs } from '../pages/publications/content';
import { TAGLINE } from '../pages/home/content';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import { assetUrl } from '../lib/utils/assetUrl';
import { prefersReducedMedia } from '../lib/utils/reducedMedia';
import { itemsFor } from './contexts';
import { assemble } from './magnet';
import { CHAPTERS } from './tour';

export const GAP = 10;
const PAD = 24; // inside the voice and the modules (composition.css)

// Shown otherwise: a film is its own element; the library is the atlas.
const NOT_IN_READING = new Set(['map', 'loop', 'loopbrowse', 'paperlist', 'player', 'sequence', 'paths']);
const MOD_W = { text: 560, thread: 560, pathcards: 560, found: 440, summary: 380, findings: 380, abstract: 360, practice: 340, film: 340, inpractice: 340, cite: 300 };
export const plansOf = (record, from) => planRecord(record, { from }, lib).filter((p) => !NOT_IN_READING.has(p.id)).sort((a, b) => a.order - b.order);

export const labelOf = (key) => {
  const r = catalog.get(key);
  if (!r) return '';
  if (r.kind === 'paper') return `Paper ${r.n} · ${r.short}`;
  if (r.kind === 'film') return `Film · ${r.name}`;
  return `${r.number ? `${r.number} ` : ''}${r.id === '' ? 'Welcome to the toolbox' : r.title}`;
};

function stopState(s) {
  if (s.at === 'everything') return { lens: 'everything' };
  if (Array.isArray(s.at) || /^(column|region):/.test(s.at)) return { lens: s.at };
  return { anchor: s.at };
}

/* ── a record, as an element ───────────────────────────────────────────── */

function RecordEl({ id, kind, rect, anchor, visited, playing, onPick, world }) {
  const head = kind === 'head' ? world.heads.find((h) => h.id === id) : null;
  const r = head ? null : catalog.get(id);
  const [reduced] = useState(prefersReducedMedia);
  let body;
  if (kind === 'film') {
    body = (
      <>
        {playing && !reduced
          ? <video className="t__media" src={clipFor(r)} poster={stillFor(r)} autoPlay muted loop playsInline preload="auto" />
          : <img className="t__media" src={stillFor(r)} alt="" draggable={false} />}
        <span className="t__plate">
          <span className="t__n">{r.order + 1}</span>
          <span className="t__name">{r.name}</span>
          <span className="t__claim">{r.claim}</span>
        </span>
      </>
    );
  } else if (kind === 'paper') {
    body = (
      <span className="t__in">
        <span className="t__n">{r.n}</span>
        <span className="t__title">{r.short}</span>
        <span className="t__found">{r.found}</span>
        <span className="t__meta">{r.journal} · {r.year}</span>
      </span>
    );
  } else if (kind === 'head') {
    const count = world.guidance.filter((g) => g.phase === head.phase).length;
    body = (
      <span className="t__in">
        <span className="t__n">{head.step}</span>
        <span className="t__title">{head.name}</span>
        <span className="t__meta">{count} pages</span>
      </span>
    );
  } else {
    body = (
      <span className="t__in">
        {r.number ? <span className="t__n">{r.number}</span> : null}
        <span className="t__title">{r.id === '' ? 'Welcome to the toolbox' : r.title}</span>
        {r.excerpt && <span className="t__ex">{r.excerpt}</span>}
      </span>
    );
  }
  const style = { transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`, width: rect.w, height: rect.h };
  const Tag = head ? 'button' : 'a';
  return (
    <Tag
      className={`e e--${kind}`}
      style={style}
      href={head ? undefined : urlFor(id)}
      type={head ? 'button' : undefined}
      data-id={id}
      data-numbered={kind === 'guidance' && !r.number ? undefined : ''}
      data-anchor={anchor ? '' : undefined}
      data-visited={visited ? '' : undefined}
      draggable={false}
      onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); onPick(id); }}
      aria-label={head ? `${head.name}: this step of the loop` : labelOf(id)}
    >
      {body}
    </Tag>
  );
}

const Measured = React.forwardRef(function Measured({ rect, width, className, children, ...rest }, ref) {
  const style = rect ? { transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`, width: rect.w, height: rect.h } : { visibility: 'hidden', width };
  return (
    <section className={`e e--measured ${className || ''}`} style={style} {...rest}>
      <div className="e__scroll">
        <div className="e__content" ref={ref} style={{ width: Math.max(0, width - PAD * 2) }}>{children}</div>
      </div>
    </section>
  );
});

/* ── the voice: the words for this page ────────────────────────────────── */

function StopVoice({ node, resume, onResume }) {
  const s = node.stop;
  const chapter = CHAPTERS.find((c) => c.id === s.chapter);
  return (
    <div className="v__story">
      <p className="v__where">
        {chapter ? <><b>{CHAPTERS.indexOf(chapter) + 1}</b>{chapter.name}</> : <><b>{node.index === 0 ? 'N' : '■'}</b>{node.index === 0 ? 'Neoflix, Leiden' : 'The end of the story'}</>}
      </p>
      <h1 className={`v__title${node.index === 0 ? ' v__title--big' : ''}`}>{node.index === 0 ? TAGLINE : s.title}</h1>
      <p className="v__text">{node.index === 0 ? `${s.title} ${s.text}` : s.text}</p>
      {resume && <p className="v__back">Welcome back. <a href={urlFor(resume.key || '')} onClick={(e) => { e.preventDefault(); onResume(); }}>Carry on with {resume.label} →</a></p>}
    </div>
  );
}

function StepVoice({ node }) {
  const pages = catalog.list('guidance').filter((g) => g.phase === node.phase && !g.divider);
  return (
    <div className="v__rest">
      <p className="v__where"><b>{node.num}</b>Step {node.num} of the loop</p>
      <h1 className="v__title">{node.label}</h1>
      <p className="v__text">{pages.length} pages of the toolbox. Its chapters are to the right, in the order you’ll need them.</p>
    </div>
  );
}

function PathVoice({ node }) {
  const p = catalog.path(node.pathId);
  return (
    <div className="v__rest">
      <p className="v__where"><b>→</b>A path, {p.steps.length} steps</p>
      <h1 className="v__title">{p.name}</h1>
      <p className="v__text">{p.blurb}</p>
    </div>
  );
}

function RecordVoice({ record }) {
  const pins = usePins();
  const pinned = pins.includes(record.key);
  let where;
  let sub = null;
  let title = record.title;
  if (record.key === 'guidance:') {
    where = <><b>T</b>The toolbox</>;
    title = 'Video review for neonatal teams, step by step';
  } else if (record.kind === 'guidance') {
    where = <><b>{record.number || LOOP.findIndex((l) => l.id === record.phase) + 1 || 'T'}</b>{loopName(record.phase) || 'The toolbox'}</>;
    sub = record.excerpt && <p className="v__text">{record.excerpt}</p>;
  } else if (record.kind === 'paper') {
    const pdf = publicationPdfs[record.id];
    where = <><b>{record.n}</b>{record.journal}, {record.year}</>;
    sub = (
      <p className="v__meta">
        {shortAuthors(record)}
        {record.doi && <><br /><a href={doiUrl(record)} target="_blank" rel="noopener noreferrer">doi.org/{record.doi}</a></>}
        {pdf && <><br /><a href={assetUrl(pdf.src)} download>Author PDF, {pdf.pages} pages</a></>}
      </p>
    );
  } else {
    where = <><b>{record.order + 1}</b>Film · {record.name}</>;
    sub = (
      <>
        <p className="v__text">{record.caption}</p>
        <SessionFilmButton at={record.at} />
      </>
    );
  }
  return (
    <div className="v__record">
      <p className="v__where">{where}</p>
      <h1 className={`v__title${title.length > 90 ? ' v__title--long' : ''}`}>{title}</h1>
      {sub}
      <div className="v__actions">
        <button type="button" data-on={pinned ? '' : undefined} onClick={() => togglePin(record.key)}>{pinned ? '✓ In your pack' : '+ Pack'}</button>
      </div>
    </div>
  );
}

/* ── the page ──────────────────────────────────────────────────────────── */

/**
 * `node` is an atlas node, or { kind: 'search', hits, query, … } for a
 * search. `bounds` is the room inside the page area.
 */
export default function Page({ node, world, bounds, f, phone, visited, voiceSlot, onPick, onProbe }) {
  const record = node.kind === 'record' ? catalog.get(node.key) : null;
  const plans = useMemo(() => (record ? plansOf(record, null) : []), [record]);
  const vw = Math.min(bounds.w, Math.round((record ? 380 : 400) * Math.max(0.9, f)));
  const modW = (id) => Math.min(bounds.w, Math.max(280, Math.round((MOD_W[id] || 360) * f)));

  const refs = useRef(new Map());
  const refOf = (id) => (el) => { if (el) refs.current.set(id, el); else refs.current.delete(id); };
  const [heights, setHeights] = useState({});
  useLayoutEffect(() => {
    const next = {};
    let changed = false;
    refs.current.forEach((el, id) => {
      const h = Math.ceil(el.offsetHeight + PAD * 2);
      next[id] = h;
      if (Math.abs((heights[id] || 0) - h) > 3) changed = true;
    });
    if (changed) setHeights((o) => ({ ...o, ...next }));
  });

  const { items, rects } = useMemo(() => {
    const cap = phone ? 2000 : bounds.h;
    const voice = { w: vw, h: Math.min(cap, heights.voice || 360) };
    let ctx;
    if (node.kind === 'stop') ctx = { mode: 'tour', ...stopState(node.stop) };
    else if (node.kind === 'step') ctx = { mode: 'step', lens: `column:${node.phase}` };
    else if (node.kind === 'path') ctx = { mode: 'search', hits: node.kids.map((k) => k.key) };
    else if (node.kind === 'search') ctx = { mode: 'search', hits: node.hits };
    else {
      const modules = plans.map((p) => ({
        id: `mod:${p.id}`,
        w: modW(p.id),
        h: Math.min(phone ? 2000 : p.id === 'text' ? bounds.h : Math.round(460 * Math.max(0.9, f)), heights[`mod:${p.id}`] || 240),
        scalable: false,
        squeeze: phone ? 0 : 170,
      }));
      ctx = { mode: 'read', anchor: node.key, modules, everyModule: phone };
    }
    const list = itemsFor(world, { ...ctx, voice }, graph, f);
    return { items: list, rects: assemble(list, { bounds, gap: GAP, top: phone }).rects };
  }, [node, plans, heights, bounds, f, phone, vw, world]); // eslint-disable-line react-hooks/exhaustive-deps

  const anchor = node.kind === 'record' ? node.key : node.kind === 'stop' && typeof node.stop.at === 'string' ? node.stop.at : null;
  const probe = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    const key = keyForPath(href.split('?')[0], { resolveSlug });
    if (key && key !== anchor && catalog.has(key)) onProbe(key);
  };

  let voiceBody;
  if (node.kind === 'stop') voiceBody = <StopVoice node={node} resume={voiceSlot?.resume} onResume={voiceSlot?.onResume} />;
  else if (node.kind === 'step') voiceBody = <StepVoice node={node} />;
  else if (node.kind === 'path') voiceBody = <PathVoice node={node} />;
  else if (node.kind === 'search') voiceBody = voiceSlot?.search;
  else voiceBody = <RecordVoice record={record} />;

  const height = phone ? Math.max(0, ...[...rects.values()].map((r) => r.y + r.h)) + 24 : undefined;

  return (
    <div className="pg" style={height ? { height } : undefined} onMouseOver={probe} onMouseOut={(e) => e.target.closest?.('a[href]') && onProbe(null)}>
      {items.map((it) => {
        const rect = rects.get(it.id);
        if (it.id === 'voice') return <Measured key="voice" rect={rect} width={vw} ref={refOf('voice')} className="e--voice">{voiceBody}</Measured>;
        if (it.kind === 'module') return null;
        if (!rect) return null;
        return <RecordEl key={it.id} id={it.id} kind={it.kind} rect={rect} world={world} anchor={it.id === anchor} visited={visited.has(it.id)} playing={it.kind === 'film' && it.id === anchor} onPick={onPick} />;
      })}
      {record && (
        <Here.Provider value={{ current: record.key, path: null }}>
          <FrontContext.Provider value={{ route: null, setRoute: () => {}, trail: [] }}>
            {plans.map((plan, i) => {
              const Cmp = MODULES[plan.id];
              const id = `mod:${plan.id}`;
              return (
                <Measured key={id} rect={rects.get(id)} width={modW(plan.id)} ref={refOf(id)} className={`e--module mod--${plan.id}`} data-emph={plan.emph ? '' : undefined} title={`Here because ${plan.reason}`}>
                  <div className="sys">
                    <h2 className="t__modname"><b>{i + 1}</b>{MODULE_NAMES[plan.id]}</h2>
                    {Cmp ? <Cmp record={record} plan={plan} /> : null}
                  </div>
                </Measured>
              );
            })}
          </FrontContext.Provider>
        </Here.Provider>
      )}
    </div>
  );
}
