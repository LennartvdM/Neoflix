/**
 * /publications on a laptop — the six papers as a board, on their time
 * axis.
 *
 * Columns are the years 2022–2026; each paper hangs in its own year, so
 * the shape of the page is the shape of the work: one paper, a gap, four
 * at once, a gap, one more. Years with nothing published stay as open
 * holes on the board. Veerle's letter takes the first column, where the
 * line of work begins (the blueprint later moves it to the toolbox's
 * Start here).
 *
 * At rest a card shows the paper's short name, title and one finding.
 * It opens in place — the board reflows around it — to Asked / Found /
 * Changed and its doors: the paper's page or the journal, the author PDF,
 * and the beats of the argument it supports.
 *
 * Words: arc.js (what we say about each paper), records.js (the facts).
 * Card ids are the old anchors, so /publications#narrative still lands.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGroup, motion } from 'framer-motion';
import BoardPage from '../../shared/board/BoardPage';
import { Exit, Proof } from '../../shared/board/hooks';
import useDownloadGuard from '../../lib/hooks/useDownloadGuard';
import { renderMarkdown } from '../../lib/utils/renderMarkdown';
import { assetUrl } from '../../lib/utils/assetUrl';
import { beatsForPaper } from '../../shared/argument';
import Token from '../../shared/index/Token';
import { useLit } from '../../shared/index/IndexContext';
import { token } from '../../shared/index/relations';
import { ARC, ARC_INTRO } from './arc';
import { publicationOrder, publicationRecords, paperPath, doiUrl, shortAuthors } from './records';
import { publicationPdfs, sections, bundle } from './content';
import './publications-board.css';

const LAYOUT = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 };
const YEARS = (() => {
  const ys = publicationOrder.map((id) => publicationRecords[id].year);
  const out = [];
  for (let y = Math.min(...ys); y <= Math.max(...ys); y++) out.push(y);
  return out;
})();
const SECTION_IDS = ['preface', ...publicationOrder];

function PdfDoor({ id }) {
  const pdf = publicationPdfs[id];
  const guard = useDownloadGuard(pdf?.src);
  if (!pdf) return null;
  return (
    <a
      className={`hook-exit${guard.cooling ? ' is-cooling' : ''}`}
      href={assetUrl(pdf.src)}
      download
      aria-disabled={guard.cooling || undefined}
      onClick={guard.onClick}
    >
      <span>{guard.cooling ? `Ready again in ${guard.secondsLeft}s` : `Author PDF · ${pdf.pages} pages`}</span>
      <span aria-hidden="true" className="hook-exit__arrow">↓</span>
    </a>
  );
}

function PaperCard({ id, open, onToggle, onFocus }) {
  const record = publicationRecords[id];
  const arc = ARC[id];
  const page = paperPath(id);
  const journal = doiUrl(record);
  const beats = beatsForPaper(id);
  return (
    <motion.article
      layout
      transition={LAYOUT}
      id={id}
      className="pb-card"
      data-open={open ? 'true' : 'false'}
      onMouseEnter={() => onFocus(id)}
      onMouseLeave={() => onFocus(null)}
    >
      <motion.button layout="position" type="button" className="pb-card__head" onClick={onToggle} aria-expanded={open}>
        <span className="pb-card__n">
          <Token t={token('paper', id)} size="m" anchor />
          <span className="pb-card__short">{arc.short}</span>
        </span>
        <span className="pb-card__journal">{record.journal}</span>
      </motion.button>
      <motion.h2 layout="position" className="pb-card__title">
        {record.title}
      </motion.h2>
      <motion.div layout="position">
        <Proof size="line" text={arc.lifted.text} />
      </motion.div>
      {open && (
        <motion.div
          className="pb-card__more"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="pb-card__byline">{shortAuthors(record)}</p>
          <dl className="pb-card__afc">
            <div><dt>Asked</dt><dd>{arc.asked}</dd></div>
            <div><dt>Found</dt><dd>{arc.found}</dd></div>
            <div><dt>Changed</dt><dd>{arc.changed}</dd></div>
          </dl>
          <nav className="pb-card__doors">
            {page && <Exit href={page} label="The paper’s page" />}
            {journal && <Exit href={journal} label={record.journal} direction="across" />}
            <PdfDoor id={id} />
            {beats.map((b) => (
              <Exit key={b.id} href={`/neoflix#${b.id}`} label={`The argument · ${b.name}`} token={token('beat', b.id)} />
            ))}
          </nav>
        </motion.div>
      )}
      <motion.button layout="position" type="button" className="pb-card__toggle" onClick={onToggle}>
        {open ? 'Close' : 'Asked, found, changed'}
      </motion.button>
    </motion.article>
  );
}

function Letter({ open, onToggle }) {
  const paragraphs = useMemo(() => {
    const md = sections.find((s) => s.id === 'preface')?.content || '';
    return md.split(/\n\s*\n+/).map((p) => renderMarkdown(p));
  }, []);
  const shown = open ? paragraphs : paragraphs.slice(0, 1);
  return (
    <motion.article layout transition={LAYOUT} id="preface" className="pb-letter" data-open={open ? 'true' : 'false'}>
      <motion.p layout="position" className="pb-letter__kicker">From Veerle</motion.p>
      <motion.div layout="position" className="pb-letter__body">
        {shown.map((html, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </motion.div>
      <motion.button layout="position" type="button" className="pb-card__toggle" onClick={onToggle}>
        {open ? 'Fold the letter' : 'Read the letter'}
      </motion.button>
    </motion.article>
  );
}

export default function PublicationsDesktop() {
  const { hash } = useLocation();
  const [open, setOpen] = useState(() => (SECTION_IDS.includes(hash.slice(1)) ? hash.slice(1) : null));
  const [focus, setFocus] = useState(null);
  const toggle = (id) => setOpen((o) => (o === id ? null : id));
  // A paper token carried here (from the index, a thread on /neoflix)
  // arrives as a hash: open that paper.
  useEffect(() => {
    if (publicationOrder.includes(hash.slice(1))) setOpen(hash.slice(1));
  }, [hash]);
  const lit = focus || (publicationOrder.includes(open) ? open : null);
  useLit(lit && token('paper', lit));

  return (
    <BoardPage tone="light" wide sectionIds={SECTION_IDS} title="Publications">
      <div className="pb">
        <header className="pb-intro">
          <h2 className="pb-intro__title">{ARC_INTRO.headline}</h2>
          <div className="pb-intro__body">
            {ARC_INTRO.body.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
          </div>
          {bundle && (
            <a className="hook-exit pb-intro__bundle" href={assetUrl(bundle.file)} download>
              <span>All six papers · ZIP, {bundle.size}</span>
              <span aria-hidden="true" className="hook-exit__arrow">↓</span>
            </a>
          )}
        </header>

        <LayoutGroup>
          <div className="pb-board">
            <div className="pb-col pb-col--letter" data-count="letter">
              <span className="pb-col__year">Before</span>
              <Letter open={open === 'preface'} onToggle={() => toggle('preface')} />
            </div>
            {YEARS.map((year) => {
              const ids = publicationOrder.filter((id) => publicationRecords[id].year === year);
              return (
                <div key={year} className="pb-col" data-count={ids.length}>
                  <span className="pb-col__year">{year}</span>
                  <div className="pb-col__cards">
                    {ids.map((id) => (
                      <PaperCard
                        key={id}
                        id={id}
                        open={open === id}
                        onToggle={() => toggle(id)}
                        onFocus={setFocus}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </BoardPage>
  );
}
