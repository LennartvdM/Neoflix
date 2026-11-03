import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useScrollSpy from '../lib/hooks/useScrollSpy';
import useTransitionNavigate from '../lib/hooks/useTransitionNavigate';
import { useTransitionState } from './motion/TransitionContext';
import { SLIDE_EASE } from './motion/RouteSlider';
import { renderMarkdown } from '../lib/utils/renderMarkdown';
import { useBackdropTarget, useBackdropBands, blogBandsId } from './backdrop/useBackdrop';
import { BLOG_DECK, blogIdxForSection } from './backdrop/decks';
import IllustrationClip from './IllustrationClip';
import { stillFor } from '../lib/utils/reducedMedia';
import StoryHeadline from '../pages/home/story/StoryHeadline';
import PublicationAttachment from '../pages/publications/PublicationAttachment';
import PublicationBundle from '../pages/publications/PublicationBundle';
import { paperPath } from '../pages/publications/records';

/**
 * BlogPage — shared layout for /neoflix and /publications.
 *
 * Native React rebuild of the original Framer blog-style page. Content stays
 * in each page's `data/*Page.js` file (unchanged markdown strings); this
 * component auto-detects publications-style metadata (bold link +
 * italic citation + `---`) and renders those as structured cards while
 * falling through to plain markdown for everything else.
 *
 * The backdrop isn't rendered here — it lives at BackdropProvider level
 * so it persists across transitions between the two blog routes and
 * only the foreground slides horizontally. This component publishes a
 * single target ('blog') whose topIdx tracks the active scroll-spy
 * section. When no section is resolved the target is null and the
 * backdrop's BlogBackdrop fades the cell out.
 */
// Two-column blog stagger. The outer RouteSlider already slides the
// whole page; this adds an internal translateX on just one of the two
// columns so they arrive at different times. Matches the old VT-era
// choreography:
//   direction > 0 (new from right) → sidebar leads, article trails
//   direction < 0 (new from left)  → article leads, sidebar trails
// The leader rides the outer slide without extra motion; the trailer
// gets an additional inner slide from STAGGER_OFFSET → 0, delayed so
// it lands after the outer slide settles.
const STAGGER_OFFSET = '32%';
const STAGGER_DELAY = 0.1;
const STAGGER_DURATION = 0.75;
// The page slide's own curve, so the trailing column decelerates into
// place with the page instead of on a beat of its own.
const STAGGER_EASE = SLIDE_EASE;
const PUBLICATION_PREVIEW_OVERRIDES = new Map([
  [
    'https://www.frontiersin.org/articles/10.3389/fped.2022.931055/full',
    {
      image: '/previews/narrative-review-frontiers-preview.png',
      label: 'Frontiers in Pediatrics',
    },
  ],
  [
    'https://fn.bmj.com/content/early/2024/02/07/archdischild-2023-326528',
    {
      image: '/previews/providers-perspective-bmj-preview.png',
      label: 'Fetal & Neonatal',
    },
  ],
  [
    'https://www.nature.com/articles/s41390-024-03083-w',
    {
      image: '/previews/record-reflect-refine-nature-preview.png',
      label: 'Pediatric Research',
    },
  ],
  [
    'https://docs.google.com/viewerng/viewer?url=https://bmjopenquality.bmj.com/content/bmjqir/13/2/e002588.full.pdf',
    {
      image: '/previews/practical-guidance-bmj-open-quality-preview.png',
      label: 'BMJ Open Quality',
    },
  ],
  [
    'https://www.sciencedirect.com/science/article/pii/S030095722300789X',
    {
      image: '/previews/driving-research-sciencedirect-preview.png',
      label: 'Resuscitation',
    },
  ],
  [
    'https://www.mdpi.com/2227-9067/13/6/816',
    {
      image: '/previews/international-collaboration-mdpi-preview.png',
      label: 'Children',
    },
  ],
]);

