import { createContext } from 'react';

/** The front's map and its path cards talk through this: hover a path, see its route. */
export const FrontContext = createContext({ route: null, setRoute: null, trail: [] });
