import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./shared/fonts.css";
import "./index.css";

// One spelling per route. Every route is a physical <route>/index.html,
// so a static host can serve — or redirect to — `/neoflix/` as readily as
// `/neoflix`. The app compares paths exactly in several places (backdrop
// mode, navbar active link, slide direction, mobile dock); with the slash,
// a direct visit to /neoflix/ got a flat backdrop with no footage and the
// wrong nav state. Normalise before the router reads the URL. replaceState
// requests nothing, and canonical URLs (routeMeta.js) have no slash.
{
  const { pathname, search, hash } = window.location;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    window.history.replaceState(window.history.state, "", pathname.replace(/\/+$/, "") + search + hash);
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