export default function BlogPage({ sections, scrollTo, bundle, pageTitle, page, acts, ledes }) {
  // Optional structure above the sections (/neoflix passes both; see
  // NeoflixPage): `acts` group sections under a display opener, and
  // `ledes` give a section a statement to open with in place of a title
  // bar. Without them every section renders the same way.
  const actStartingAt = {};
  (acts || []).forEach((act) => {
    if (act.sectionIds?.length) actStartingAt[act.sectionIds[0]] = act;
  });
  const inAct = new Set((acts || []).flatMap((act) => act.sectionIds || []));
  // Internal scroll container. BlogPage renders inside RouteSlider,
  // which is `position: fixed; inset: 0` — window never scrolls under
  // that layout, so the page scrolls on this inner element instead.
  const scrollRef = useRef(null);

  // Capture the slide direction at mount. BlogPage is keyed by
  // pathname in AnimatePresence, so a fresh mount = a fresh arrival;
  // the direction at that instant is the one that staged this entry.
  // Reading directly from context on every render would let a later
  // navigation (which mutates context direction before the next
  // transition starts) retroactively change our stagger half-way.
  const { direction, isSliding } = useTransitionState();
  const [entryDir] = useState(direction);
  const sidebarTrails = entryDir < 0;
  const articleTrails = entryDir > 0;
  // True once this page's arrival choreography has finished — the slide
  // plus the trailing column. Things drawn outside the sliding subtree
  // (the backdrop lane) wait for it, and measure only then. A direct
  // visit has no choreography and starts settled.
  const [settled, setSettled] = useState(entryDir === 0);
  useEffect(() => {
    if (settled) return undefined;
    const id = setTimeout(() => setSettled(true), (STAGGER_DELAY + STAGGER_DURATION) * 1000 + 50);
    return () => clearTimeout(id);
  }, [settled]);

  // Synchronously place the internal scroll container at the right spot
  // on mount and whenever the route's `scrollTo` changes. useLayoutEffect
  // fires before paint so the page renders already at the target — no
  // retained scroll from the previous page bleeding through.
  //
  // Target resolution:
  //   1. `scrollTo` prop (route-configured, e.g. /contact → "contact")
  //   2. URL hash on mount (direct visits like /neoflix#collab)
  //   3. Otherwise top of page
  //
  // Defaulting to 0 (rather than leaving scroll alone) is the fix for
  // "/publications' midway scroll leaking into /neoflix": each blog
  // route mounts fresh at its intended anchor.
  //
  // behavior: 'instant' is explicit; 'auto' defers to CSS scroll-behavior
  // and can silently smooth-animate, which is the exact diagonal motion
  // this effect exists to prevent. Placed before useScrollSpy so the
  // spy's initial calc() reads the post-scroll rects and picks the
  // correct active section first try.
  //
  // Intentionally not depending on `location.hash`: the sidebar updates
  // the hash via history.replaceState as the user scrolls, and we don't
  // want that to yank the viewport back to the anchor.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const hashId = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const targetId = scrollTo || hashId;
    let top = 0;
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        const navbarOffset = 96;
        const containerTop = container.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        top = elTop - containerTop + container.scrollTop - navbarOffset;
      }
    }
    container.scrollTo({ top, behavior: 'instant' });
  }, [scrollTo]);

  const sectionIds = sections.map((s) => s.id);
  const active = useScrollSpy(sectionIds, 120, scrollRef);

  const activeIdx = blogIdxForSection(active);
  useBackdropTarget(
    'blog',
    activeIdx >= 0 ? { kind: 'video', deck: BLOG_DECK, topIdx: activeIdx } : null
  );

  // ── The index lane ──
  // The homepage's travelling highlighter, carried over: a band of lifted
  // footage behind the current index entry, running from the screen edge
  // to the article card. It is drawn in the backdrop (useBackdropBands —
  // only there can it sample the footage), so it can't ride the page
  // slide: it waits for the slide to finish, then fades in where the
  // index has landed.
  const gridRef = useRef(null);
  const articleRef = useRef(null);
  const indexItemRefs = useRef({});
  const progressFillRef = useRef(null);
  const [lane, setLane] = useState(null);
  const measureLane = useCallback(() => {
    const root = scrollRef.current;
    const grid = gridRef.current;
    const article = articleRef.current;
    const item = indexItemRefs.current[active];
    const index = item?.closest('.blog-index');
    // The lane is fixed to the viewport, so it only makes sense while the
    // index is pinned. Below 900px the index stacks above the article and
    // scrolls away (see the media query) — no lane there.
    if (!root || !grid || !article || !item || getComputedStyle(index).position !== 'sticky') {
      setLane(null);
      return;
    }
    // Relative to the scroll root, so a slide offset in flight cancels
    // out. The item's own translateX (a trailing index) doesn't move it
    // vertically, and the card edge comes from offsets, not rects, so
    // neither entrance transform skews the band.
    const rootRect = root.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    const cardLeft = grid.getBoundingClientRect().left - rootRect.left + article.offsetLeft;
    const next = {
      top: Math.round(r.top - rootRect.top),
      height: Math.round(r.height),
      // Flush with the card's edge, square-ended: it reads as the band
      // running into the card. (A rounded end tucked underneath showed
      // through the card's translucent header.)
      right: Math.round(root.offsetWidth - cardLeft),
    };
    // Re-measured on scroll (below), so only re-render on a real change.
    setLane((prev) => (prev && prev.top === next.top && prev.height === next.height && prev.right === next.right ? prev : next));
  }, [active]);
  useLayoutEffect(() => {
    measureLane();
  }, [measureLane, isSliding, settled]);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measureLane);
    ro.observe(root);
    if (gridRef.current) ro.observe(gridRef.current);
    document.fonts?.ready?.then(measureLane);
    return () => ro.disconnect();
  }, [measureLane]);
  useBackdropBands(
    blogBandsId(page),
    lane
      ? {
          visible: settled && !isSliding,
          items: [{ id: 'lane', role: 'lane', top: lane.top, height: lane.height, left: 0, right: lane.right }],
        }
      : null
  );

  // ── Reading progress ──
  // The teal line under the current index entry fills as that section is
  // read — the vertical page's version of the homepage captions' timer.
  // Written straight to the element on scroll; no re-render per frame.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const section = document.getElementById(active);
      const fill = progressFillRef.current;
      if (!section || !fill) return;
      const top = (gridRef.current?.offsetTop || 0) + section.offsetTop;
      const p = (root.scrollTop + 120 - top) / Math.max(1, section.offsetHeight);
      fill.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
      // A sticky index can still release near the very end of the page;
      // keep the lane on its entry if it does.
      measureLane();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active, measureLane]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevH = html.style.backgroundColor;
    const prevB = body.style.backgroundColor;
    html.style.backgroundColor = 'var(--cool-page)';
    body.style.backgroundColor = 'var(--cool-page)';
    return () => {
      html.style.backgroundColor = prevH;
      body.style.backgroundColor = prevB;
    };
  }, []);

  // Publish each publication section's hero height as a custom property
  // so the gutter download button can sit that far up from the section's
  // bottom edge. Anchoring it to a percentage instead put it at a
  // different distance from every section boundary — articles run from
  // 900 to 1500px of body copy — which read as arbitrary while
  // scrolling. Measured rather than hard-coded because a wrapped title
  // or a three-line citation changes the hero's height.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !bundle || typeof ResizeObserver === 'undefined') return undefined;

    const pairs = Array.from(
      root.querySelectorAll('section.blog-section--with-publication')
    )
      .map((section) => [section, section.querySelector('.blog-section__lead')])
      .filter(([, lead]) => lead);
    if (!pairs.length) return undefined;

    const apply = () => {
      pairs.forEach(([section, lead]) => {
        section.style.setProperty('--publication-hero-h', `${Math.round(lead.offsetHeight)}px`);
      });
    };

    apply();
    const observer = new ResizeObserver(apply);
    pairs.forEach(([, lead]) => observer.observe(lead));
    return () => observer.disconnect();
  }, [sections, bundle]);

  // Intercept clicks on internal toolbox/article links inside the
  // markdown body so they route through the direction-aware slide
  // instead of triggering a full page reload. renderMarkdown tags
  // every internal `/toolbox/...` and `/neoflix/...` anchor with
  // `data-internal="true"` for exactly this handler.
  const transitionNavigate = useTransitionNavigate();
  const handleBodyClick = useCallback((e) => {
    const link = e.target.closest('a[data-internal]');
    if (!link) return;
    e.preventDefault();
    transitionNavigate(link.getAttribute('href'));
  }, [transitionNavigate]);

  const handleSidebarClick = (id) => {
    const container = scrollRef.current;
    const el = document.getElementById(id);
    if (!container || !el) return;
    const navbarOffset = 96;
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const top = elTop - containerTop + container.scrollTop - navbarOffset;
    container.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Keeps the index — now type straight on the footage — legible on
          the paler clips. Fixed inside the route slide, so it travels with
          the page during a transition and stays put while reading. */}
      <div aria-hidden="true" className="blog-scrim" />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1480,
          margin: '0 auto',
          padding: '104px 24px 120px',
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 284px) minmax(0, 900px)',
          columnGap: 64,
          alignItems: 'start',
          // Centred: the pair used to hug the left edge (24px of margin
          // against 186px on the right at 1440 wide).
          justifyContent: 'center',
        }}
        className="blog-grid"
        ref={gridRef}
      >
        {/* Sticky sidebar. Tagged with data-blog-sidebar for styling
            hooks; slides as part of the page's RouteSlider wrapper,
            plus an optional inner translate when it trails. */}
        <motion.aside
          data-blog-sidebar="true"
          className="blog-index"
          initial={sidebarTrails ? { x: `-${STAGGER_OFFSET}` } : false}
          animate={sidebarTrails ? { x: 0 } : undefined}
          transition={sidebarTrails ? { duration: STAGGER_DURATION, delay: STAGGER_DELAY, ease: STAGGER_EASE } : undefined}
        >
          {/* The index used to sit in an opaque navy box held at 620px
              tall and mostly empty. It is type on the footage now, with
              the backdrop lane (above) behind the current entry. */}
          <nav aria-label="On this page">
            <ul className="blog-index__list">
              {sections.map((s, idx) => {
                const isActive = s.id === active;
                // Intro divider: below the first item only when it's
                // unnumbered and the next item IS numbered (e.g.
                // "Preface" → "1. Narrative Review"). The /neoflix index
                // has no numbering, so it doesn't get this divider.
                const { numberPart: myNumber } = splitHeading(s.title);
                const nextNumber = sections[idx + 1]
                  ? splitHeading(sections[idx + 1].title).numberPart
                  : '';
                const isIntro =
                  idx === 0 && !myNumber && sections.length > 1 && !!nextNumber;
                // Divider above the Contact pin in the /neoflix index.
                const dividerAbove = s.id === 'contact' && idx > 0;
                const actHere = actStartingAt[s.id];
                return (
                  <React.Fragment key={s.id}>
                    {actHere && (
                      <li aria-hidden="true" className="blog-index__act">
                        {actHere.numeral} · {actHere.label}
                      </li>
                    )}
                    {dividerAbove && <li aria-hidden="true" className="blog-index__divider" />}
                    <li>
                      <button
                        type="button"
                        ref={(el) => { indexItemRefs.current[s.id] = el; }}
                        className="blog-index__item"
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => handleSidebarClick(s.id)}
                      >
                        <span className="blog-index__label">{s.title}</span>
                        {isActive && (
                          <span className="blog-index__progress" aria-hidden="true">
                            <span ref={progressFillRef} className="blog-index__progress-fill" />
                          </span>
                        )}
                      </button>
                    </li>
                    {isIntro && <li aria-hidden="true" className="blog-index__divider" />}
                  </React.Fragment>
                );
              })}
            </ul>
          </nav>

          {/* Foot of the index: everything at once. */}
          {bundle && (
            <>
              <div aria-hidden="true" className="blog-index__divider" />
              <PublicationBundle bundle={bundle} variant="sidebar" />
            </>
          )}
        </motion.aside>

        {/* Content column */}
        {pageTitle ? <h1 className="sr-only">{pageTitle}</h1> : null}
        <motion.article
          ref={articleRef}
          initial={articleTrails ? { x: STAGGER_OFFSET } : false}
          animate={articleTrails ? { x: 0 } : undefined}
          transition={articleTrails ? { duration: STAGGER_DURATION, delay: STAGGER_DELAY, ease: STAGGER_EASE } : undefined}
          style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
        >
          {sections.map((section) => {
            const parsed = parseSectionContent(section.content || '', {
              video: section.video,
              videoAfterParagraph: section.videoAfterParagraph,
            });
            const { numberPart, titlePart } = splitHeading(section.title);
            const hasPublicationLead = Boolean(parsed.titleCard || parsed.citation);
            const act = actStartingAt[section.id];
            const lede = ledes?.[section.id];
            // Inside an act the chapter title sits one level under the
            // act's own heading.
            const TitleTag = inAct.has(section.id) ? 'h3' : 'h2';
            const publicationPreview = hasPublicationLead && parsed.titleCard
              ? getPublicationPreview(parsed.titleCard.href)
              : null;
            return (
              <React.Fragment key={section.id}>
              {act && (
                <header id={act.id} className="blog-act">
                  {/* No label: the headline says what the act is (a lone
                      numeral read as a stray mark); the index carries the
                      short "I · In the moment" label. */}
                  <h2 className="blog-act__title">
                    <StoryHeadline header={act.header} accentClassName="blog-act__accent" />
                  </h2>
                </header>
              )}
              <section
                id={section.id}
                className={`blog-section${hasPublicationLead ? ' blog-section--with-publication' : ' blog-section--plain'}`}
                style={{
                  position: 'relative',
                  borderRadius: 0,
                  padding: 0,
                  scrollMarginTop: 96,
                  opacity: 1,
                  isolation: 'isolate',
                  overflow: 'visible',
                }}
              >
                {/* This article's own PDF, out on the background beside
                    it. Anchored to the section rather than the viewport,
                    so it travels with the paper it hands over. */}
                {hasPublicationLead && (
                  <PublicationAttachment
                    pdf={section.pdf}
                    variant="gutter"
                    title={parsed.titleCard?.title}
                  />
                )}

                <div className={`blog-section__lead${hasPublicationLead ? ' blog-section__lead--publication' : ' blog-section__lead--plain'}`}>
                  {hasPublicationLead && (
                    <div aria-hidden="true" className="blog-section__glass" />
                  )}
                  {publicationPreview && (
                    <PublicationGlassPreview preview={publicationPreview} />
                  )}
                  {lede ? (
                    // A chapter opens on its statement — the same sentence
                    // the homepage caption that links here shows — with
                    // the title as a kicker above it.
                    <div className="blog-section__header blog-section__header--chapter">
                      <TitleTag className="blog-chapter__kicker">{section.title}</TitleTag>
                      <p className="blog-chapter__lede">{lede}</p>
                    </div>
                  ) : (
                    <div className="blog-section__header">
                      <TitleTag
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 14,
                          flexWrap: 'wrap',
                          color: '#f8fbff',
                          letterSpacing: 0,
                          lineHeight: 1.08,
                          textShadow: '0 2px 14px rgba(8, 17, 24, 0.24)',
                        }}
                      >
                        {numberPart && (
                          <span
                            style={{
                              fontWeight: 300,
                              fontSize: 42,
                              color: 'rgba(248, 251, 255, 0.72)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {numberPart}
                          </span>
                        )}
                        <span style={{ fontWeight: 740, fontSize: 38 }}>
                          {titlePart}
                        </span>
                      </TitleTag>
                    </div>
                  )}

                  {hasPublicationLead && (
                    <PublicationLead
                      card={parsed.titleCard}
                      citation={parsed.citation}
                      preview={publicationPreview}
                      pdf={section.pdf}
                      paperHref={paperPath(section.id)}
                    />
                  )}
                </div>

                <div className="blog-section__content">
                  <div aria-hidden="true" className="blog-section__content-wash" />

                {/* A section may bring its own body (`Component`, e.g. the
                    film or the toolbox route on /neoflix) and something to
                    follow its prose (`After`, e.g. a chapter's toolbox
                    links). Both receive the section. */}
                {section.Component ? (
                  <section.Component section={section} />
                ) : (
                  <>
                  {parsed.bodyHtmlBefore && (
                    <div
                      className="blog-body"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: 1.8,
                        color: '#383437',
                        maxWidth: 620,
                        marginTop: hasPublicationLead ? 4 : 0,
                      }}
                      dangerouslySetInnerHTML={{ __html: parsed.bodyHtmlBefore }}
                      onClick={handleBodyClick}
                    />
                  )}
                  {section.video && (
                    <InlineVideo src={section.video} />
                  )}
                  {parsed.bodyHtmlAfter && (
                    <div
                      className="blog-body"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: 1.8,
                        color: '#383437',
                        maxWidth: 620,
                        marginTop: section.video ? 24 : (hasPublicationLead ? 12 : 0),
                      }}
                      dangerouslySetInnerHTML={{ __html: parsed.bodyHtmlAfter }}
                      onClick={handleBodyClick}
                    />
                  )}
                  </>
                )}
                {section.After && <section.After section={section} />}
                </div>
              </section>
              </React.Fragment>
            );
          })}
          {/* Bottom scroll spacer: lets the last (possibly short) post
              scroll up far enough to align with the sticky sidebar top
              instead of getting pinned at the end of the scroll range. */}
          <div aria-hidden="true" style={{ minHeight: 'calc(100vh - 200px)' }} />
        </motion.article>
      </div>

      <style>{`
        .blog-scrim {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(90deg,
            rgba(4, 14, 18, 0.4) 0,
            rgba(4, 14, 18, 0.2) 380px,
            rgba(4, 14, 18, 0) 720px);
        }
        .blog-index {
          position: sticky;
          top: max(120px, calc(50vh - 230px));
          font-family: Inter, sans-serif;
          color: #fff;
        }
        .blog-index__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .blog-index__item {
          all: unset;
          box-sizing: border-box;
          position: relative;
          display: block;
          width: 100%;
          padding: 12px 0 14px;
          cursor: pointer;
        }
        .blog-index__label {
          display: block;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.35;
          letter-spacing: -0.005em;
          color: rgba(255, 255, 255, 0.6);
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.16);
          transition: color 0.35s ease;
        }
        .blog-index__item:hover .blog-index__label {
          color: rgba(255, 255, 255, 0.9);
        }
        .blog-index__item[aria-current='true'] .blog-index__label {
          color: #fff;
        }
        .blog-index__item:focus-visible {
          outline: 2px solid #48c1c4;
          outline-offset: 2px;
          border-radius: 6px;
        }
        .blog-index__progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          border-radius: 2px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.18);
        }
        .blog-index__progress-fill {
          display: block;
          width: 100%;
          height: 100%;
          background: #48c1c4;
          transform-origin: left center;
          transform: scaleX(0);
        }
        .blog-index__act {
          list-style: none;
          padding: 22px 0 4px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }
        .blog-index__list > .blog-index__act:first-child {
          padding-top: 0;
        }
        /* Act opener: the page's two halves announced on the footage, in
           the homepage's display type, instead of starting on a title bar. */
        .blog-act {
          min-height: min(48vh, 440px);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 0 24px;
          scroll-margin-top: 96px;
          font-family: Inter, sans-serif;
        }
        .blog-act__title {
          margin: 0;
          font-size: clamp(48px, 4.4vw, 66px);
          font-weight: 700;
          line-height: 1.03;
          letter-spacing: -0.035em;
          color: #fff;
          text-shadow: 0 2px 30px rgba(0, 0, 0, 0.16);
        }
        .blog-act__accent {
          color: #48c1c4;
        }
        .blog-section__header--chapter {
          padding: 40px 54px 34px;
          font-family: Inter, sans-serif;
        }
        .blog-chapter__kicker {
          margin: 0 0 14px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
        }
        .blog-chapter__lede {
          margin: 0;
          max-width: 17em;
          font-size: 36px;
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.025em;
          color: #f8fbff;
          text-shadow: 0 2px 14px rgba(8, 17, 24, 0.24);
        }
        .blog-index__divider {
          list-style: none;
          height: 1px;
          margin: 10px 0;
          background: rgba(255, 255, 255, 0.16);
        }
        .blog-section {
          z-index: 0;
        }
        .blog-section__lead {
          position: relative;
          z-index: 1;
          isolation: isolate;
          margin-bottom: 2px;
        }
        .blog-section__lead--publication {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          grid-auto-rows: auto;
          align-items: start;
          margin-bottom: 0;
          padding-bottom: 48px;
        }
        .blog-section__glass {
          position: absolute;
          z-index: 0;
          top: -24px;
          right: 0;
          bottom: 0;
          left: 0;
          pointer-events: none;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(245, 249, 252, 0.34) 48%, rgba(232, 244, 246, 0.28));
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-bottom: 0;
          border-radius: 12px 12px 0 0;
          box-shadow: 0 20px 54px rgba(17, 34, 65, 0.08);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .blog-section__header {
          position: relative;
          z-index: 3;
          margin: 0 72px -1px 0;
          padding: 42px 54px 34px;
          background: transparent;
          border: 0;
          border-radius: 0;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .blog-section--with-publication .blog-section__header {
          grid-column: 1 / 13;
          margin: 0;
          padding: 42px 54px 18px;
        }
        .blog-section--plain .blog-section__header {
          margin: 0 0 -1px;
          background:
            linear-gradient(to bottom, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-bottom: 0;
          border-radius: 8px 8px 0 0;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .blog-section__content {
          position: relative;
          z-index: 2;
          padding: 44px 54px 88px;
          isolation: isolate;
          border-radius: 8px;
          overflow: hidden;
        }
        .blog-section--with-publication .blog-section__content {
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          padding-top: 48px;
        }
        .blog-section--plain .blog-section__content {
          border-radius: 0 0 8px 8px;
        }
        .blog-section__content-wash {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: rgba(245, 249, 252, 0.9);
          mix-blend-mode: screen;
          border-radius: 8px;
        }
        .blog-section--with-publication .blog-section__content-wash {
          border-radius: 0 0 12px 12px;
        }
        .blog-section--plain .blog-section__content-wash {
          border-radius: 0 0 8px 8px;
        }
        .blog-section__glass-preview {
          position: absolute;
          z-index: 1;
          top: -24px;
          right: 0;
          bottom: 0;
          left: 0;
          overflow: hidden;
          pointer-events: none;
          border-radius: 12px 12px 0 0;
        }
        /* Journal-page still, peeking from behind the lead's right-hand
           plates. Its left edge is set to the attachment sheet's left
           edge (grid column 7 plus that sheet's 18px inset), so the
           still reads as one band tucked underneath rather than a
           rectangle the sheet happens to overlap. */
        .blog-section__glass-preview-plate {
          position: absolute;
          top: 266px;
          right: 0;
          bottom: 0;
          left: 52%;
          overflow: hidden;
          background: #f7fafc;
        }
        .blog-section__glass-preview-plate img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: #ffffff;
          object-fit: cover;
          object-position: center;
          filter: none;
          opacity: 1;
        }
        .blog-section__glass-preview-plate::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(0deg, rgba(14, 28, 49, 0.68) 0%, rgba(14, 28, 49, 0.52) 34%, rgba(14, 28, 49, 0.24) 72%, rgba(14, 28, 49, 0.08) 100%);
        }
        .publication-lead {
          position: relative;
          z-index: 2;
          isolation: isolate;
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          max-width: none;
          margin: 6px 0 0;
          font-family: Inter, sans-serif;
        }
        .publication-lead__title {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(116px, 148px) 42px;
          align-items: center;
          gap: 24px;
          grid-column: 2 / 13;
          margin: 0 -16px 0 0;
          min-height: 126px;
          padding: 24px 28px 24px 32px;
          max-width: none;
          color: #ffffff;
          background: #0e1c31;
          border: 0;
          border-radius: 8px;
          box-shadow: 0 22px 44px rgba(17, 34, 65, 0.18);
          text-decoration: none;
          z-index: 3;
        }
        .publication-lead__title:hover {
          color: #ffffff;
          background: #132641;
        }
        .publication-lead__title-text {
          display: block;
          font-size: 19px;
          font-weight: 760;
          line-height: 1.28;
          letter-spacing: 0;
        }
        .publication-lead__preview {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 5px;
          background: #f7fafc;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        }
        .publication-lead__preview img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: #ffffff;
          object-fit: cover;
          object-position: center;
          opacity: 1;
        }
        .publication-lead__preview-label {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 7px;
          padding: 4px 6px;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.86);
          background: rgba(14, 28, 49, 0.76);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 760;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .publication-lead__arrow {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }
        .publication-lead__title svg {
          width: 30px;
          height: 30px;
          color: rgba(255, 255, 255, 0.92);
          margin-left: 0 !important;
        }
        .publication-lead__details {
          position: relative;
          z-index: 4;
          grid-column: 1 / 7;
          justify-self: start;
          margin: 14px 0 0 -26px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
          transition: background-color 0.22s ease, border-color 0.22s ease;
        }
        .publication-lead__details:hover {
          border-color: rgba(255, 255, 255, 0.46);
          background: rgba(255, 255, 255, 0.24);
        }
        .publication-lead__citation {
          position: relative;
          display: block;
          grid-column: 1 / 7;
          margin: -18px 0 0 -26px;
          max-width: none;
          padding: 24px 28px 22px;
          background: #f5f9fc;
          border: 0;
          border-radius: 8px;
          box-shadow: 0 16px 34px rgba(17, 34, 65, 0.09);
          color: rgba(56, 52, 55, 0.72);
          font-size: 14px;
          font-style: italic;
          font-weight: 500;
          line-height: 1.62;
          z-index: 4;
        }
        @media (max-width: 900px) {
          .blog-grid {
            grid-template-columns: 1fr !important;
            padding: 96px 16px 80px !important;
          }
          .blog-grid aside {
            position: static !important;
          }
          .blog-grid section.blog-section {
            padding: 0 !important;
          }
          .blog-section__glass {
            top: -14px;
            right: 0;
            bottom: 0;
            left: 0;
            border-radius: 8px 8px 0 0;
          }
          .blog-section__lead--publication {
            grid-template-columns: 1fr;
            padding-bottom: 28px;
          }
          .blog-section__header {
            margin: 0 20px -1px 0;
            padding: 32px 24px 28px;
          }
          .blog-section--with-publication .blog-section__header {
            grid-column: 1;
            margin: 0;
          }
          .blog-section__content {
            padding: 32px 24px 40px;
          }
          .blog-section--with-publication .blog-section__content {
            border-radius: 0 0 8px 8px;
            padding-top: 28px;
          }
          .blog-section--with-publication .blog-section__content-wash {
            border-radius: 0 0 8px 8px;
          }
          .publication-lead {
            grid-column: 1;
            grid-template-columns: 1fr;
            margin: 30px 20px 34px;
          }
          .blog-section__glass-preview {
            display: none;
          }
          .publication-lead__title {
            grid-template-columns: minmax(0, 1fr) auto;
            grid-column: 1;
            margin-right: 0;
            min-height: 104px;
            padding: 22px 22px 26px;
          }
          .publication-lead__preview {
            display: none;
          }
          .publication-lead__arrow {
            width: 38px;
            height: 38px;
          }
          .publication-lead__title svg {
            width: 26px;
            height: 26px;
          }
          .publication-lead__details {
          position: relative;
          z-index: 4;
          grid-column: 1 / 7;
          justify-self: start;
          margin: 14px 0 0 -26px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
          transition: background-color 0.22s ease, border-color 0.22s ease;
        }
        .publication-lead__details:hover {
          border-color: rgba(255, 255, 255, 0.46);
          background: rgba(255, 255, 255, 0.24);
        }
        .publication-lead__citation {
            grid-column: 1;
            margin: -10px 0 0 -12px;
            padding: 20px 20px 18px;
          }
        }
        .blog-body {
          position: relative;
          z-index: 1;
        }
        .blog-body p { margin: 0 0 1.35em 0; }
        .blog-body p:last-child { margin-bottom: 0; }
        /* Links read as part of the sentence, not a keyword spray: normal
           weight (the content bolds its link text), a soft teal underline,
           and only on hover do they announce themselves. */
        .blog-body a {
          color: inherit;
          text-decoration: underline;
          text-decoration-color: rgba(72, 193, 196, 0.6);
          text-decoration-thickness: 1.5px;
          text-underline-offset: 3px;
          transition: color 0.2s, text-decoration-color 0.2s;
        }
        .blog-body a strong { font-weight: inherit; color: inherit; }
        .blog-body a:hover { color: #2d6a6a; text-decoration-color: #48c1c4; }
        .blog-body strong { font-weight: 700; color: #383437; }
        .blog-body em { font-style: italic; }
        .blog-body h2 {
          font-weight: 700; color: #383437; font-size: 24px;
          letter-spacing: 0; line-height: 1.32;
          margin: 44px 0 18px;
        }
        .blog-body h3 {
          font-weight: 700; color: #383437; font-size: 20px;
          line-height: 1.4; margin: 36px 0 16px;
        }
        .blog-body ul, .blog-body ol { padding-left: 1.4em; margin: 0 0 1.35em; }
        .blog-body ul li { margin-bottom: 12px; }
        .blog-body ol li { margin-bottom: 12px; }
        .blog-body ul li::marker { color: #48c1c4; }
        .blog-body hr {
          border: 0; border-top: 1px solid rgba(56, 52, 55, 0.12);
          margin: 32px 0;
        }
      `}</style>
    </div>
  );
}

