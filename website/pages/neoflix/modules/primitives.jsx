// Building blocks for /neoflix's bespoke chapter modules. Each module
// composes these differently; none of them knows the page layout around
// it (that's BlogPage: index, lane, scroll spy, backdrop).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import IllustrationClip from '../../../shared/IllustrationClip';
import { renderMarkdown } from '../../../lib/utils/renderMarkdown';
import { stillFor } from '../../../lib/utils/reducedMedia';
import useTransitionNavigate from '../../../lib/hooks/useTransitionNavigate';

/** A chapter's prose, split into its paragraphs (markdown strings). */
export function paragraphsOf(section) {
  return (section?.content || '')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Markdown → plain text: links and emphasis reduced to their words. */
function plain(md) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

/**
 * The sentence of a chapter that begins with `opening`, as plain text — or
 * null if the chapter no longer contains it. Modules pull quotes and lists
 * out of the prose this way, so a rewording drops the quote instead of
 * leaving stale copy on the page.
 */
export function sentenceFrom(section, opening) {
  const text = plain(section?.content || '').replace(/\s+/g, ' ');
  const i = text.indexOf(opening);
  if (i < 0) return null;
  const rest = text.slice(i);
  const end = rest.search(/[.!?](\s|$)/);
  return end < 0 ? rest : rest.slice(0, end + 1);
}

/** The subset of `phrases` that the chapter's prose actually contains. */
export function phrasesIn(section, phrases) {
  const text = plain(section?.content || '').toLowerCase();
  return phrases.filter((p) => text.includes((p.match || p.label).toLowerCase()));
}

/** Rendered paragraphs. Internal links slide like the rest of the site. */
export function Prose({ paragraphs, className = '' }) {
  const navigate = useTransitionNavigate();
  const html = useMemo(() => paragraphs.map((p) => renderMarkdown(p)).join(''), [paragraphs]);
  if (!paragraphs.length) return null;
  return (
    <div
      className={`nf-prose ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        const link = e.target.closest('a[data-internal]');
        if (!link) return;
        e.preventDefault();
        navigate(link.getAttribute('href'));
      }}
    />
  );
}

export function Kicker({ as: Tag = 'h3', tone, children }) {
  return <Tag className={`nf-kicker${tone ? ` nf-kicker--${tone}` : ''}`}>{children}</Tag>;
}

export function Lede({ tone, size, children }) {
  if (!children) return null;
  return (
    <p className={`nf-lede${tone ? ` nf-lede--${tone}` : ''}${size ? ` nf-lede--${size}` : ''}`}>
      {children}
    </p>
  );
}

export function PullQuote({ tone, children }) {
  if (!children) return null;
  return (
    <blockquote className={`nf-quote${tone ? ` nf-quote--${tone}` : ''}`}>
      <p>{children}</p>
    </blockquote>
  );
}

/**
 * A chapter's clip: plays only while on screen, shows its still until a
 * frame decodes. `inView` is also handed to `children` as a data attribute
 * on the frame, for modules that animate the frame itself.
 */
export function Clip({ src, className = '', ratio = '3 / 2' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!src) return null;
  return (
    <div
      ref={ref}
      className={`nf-clip ${className}`.trim()}
      data-in-view={inView ? 'true' : 'false'}
      style={{ aspectRatio: ratio }}
    >
      <IllustrationClip
        src={src}
        poster={stillFor(src) || undefined}
        play={inView}
        preload="metadata"
        className="nf-clip__media"
      />
    </div>
  );
}
