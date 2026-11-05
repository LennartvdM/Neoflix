/**
 * The sidebar: the reader's anchor. It is the atlas (atlas.js), drawn as
 * the one thing that never leaves the screen.
 *
 * On the story (the first level) it is the whole story, chapter by
 * chapter, the page you're on marked. Go right, into what a page rests
 * on, and it branches: the page you came from opens into a list of its
 * own, joined to it by a line, and the rest of the story folds up to its
 * chapter names to make room. Go deeper and it branches again; the
 * sidebar itself widens a step for every level, so depth is something
 * you can see. Go back out and the branch folds shut.
 *
 * Every entry is a way there; an entry that opens onto more says how
 * many pages lie to its right.
 */
import React from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

const EASE = [0.32, 0.72, 0, 1];
const T = { duration: 0.42, ease: EASE };

function Entry({ node, addr, cur, depth, onGo }) {
  const here = cur.length === addr.length && cur.every((v, i) => v === addr[i]);
  const onPath = !here && addr.every((v, i) => cur[i] === v) && cur.length > addr.length;
  const open = onPath;
  return (
    <motion.li layout="position" transition={T} className="sb__li" data-depth={depth}>
      <button
        type="button"
        className="sb__item"
        data-here={here ? '' : undefined}
        data-path={onPath ? '' : undefined}
        onClick={() => onGo(addr)}
      >
        <b>{node.num || '·'}</b>
        <span>{node.kind === 'stop' ? node.short : node.label}</span>
        {node.kids.length > 0 && <i aria-label={`${node.kids.length} pages to the right`}>→{node.kids.length}</i>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            key="kids"
            className="sb__branch"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={T}
          >
            {node.kids.map((k, i) => <Entry key={k.id} node={k} addr={[...addr, i]} cur={cur} depth={depth + 1} onGo={onGo} />)}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function Sidebar({ atlas, cur, onGo, searching, query, width }) {
  const deep = cur.length > 1;
  const stop = atlas.spine[cur[0]];
  // The story, in its chapters; the first and last stops stand alone.
  const groups = [];
  atlas.spine.forEach((n, i) => {
    const g = groups[groups.length - 1];
    if (n.chapter && g && g.chapter === n.chapter) g.items.push([n, i]);
    else groups.push({ chapter: n.chapter, items: [[n, i]] });
  });
  return (
    <motion.nav className="sb" aria-label="Where you are" animate={{ width }} transition={T}>
      <LayoutGroup>
        <ol className="sb__story">
          {groups.map((g) => {
            const ch = atlas.chapters.find((c) => c.id === g.chapter);
            const mine = g.items.some(([, i]) => i === cur[0]);
            // Deeper in, the rest of the story folds to its chapter names.
            const folded = deep && !mine && ch;
            return (
              <motion.li layout="position" transition={T} key={g.chapter || g.items[0][0].id} className="sb__group" data-mine={mine ? '' : undefined}>
                {ch && (
                  <button type="button" className="sb__chapter" onClick={() => onGo([g.items[0][1]])}>
                    {ch.name}
                    {folded && <i>{g.items.length}</i>}
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {!folded && (
                    <motion.ul
                      key="items"
                      className="sb__items"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={T}
                    >
                      {g.items.map(([n, i]) => <Entry key={n.id} node={n} addr={[i]} cur={cur} depth={0} onGo={onGo} />)}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>
      <div className="sb__foot">
        {searching ? (
          <p><b>Search</b>{query ? `“${query}”` : 'type to search'}</p>
        ) : (
          <p><b>{cur[0] + 1}</b>of {atlas.spine.length}{deep ? <>, {cur.length - 1} deep in <em>{stop.short}</em></> : null}</p>
        )}
        <p className="sb__keys">↑↓ the story · → deeper · ← back</p>
      </div>
    </motion.nav>
  );
}