/* ── Publication lead ───────────────────────────────────────────────── */
function PublicationGlassPreview({ preview }) {
  if (!preview) return null;

  return (
    <span className="blog-section__glass-preview" aria-hidden="true">
      <span className="blog-section__glass-preview-plate">
        <img
          src={preview.image}
          data-fallback-src={preview.fallbackImage}
          alt=""
          loading="lazy"
          onError={handlePublicationPreviewError}
        />
      </span>
    </span>
  );
}

function PublicationLead({ card, citation, preview, pdf, paperHref }) {

  return (
    <div className="publication-lead">
      {card && (
        <a
          className="publication-lead__title"
          href={card.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="publication-lead__title-text">
            {card.title}
          </span>
          {preview && (
            <span className="publication-lead__preview" aria-hidden="true">
              <img
                src={preview.image}
                data-fallback-src={preview.fallbackImage}
                alt=""
                loading="lazy"
                onError={handlePublicationPreviewError}
              />
              <span className="publication-lead__preview-label">
                {preview.label}
              </span>
            </span>
          )}
          <span className="publication-lead__arrow" aria-hidden="true">
            <ExternalArrow />
          </span>
        </a>
      )}
      {citation && (
        <cite className="publication-lead__citation">
          {citation}
        </cite>
      )}
      {/* Third plate in the stack: the paper's own PDF, tucked under the
          title card's right edge opposite the citation. */}
      <PublicationAttachment pdf={pdf} variant="blog" />
      {/* Only papers with a page of their own link out to it — the two
          under an exclusive publisher licence have nothing to put there
          yet. Also how a crawler reaches those pages at all. */}
      {paperHref && (
        <a className="publication-lead__details" href={paperHref} data-internal="true">
          Abstract, citation &amp; DOI →
        </a>
      )}
    </div>
  );
}

function handlePublicationPreviewError(event) {
  const img = event.currentTarget;
  const fallback = img.dataset.fallbackSrc;
  if (fallback && img.src !== fallback) {
    img.src = fallback;
    img.dataset.fallbackSrc = '';
    return;
  }
  img.style.display = 'none';
}

function getPublicationPreview(href) {
  if (!href || !/^https?:\/\//i.test(href)) return null;

  let label = 'Open article';
  let host = '';
  const canonicalHref = href.replace(/\/$/, '');
  try {
    const url = new URL(href);
    host = url.hostname.replace(/^www\./, '');
    label = host;
    if (label.endsWith('bmj.com')) {
      label = 'Fetal & Neonatal';
    }
  } catch {
    // Keep the neutral label if the URL cannot be parsed.
  }

  const encoded = encodeURIComponent(href);
  const fallback = host
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
    : '';
  const override = PUBLICATION_PREVIEW_OVERRIDES.get(canonicalHref);

  return {
    label: override?.label || label,
    image: override?.image || `https://s.wordpress.com/mshots/v1/${encoded}?w=640`,
    fallbackImage: fallback,
  };
}

function ExternalArrow() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
      }}
      aria-hidden="true"
    >
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Heading split ──────────────────────────────────────────────────── */
function splitHeading(title) {
  if (!title) return { numberPart: '', titlePart: '' };
  const m = title.match(/^(\d+\.)\s+(.+)$/);
  if (m) return { numberPart: m[1], titlePart: m[2] };
  return { numberPart: '', titlePart: title };
}

