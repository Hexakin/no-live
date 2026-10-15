// End-to-end check against real YouTube.
//   node test/run.mjs                    the browser extension
//   node test/run.mjs --userscript       the userscript, injected at document start the way Tampermonkey does
// Each check prints PASS/FAIL. The control run (no extension) proves the checks can fail.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CHROME, acceptConsent, findLiveId, findNormalId } from './yt.mjs';

const EXT = path.resolve('extension');
const USERSCRIPT = (process.env.NO_LIVE_MODE === 'userscript' || process.argv.includes('--userscript')) ? path.resolve('userscript/no-live.user.js') : null;
console.log('testing', USERSCRIPT ? 'userscript' : 'extension', 'in', path.basename(CHROME));
const OUT = path.resolve('test/out');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const report = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

async function launch(withExtension, mobile = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nolive-'));
  const args = ['--autoplay-policy=no-user-gesture-required', '--mute-audio'];
  if (withExtension && !USERSCRIPT) args.push(`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`);
  const ctx = await chromium.launchPersistentContext(dir, {
    executablePath: CHROME, headless: true, args, locale: 'en-GB',
    ignoreDefaultArgs: ['--disable-extensions'],
    ...(mobile ? { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36' } : {}),
  });
  if (withExtension && USERSCRIPT) await ctx.addInitScript({ path: USERSCRIPT });
  const page = ctx.pages()[0] || await ctx.newPage();
  return { ctx, page };
}

// What the player was told, plus whether the picture actually moved.
async function state(page, ms = 9000, target = page) {
  // The UK consent box can come back on any page and pauses playback underneath it.
  const reject = page.getByRole('button', { name: /^reject/i }).first();
  if (await reject.isVisible({ timeout: 1500 }).catch(() => false)) await reject.click().catch(() => {});
  await target.evaluate(() => {
    const p = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
    try { p && p.playVideo && p.playVideo(); } catch (e) {}
    for (const v of document.querySelectorAll('video')) v.play().catch(() => {});
  }).catch(() => {});
  const read = () => target.evaluate(() => {
    const p = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
    let pr = null;
    try { pr = p && p.getPlayerResponse ? p.getPlayerResponse() : null; } catch (e) {}
    pr = pr || window.ytInitialPlayerResponse || null;
    const v = [...document.querySelectorAll('video')].sort((a, b) => b.currentTime - a.currentTime)[0];
    return {
      status: pr && pr.playabilityStatus ? pr.playabilityStatus.status : null,
      stream: !!(pr && pr.streamingData),
      ad: !!(p && p.classList.contains('ad-showing')),
      t: v ? v.currentTime : 0,
      said: document.body.innerText.includes('Live streams are blocked'),
      log: (window.__noLiveLog || []).filter((x) => !/ via json$/.test(x) || !/^allowed/.test(x)).slice(-3).join(' | '),
    };
  });
  await page.waitForTimeout(3000);
  const a = await read();
  await page.waitForTimeout(ms);
  const b = await read();
  return { ...b, advanced: +(b.t - a.t).toFixed(1) };
}
const plays = (s) => s.status === 'OK' && s.stream && !s.said && (s.advanced > 1 || s.ad);
const blocked = (s) => s.said && s.advanced < 0.5;

async function liveTiles(page) {
  return page.evaluate(() => {
    const live = document.querySelectorAll(
      '[class*="BadgeShapeLive"], .badge-style-type-live-now-alternate, ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"], .yt-badge-shape--thumbnail-live, badge-shape[class*="live"]');
    const tiles = document.querySelectorAll('ytd-video-renderer, yt-lockup-view-model, ytd-rich-item-renderer, ytm-video-with-context-renderer, ytm-compact-video-renderer');
    return { live: [...live].filter((e) => e.offsetParent !== null).length, tiles: tiles.length };
  });
}

// ---- find fresh ids with a plain browser ----
const scout = await launch(false);
await acceptConsent(scout.page);
const liveId = await findLiveId(scout.page);
const normalId = await findNormalId(scout.page);
console.log('live id', liveId, '| normal id', normalId);

// ---- control: without the extension the live stream plays and live tiles show ----
await scout.page.goto(`https://www.youtube.com/watch?v=${liveId}`);
const ctl = await state(scout.page);
report('control: live plays without No Live', plays(ctl), JSON.stringify(ctl));
await scout.page.goto('https://www.youtube.com/results?search_query=news&sp=EgJAAQ%253D%253D');
await scout.page.waitForTimeout(5000);
const ctlTiles = await liveTiles(scout.page);
report('control: live search shows live tiles', ctlTiles.live > 0, JSON.stringify(ctlTiles));
await scout.ctx.close();

// ---- with the extension ----
const { ctx, page } = await launch(true);
await acceptConsent(page);

await page.goto(`https://www.youtube.com/watch?v=${normalId}`);
const normal = await state(page);
report('normal video still plays', plays(normal), JSON.stringify(normal));

// SPA hop: normal -> live without a page load.
await page.evaluate(() => { window.__noReload = true; });
await page.evaluate((id) => {
  document.querySelector('ytd-app').dispatchEvent(new CustomEvent('yt-navigate', {
    bubbles: true, composed: true,
    detail: { endpoint: { commandMetadata: { webCommandMetadata: { url: `/watch?v=${id}`, webPageType: 'WEB_PAGE_TYPE_WATCH', rootVe: 3832 } }, watchEndpoint: { videoId: id } } },
  }));
}, liveId);
await page.waitForURL(new RegExp(liveId), { timeout: 15000 });
const spa = await state(page);
const stillSpa = await page.evaluate(() => window.__noReload === true);
report('SPA hop to live is blocked', stillSpa && blocked(spa), JSON.stringify({ ...spa, spa: stillSpa }));
await page.screenshot({ path: path.join(OUT, 'spa-live.png') });

await page.goto(`https://www.youtube.com/watch?v=${liveId}`);
const direct = await state(page);
report('direct load of live is blocked', blocked(direct), JSON.stringify(direct));
await page.screenshot({ path: path.join(OUT, 'direct-live.png') });

await page.goto('https://www.youtube.com/results?search_query=news&sp=EgJAAQ%253D%253D');
await page.waitForTimeout(5000);
const t = await liveTiles(page);
report('live search shows no live tiles', t.live === 0, JSON.stringify(t));
await page.screenshot({ path: path.join(OUT, 'search-live.png') });

await page.goto('https://www.youtube.com/results?search_query=how+to+boil+an+egg');
await page.waitForTimeout(5000);
const n = await liveTiles(page);
report('normal search still has results', n.tiles >= 5, JSON.stringify(n));

const HOST = 'https://nolive-test.example/';
await page.route(HOST + '**', (route) => {
  const src = new URL(route.request().url()).searchParams.get('src');
  route.fulfill({ contentType: 'text/html', body: `<!doctype html><title>embed test</title><iframe width="640" height="360" src="${src}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>` });
});
for (const host of ['www.youtube.com', 'www.youtube-nocookie.com']) {
  for (const [label, id, want] of [['live', liveId, 'blocked'], ['normal', normalId, 'plays']]) {
    await page.goto(HOST + '?src=' + encodeURIComponent(`https://${host}/embed/${id}?autoplay=1&mute=1`));
    await page.waitForTimeout(4000);
    const frame = page.frames().find((f) => f.url().includes('/embed/'));
    if (frame) await frame.click('.ytp-large-play-button', { timeout: 5000 }).catch(() => {});
    const e = frame ? await state(page, 9000, frame) : { error: 'no frame' };
    report(`embed on ${host}: ${label} ${want}`, frame && (want === 'blocked' ? blocked(e) : plays(e)), JSON.stringify(e));
    if (label === 'live') await page.screenshot({ path: path.join(OUT, `embed-${host}.png`) });
  }
}
await ctx.close();

// ---- mobile site ----
const m = await launch(true, true);
await acceptConsent(m.page);
await m.page.goto(`https://m.youtube.com/watch?v=${liveId}`);
await m.page.waitForTimeout(2000);
await m.page.click('body', { position: { x: 200, y: 120 } }).catch(() => {});
const mob = await state(m.page);
report('mobile site: live is blocked', blocked(mob), JSON.stringify({ ...mob, url: m.page.url() }));
await m.page.screenshot({ path: path.join(OUT, 'mobile-live.png') });
await m.page.goto(`https://m.youtube.com/watch?v=${normalId}`);
await m.page.waitForTimeout(2000);
await m.page.click('body', { position: { x: 200, y: 120 } }).catch(() => {});
const mobN = await state(m.page);
report('mobile site: normal video plays', plays(mobN), JSON.stringify(mobN));
await m.ctx.close();

const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} FAILED` : 'ALL PASS');
process.exit(failed ? 1 : 0);
