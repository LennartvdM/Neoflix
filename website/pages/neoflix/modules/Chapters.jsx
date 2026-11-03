// /neoflix's six essay chapters, each composed for what it says instead
// of poured into one template. The prose is content.js (shared with the
// phone page); the phrases these modules lift out of it — the cast, the
// pull quotes, the lists — are matched against that prose (primitives:
// sentenceFrom / phrasesIn), so rewording a chapter quietly drops a lifted
// phrase rather than leaving a stale one on the page.
import React from 'react';
import { ToolboxBridge } from '../practice/Practice';
import { toolboxLinksIn } from '../practice/toolbox';
import {
  paragraphsOf,
  sentenceFrom,
  phrasesIn,
  Prose,
  Kicker,
  Lede,
  PullQuote,
  Clip,
} from './primitives';
import './modules.css';

function Bridge({ section, tone }) {
  const pages = toolboxLinksIn(section.content);
  if (!pages.length) return null;
  return (
    <div className={`nf-bridge${tone ? ` nf-bridge--${tone}` : ''}`}>
      <ToolboxBridge pages={pages} />
    </div>
  );
}

/* I.1 — "The clock". Urgency: the statement straight on the footage, the
   clip at cinema width, the prose on a sheet laid over its lower edge. */
export function TimeSensitive({ section, lede, TitleTag }) {
  const [first, ...rest] = paragraphsOf(section);
  return (
    <div className="nf-clock">
      <header className="nf-on-footage">
        <Kicker as={TitleTag} tone="light">{section.title}</Kicker>
        <Lede tone="light" size="xl">{lede}</Lede>
      </header>
      <Clip src={section.video} className="nf-clock__clip" ratio="21 / 9" />
      <div className="nf-sheet nf-clock__sheet">
        <Prose paragraphs={[first]} className="nf-prose--intro" />
        <Prose paragraphs={rest} className="nf-prose--two-col" />
        <Bridge section={section} />
      </div>
    </div>
  );
}

/* I.2 — "Ensemble". Coordination: the roles the chapter names, as a cast
   whose markers pulse one after another — a team keeping time. */
const CAST = [
  { label: 'Nurses' },
  { label: 'Physicians' },
  { label: 'Technicians' },
  { label: 'Support staff' },
  { label: 'Lab technicians' },
  { label: 'Pharmacists' },
  { label: 'Administrators' },
];
export function LikeADance({ section, lede, TitleTag }) {
  const cast = phrasesIn(section, CAST);
  return (
    <div className="nf-sheet nf-ensemble">
      <div className="nf-ensemble__aside">
        <Kicker as={TitleTag}>{section.title}</Kicker>
        <Lede>{lede}</Lede>
        {cast.length > 0 && (
          <ul className="nf-ensemble__cast" aria-label="The team">
            {cast.map((role, i) => (
              <li key={role.label} style={{ '--i': i, '--n': cast.length }}>
                <span aria-hidden="true" className="nf-ensemble__beat" />
                {role.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="nf-ensemble__main">
        <Clip src={section.video} />
        <Prose paragraphs={paragraphsOf(section)} />
        <Bridge section={section} />
      </div>
    </div>
  );
}

/* I.3 — "Tunnel vision". The turn of the argument: a dark panel, the clip's
   frame closing in as it comes into view, and the chapter's sharpest
   sentence held up on its own. */
export function TheCost({ section, lede, TitleTag }) {
  const quote = sentenceFrom(section, 'Seemingly minor discrepancies');
  return (
    <div className="nf-dark nf-tunnel">
      <Clip src={section.video} className="nf-tunnel__clip" ratio="16 / 9" />
      <header className="nf-tunnel__head">
        <Kicker as={TitleTag} tone="light">{section.title}</Kicker>
        <Lede tone="light" size="xl">{lede}</Lede>
      </header>
      <PullQuote tone="light">{quote}</PullQuote>
      <Prose paragraphs={paragraphsOf(section)} className="nf-prose--light nf-prose--two-col" />
      <Bridge section={section} tone="dark" />
    </div>
  );
}

/* II.1 — "Quiet". Self-review: one narrow column and room around it; the
   clip set aside with the chapter's own line as a margin note. */
export function Sharpening({ section, lede, TitleTag }) {
  const note = sentenceFrom(section, 'Self-reflection allows');
  const paragraphs = paragraphsOf(section);
  return (
    <div className="nf-sheet nf-quiet">
      <div className="nf-quiet__column">
        <Kicker as={TitleTag}>{section.title}</Kicker>
        <Lede>{lede}</Lede>
        <Prose paragraphs={paragraphs.slice(0, 1)} />
      </div>
      <figure className="nf-quiet__figure">
        <Clip src={section.video} />
        {note && <figcaption className="nf-quiet__note">{note}</figcaption>}
      </figure>
      <div className="nf-quiet__column">
        <Prose paragraphs={paragraphs.slice(1)} />
        <Bridge section={section} />
      </div>
    </div>
  );
}

/* II.2 — "The debrief". What a team looks for in the footage, then what it
   gets out of doing so — both as the chapter lists them. */
const LOOKS_FOR = [
  { label: 'Successful strategies' },
  { label: 'Areas for optimization' },
  { label: 'Breakdowns in communication or workflow' },
];
const LEADS_TO = [
  { label: 'Improved patient outcomes' },
  { label: 'Optimized team efficiency' },
  { label: 'Stronger professional relationships' },
];
export function TeamDynamics({ section, lede, TitleTag }) {
  const [first, ...rest] = paragraphsOf(section);
  const looksFor = phrasesIn(section, LOOKS_FOR);
  const leadsTo = phrasesIn(section, LEADS_TO);
  return (
    <div className="nf-sheet nf-debrief">
      <header className="nf-debrief__head">
        <Kicker as={TitleTag}>{section.title}</Kicker>
        <Lede>{lede}</Lede>
      </header>
      <div className="nf-debrief__review">
        <Clip src={section.video} />
        <div>
          <Prose paragraphs={[first]} />
          {looksFor.length > 0 && (
            <ul className="nf-debrief__looks" aria-label="What the team looks for">
              {looksFor.map((item) => <li key={item.label}>{item.label}</li>)}
            </ul>
          )}
        </div>
      </div>
      <Prose paragraphs={rest} className="nf-prose--two-col" />
      {leadsTo.length > 0 && (
        <ul className="nf-debrief__outcomes" aria-label="What it leads to">
          {leadsTo.map((item) => <li key={item.label}>{item.label}</li>)}
        </ul>
      )}
      <Bridge section={section} />
    </div>
  );
}

/* II.3 — "Shared ground". What each member comes away with, numbered,
   beside the clip; the prose underneath. */
const GAINS = [
  { label: 'Clarity on their responsibilities' },
  { label: 'Effective communication strategies' },
  { label: 'Contingency plans for complex scenarios' },
];
export function Perspectives({ section, lede, TitleTag }) {
  const gains = phrasesIn(section, GAINS);
  return (
    <div className="nf-sheet nf-shared">
      <div className="nf-shared__top">
        <div>
          <Kicker as={TitleTag}>{section.title}</Kicker>
          <Lede>{lede}</Lede>
          {gains.length > 0 && (
            <ol className="nf-shared__gains" aria-label="What each member gains">
              {gains.map((g) => <li key={g.label}>{g.label}</li>)}
            </ol>
          )}
        </div>
        <Clip src={section.video} ratio="4 / 5" className="nf-shared__clip" />
      </div>
      <Prose paragraphs={paragraphsOf(section)} className="nf-prose--two-col" />
      <Bridge section={section} />
    </div>
  );
}