/* ── Content parsing ────────────────────────────────────────────────── */
// Pattern at the top of a publications section:
//   **[Title](URL)**
//
//   *Citation line*
//
//   ---
//
//   Body markdown...
//
// If the pattern matches, pull the title + citation out as structured
// cards and render the body as markdown. Otherwise everything is body.
function parseSectionContent(content, opts = {}) {
  const { video, videoAfterParagraph } = opts;
  const match = content.match(
    /^\s*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*\n+\*([^*][^\n]*?)\*\s*\n+---\s*\n+([\s\S]*)$/
  );
  let titleCard = null;
  let citation = null;
  let body = content;
  if (match) {
    const [, title, href, cite, b] = match;
    titleCard = { title: title.trim().replace(/\.$/, ''), href };
    citation = cite.trim();
    body = b;
  }

  if (video && Number.isFinite(videoAfterParagraph) && videoAfterParagraph > 0) {
    const paragraphs = body.split(/\n\s*\n+/);
    const split = Math.min(videoAfterParagraph, paragraphs.length);
    const before = paragraphs.slice(0, split).join('\n\n');
    const after = paragraphs.slice(split).join('\n\n');
    return {
      titleCard,
      citation,
      bodyHtmlBefore: renderMarkdown(before),
      bodyHtmlAfter: renderMarkdown(after),
    };
  }

  return {
    titleCard,
    citation,
    bodyHtmlBefore: renderMarkdown(body),
    bodyHtmlAfter: '',
  };
}

/* ── Inline illustrative video ──────────────────────────────────────── */
/**
 * The clip inside a product section is a moving illustration: silent,
 * six seconds, looping, with nothing to control. IllustrationClip
 * renders it as a <video> with every media affordance opted out (see
 * that component's header for the canvas-era history).
 *
 * Playback is scroll-gated: the clip only plays while its frame is on
 * screen.
 */
function InlineVideo({ src }) {
  const frameRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setInView(entry.isIntersecting));
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      style={{ maxWidth: 620, margin: '26px 0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(28,54,100,0.1)' }}
    >
      <IllustrationClip
        src={src}
        // The clip's still stands in until a frame decodes — otherwise
        // the frame shows as a black box, often mid page slide.
        poster={stillFor(src) || undefined}
        play={inView}
        preload="metadata"
        style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '3 / 2', objectFit: 'cover', background: '#000' }}
      />
    </div>
  );
}
