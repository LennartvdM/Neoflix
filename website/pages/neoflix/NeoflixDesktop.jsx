/**
 * /neoflix on a laptop — the argument as a board, not a column of slides.
 *
 * The content blueprint's two spines, laid out as the two axes they are:
 *
 *   rows      the argument — six beats, one per clip, read downward
 *   columns   the loop — Before you record · Record · Reflect · Refine ·
 *             Keep going; a beat's toolbox doors hang as pegs in the
 *             column of the part they lead into
 *   threads   the six papers, running down the far right; a beat that
 *             cites a paper puts a dot on its thread
 *
 * Inside its row, a beat's modules (claim, clip, findings) are sized by
 * their own weight and packed densely, so no two rows have the same shape
 * — the asymmetry comes from the content, never from per-row design.
 * Empty cells stay empty: a beat that leads nowhere in "Record" leaves
 * that hole open on the board.
 *
 * A beat opens in place (its row grows, the board reflows around it) to
 * show its instrument, the clip with its film moment, and the full
 * breakdown. The backdrop follows whichever beat you're looking at.
 *
 * All words come from shared/argument.js; this file only composes.
 */
import React, { useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import BoardPage from '../../shared/board/BoardPage';
import { Claim, Proof, Witness, Exit } from '../../shared/board/hooks';
import { INSTRUMENTS } from '../../shared/board/instruments';
import { useFilm } from '../../shared/board/FilmDoor';
import { toolboxDoor, paperCite, paperHref } from '../../shared/board/doors';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import WorldMapEmbed from '../toolbox/blocks/WorldMapEmbed';
import { BEATS, LOOP, PAPERS, loopPartOf } from '../../shared/argument';
import { ARC } from '../publications/arc';
import './neoflix-board.css';

const UNITS = [
  {
    city: 'Leiden',
    place: 'the Netherlands',
    slug: 'level-1-fundamentals/4.-learning-from-success-stories/nicu-in-leiden-the-netherlands',
    line: 'Two fixed cameras at birth since 2009; a wearable camera for intubations, surfactant and sterile procedures.',
  },
  {
    city: 'Vienna',
    place: 'Austria',
    slug: 'level-1-fundamentals/4.-learning-from-success-stories/nicu-in-vienna-austria',
    line: 'Fixed cameras and wearable devices, in the delivery room and on the unit.',
  },
  {
    city: 'Philadelphia',
    place: 'USA',
    slug: 'level-1-fundamentals/4.-learning-from-success-stories/nicu-in-philadelphia-pennsylvania-usa',
    line: 'Dedicated resuscitation rooms: a bird’s-eye view of the bed, a wide angle and the monitor feed.',
  },
  {
    city: 'Melbourne',
    place: 'Australia',
    slug: 'level-1-fundamentals/4.-learning-from-success-stories/nicu-in-melbourne-australia',
    line: 'Fixed cameras at birth: the infant and the hands, voices audible.',
  },
];

const PAPER_IDS = Object.keys(PAPERS);
const SECTION_IDS = [...BEATS.map((b) => b.id), 'units', 'contact'];
const LAYOUT = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 };

// Module widths on the beat's 8-column strip, from their weight. The
// claim takes what its length needs and the clip takes the rest of that
// line; the findings share the next line in proportion to their weight
// (a panel weighs twice a line). So a beat with one finding and a beat
// with three come out different shapes — from the content, not a layout.
const STRIP = 8;
function spans(beat, open) {
  const claim = open ? 3 : beat.claim.length > 75 ? 5 : 4;
  const weights = beat.proofs.map((p) => (p.size === 'line' ? 1 : 2));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let left = STRIP;
  const proofs = weights.map((w, i) => {
    const n = i === weights.length - 1 ? left : Math.max(2, Math.round((w / total) * STRIP));
    left -= n;
    return n;
  });
  return { claim, clip: STRIP - claim, proofs };
}

