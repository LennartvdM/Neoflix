/**
 * Starter artifact: one page of the Neoflix atlas, as a single-file React
 * artifact. It reproduces the site's design language without the site's
 * code, so a chat session can sketch new pages from it.
 *
 * Shown: the Skills stop (atlas page 5), in data/atlas.json → pages[5].
 *   need      the film, feathered: it dissolves into the dark card and
 *             the words sit on it (a moment, not a record)
 *   want      ≤3 small cards, each tied to the subject by a broad dashed
 *             white edge (whiteboard, not circuit board)
 *   under     the evidence, tucked beneath the subject's lower edge
 *   adjacent  neighbours percolating out of the top edge, tethered
 *             outward, off the screen
 *   witness   a session-film moment (data/session-film.json → moments)
 *   sidebar   the frosted anchor: the story as an outline
 *
 * To show real images: paste data URIs from data/media-inline.json into
 * IMG (artifacts can't load files from the package).
 */
import React, { useEffect, useRef, useState } from 'react';

const IMG = {
  // 'still:skills': 'data:image/webp;base64,…',
  // 'frame:p023': 'data:image/webp;base64,…',
};

// A slice of data/atlas.json pages[5] and data/session-film.json.
const PAGE = {
  num: '05', running: 'Watching it back', of: '5 / 17',
  film: { key: 'film:skills', img: 'still:skills', eyebrow: 'Skills', headline: 'So record it.',
    words: 'Leiden has filmed every stabilisation at birth since 2009, and intubations and lines since 2021. Watching it back, you see what happened instead of what you remember.' },
  want: [
    { why: 'How to do it', title: '11.4 Unlocking Insights', line: 'Video review sessions offer a unique opportunity to analyze medical practices from multiple angles.' },
    { why: 'How to do it', title: '13.1 The Neoflix approach', line: 'Action research cycles were used to implement interventions, observe their effect over time, and re-evaluate their impact.' },
  ],
  under: [{ n: 3, title: 'Record, reflect, refine' }, { n: 5, title: 'The vocal cords' }],
  adjacent: ['still:team', 'still:focus', 'still:urgency'],
  witness: {
    img: 'frame:p023', at: '0:57', title: 'What do you remember?',
    lines: [
      { who: 'Colleague', text: 'I’m curious. What do you remember about the procedure?' },
      { who: 'Ruben', text: 'I found it difficult to get the catheter right. I could see everything clearly, however actually inserting the catheter was tough.' },
    ],
  },
};
const OUTLINE = [
  { label: 'Start' }, { label: 'In the moment', count: 3 },
  { chapter: 'Watching it back' }, { label: 'Skills', active: true }, { label: 'Team' }, { label: 'Perspectives' },
  { label: 'The evidence', count: 2 }, { label: 'Doing it yourself', count: 7 }, { label: 'Where next' },
];

