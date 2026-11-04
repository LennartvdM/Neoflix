/**
 * The library's own strip, under the site navbar: search, the paths, the
 * session pack, and the "Assembly" switch that shows why every module on
 * a record is there.
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { usePins } from '../state';
import { AppLink } from './nav';

export default function LibraryBar({ crumbs = [] }) {
  const { pathname, search } = useLocation();
  const navigate = useTransitionNavigate();
  const pins = usePins();
  const q0 = pathname === '/search' ? new URLSearchParams(search).get('q') || '' : '';
  const [q, setQ] = useState(q0);
  useEffect(() => setQ(q0), [q0]);
  const [inspect, setInspect] = useState(() => typeof document !== 'undefined' && document.body.hasAttribute('data-assembly'));
  const toggle = () => { document.body.toggleAttribute('data-assembly'); setInspect(document.body.hasAttribute('data-assembly')); };
  const onInput = (e) => {
    const v = e.target.value;
    setQ(v);
    navigate(v.trim() ? `/search?q=${encodeURIComponent(v.trim())}` : '/search', { replace: pathname === '/search' });
  };
  return (
    <div className="libbar">
      <div className="libbar__in">
        <nav className="libbar__crumbs" aria-label="Breadcrumbs">
          <AppLink to="/toolbox">Library</AppLink>
          {crumbs.map(([label, to]) => (
            <React.Fragment key={label}>
              <i>/</i>
              {to ? <AppLink to={to}>{label}</AppLink> : <span>{label}</span>}
            </React.Fragment>
          ))}
        </nav>
        <label className="libbar__search">
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.6" /></svg>
          <input type="search" value={q} onChange={onInput} placeholder="Search guidance, papers and films" aria-label="Search the library" />
        </label>
        <div className="libbar__links">
          <AppLink to="/paths">Paths</AppLink>
          <AppLink to="/search">Browse</AppLink>
          <AppLink to="/pack">Pack{pins.length ? ` (${pins.length})` : ''}</AppLink>
          <button type="button" className="libbar__assembly" aria-pressed={inspect} onClick={toggle} title="Show why each module is on the page">
            <i />Assembly
          </button>
        </div>
      </div>
    </div>
  );
}
