/**
 * What the visitor is looking at, site-wide.
 *
 * Pages publish the thing in front of the reader — the beat playing on
 * the homepage, the row hovered on /neoflix, the paper open on
 * /publications, the loop part of the toolbox page — with `useLit`. The
 * navbar index lights that token and everything related to it, so the
 * bar always shows where the reader is in the whole, not just which page.
 *
 * The other direction: hovering a token in the index (`hover`) marks
 * every mention of that thing on the current page, through one generated
 * rule on `[data-token="…"]` (and a fainter one on its relations) — no
 * page has to subscribe.
 *
 * Two contexts so publishing never re-renders a page: the setter is
 * stable, only the index reads the state.
 */
import React, { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { relatedTo } from './relations';

const Api = createContext(null);
const State = createContext({ lit: null, hover: null });

export function IndexProvider({ children }) {
  const [lit, setLit] = useState(null); // { owner, token }
  const [hover, setHover] = useState(null);
  const api = useMemo(
    () => ({
      publish(owner, t) {
        setLit((cur) => {
          if (t) return cur?.owner === owner && cur.token === t ? cur : { owner, token: t };
          return cur?.owner === owner ? null : cur;
        });
      },
      setHover,
    }),
    []
  );
  const state = useMemo(() => ({ lit: lit?.token || null, hover }), [lit, hover]);

  const focus = hover;
  const rule = focus
    ? [
        `[data-token="${focus}"]:not(.ix-item > *){outline:2px solid #48c1c4;outline-offset:3px}`,
        ...[...relatedTo(focus)].map((r) => `[data-token="${r}"]:not(.ix-item > *){outline:1.5px solid rgba(72,193,196,.5);outline-offset:3px}`),
      ].join('')
    : '';

  return (
    <Api.Provider value={api}>
      <State.Provider value={state}>
        {children}
        {hover ? <style data-index-hover="">{rule}</style> : null}
      </State.Provider>
    </Api.Provider>
  );
}

/** Publish the token in front of the reader while this component shows it. */
export function useLit(t) {
  const api = useContext(Api);
  const owner = useId();
  useEffect(() => {
    api?.publish(owner, t || null);
  }, [api, owner, t]);
  useEffect(() => () => api?.publish(owner, null), [api, owner]);
}

export const useIndexApi = () => useContext(Api);
export const useIndexState = () => useContext(State);
