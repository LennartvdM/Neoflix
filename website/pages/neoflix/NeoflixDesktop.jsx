/**
 * /neoflix on a laptop — the argument, as a scroll page on the board.
 *
 * Six beats, one per clip, each with the same skeleton in the same order
 * (content blueprint, "/neoflix"):
 *
 *   orientation · claim · witness · proof · instrument · exits
 *
 * and nothing more. What varies is only what the content brings — the
 * size of the proof, whether an instrument hangs — and that variation is
 * the asymmetry. All words come from shared/argument.js; this file only
 * composes. After the beats, two still sections: the four units, and the
 * sign-off (which /contact lands on).
 */
import React, { useRef } from 'react';
import BoardPage from '../../shared/board/BoardPage';
import { Block, Claim, Proof, Witness, Exit, Exits, Orientation } from '../../shared/board/hooks';
import { INSTRUMENTS } from '../../shared/board/instruments';
import { useScrollProgress } from '../../shared/board/motion';
import { useFilm } from '../../shared/board/FilmDoor';
import { toolboxDoor, paperCite, paperDoor } from '../../shared/board/doors';
import WorldMapEmbed from '../toolbox/blocks/WorldMapEmbed';
import { BEATS } from '../../shared/argument';
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

const SECTION_IDS = [...BEATS.map((b) => b.id), 'units', 'contact'];

function Beat({ beat }) {
  const ref = useRef(null);
  useScrollProgress(ref, { rest: 0 });
  const openFilm = useFilm();
  const Instrument = beat.instrument && INSTRUMENTS[beat.instrument];
  // The narrowing frame *is* beat 3's witness (blueprint grid).
  const witnessIsInstrument = beat.instrument === 'narrowing-frame';
  const lines = beat.proofs.filter((p) => p.size === 'line');
  const big = beat.proofs.filter((p) => p.size !== 'line');
  const doors = [
    ...beat.exits.map((e) => toolboxDoor(e.slug)).filter(Boolean),
    ...beat.papers.map(paperDoor).filter(Boolean),
  ];

  return (
    <section id={beat.id} ref={ref} className="board-beat nf-beat" data-act={beat.act}>
      <Orientation number={beat.n} still={beat.clip.still}>{beat.name}</Orientation>

      <Block>
        <Claim universal={beat.claim} inPractice={beat.inPractice} />
      </Block>

      {!witnessIsInstrument && (
        <Block
          gap="panel"
          margin={lines.length > 0 && (
            <div className="nf-beat__margin-proofs">
              {lines.map((p) => (
                <Proof key={p.text} size="line" figure={p.figure} text={p.text} cite={paperCite(p.paper)} />
              ))}
            </div>
          )}
        >
          <Witness clip={beat.clip} caption={beat.witness?.caption} film={beat.witness?.film} />
        </Block>
      )}

      {witnessIsInstrument && Instrument && (
        <Block wide gap="panel">
          <Instrument clip={beat.clip} />
        </Block>
      )}

      {(big.length > 0 || (witnessIsInstrument && lines.length > 0)) && (
        <Block
          gap="panel"
          margin={witnessIsInstrument && lines.length > 0 && lines.map((p) => (
            <Proof key={p.text} size="line" figure={p.figure} text={p.text} cite={paperCite(p.paper)} />
          ))}
        >
          <div className="nf-beat__proofs">
            {big.map((p) => (
              <Proof
                key={p.text}
                size={p.size}
                figure={p.figure}
                text={p.text}
                breakdown={p.breakdown}
                cite={paperCite(p.paper)}
                clip={p.size === 'screen' ? beat.clip : undefined}
              />
            ))}
          </div>
        </Block>
      )}

      {Instrument && !witnessIsInstrument && (
        <Block wide gap="panel">
          <Instrument clip={beat.clip} />
        </Block>
      )}

      <Block gap="panel">
        <Exits>
          {beat.film && openFilm && (
            <Exit label="Watch the session · 6:44" onOpen={() => openFilm(beat.witness?.film || 0)} />
          )}
          {doors.map((d) => (
            <Exit key={d.href} href={d.href} label={d.label} direction={d.direction} />
          ))}
        </Exits>
      </Block>
    </section>
  );
}

function Units() {
  const doors = UNITS.map((u) => ({ ...u, door: toolboxDoor(u.slug) }));
  return (
    <section id="units" className="board-section nf-units">
      <Orientation>Four units that record</Orientation>
      <Block>
        <h2 className="nf-section-title">Four units that record.</h2>
      </Block>
      <Block wide gap="panel">
        <div className="nf-units__map">
          <WorldMapEmbed city="leiden" />
        </div>
      </Block>
      <Block wide>
        <ul className="nf-units__list">
          {doors.map((u) => (
            <li key={u.city}>
              <span className="nf-units__city">{u.city}<span>, {u.place}</span></span>
              <span className="nf-units__line">{u.line}</span>
              {u.door && <Exit href={u.door.href} label="The unit’s page" />}
            </li>
          ))}
        </ul>
      </Block>
    </section>
  );
}

function SignOff() {
  const quickStart = toolboxDoor('welcome/quick-start');
  return (
    <section id="contact" className="board-section nf-signoff">
      <Orientation>Contact</Orientation>
      <Block
        margin={
          <p>
            Neoflix was developed at the Department of Neonatology, Leiden University Medical Center,
            by Veerle Heesters with Arjan te Pas and Ruben Witlox. Supported by the KNAW Van Walree Fund.
          </p>
        }
      >
        <h2 className="nf-section-title">Questions about starting video review on your unit?</h2>
        <a className="nf-signoff__mail" href="mailto:info@neoflix.care">info@neoflix.care</a>
      </Block>
      {quickStart && (
        <Block gap="panel">
          <Exits>
            <Exit href={quickStart.href} label="Run your first session · Toolbox quick start" />
          </Exits>
        </Block>
      )}
    </section>
  );
}

export default function NeoflixDesktop({ scrollTo }) {
  return (
    <BoardPage tone="dark" sectionIds={SECTION_IDS} scrollTo={scrollTo} title="How Leiden learned to watch itself work">
      {BEATS.map((beat) => (
        <Beat key={beat.id} beat={beat} />
      ))}
      <Units />
      <SignOff />
    </BoardPage>
  );
}
