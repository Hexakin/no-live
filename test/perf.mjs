// Times the guard's work on captured YouTube responses. Parses each file with and without
// the guard in the same browser and reports the median extra milliseconds per parse.
//   node test/perf.mjs            (needs test/out/, made by test/probe.mjs)
// The guard only does work on JSON that mentions live markers; the other files cost nothing extra.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { CHROME } from './yt.mjs';

const OUT = path.resolve('test/out');
const GUARD = path.resolve('extension/guard.js');
const RUNS = 25;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const plainCtx = await browser.newContext();
const guardCtx = await browser.newContext();
await guardCtx.addInitScript({ path: GUARD });
const plain = await plainCtx.newPage();
const guarded = await guardCtx.newPage();
await plain.setContent('<html></html>');
await guarded.setContent('<html></html>');

const timeParses = (page, text) => page.evaluate(({ text, RUNS }) => {
  const times = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    JSON.parse(text);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return { median: times[Math.floor(RUNS / 2)], min: times[0] };
}, { text, RUNS });

const median = (page, text) => timeParses(page, text);
const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.json'));
const rows = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(OUT, f), 'utf8');
  const base = await median(plain, text);
  const g = await median(guarded, text);
  rows.push({
    file: f,
    kb: +(text.length / 1024).toFixed(0),
    nativeMs: +base.median.toFixed(2),
    guardMs: +g.median.toFixed(2),
    extraMs: +(g.median - base.median).toFixed(2),
  });
}
console.table(rows);
await browser.close();
