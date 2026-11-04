/**
 * Moving between records. Every link out of a record carries where the
 * reader came from (`from=`) and the path they're walking (`path=`), so
 * the next record can open on the thread that was followed.
 */
import React, { createContext, useContext } from 'react';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { urlFor } from '../urls';

export const Here = createContext({ current: null, path: null });

// The library's front is a record too, but leaving it isn't following a
// thread — no from= for it.
const fromOf = (current) => (current && current !== 'guidance:' ? current : null);

export function useGo() {
  const navigate = useTransitionNavigate();
  const { current } = useContext(Here);
  return (key, { path, replace } = {}) => navigate(urlFor(key, { from: fromOf(current), path }), replace ? { replace: true } : undefined);
}

const modified = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;

/** A link to a record. */
export function RecordLink({ k, path, children, className, title, ...rest }) {
  const go = useGo();
  const { current } = useContext(Here);
  return (
    <a
      href={urlFor(k, { from: fromOf(current), path })}
      className={className}
      title={title}
      onClick={(e) => { if (modified(e)) return; e.preventDefault(); go(k, { path }); }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** A link to any other address in the app, sliding like the navbar does. */
export function AppLink({ to, children, className, replace, ...rest }) {
  const navigate = useTransitionNavigate();
  return (
    <a href={to} className={className} onClick={(e) => { if (modified(e)) return; e.preventDefault(); navigate(to, replace ? { replace: true } : undefined); }} {...rest}>
      {children}
    </a>
  );
}
