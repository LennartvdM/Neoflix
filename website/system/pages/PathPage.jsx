/**
 * /paths and /paths/<id>: the guided ways through the library. A path's
 * page lists its steps with what each one is, and draws its route on the
 * map; "Begin" starts walking it.
 */
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { parseKey, loopName } from '../catalog';
import { catalog } from '../library';
import { useMyPath, useTrail } from '../state';
import { FrontContext } from '../modules/front';
import { PathCards } from '../modules';
import MapGraph from '../ui/MapGraph';
import Shape, { KindLabel } from '../ui/Shape';
import { RecordLink } from '../ui/nav';
import Shell from './Shell';
import { NotInLibrary } from './RecordPage';

function lineFor(k) {
  const r = catalog.get(k);
  if (r.kind === 'film') return r.claim;
  if (r.kind === 'paper') return r.found;
  return r.excerpt;
}

export default function PathPage() {
  const { id } = useParams();
  const mine = useMyPath();
  const trail = useTrail();
  const [route, setRoute] = useState(null);
  const all = [...catalog.paths, ...(mine ? [{ id: 'mine', name: 'Your path', blurb: 'The route you took through the library, saved.', steps: mine.steps.filter((k) => catalog.has(k)) }] : [])];

  if (!id) {
    return (
      <Shell crumbs={[['Paths']]}>
        <FrontContext.Provider value={{ route, setRoute, trail }}>
          <header className="rec rec--front"><div><span className="sys-label">Paths</span><h1>Guided ways through the library.</h1></div><p className="standfirst">A path is a sequence you can walk one step at a time, like slides, with every record still connected to everything around it. Hover a path to see its route.</p></header>
          <div className="asm">
            <section className="mod" style={{ gridColumn: 'span 12' }}><MapGraph route={route} routeSteps={all.find((p) => p.id === route)?.steps} trail={trail} /></section>
            <section className="mod" style={{ gridColumn: 'span 12' }}><PathCards paths={all} /></section>
          </div>
        </FrontContext.Provider>
      </Shell>
    );
  }

  const path = all.find((p) => p.id === id);
  if (!path) return <NotInLibrary />;
  return (
    <Shell crumbs={[['Paths', '/paths'], [path.name]]}>
      <header className="rec rec--front">
        <div><span className="sys-label">Path · {path.steps.length} steps</span><h1>{path.name}</h1></div>
        <p className="standfirst">{path.blurb}</p>
      </header>
      <div className="asm">
        <section className="mod" style={{ gridColumn: 'span 7' }}>
          <header className="mod__h"><h2>The steps</h2></header>
          <ol className="steps">
            {path.steps.map((k, i) => {
              const r = catalog.get(k);
              return (
                <li key={k}>
                  <RecordLink k={k} path={path.id} className="step">
                    <span className="step__n">{i + 1}</span>
                    <Shape k={k} />
                    <span>
                      <KindLabel kind={r.kind} name={r.kind === 'paper' ? `Paper ${r.n}` : undefined}>{r.kind === 'guidance' ? loopName(r.phase) : r.kind === 'paper' ? r.year : r.name}</KindLabel>
                      <strong>{catalog.label(k)}</strong>
                      {lineFor(k) && <small>{lineFor(k)}</small>}
                    </span>
                  </RecordLink>
                </li>
              );
            })}
          </ol>
          <RecordLink k={path.steps[0]} path={path.id} className="sys-btn sys-btn--dark sys-btn--lg">Begin the path →</RecordLink>
        </section>
        <section className="mod" style={{ gridColumn: 'span 5' }}>
          <header className="mod__h"><h2>Its route</h2></header>
          <MapGraph mini route={parseKey(path.steps[0]).kind} routeSteps={path.steps} dim={(k) => !path.steps.includes(k)} />
        </section>
      </div>
    </Shell>
  );
}