// Cold tokens only: warm is a deviation from sterility.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap');
.np { --ink:#16163a; --ink-soft:#55597a; --ink-mute:#9195b2; --brand:#1c1c6e; --accent:#3b5bdb; --teal:#14868c;
  --display:'Space Grotesk','Inter',system-ui,sans-serif;
  --shadow:0 1px 2px rgba(20,20,58,.05),0 12px 34px rgba(20,20,58,.08);
  position:relative; width:100%; min-height:760px; overflow:hidden; font-family:Inter,system-ui,sans-serif; color:var(--ink);
  background:radial-gradient(120% 90% at 70% 10%,#eef3fb 0%,#dfe7f3 60%,#d6e0ee 100%); }
.np * { box-sizing:border-box; }
.side { position:absolute; left:14px; top:14px; bottom:14px; width:224px; padding:26px 16px; border-radius:22px;
  background:rgba(248,251,255,.72); backdrop-filter:blur(18px); box-shadow:0 0 0 6px rgba(255,255,255,.35),var(--shadow); }
.side h1 { margin:0 0 22px 14px; font:600 21px var(--display); color:var(--brand); }
.side .row { display:flex; justify-content:space-between; padding:9px 14px; border-radius:10px; font-size:14px; color:var(--ink-soft); }
.side .row.on { background:rgba(140,174,244,.22); color:var(--brand); font-weight:600; }
.side .ch { margin:14px 14px 6px; font-size:10.5px; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-mute); font-weight:600; }
.stage { position:absolute; left:262px; right:24px; top:0; bottom:0; }
.head { position:absolute; top:34px; left:20px; display:flex; align-items:center; gap:14px; }
.head b { padding:2px 9px; border-radius:999px; background:var(--brand); color:#fff; font-size:12px; }
.head h2 { margin:0; font:500 22px var(--display); color:var(--brand); }
.of { position:absolute; top:40px; right:20px; font-size:11px; color:var(--ink-mute); }
.adj { position:absolute; top:-8px; width:132px; height:88px; border-radius:10px; overflow:hidden; box-shadow:var(--shadow); background:#22305a center/cover; }
.film { position:absolute; left:20px; top:110px; width:58%; height:470px; border-radius:22px; overflow:hidden;
  background:#0f1628 center/cover; box-shadow:0 2px 6px rgba(12,18,34,.16),0 18px 40px rgba(12,18,34,.26); z-index:2; }
.film::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(15,22,40,0) 20%,rgba(15,22,40,.86) 58%,#0f1628 80%); }
.film .w { position:absolute; left:42px; right:42px; bottom:44px; z-index:1; color:#e6ecfb; }
.film .e { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#9fdde3; font-weight:600; }
.film h3 { margin:8px 0 18px; font:500 40px/1.08 var(--display); color:#fff; }
.film p { margin:0; padding-left:18px; border-left:2px solid #6fc7cf; font-size:16px; line-height:1.65; color:#cfd8ee; }
.under { position:absolute; top:548px; width:220px; padding:30px 16px 14px; border-radius:0 0 14px 14px; background:#fff; box-shadow:var(--shadow); z-index:1; font-size:13px; }
.under em { font:500 17px var(--display); font-style:normal; color:var(--accent); margin-right:8px; }
.right { position:absolute; left:calc(58% + 70px); right:20px; top:110px; z-index:2; display:grid; gap:12px; }
.moment { border-radius:20px; overflow:hidden; padding:0 22px 18px; background:radial-gradient(120% 90% at 30% 0%,#1a2440 0%,#0f1628 70%); color:#e6ecfb; box-shadow:0 18px 40px rgba(12,18,34,.26); }
.moment .still { height:150px; margin:0 -22px -40px; background:#26365e center/cover; -webkit-mask-image:linear-gradient(#000 45%,transparent); mask-image:linear-gradient(#000 45%,transparent); opacity:.85; }
.moment .tag { position:relative; font-size:10.5px; letter-spacing:.13em; text-transform:uppercase; color:#9fdde3; font-weight:600; }
.moment strong { position:relative; display:block; margin:4px 0 10px; font:500 18px var(--display); color:#fff; }
.moment b { display:block; margin-top:8px; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:#9fb6f5; }
.moment span { font-size:14px; line-height:1.5; }
.moment button { margin-top:14px; padding:8px 16px; border:0; border-radius:999px; background:rgba(255,255,255,.12); color:#fff; font-weight:600; font-size:13px; }
.wl { margin:8px 0 0; font-size:10.5px; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-mute); font-weight:600; }
.want { padding:14px 18px; border-radius:14px; background:#fff; box-shadow:var(--shadow); }
.want i { font-style:normal; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--teal); font-weight:600; }
.want h4 { margin:4px 0; font-size:15px; }
.want p { margin:0; font-size:13px; color:var(--ink-soft); line-height:1.5; }
.wires { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; z-index:1; overflow:visible; }
`;

const bg = (k) => (IMG[k] ? { backgroundImage: `url(${IMG[k]})` } : {});

/** Broad dashed white edges from the subject's right edge to each want. */
function Wires({ stage, from, to }) {
  const [paths, setPaths] = useState([]);
  // A passive effect, not a layout one: a child's layout effect runs before
  // the parent's ref is attached. Re-measure once fonts land, and on resize.
  useEffect(() => {
    const draw = () => {
    const s = stage.current?.getBoundingClientRect();
    const f = from.current?.getBoundingClientRect();
    if (!s || !f) return;
    setPaths(to.current.filter(Boolean).map((el) => {
      const r = el.getBoundingClientRect();
      const x1 = f.right - s.left, y1 = f.top - s.top + f.height * 0.55;
      const x2 = r.left - s.left, y2 = r.top - s.top + r.height / 2;
      const mx = (x1 + x2) / 2;
      return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    }));
    };
    draw();
    document.fonts?.ready.then(draw);
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);
  return (
    <svg className="wires">
      {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="5" strokeDasharray="10 9" strokeLinecap="round" />)}
    </svg>
  );
}

export default function AtlasPage() {
  const stage = useRef(null);
  const film = useRef(null);
  const wants = useRef([]);
  const p = PAGE;
  return (
    <div className="np">
      <style>{CSS}</style>
      <nav className="side">
        <h1>Neoflix</h1>
        {OUTLINE.map((o, i) => (o.chapter
          ? <div key={i} className="ch">{o.chapter}</div>
          : <div key={i} className={`row${o.active ? ' on' : ''}`}><span>{o.label}</span><span>{o.count ?? '›'}</span></div>))}
      </nav>
      <main className="stage" ref={stage}>
        <div className="head"><b>{p.num}</b><h2>{p.running}</h2></div>
        <div className="of">{p.of}</div>
        {/* Neighbours percolate out of the top edge and tether off-screen. */}
        {p.adjacent.map((k, i) => <div key={k} className="adj" style={{ left: `${300 + i * 150}px`, transform: `translateY(${[0, -14, 6][i]}px) rotate(${[-2, 1.5, -1][i]}deg)`, ...bg(k) }} />)}
        {/* The evidence, tucked under the subject's lower edge. */}
        {p.under.map((u, i) => <div key={u.n} className="under" style={{ left: `${40 + i * 240}px` }}><em>{u.n}</em>{u.title}</div>)}
        <section className="film" ref={film} style={bg(p.film.img)}>
          <div className="w">
            <div className="e">{p.film.eyebrow}</div>
            <h3>{p.film.headline}</h3>
            <p>{p.film.words}</p>
          </div>
        </section>
        <aside className="right">
          <figure className="moment" style={{ margin: 0 }}>
            <div className="still" style={bg(p.witness.img)} />
            <div className="tag">In the session film · {p.witness.at}</div>
            <strong>{p.witness.title}</strong>
            {p.witness.lines.map((l, i) => <div key={i}><b>{l.who}</b><span>{l.text}</span></div>)}
            <button type="button">▶ Watch this moment</button>
          </figure>
          <p className="wl">You might also want</p>
          {p.want.map((w, i) => (
            <div key={w.title} className="want" ref={(el) => { wants.current[i] = el; }}>
              <i>{w.why}</i><h4>{w.title}</h4><p>{w.line}</p>
            </div>
          ))}
        </aside>
        <Wires stage={stage} from={film} to={wants} />
      </main>
    </div>
  );
}
