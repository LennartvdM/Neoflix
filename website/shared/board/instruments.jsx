/**
 * Instruments — the one hook whose motion is made per instance (blueprint,
 * "Instruments"). They are tiles on the board, scrubbed by moving the
 * pointer across them (or the arrow keys): nothing plays on its own and
 * letting go leaves it where it is. Each is complete at its rest state.
 *
 * These are v1 SKETCHES: cheap, sharp, built from the beat's own clip, and
 * meant to be replaced by the extravagant versions later without touching
 * the beat around them (same component name, same props).
 */
import React, { useMemo, useRef, useState } from 'react';
import IllustrationClip from '../IllustrationClip';
import { Instrument } from './hooks';
import { useInView, usePointerProgress } from './motion';
import './instruments.css';

/* ── The narrowing frame · beat 3, focus ──────────────────────────────────
   The focus clip fills the view; scrolling narrows the frame to the hands
   while, outside it, the clock and the trace keep running — and fade from
   view. At the foot: what did the clock say? */
export function NarrowingFrame({ clip }) {
  const ref = useRef(null);
  const clockRef = useRef(null);
  const onScreen = useInView(ref, { threshold: 0.05 });
  usePointerProgress(ref, {
    rest: 0,
    onProgress: (p) => {
      if (!clockRef.current) return;
      // Two minutes of procedure pass over the length of the scroll.
      const s = Math.round(54 + p * 128);
      clockRef.current.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    },
  });
  return (
    <Instrument label="The narrowing frame">
      <div ref={ref} className="inst-narrow" tabIndex={0} aria-label="Move across to narrow the frame">
        <div className="inst-narrow__stage">
          <span className="inst-hint" aria-hidden="true">Move across ⟷</span>
          <div className="inst-narrow__periphery" aria-hidden="true">
            <span className="inst-narrow__clock" ref={clockRef}>00:54</span>
            <svg className="inst-narrow__trace" viewBox="0 0 400 60" preserveAspectRatio="none">
              <path d="M0 30 H60 L70 10 L80 50 L90 30 H160 L170 8 L180 52 L190 30 H260 L270 12 L280 48 L290 30 H360 L370 9 L380 51 L390 30 H400" />
            </svg>
          </div>
          <div className="inst-narrow__frame">
            <IllustrationClip src={clip.video} poster={clip.still} play={onScreen} preload="metadata" className="inst-narrow__media" />
          </div>
          <p className="inst-narrow__question">What did the clock say?</p>
        </div>
      </div>
    </Instrument>
  );
}

/* ── Twenty rows · beat 4, skills ─────────────────────────────────────────
   The same procedure twenty times, as blocks of different lengths in
   different orders — the guideline a single row on top. Moving across lifts
   the rows that differ away from it. Illustrative, and labelled so: the
   recordings weren't annotated with step timings (blueprint open question). */
const STEPS = 7;
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
export function TwentyRows({ clip }) {
  const ref = useRef(null);
  usePointerProgress(ref, { rest: 1 });
  const rows = useMemo(() => {
    const rand = rng(84120);
    return Array.from({ length: 20 }, (_, r) => {
      // 14 of 20 rows (70% — as 84 of 120 findings were) differ.
      const differs = r % 10 !== 3 && r % 10 !== 7 && r !== 0 && r !== 19 ? true : false;
      const order = Array.from({ length: STEPS }, (_, i) => i);
      if (differs) {
        for (let i = order.length - 1; i > 0; i--) {
          if (rand() < 0.45) {
            const j = Math.floor(rand() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
          }
        }
      }
      return {
        differs,
        lift: differs ? 0.15 + rand() * 0.85 : 0,
        blocks: order.map((step) => ({ step, w: differs ? 0.6 + rand() * 1.1 : 1 })),
      };
    });
  }, []);
  return (
    <Instrument label="Twenty rows">
      <div ref={ref} className="inst-rows" tabIndex={0} aria-label="Move across to lift the rows that differ" style={{ '--still': `url(${clip.still})` }}>
        <div className="inst-rows__stage">
          <span className="inst-hint" aria-hidden="true">Move across ⟷</span>
          <div className="inst-rows__row inst-rows__row--guideline">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className="inst-rows__block" style={{ flexGrow: 1 }} />
            ))}
            <span className="inst-rows__tag">The guideline</span>
          </div>
          {rows.map((row, r) => (
            <div
              key={r}
              className={`inst-rows__row${row.differs ? ' inst-rows__row--differs' : ''}`}
              style={{ '--lift': row.lift }}
            >
              {row.blocks.map((b, i) => (
                <span
                  key={i}
                  className="inst-rows__block"
                  style={{ flexGrow: b.w, '--step': b.step }}
                />
              ))}
            </div>
          ))}
          <p className="inst-rows__note">Illustrative: one procedure, twenty times. 84 of the 120 findings were differences like these.</p>
        </div>
      </div>
    </Instrument>
  );
}

/* ── The retyped sentence · beat 5, team ──────────────────────────────────
   A sentence from a session is struck through and retyped as a question;
   the rules of the room settle beneath. Over the team clip. */
const BEFORE = 'Clearly the saturations were already at 60%.';
const AFTER = 'I’m used to stopping earlier. What made you continue?';
const RULES = [
  'Talk about what you see, not who you see.',
  'Be specific: “at 3:12 I noticed…”',
  'Say what went well as readily as what didn’t.',
  'What is said in the room stays in the room.',
];
export function RetypedSentence({ clip }) {
  const ref = useRef(null);
  const onScreen = useInView(ref, { threshold: 0.05 });
  const [typed, setTyped] = useState(AFTER.length);
  usePointerProgress(ref, {
    rest: 1,
    onProgress: (p) => {
      const t = Math.min(1, Math.max(0, (p - 0.42) / 0.38));
      setTyped(Math.round(t * AFTER.length));
    },
  });
  return (
    <Instrument label="The retyped sentence">
      <div ref={ref} className="inst-retype" tabIndex={0} aria-label="Move across to retype the sentence">
        <div className="inst-retype__stage">
          <span className="inst-hint" aria-hidden="true">Move across ⟷</span>
          <IllustrationClip src={clip.blur || clip.video} play={onScreen} preload="metadata" className="inst-retype__bg" />
          <div className="inst-retype__copy">
            <p className="inst-retype__before">
              <span>{BEFORE}</span>
            </p>
            <p className="inst-retype__after" aria-label={AFTER}>
              <span aria-hidden="true">{AFTER.slice(0, typed)}</span>
              <span className="inst-retype__caret" aria-hidden="true" />
            </p>
            <ol className="inst-retype__rules">
              {RULES.map((rule, i) => (
                <li key={rule} style={{ '--i': i }}>{rule}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Instrument>
  );
}

export const INSTRUMENTS = {
  'narrowing-frame': NarrowingFrame,
  'twenty-rows': TwentyRows,
  'retyped-sentence': RetypedSentence,
};
