/**
 * /search — with a query, results assembled around it (system/search.js);
 * without one, the library to browse by kind and by step of the loop.
 */
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LOOP, loopName } from '../catalog';
import { catalog, lib, stillFor } from '../library';
import { searchLibrary } from '../search';
import { assemble } from '../assemble';
import MapGraph from '../ui/MapGraph';
import Shape, { KindLabel } from '../ui/Shape';
import { RecordLink, AppLink } from '../ui/nav';
import Shell from './Shell';

const NAMES = { top: 'Best match', where: 'Where the matches are', loop: 'In the loop', sentences: 'From the papers', papers: 'Papers', films: 'Films', guidance: 'Guidance' };

function Mark({ text, q }) {
  const words = q.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return text;
  const parts = String(text).split(new RegExp(`(${words.join('|')})`, 'ig'));
  return parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p));
}

function lead(r) {
  return r.kind === 'paper' ? r.found : r.kind === 'film' ? r.inPractice : r.excerpt;
}

function Row({ r, q }) {
  return (
    <li>
      <RecordLink k={r.key} className="row">
        <Shape k={r.key} />
        <span>
          <KindLabel kind={r.kind} name={r.kind === 'paper' ? `Paper ${r.n}` : undefined}>{r.kind === 'guidance' ? loopName(r.phase) : r.kind === 'paper' ? r.year : r.name}</KindLabel>
          <strong><Mark text={catalog.label(r.key)} q={q} /></strong>
          {lead(r) && <small><Mark text={lead(r)} q={q} /></small>}
        </span>
      </RecordLink>
    </li>
  );
}

function Results({ query }) {
  const { q, hits, plans } = useMemo(() => searchLibrary(query, lib), [query]);
  const items = assemble(plans);
  const set = new Set(hits.map((h) => h.key));
  const draw = (p) => {
    switch (p.id) {
      case 'top': {
        const r = catalog.get(p.data.key);
        return (
          <RecordLink k={r.key} className="topmatch">
            <Shape k={r.key} size="l" />
            <span>
              <KindLabel kind={r.kind} name={r.kind === 'paper' ? `Paper ${r.n}` : undefined}>{r.kind === 'guidance' ? loopName(r.phase) : r.kind === 'paper' ? r.journal : r.name}</KindLabel>
              <strong><Mark text={catalog.label(r.key)} q={q} /></strong>
              {lead(r) && <p><Mark text={lead(r)} q={q} /></p>}
            </span>
          </RecordLink>
        );
      }
      case 'where':
        return <MapGraph mini dim={(k) => !set.has(k)} />;
      case 'loop':
        return (
          <div className="loopmap">
            {LOOP.map((l) => {
              const gs = catalog.list('guidance').filter((g) => g.phase === l.id);
              const here = l.id === p.data.step;
              const shown = here ? (p.data.named ? gs : gs.filter((g) => set.has(g.key))) : [];
              return (
                <div key={l.id} data-here={here ? '' : undefined}>
                  <h4>{l.name}<small>{gs.filter((g) => set.has(g.key)).length || gs.length}</small></h4>
                  {here ? <ul>{shown.map((g) => <li key={g.key}><RecordLink k={g.key}>{g.title}</RecordLink></li>)}</ul> : <span className="loopmap__dots">{gs.map((g) => <i key={g.key} data-on={set.has(g.key) ? '' : undefined} />)}</span>}
                </div>
              );
            })}
          </div>
        );
      case 'sentences':
        return (
          <ul className="findings">
            {p.data.sentences.map((s) => {
              const r = catalog.get(`paper:${s.paper}`);
              return <li key={s.text}><RecordLink k={r.key}><Shape k={r.key} /></RecordLink><span><Mark text={s.text} q={q} /><small>Paper {r.n} · {r.short}</small></span></li>;
            })}
          </ul>
        );
      case 'films':
        return <div className="filmrow filmrow--grid">{hits.filter((r) => r.kind === 'film').map((r) => <RecordLink key={r.key} k={r.key}><img src={stillFor(r)} alt="" /><span>{r.name}</span></RecordLink>)}</div>;
      default:
        return <ul className="rows">{hits.filter((r) => r.kind === (p.id === 'papers' ? 'paper' : 'guidance')).slice(0, 12).map((r) => <Row key={r.key} r={r} q={q} />)}</ul>;
    }
  };
  let n = 0;
  const one = (p, span) => { n += 1; return (
    <section key={p.id} className={`mod mod--${p.id}`} style={{ gridColumn: `span ${span}`, '--d': `${0.06 + n * 0.05}s` }}>
      <header className="mod__h"><h2>{NAMES[p.id]}</h2><span className="mod__why"><b>{n}</b>{p.reason}</span></header>
      {draw(p)}
    </section>
  ); };
  return (
    <>
      <header className="rec rec--search">
        <span className="sys-label">Search{hits.length ? ` · ${hits.length} record${hits.length === 1 ? '' : 's'}` : ''}</span>
        <h1>“{query}”</h1>
        {!hits.length && <p className="standfirst">Nothing in the library uses those words. Try “consent”, “chair”, “reflect” or “vocal cords”.</p>}
      </header>
      <div className="asm asm--quiet">{items.map((it, i) => (it.stack ? <div key={i} className="asm__stack" style={{ gridColumn: `span ${it.span}` }}>{it.stack.map((p) => one(p, 12))}</div> : one(it.module, it.span)))}</div>
    </>
  );
}

function Browse({ kind, phase }) {
  const all = [...catalog.records.values()].filter((r) => r.key !== 'guidance:');
  const shown = all.filter((r) => (!kind || r.kind === kind) && (!phase || r.phase === phase));
  const href = (k, v) => {
    const p = new URLSearchParams();
    const next = { kind, phase, [k]: v };
    if (k === 'kind') next.phase = null;
    if (next.kind) p.set('kind', next.kind);
    if (next.phase) p.set('phase', next.phase);
    const s = p.toString();
    return s ? `/search?${s}` : '/search';
  };
  const facet = (k, v, label, count) => {
    const on = (k === 'kind' ? kind : phase) === v;
    return <AppLink key={label} to={href(k, on ? null : v)} replace className="facet" aria-current={on ? 'true' : undefined}><span>{label}</span><small>{count}</small></AppLink>;
  };
  return (
    <>
      <header className="rec rec--search"><span className="sys-label">Browse</span><h1>Everything in the library.</h1></header>
      <div className="browse">
        <aside>
          <h3>Kind</h3>
          {facet('kind', null, 'Everything', all.length)}
          {['guidance', 'paper', 'film'].map((k) => facet('kind', k, { guidance: 'Guidance', paper: 'Papers', film: 'Films' }[k], all.filter((r) => r.kind === k).length))}
          {(!kind || kind === 'guidance') && (
            <>
              <h3>Step of the loop</h3>
              {LOOP.map((l) => facet('phase', l.id, l.name, all.filter((r) => r.phase === l.id).length))}
            </>
          )}
        </aside>
        <ul className="rows rows--browse">{shown.map((r) => <Row key={r.key} r={r} q="" />)}</ul>
      </div>
    </>
  );
}

export default function SearchPage() {
  const { search } = useLocation();
  const p = new URLSearchParams(search);
  const q = (p.get('q') || '').trim();
  return (
    <Shell crumbs={[[q ? 'Search' : 'Browse']]}>
      {q ? <Results query={q} /> : <Browse kind={p.get('kind')} phase={p.get('phase')} />}
    </Shell>
  );
}
