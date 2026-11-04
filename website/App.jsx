import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './shared/Navbar';
import MobileDock from './shared/MobileDock';
import RouteSlider from './shared/motion/RouteSlider';
import BackdropProvider from './shared/backdrop/BackdropProvider';
import { TransitionProvider } from './shared/motion/TransitionContext';
import useTabletLayout from './lib/hooks/useTabletLayout';
import useDocumentMeta from './lib/hooks/useDocumentMeta';
import ErrorBoundary from './shared/ErrorBoundary';

// Every page is its own chunk. Before this, one bundle carried all five
// pages (each with both its desktop and mobile tree) plus the docs
// viewer to every visitor; a phone visitor parsed ~80% JS it never
// rendered. The Suspense fallback is null on purpose — the backdrop
// keeps painting during the (one-time, small) chunk fetch, which reads
// better than a spinner flashing inside the slide.
const Home = lazy(() => import('./pages/home/Home'));
const NeoflixPage = lazy(() => import('./pages/neoflix/NeoflixPage'));
const PublicationsPage = lazy(() => import('./pages/publications/PublicationsPage'));
const DocsPage = lazy(() => import('./pages/toolbox/ToolboxPage'));
const PaperPage = lazy(() => import('./pages/publications/PaperPage'));
const NotFoundPage = lazy(() => import('./pages/not-found/NotFoundPage'));

function AppShell() {
  const location = useLocation();
  const { width } = useTabletLayout();
  const isNeoflix = location.pathname === '/neoflix' || location.pathname.startsWith('/neoflix/');
  const isPublications = location.pathname.startsWith('/publications');
  const isContact = location.pathname === '/contact';
  const isToolbox = location.pathname.startsWith('/toolbox');
  const showMobileDock = width > 0 && width < 600;

  // Client-side navigation doesn't reload the document, so the head has
  // to be updated by hand. The build writes the same values into each
  // route's HTML for anything that doesn't run JavaScript.
  useDocumentMeta();

  // After a client-side navigation, move focus into the new page's
  // region. Without this, focus stays on the navbar link that was
  // clicked and screen readers announce nothing about the change.
  const mainRef = React.useRef(null);
  const firstRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  // The navbar, backdrop, and route slider each render independently.
  // They share a single source of truth — TransitionContext — for the
  // current slide direction and "is a slide in flight" flag, but none
  // of them are coupled through a document-scoped animation primitive.
  // This is deliberate: the previous View Transitions API setup froze
  // the whole page (navbar included) behind a snapshot during each
  // nav, which produced dead-click windows on persistent chrome.
  return (
    <div className={`min-h-screen ${isNeoflix || isPublications || isContact || isToolbox ? '' : 'bg-[var(--cool-page)]'}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      {/* The pages render position:fixed inside RouteSlider, so this
          <main> contributes no layout of its own — it exists as the
          landmark and focus target for the skip link and for the
          focus reset above. */}
      <main id="main-content" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
      <ErrorBoundary>
        <BackdropProvider>
          <RouteSlider>
            {(captured) => (
              // While the home chunk loads, paint what the page itself
              // will paint. The backdrop's cell-0 camo (#739780, chosen
              // to blend the snap into the medical deck) sits under the
              // intro, and with pages arriving as lazy chunks it showed
              // as a green flash on first load. Blog/toolbox routes keep
              // a null fallback — their backdrop showing through during
              // the fetch IS their designed look.
              <Suspense
                fallback={
                  captured.pathname === '/' ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: showMobileDock
                          ? '#07110f'
                          : 'linear-gradient(to top, #FFFFFF, #F5F9FC)',
                      }}
                    />
                  ) : null
                }
              >
                <Routes location={captured}>
                  <Route path="/" element={<Home />} />
                  <Route path="/neoflix" element={<NeoflixPage />} />
                  <Route path="/publications" element={<PublicationsPage />} />
                  <Route path="/publications/:slug" element={<PaperPage />} />
                  <Route path="/contact" element={<NeoflixPage scrollTo="contact" />} />
                  <Route path="/toolbox" element={<DocsPage />} />
                  <Route path="/toolbox/*" element={<DocsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            )}
          </RouteSlider>
        </BackdropProvider>
      </ErrorBoundary>
      </main>
      {showMobileDock ? <MobileDock /> : null}
    </div>
  );
}

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
      <TransitionProvider>
        <AppShell />
      </TransitionProvider>
    </Router>
  );
}