// "11.3 Tasks of the chair" → "Tasks of the chair": the toolbox's own
// numbering is stale (see the blueprint's outline); the column says where.
const pegTitle = (label) => label.replace(/^Toolbox · /, '').replace(/^[\d.]+\s+/, '');

function Peg({ door }) {
  const navigate = useTransitionNavigate();
  return (
    <a
      className="ab-peg"
      href={door.href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(door.href);
      }}
    >
      <span className="ab-peg__head" aria-hidden="true" />
      {pegTitle(door.label)}
    </a>
  );
}

function Threads({ papers }) {
  const navigate = useTransitionNavigate();
  return (
    <div className="ab-threads">
      {PAPER_IDS.map((id) => {
        const cited = papers?.includes(id);
        const href = paperHref(id);
        return (
          <span key={id} className="ab-thread" data-cited={cited ? 'true' : 'false'}>
            {cited && (
              <a
                className="ab-thread__dot"
                href={href}
                title={`Paper ${PAPERS[id].n} · ${ARC[id]?.short}`}
                aria-label={`Paper ${PAPERS[id].n}: ${ARC[id]?.short}`}
                {...(href?.startsWith('/')
                  ? { onClick: (e) => { e.preventDefault(); navigate(href); } }
                  : { target: '_blank', rel: 'noopener noreferrer' })}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

function Beat({ beat, open, onToggle, onFocus }) {
  const openFilm = useFilm();
  const Instrument = beat.instrument && INSTRUMENTS[beat.instrument];
  const sz = spans(beat, open);
  const pegsByPart = {};
  beat.exits.forEach((e) => {
    const part = loopPartOf(e.plan);
    const door = toolboxDoor(e.slug);
    if (part && door) (pegsByPart[part] = pegsByPart[part] || []).push(door);
  });

  return (
    <motion.section
      layout="position"
      transition={LAYOUT}
      id={beat.id}
      className="ab-row"
      data-open={open ? 'true' : 'false'}
      onMouseEnter={() => onFocus(beat.id)}
    >
      <div className="ab-label">
        <span className="ab-label__n">{String(beat.n).padStart(2, '0')}</span>
        <span className="ab-label__name">{beat.name}</span>
        <button type="button" className="ab-label__toggle" onClick={onToggle} aria-expanded={open}>
          {open ? 'Close' : 'Open'}
        </button>
      </div>

      <div className="ab-arg">
        <motion.div layout transition={LAYOUT} className="ab-tile ab-tile--claim" style={{ gridColumn: `span ${sz.claim}` }}>
          <Claim universal={beat.claim} inPractice={beat.inPractice} />
        </motion.div>

        <motion.div
          layout
          transition={LAYOUT}
          className="ab-tile ab-tile--clip"
          style={{ gridColumn: `span ${sz.clip}` }}
          onClick={open ? undefined : onToggle}
        >
          <Witness
            clip={beat.clip}
            caption={open ? beat.witness?.caption : undefined}
            film={open ? beat.witness?.film : undefined}
          />
        </motion.div>

        {beat.proofs.map((p, i) => (
          <motion.div key={p.text} layout transition={LAYOUT} className="ab-tile ab-tile--proof" style={{ gridColumn: `span ${sz.proofs[i]}` }}>
            <Proof
              size={p.size === 'line' ? 'line' : 'panel'}
              figure={p.figure}
              text={p.text}
              breakdown={open ? p.breakdown : undefined}
              cite={paperCite(p.paper)}
            />
          </motion.div>
        ))}

        {open && beat.film && openFilm && (
          <motion.div layout transition={LAYOUT} className="ab-tile ab-tile--door" style={{ gridColumn: 'span 8' }}>
            <Exit label="Watch the session · 6:44" onOpen={() => openFilm(beat.witness?.film || 0)} />
          </motion.div>
        )}
      </div>

      {/* Opened, the beat's instrument spreads across the whole board —
          over the loop's empty holes — on a line of its own. */}
      {open && Instrument && (
        <motion.div
          layout
          transition={LAYOUT}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ab-instrument"
        >
          <Instrument clip={beat.clip} />
        </motion.div>
      )}

      {LOOP.map((part, i) => (
        <div key={part.id} className="ab-loop" style={{ gridColumn: `loop${i + 1}` }} data-empty={pegsByPart[part.id] ? 'false' : 'true'}>
          {(pegsByPart[part.id] || []).map((door) => (
            <Peg key={door.href} door={door} />
          ))}
        </div>
      ))}

      <Threads papers={beat.papers} />
    </motion.section>
  );
}

function Units() {
  return (
    <motion.section layout="position" transition={LAYOUT} id="units" className="ab-row ab-row--band">
      <div className="ab-label">
        <span className="ab-label__name">Units</span>
      </div>
      <div className="ab-arg">
        <div className="ab-tile" style={{ gridColumn: 'span 8' }}>
          <h2 className="ab-band-title">Four units that record.</h2>
          <div className="ab-map">
            <WorldMapEmbed city="leiden" />
          </div>
        </div>
      </div>
      <ul className="ab-units">
        {UNITS.map((u) => {
          const door = toolboxDoor(u.slug);
          return (
            <li key={u.city}>
              <span className="ab-units__city">{u.city}<span>, {u.place}</span></span>
              <span className="ab-units__line">{u.line}</span>
              {door && <Peg door={{ href: door.href, label: 'The unit’s page' }} />}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

function SignOff() {
  const quickStart = toolboxDoor('welcome/quick-start');
  return (
    <motion.section layout="position" transition={LAYOUT} id="contact" className="ab-row ab-row--band">
      <div className="ab-label">
        <span className="ab-label__name">Contact</span>
      </div>
      <div className="ab-arg">
        <div className="ab-tile" style={{ gridColumn: 'span 8' }}>
          <h2 className="ab-band-title">Questions about starting video review on your unit?</h2>
          <a className="ab-mail" href="mailto:info@neoflix.care">info@neoflix.care</a>
        </div>
      </div>
      <div className="ab-signoff-side">
        <p>
          Neoflix was developed at the Department of Neonatology, Leiden University Medical Center,
          by Veerle Heesters with Arjan te Pas and Ruben Witlox. Supported by the KNAW Van Walree Fund.
        </p>
        {quickStart && <Peg door={{ href: quickStart.href, label: 'Run your first session' }} />}
      </div>
    </motion.section>
  );
}

export default function NeoflixDesktop({ scrollTo }) {
  const initial = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
  const [open, setOpen] = useState(BEATS.some((b) => b.id === initial) ? initial : null);
  const [focus, setFocus] = useState(null);

  return (
    <BoardPage
      tone="dark"
      wide
      sectionIds={SECTION_IDS}
      scrollTo={scrollTo}
      activeId={open || focus}
      title="How Leiden learned to watch itself work"
    >
      <div className="ab">
        <div className="ab-intro">
          <p className="ab-intro__kicker">Neoflix · the argument</p>
          <p className="ab-intro__title">How a neonatal intensive care unit learned to watch itself work, and what it changed.</p>
        </div>

        <div className="ab-head" aria-hidden="true">
          <span className="ab-head__arg">Six beats</span>
          {LOOP.map((part, i) => (
            <span key={part.id} className="ab-head__loop" style={{ gridColumn: `loop${i + 1}` }}>{part.name}</span>
          ))}
          <span className="ab-head__papers">
            {PAPER_IDS.map((id) => (
              <span key={id}>{PAPERS[id].n}</span>
            ))}
          </span>
        </div>

        <LayoutGroup>
          {BEATS.map((beat) => (
            <Beat
              key={beat.id}
              beat={beat}
              open={open === beat.id}
              onToggle={() => setOpen((o) => (o === beat.id ? null : beat.id))}
              onFocus={setFocus}
            />
          ))}
          <Units />
          <SignOff />
        </LayoutGroup>
      </div>
    </BoardPage>
  );
}
