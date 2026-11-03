// /neoflix Act III as modules: each part on the surface that suits it
// rather than one reading card — the film bare on the footage, the
// toolbox route on a dark panel, the map large, the sign-off as a
// closing statement. The parts themselves are ../practice/Practice.jsx.
import React from 'react';
import { FilmBlock, ToolboxPath, SuccessStories, SignOff } from '../practice/Practice';
import { Kicker, Lede } from './primitives';
import './modules.css';

export function FilmModule({ section, lede, TitleTag }) {
  return (
    <div className="nf-film">
      <header className="nf-on-footage">
        <Kicker as={TitleTag} tone="light">{section.title}</Kicker>
        <Lede tone="light" size="xl">{lede}</Lede>
      </header>
      <FilmBlock />
    </div>
  );
}

export function ToolboxModule({ section, lede, TitleTag }) {
  return (
    <div className="nf-dark nf-route">
      <header className="nf-route__head">
        <Kicker as={TitleTag} tone="light">{section.title}</Kicker>
        <Lede tone="light">{lede}</Lede>
      </header>
      <ToolboxPath />
    </div>
  );
}

export function StoriesModule({ section, lede, TitleTag }) {
  return (
    <div className="nf-stories">
      <header className="nf-on-footage">
        <Kicker as={TitleTag} tone="light">{section.title}</Kicker>
        <Lede tone="light" size="xl">{lede}</Lede>
      </header>
      <SuccessStories />
    </div>
  );
}

export function SignOffModule({ section, lede, TitleTag }) {
  return (
    <div className="nf-close">
      <header className="nf-on-footage nf-close__head">
        <Kicker as={TitleTag} tone="light">{section.title}</Kicker>
        <Lede tone="light" size="xl">{lede}</Lede>
      </header>
      <div className="nf-sheet">
        <SignOff section={section} />
      </div>
    </div>
  );
}
