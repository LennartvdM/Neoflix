/**
 * The sidebar: the reader's anchor, after the Talent naar de Top deck's
 * (a frosted card, quiet rows, the current one marked).
 *
 * It says where you are without being the whole index:
 *   - the story by chapter, but only your chapter opens to its stops;
 *     the others are one line each (a click goes to their first page);
 *   - when you go right, the stop you came from branches: the trail you
 *     took, one row per level, and at each level a short window of the
 *     pages beside yours (two each way), the rest counted, not listed;
 *   - go back and the branch folds shut.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const EASE = [0.32, 0.72, 0, 1];
const T = { duration: 0.38, ease: EASE };
const WIN = 2;

const nameOf = (n) => (n.kind === 'stop' ? n.short : n.label);

/** One level of the branch: a window of siblings round the one you're on. */
function Level({ siblings, at, addr, cur, onGo, children }) {
  const lo = Math.max(0, at - WIN);
  const hi = Math.min(siblings.length - 1, at + WIN);
  const base = addr.slice(0, -1);
  return (
    <motion.ul className="sb__branch" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={T}>
      {lo > 0 && (
        <li><button type="button" className="sb__more" onClick={() => onGo([...base, lo - 1])}>↑ {lo} more</button></li>
      )}
      {siblings.slice(lo, hi + 1).map((n, j) => {
        const i = lo + j;
        const a = [...base, i];
        const here = i === at && cur.length === addr.length;
        const through = i === at && !here;
        return (
          <li key={n.id}>
            <button type="button" className="sb__item" data-here={here ? '' : undefined} data-path={through ? '' : undefined} onClick={() => onGo(a)}>
              {n.num && <b>{n.num}</b>}
              <span>{nameOf(n)}</span>
              {n.kids.length > 0 && <i aria-hidden="true">›</i>}
            </button>
            {i === at && children}
          </li>
        );
      })}
      {hi < siblings.length - 1 && (
        <li><button type="button" className="sb__more" onClick={() => onGo([...base, hi + 1])}>↓ {siblings.length - 1 - hi} more</button></li>
      )}
    </motion.ul>
  );
}

export default function Sidebar({ atlas, cur, onGo, searching, query }) {
  // The branch below the stop: one Level per level of depth, nested.
  const branch = (d) => {
    if (d >= cur.length) return null;
    const parent = atlas.at(cur.slice(0, d));
    return (
      <Level key={`lvl${d}`} siblings={parent.kids} at={cur[d]} addr={cur.slice(0, d + 1)} cur={cur} onGo={onGo}>
        <AnimatePresence initial={false}>{branch(d + 1)}</AnimatePresence>
      </Level>
    );
  };

  const groups = [];
  atlas.spine.forEach((n, i) => {
    const g = groups[groups.length - 1];
    if (n.chapter && g && g.chapter === n.chapter) g.items.push([n, i]);
    else groups.push({ chapter: n.chapter, items: [[n, i]] });
  });

  return (
    <nav className="sb" aria-label="Where you are">
      <ul className="sb__nav">
        {groups.map((g) => {
          const ch = atlas.chapters.find((c) => c.id === g.chapter);
          const mine = g.items.some(([, i]) => i === cur[0]);
          if (ch && !mine) {
            return (
              <li key={g.chapter}>
                <button type="button" className="sb__item sb__item--chapter" onClick={() => onGo([g.items[0][1]])}>
                  <span>{ch.name}</span><i aria-hidden="true">{g.items.length}</i>
                </button>
              </li>
            );
          }
          return (
            <li key={g.chapter || g.items[0][0].id} className={ch ? 'sb__open' : undefined}>
              {ch && <p className="sb__chapter">{ch.name}</p>}
              <ul>
                {g.items.map(([n, i]) => {
                  const here = i === cur[0] && cur.length === 1;
                  const through = i === cur[0] && cur.length > 1;
                  return (
                    <li key={n.id}>
                      <button type="button" className="sb__item" data-here={here ? '' : undefined} data-path={through ? '' : undefined} onClick={() => onGo([i])}>
                        <span>{n.short}</span>
                        {n.kids.length > 0 && <i aria-hidden="true">›</i>}
                      </button>
                      <AnimatePresence initial={false}>{i === cur[0] && branch(1)}</AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
      <div className="sb__foot">
        {searching ? <p>Search{query ? `: “${query}”` : ''}</p> : <p>{cur[0] + 1} of {atlas.spine.length}{cur.length > 1 ? ` · ${cur.length - 1} deeper` : ''}</p>}
        <p className="sb__keys">↑ ↓ the story · → deeper · ← back</p>
      </div>
    </nav>
  );
}
