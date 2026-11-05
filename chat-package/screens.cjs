// Screenshots of the current site for the chat package (1440×900, desktop).
// node chat-package/screens.cjs <base-url> <out-dir>
const { chromium } = require('playwright');
const [base = 'http://localhost:4173', out = 'chat-package/out/screens'] = process.argv.slice(2);
const SHOTS = [
  ['01-cover', '/'],
  ['02-film-stop-urgency', '/?at=1'],
  ['03-intermission', '/?at=4'],
  ['04-film-stop-skills-with-moment', '/?at=5'],
  ['05-papers-stop', '/?at=9'],
  ['06-record-page', '/?at=0.0.0'],
  ['07-reading-verbatim', '/?at=0.2.0.0'],
  ['08-reading-intermission', '/?at=0.2.0.5'],
  ['09-synopsis', '/?at=0.2.1.0'],
  ['10-transcript', '/?at=0.3'],
  ['11-loop-step', '/?at=12.0'],
];
(async () => {
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [name, url] of SHOTS) {
    await p.goto(base + url);
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${name}.png` });
  }
  await b.close();
  console.log(`[screens] ${SHOTS.length} → ${out}`);
})();
