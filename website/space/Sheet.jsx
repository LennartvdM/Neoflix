/**
 * The reading sheet: a record, opened beside its place in the space.
 *
 * It is the library's assembled record (system/modules), in one column:
 * the same rules decide what a record shows and in what order, and how
 * the reader arrived still moves things (from a paper, the evidence
 * first). What the space already shows (the map, the loop, the film
 * playing on its card) is left out.
 *
 * Changing records doesn't crossfade. The new sheet is already there,
 * at full strength, underneath; the old one lifts off the top.
 *
 * Every link in it is a probe: hover one and a line runs from the link
 * to the place in the space where it lands.
 */
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { lib, catalog } from '../system/library';
import { loopName } from '../system/catalog';
import { planRecord } from '../system/modules/plans';
import { MODULES, MODULE_NAMES, SessionFilmButton } from '../system/modules';
import { FrontContext } from '../system/modules/front';
import { keyForPath } from '../system/urls';
import { Here } from '../system/ui/nav';
import { KindLabel } from '../system/ui/Shape';
import { usePins, togglePin } from '../system/state';
import { shortAuthors, doiUrl } from '../pages/publications/records';
import { publicationPdfs } from '../pages/publications/content';
import { assetUrl } from '../lib/utils/assetUrl';
import { resolveSlug } from '../pages/toolbox/docsIndex';
import '../system/system.css';

// Shown by the space itself, so not repeated in the sheet.
const SHOWN_BY_THE_SPACE = new Set(['map', 'loop', 'loopbrowse', 'paperlist', 'player']);

function Head({ record, onClose }) {
  const pins = usePins();
  const pinned = pins.includes(record.key);
  let label;
  let sub = null;
  let title = record.title;
  if (record.key === 'guidance:') {
    label = <KindLabel kind="guidance">The toolbox</KindLabel>;
    title = 'Video review for neonatal teams, step by step';
    sub = <p className="sheet__stand">How to start recording and reviewing, from the decision to the first session and beyond. Every page sits in the columns below the films, in the order of the loop.</p>;
  } else if (record.kind === 'guidance') {
    label = <KindLabel kind="guidance">{[loopName(record.phase), record.number && `Toolbox ${record.number}`].filter(Boolean).join(' · ')}</KindLabel>;
    sub = record.excerpt && <p className="sheet__stand">{record.excerpt}</p>;
  } else if (record.kind === 'paper') {
    const pdf = publicationPdfs[record.id];
    label = <KindLabel kind="paper" name={`Paper ${record.n}`}>{record.journal} · {record.year}</KindLabel>;
    sub = (
      <p className="sheet__meta">
        {shortAuthors(record)}
        {record.doi && <> · <a className="sys-link" href={doiUrl(record)} target="_blank" rel="noopener noreferrer">doi.org/{record.doi}</a></>}
        {pdf && <> · <a className="sys-link" href={assetUrl(pdf.src)} download>Author PDF, {pdf.pages} pages</a></>}
      </p>
    );
  } else {
    label = <KindLabel kind="film">{record.name}</KindLabel>;
    sub = (
      <>
        <p className="sheet__stand">{record.caption} The clip is playing on its card, beside this sheet.</p>
        <SessionFilmButton at={record.at} />
      </>
    );
  }
  return (
    <header className="sheet__head">
      <div className="sheet__bar">
        {label}
        <span className="sheet__tools">
          <button type="button" className={`sheet__pin${pinned ? ' is-on' : ''}`} aria-pressed={pinned} onClick={() => togglePin(record.key)} title="Your session pack">
            {pinned ? '✓ Packed' : '+ Pack'}
          </button>
          <button type="button" className="sheet__x" onClick={onClose} aria-label="Close and step back">✕</button>
        </span>
      </div>
      <h1>{title}</h1>
      {sub}
    </header>
  );
}

function Page({ record, from, path, onClose, onProbe, onRail }) {
  const plans = useMemo(
    () => planRecord(record, { from }, lib).filter((p) => !SHOWN_BY_THE_SPACE.has(p.id)).sort((a, b) => a.order - b.order),
    [record, from]
  );
  const probe = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    const key = keyForPath(href, { resolveSlug });
    if (key && key !== record.key && catalog.has(key)) onProbe({ key, el: a });
  };
  return (
    <Here.Provider value={{ current: record.key, path: path?.id || null }}>
      <FrontContext.Provider value={{ route: null, setRoute: onRail, trail: [] }}>
        <div className="sys sheet__page" onMouseOver={probe} onMouseOut={(e) => e.target.closest?.('a[href]') && onProbe(null)}>
          <Head record={record} onClose={onClose} />
          {plans.map((plan, i) => {
            const Cmp = MODULES[plan.id];
            return (
              <section key={plan.id} className={`mod mod--${plan.id}`} data-emph={plan.emph ? '' : undefined}>
                <header className="mod__h">
                  <h2>{MODULE_NAMES[plan.id]}</h2>
                  <span className="mod__why"><b>{i + 1}</b>{plan.reason}</span>
                </header>
                {Cmp ? <Cmp record={record} plan={plan} /> : null}
              </section>
            );
          })}
        </div>
      </FrontContext.Provider>
    </Here.Provider>
  );
}

export default function Sheet(props) {
  const { record, from } = props;
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={`${record.key}|${from || ''}`}
        className="sheet__layer"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1, zIndex: 1 }}
        exit={{ opacity: 0, y: -28, scale: 0.985, zIndex: 2, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
        onAnimationStart={() => props.onProbe(null)}
      >
        <Page {...props} />
      </motion.div>
    </AnimatePresence>
  );
}
