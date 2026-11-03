/**
 * The homepage's last slide: the way out (content blueprint, "/"). Two
 * doors — down into the argument, and straight into the toolbox — and
 * under the first, the six clips as six small doors, each straight to its
 * beat on /neoflix. The film and the map that used to be slides here now
 * hang where the argument uses them (beat 5 and "Four units that record").
 */
import React from 'react';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import { BEATS } from '../../shared/argument';
import './home-exit.css';

function Door({ href, className, children }) {
  const navigate = useTransitionNavigate();
  return (
    <a
      className={className}
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

export default function HomeExit() {
  return (
    <div className="home-exit" data-nav-tone="dark">
      <div className="home-exit__inner">
        <Door href="/neoflix" className="home-exit__door home-exit__door--primary">
          <span>Read how Leiden did it</span>
          <span aria-hidden="true" className="home-exit__arrow">→</span>
        </Door>
        <ol className="home-exit__beats">
          {BEATS.map((beat) => (
            <li key={beat.id}>
              <Door href={`/neoflix#${beat.id}`} className="home-exit__beat">
                <img src={beat.clip.still} alt="" loading="lazy" />
                <span className="home-exit__beat-n">{String(beat.n).padStart(2, '0')}</span>
                <span className="home-exit__beat-name">{beat.name}</span>
              </Door>
            </li>
          ))}
        </ol>
        <Door href="/toolbox/welcome/quick-start" className="home-exit__door">
          <span>Run your first session</span>
          <span aria-hidden="true" className="home-exit__arrow">→</span>
        </Door>
      </div>
    </div>
  );
}
