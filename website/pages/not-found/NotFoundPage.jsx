import React from 'react';
import { useLocation } from 'react-router-dom';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';

// Top-level catch-all. Before this existed, an unknown URL rendered the
// navbar over an empty fixed layer — a blank page at HTTP 200. The
// build also emits a 404.html shell (build-route-html.mjs) so Netlify
// serves unknown paths with a real 404 status; this component is what
// that shell renders.
export default function NotFoundPage() {
  const location = useLocation();
  const transitionNavigate = useTransitionNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '96px 24px',
        textAlign: 'center',
        background: 'var(--cool-page, #f4f7f7)',
        color: '#14282c',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>Page not found</h1>
      <p style={{ margin: 0, maxWidth: '46ch', color: '#55706f' }}>
        There&rsquo;s nothing at &ldquo;{location.pathname}&rdquo;. It may have moved, or the
        link may be out of date.
      </p>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          transitionNavigate('/');
        }}
        style={{ color: '#14797d', fontWeight: 500 }}
      >
        Back to the homepage
      </a>
    </div>
  );
}
