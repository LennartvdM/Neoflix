/**
 * /publications on a laptop — the arc, as a still page on the board.
 *
 * The six papers as one line of work, in the order the questions were
 * asked (content blueprint, "/publications"). Each card is a paper page in
 * small: eyebrow, title as the door to its page, Asked / Found / Changed,
 * one lifted proof in the margin, and doors to the author PDF and the
 * journal. Still page: no choreography beyond the pinned orientation line
 * and the proofs settling once.
 *
 * Words: arc.js (what we say about each paper), records.js (the facts).
 * Section ids are the old anchors, so /publications#narrative still lands.
 *
 * Veerle's preface closes the page for now; the blueprint moves it to the
 * door of the toolbox (Start here) once that is rebuilt.
 */
import React, { useMemo } from 'react';
import BoardPage from '../../shared/board/BoardPage';
import { Block, Proof, Exit, Exits, Orientation } from '../../shared/board/hooks';
import useDownloadGuard from '../../lib/hooks/useDownloadGuard';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { renderMarkdown } from '../../lib/utils/renderMarkdown';
import { assetUrl } from '../../lib/utils/assetUrl';
import { beatsForPaper } from '../../shared/argument';
import { ARC, ARC_INTRO } from './arc';
import { publicationOrder, publicationRecords, paperPath, doiUrl, shortAuthors } from './records';
import { publicationPdfs, sections, bundle } from './content';
import './publications-board.css';

const SECTION_IDS = ['arc', ...publicationOrder, 'preface'];

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
      <span>{guard.cooling ? `Ready again in ${guard.secondsLeft}s` : `Author PDF · ${pdf.pages} pages, ${pdf.size}`}</span>
      <span aria-hidden="true" className="hook-exit__arrow">↓</span>
    </a>
  );
}

function PaperCard({ id, n }) {
  const navigate = useTransitionNavigate();
  const record = publicationRecords[id];
  const arc = ARC[id];
  const page = paperPath(id);
  const journal = doiUrl(record);
  const beats = beatsForPaper(id);
  return (
    <section id={id} className="board-section pub-card">
      <Orientation>Paper {n} of 6 · {record.year}</Orientation>
      <Block
        margin={
          <div className="pub-card__margin">
            <Proof size="panel" figure={arc.lifted.figure} text={arc.lifted.text} />
            <Exits>
              <PdfDoor id={id} />
              {journal && <Exit href={journal} label={record.journal} direction="across" />}
              {beats.map((b) => (
                <Exit key={b.id} href={`/neoflix#${b.id}`} label={`The argument · ${b.name}`} />
              ))}
            </Exits>
          </div>
        }
      >
        <p className="pub-card__eyebrow">{record.year} · {record.journal} · {arc.short}</p>
        <h2 className="pub-card__title">
          {page ? (
            <a href={page} onClick={(e) => { e.preventDefault(); navigate(page); }}>
              {record.title}
              <span aria-hidden="true" className="hook-exit__arrow"> →</span>
            </a>
          ) : (
            <a href={journal} target="_blank" rel="noopener noreferrer">
              {record.title}
              <span aria-hidden="true" className="hook-exit__arrow"> ↗</span>
            </a>
          )}
        </h2>
        <p className="pub-card__byline">{shortAuthors(record)}</p>
        <dl className="pub-card__afc">
          <div><dt>Asked</dt><dd>{arc.asked}</dd></div>
          <div><dt>Found</dt><dd>{arc.found}</dd></div>
          <div><dt>Changed</dt><dd>{arc.changed}</dd></div>
        </dl>
      </Block>
    </section>
  );
}

function Preface() {
  const html = useMemo(() => renderMarkdown(sections.find((s) => s.id === 'preface')?.content || ''), []);
  return (
    <section id="preface" className="board-section pub-preface">
      <Orientation>From Veerle</Orientation>
      <Block>
        <div className="pub-preface__letter" dangerouslySetInnerHTML={{ __html: html }} />
      </Block>
    </section>
  );
}

export default function PublicationsDesktop() {
  return (
    <BoardPage tone="light" sectionIds={SECTION_IDS} title="Publications">
      <section id="arc" className="board-section pub-intro">
        <Orientation>Six papers, 2022 to 2026</Orientation>
        <Block
          margin={
            bundle && (
              <Exits>
                <a className="hook-exit" href={assetUrl(bundle.file)} download>
                  <span>All six papers · ZIP, {bundle.size}</span>
                  <span aria-hidden="true" className="hook-exit__arrow">↓</span>
                </a>
              </Exits>
            )
          }
        >
          <h2 className="pub-intro__title">{ARC_INTRO.headline}</h2>
          {ARC_INTRO.body.map((p) => (
            <p key={p.slice(0, 20)} className="pub-intro__body">{p}</p>
          ))}
        </Block>
      </section>
      {publicationOrder.map((id, i) => (
        <PaperCard key={id} id={id} n={i + 1} />
      ))}
      <Preface />
    </BoardPage>
  );
}
