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
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { motion } from 'framer-motion';
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

/**
 * What the reader could want: small, one line each, to one side, and
 * tied to what the page is about by a drawn edge (Wires), so the page
 * shows *why* each is offered. Following one lights its edge first.
 */
function Wants({ want, onPick, onPath, refOf, follow, setFollow, title = 'You might also want' }) {
  if (!want.length) return null;
  const take = (w) => {
    setFollow(w.key);
    setTimeout(() => { if (w.path) onPath(w.path); else onPick(w.key); }, 230);
  };
  return (
    <aside className="wants" aria-label={title}>
      <p className="wants__h">{title}</p>
      {want.map((w) => (
        <a
          key={w.key}
          ref={refOf(w.key)}
          className="want"
          data-type={w.type}
          data-follow={follow === w.key ? '' : undefined}
          href={w.path ? `/paths/${w.path}` : urlFor(w.key)}
          data-id={w.key}
          onClick={(e) => { e.preventDefault(); take(w); }}
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

/**
 * The edges: from what the page is about to each thing on offer, drawn
 * in when the page arrives, coloured by what kind of link it is (the
 * evidence, the practice, a film, a path).
 */
function Wires({ bodyRef, mainRef, wantRefs, want, follow }) {
  const [paths, setPaths] = useState([]);
  // A passive effect, not a layout one: this component is a child of the
  // element it measures, and a parent's ref is attached after its
  // children's layout effects run.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !want.length) { setPaths([]); return undefined; }
    const measure = () => {
      const target = mainRef.current?.firstElementChild;
      if (!target) { setPaths([]); return; }
      const b = body.getBoundingClientRect();
      const m = target.getBoundingClientRect();
      const out = [];
      want.forEach((w, i) => {
        const el = wantRefs.current.get(w.key);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x1 = r.right - b.left;
        const y1 = r.top + r.height / 2 - b.top;
        const x2 = m.left - b.left;
        const span = Math.min(m.height * 0.5, 220);
        const y2 = m.top - b.top + Math.min(m.height, 440) * 0.5 + (want.length > 1 ? (i / (want.length - 1) - 0.5) * span : 0);
        if (x2 - x1 < 8) return;
        const dx = (x2 - x1) * 0.55;
        out.push({ key: w.key, type: w.type, x2, y2, d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}` });
      });
      setPaths(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    // The words column is sticky: when the page scrolls, the ends move.
    const scroller = body.closest('.pg');
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; measure(); }); };
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    return () => { ro.disconnect(); scroller?.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [bodyRef, mainRef, wantRefs, want]);
  if (!paths.length) return null;
  return (
    <svg className="wires" aria-hidden="true">
      {paths.map((p, i) => (
        <g key={p.key} data-type={p.type} data-follow={follow === p.key ? '' : undefined} style={{ '--d': `${0.25 + i * 0.12}s` }}>
          {/* A dashed line can't draw itself in with its own dashes, so a
              solid copy in a mask does the drawing and the dashes show through. */}
          <mask id={`wire-${i}`} maskUnits="userSpaceOnUse">
            <path className="wires__reveal" d={p.d} pathLength="1" />
          </mask>
          <path className="wires__line" d={p.d} mask={`url(#wire-${i})`} />
          <circle cx={p.x2} cy={p.y2} r="6" />
        </g>
      ))}
    </svg>
  );
}

/**
 * What lies beside the subject, percolating out of it: a few neighbours
 * seep out from behind the figure and settle at its edges (a row above,
 * one larger one below and off the edge), then drift a little, as if
 * the material went on past the page. Small and quiet until pointed at.
 */
const SLOTS = {
  // relative to the figure: [x, y, w, h], x/y as fractions or px offsets
  big: (f) => ({ x: f.x + f.w - 128, y: f.y + f.h + 12, w: 244, h: 204 }),
  top: (f, i, n) => {
    const w = [156, 162, 154][i % 3];
    const h = [100, 104, 98][i % 3];
    const step = Math.min(186, (f.w - 20) / Math.max(n, 1));
    return { x: f.x + 8 + i * step + (i % 2) * 6, y: f.y - h - 12 + (i % 2 ? -4 : 2), w, h };
  },
};

function Bit({ k }) {
  const r = catalog.get(k);
  if (r.kind === 'film') {
    return (
      <>
        <img src={stillFor(r)} alt="" draggable={false} />
        <span className="perc__cap"><b>{r.order + 1}</b>{r.name}</span>
      </>
    );
  }
  if (r.kind === 'paper') {
    return (
      <span className="perc__slip">
        <b>{r.n}</b>
        <strong>{r.short}</strong>
        <small>{r.year}</small>
      </span>
    );
  }
  return (
    <span className="perc__slip perc__slip--guide">
      {r.number && <b>{r.number}</b>}
      <strong>{r.title}</strong>
    </span>
  );
}

function Percolate({ keys, mainRef, big, onPick }) {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const main = mainRef.current;
    if (!main || !keys.length) { setBox(null); return undefined; }
    const measure = () => {
      const fig = main.firstElementChild?.firstElementChild || main.firstElementChild;
      if (!fig || fig.classList.contains('perc')) return;
      const m = main.getBoundingClientRect();
      const r = fig.getBoundingClientRect();
      setBox({ x: r.left - m.left, y: r.top - m.top, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    return () => ro.disconnect();
  }, [mainRef, keys]);
  if (!box || !keys.length) return null;
  const withBig = big && keys.length > 1;
  const tops = withBig ? keys.slice(1, 4) : keys.slice(0, 3);
  const items = [
    ...(withBig ? [{ k: keys[0], s: SLOTS.big(box), big: true }] : []),
    ...tops.map((k, i) => ({ k, s: SLOTS.top(box, i, tops.length) })),
  ];
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // Each neighbour is tethered outward, to the rest of the material it
  // belongs to, beyond the page: a line from behind it, away from the
  // subject, off the edge. Never inward: the subject has its own edges.
  const tethers = items.map(({ k, s }, i) => {
    const bx = s.x + s.w / 2;
    const by = s.y + s.h / 2;
    let dx = bx - cx;
    let dy = by - cy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const far = 1400;
    const ex = bx + dx * far;
    const ey = by + dy * far;
    // a slight bend, alternating, so they read as drawn, not ruled
    const bend = (i % 2 ? 1 : -1) * 90;
    const mx = bx + dx * far * 0.35 - dy * bend;
    const my = by + dy * far * 0.35 + dx * bend;
    return { k, i, d: `M${bx},${by} Q${mx},${my} ${ex},${ey}` };
  });
  return (
    <div className="perc" aria-label="Beside this">
      <svg className="wires perc__tethers" aria-hidden="true">
        {tethers.map((t) => (
          <g key={t.k} style={{ '--d': `${0.85 + t.i * 0.13}s` }}>
            <mask id={`tether-${t.i}`} maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
              <path className="wires__reveal" d={t.d} pathLength="1" />
            </mask>
            <path className="wires__line" d={t.d} mask={`url(#tether-${t.i})`} />
          </g>
        ))}
      </svg>
      {items.map(({ k, s, big: b }, i) => (
        <motion.a
          key={k}
          href={urlFor(k)}
          data-id={k}
          className={`perc__bit perc__bit--${catalog.get(k).kind}${b ? ' perc__bit--big' : ''}`}
          style={{ left: s.x, top: s.y, width: s.w, height: s.h, '--i': i }}
          initial={{ x: cx - (s.x + s.w / 2), y: cy - (s.y + s.h / 2), scale: 0.4, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 17, delay: 0.35 + i * 0.13 }}
          onClick={(e) => { e.preventDefault(); onPick(k); }}
          aria-label={labelOf(k)}
          title={labelOf(k)}
        >
          <span className="perc__drift"><Bit k={k} /></span>
        </motion.a>
      ))}
    </div>
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
export default function Page({ node, came, onPick, onPath, onProbe, search, resume, onResume }) {
  const page = useMemo(() => ONTOLOGY.pageOf(node), [node]);
  const bodyRef = useRef(null);
  const mainRef = useRef(null);
  const wantRefs = useRef(new Map());
  const refOf = (k) => (el) => { if (el) wantRefs.current.set(k, el); else wantRefs.current.delete(k); };
  const [follow, setFollow] = useState(null);
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

  const want = <Wants want={page.want} onPick={onPick} onPath={onPath} refOf={refOf} follow={follow} setFollow={setFollow} title={page.layout === 'cover' ? 'Or take a path' : 'You might also want'} />;
  // The edge you came in on: how the page you were on connects to this one.
  const thread = record && came && came !== record.key ? graph.threadBetween(came, record.key) : null;

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
      <div className="pg__body" ref={bodyRef}>
        <Wires bodyRef={bodyRef} mainRef={mainRef} wantRefs={wantRefs} want={page.want} follow={follow} />
        <div className="pg__words">
          {thread && (
            <p className="came" data-type={thread.kind}>
              <i aria-hidden="true">↖</i>
              <span><b>From {labelOf(came)}</b>{thread.text}</span>
            </p>
          )}
          {words}
          {want}
        </div>
        <div className="pg__main" ref={mainRef}>
          {main}
          {page.adjacent?.length > 0 && <Percolate keys={page.adjacent} mainRef={mainRef} big={page.layout !== 'read'} onPick={onPick} />}
        </div>
      </div>
    </div>
  );
}
