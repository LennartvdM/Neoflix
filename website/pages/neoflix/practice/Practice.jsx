// /neoflix's third act — "Record, Reflect, Refine" — and the bridges at
// the foot of each essay chapter. Where the first two acts argue, this
// one hands over: the film, the toolbox laid out as the route it is,
// the units already doing it on the world map, and the invitation that
// closes the toolbox itself. Everything shown is read from the toolbox's
// compiled manifest (./toolbox.js) or shared with the homepage.
import React, { useMemo } from 'react';
import useTransitionNavigate from '../../../lib/hooks/useTransitionNavigate';
import { renderMarkdown } from '../../../lib/utils/renderMarkdown';
import { SHOWCASE_FILM_SRC } from '../../../shared/showcaseFilm';
import WorldMapEmbed from '../../toolbox/blocks/WorldMapEmbed';
import {
  toolboxHref,
  toolboxPage,
  toolboxLevels,
  successStories,
  networkPage,
} from './toolbox';
import './practice.css';

// A toolbox link that slides into the toolbox like the navbar does,
// instead of reloading the page.
function ToolboxLink({ slug, className, children }) {
  const navigate = useTransitionNavigate();
  return (
    <a
      className={className}
      href={toolboxHref(slug)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(toolboxHref(slug));
      }}
    >
      {children}
    </a>
  );
}

/* ── Chapter bridge ──────────────────────────────────────────────────────
   The pages a chapter's prose links to, named for what they are. The
   inline links stay; this says plainly where the chapter leads. */
export function ToolboxBridge({ pages }) {
  if (!pages?.length) return null;
  return (
    <nav className="toolbox-bridge" aria-label="In the toolbox">
      <span className="toolbox-bridge__label">In the toolbox</span>
      <ul className="toolbox-bridge__list">
        {pages.map((page) => (
          <li key={page.slug}>
            <ToolboxLink slug={page.slug} className="toolbox-bridge__link">
              {page.title}
              <span aria-hidden="true" className="toolbox-bridge__arrow">→</span>
            </ToolboxLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ── The film ──────────────────────────────────────────────────────────── */
export function FilmBlock() {
  return (
    <div className="neoflix-film">
      <iframe
        title="Neoflix — showcase film"
        src={SHOWCASE_FILM_SRC}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        allowFullScreen
      />
    </div>
  );
}

/* ── The toolbox, as a route ───────────────────────────────────────────── */
export function ToolboxPath() {
  const levels = useMemo(toolboxLevels, []);
  return (
    <ol className="toolbox-path">
      {levels.map((level) => (
        <li key={level.number} className="toolbox-path__level">
          <span aria-hidden="true" className="toolbox-path__node" />
          <ToolboxLink slug={level.intro?.slug || ''} className="toolbox-path__head">
            <span className="toolbox-path__number">Level {level.number}</span>
            <span className="toolbox-path__name">{level.name}</span>
          </ToolboxLink>
          {level.intro?.excerpt && <p className="toolbox-path__excerpt">{level.intro.excerpt}</p>}
          <div className={`toolbox-path__groups${level.groups.some((g) => g.phase) ? ' toolbox-path__groups--phased' : ''}`}>
            {level.groups.map((group, i) => (
              <div key={group.phase?.slug || i} className="toolbox-path__group">
                {group.phase && (
                  <>
                    <ToolboxLink slug={group.phase.slug} className="toolbox-path__phase">
                      {group.phase.name}
                    </ToolboxLink>
                    {group.phase.excerpt && <p className="toolbox-path__phase-excerpt">{group.phase.excerpt}</p>}
                  </>
                )}
                <ul className="toolbox-path__chapters">
                  {group.chapters.map((chapter) => (
                    <li key={chapter.slug}>
                      <ToolboxLink slug={chapter.slug} className="toolbox-path__chapter">
                        {chapter.title}
                      </ToolboxLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Success stories ───────────────────────────────────────────────────── */
// The homepage's world map, bounded and paused on Leiden (where Neoflix
// started); a click sets it touring. Its pins lead to the same stories
// as the list beside it.
export function SuccessStories() {
  const { chapter, stories } = useMemo(successStories, []);
  return (
    <div className="success-stories">
      {chapter?.excerpt && <p className="success-stories__excerpt">{chapter.excerpt}</p>}
      <div className="success-stories__map">
        <WorldMapEmbed city="leiden" />
      </div>
      <ul className="success-stories__list">
        {stories.map((story) => (
          <li key={story.slug}>
            <ToolboxLink slug={story.slug} className="success-stories__story">
              <span>{story.title}</span>
              <span aria-hidden="true" className="toolbox-bridge__arrow">→</span>
            </ToolboxLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Sign-off ──────────────────────────────────────────────────────────── */
// The toolbox ends on an invitation to join the Neoflix network; so does
// the essay — then the people behind it (the existing contact copy).
export function SignOff({ section }) {
  const network = useMemo(networkPage, []);
  const quickStart = toolboxPage('welcome/quick-start');
  const html = useMemo(() => renderMarkdown(section?.content || ''), [section?.content]);
  return (
    <div className="signoff">
      <div className="signoff__actions">
        {network && (
          <ToolboxLink slug={network.slug} className="signoff__primary">
            {network.title.split(':').pop().trim()}
            <span aria-hidden="true">→</span>
          </ToolboxLink>
        )}
        {quickStart && (
          <ToolboxLink slug={quickStart.slug} className="signoff__secondary">
            Or start with the {quickStart.title.toLowerCase()}
          </ToolboxLink>
        )}
      </div>
      <div className="blog-body signoff__people" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
