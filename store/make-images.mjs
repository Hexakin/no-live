// Makes the store screenshots (1280x800) and the small promo tile (440x280).
// Run from the repo root after `node build.mjs`:  node store/make-images.mjs
// Uses real Edge with the extension, and the same launch and consent handling as the tests
// (test/yt.mjs). Intermediate files go to the scratch folder, not the repo.
// Store rule: no broadcaster names or logos. Search results are blurred and captioned, and the
// player shots only show the No Live overlay or an ordinary video's player area.
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CHROME, acceptConsent, findLiveId } from '../test/yt.mjs';

const SCRATCH = path.join(os.tmpdir(), 'no-live-store');
const EXT = path.resolve('extension');
const IMG = path.resolve('store/images');
const ICON = path.resolve('extension/icons/icon-128.png');
fs.mkdirSync(SCRATCH, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

async function launch(withExtension) {
  const dir = fs.mkdtempSync(path.join(SCRATCH, 'profile-'));
  const args = ['--autoplay-policy=no-user-gesture-required', '--mute-audio'];
  if (withExtension) args.push(`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`);
  const ctx = await chromium.launchPersistentContext(dir, {
    executablePath: CHROME, headless: true, args, locale: 'en-GB',
    viewport: { width: 1280, height: 800 }, ignoreDefaultArgs: ['--disable-extensions'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  return { ctx, page };
}

async function dismissConsent(page) {
  const reject = page.getByRole('button', { name: /^reject/i }).first();
  if (await reject.isVisible({ timeout: 1000 }).catch(() => false)) await reject.click().catch(() => {});
}

// Hide the player's control bar (it shows the video title on hover) for the store shots.
const HIDE_CHROME = `.ytp-chrome-top, .ytp-chrome-bottom, .ytp-gradient-top, .ytp-gradient-bottom,
  ytd-watch-metadata, #below { display: none !important; }`;

// Composes a player-area PNG onto a 1280x800 card with a headline underneath.
// blurs: [left, top, width, height] boxes in player-pixel coordinates, blurred over the frame
// (used to soften a creator's watermark in an ordinary video).
async function composeCard(page, playerPng, headline, sub, outName, blurs = []) {
  const html = path.join(SCRATCH, `${outName}.html`);
  const boxes = blurs.map((b) => `<i style="left:${b[0]}px;top:${b[1]}px;width:${b[2]}px;height:${b[3]}px"></i>`).join('');
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1280px;height:800px;background:#0f0f0f;color:#fff;
      font-family:"Segoe UI",Arial,sans-serif;overflow:hidden}
    .wrap{height:800px;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .frame{position:relative;display:inline-block;line-height:0;border-radius:10px;overflow:hidden;
      box-shadow:0 8px 40px rgba(0,0,0,.6)}
    img{max-width:1088px;max-height:540px;width:auto;height:auto;display:block}
    .frame i{position:absolute;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
    h1{margin:30px 0 6px;font-size:34px;font-weight:600}
    p{margin:0;font-size:20px;color:#bdbdbd}
    .brand{position:absolute;left:40px;bottom:28px;font-size:18px;color:#8a8a8a}
  </style></head><body><div class="wrap"><div class="frame">
    <img src="${pathToFileURL(playerPng)}">${boxes}</div>
    <h1>${headline}</h1><p>${sub}</p>
  </div><div class="brand">No Live by Hillmade</div></body></html>`);
  const card = await page.context().newPage();
  await card.setViewportSize({ width: 1280, height: 800 });
  await card.goto(pathToFileURL(html));
  await card.waitForTimeout(500);
  await card.screenshot({ path: path.join(IMG, outName + '.png') });
  await card.close();
}

function pathToFileURL(p) {
  return 'file:///' + path.resolve(p).replace(/\\/g, '/');
}

// Banner across the top of a full-page search shot. Blurs the result tiles so no titles,
// channel names or thumbnails are readable.
async function searchShot(page, outName, caption) {
  await page.addStyleTag({ content: `
    ytd-item-section-renderer, ytd-item-section-renderer * { color: transparent !important; text-shadow: none !important; }
    ytd-item-section-renderer img { visibility: hidden !important; }
    ytd-item-section-renderer ytd-thumbnail, ytd-item-section-renderer yt-thumbnail-view-model,
      ytd-item-section-renderer .yt-lockup-view-model__content-image { background: #cfcfcf !important; }
    ytd-item-section-renderer [class*="BadgeShapeLive"], ytd-item-section-renderer [class*="BadgeShapeLive"] *,
      ytd-item-section-renderer .badge-style-type-live-now-alternate,
      ytd-item-section-renderer .badge-style-type-live-now-alternate *,
      ytd-item-section-renderer ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"] * { color: #fff !important; }
    ytd-video-preview, #video-preview { display: none !important; }
    #no-live-banner { position: fixed; top: 0; left: 0; right: 0; height: 64px; z-index: 2147483646;
      background: #111; color: #fff; font: 600 22px "Segoe UI", Arial, sans-serif;
      display: flex; align-items: center; padding: 0 28px; box-sizing: border-box; }
    #no-live-banner span { color: #9ad3ff; margin-right: 14px; font-weight: 500; font-size: 18px; }
  ` });
  await page.evaluate((text) => {
    const b = document.createElement('div');
    b.id = 'no-live-banner';
    const tag = document.createElement('span');
    tag.textContent = 'NO LIVE';
    b.appendChild(tag);
    b.appendChild(document.createTextNode(text));
    document.body.appendChild(b);
  }, caption);
  await page.mouse.move(640, 30);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(IMG, outName + '.png') });
}

const LIVE_SEARCH = 'https://www.youtube.com/results?search_query=news&sp=EgJAAQ%253D%253D';

// Clears the old search shots so only the current set is in the folder.
for (const old of ['screenshot-2-live-filter-no-live-1280x800.png', 'screenshot-3-normal-search-1280x800.png',
  'screenshot-4-normal-video-1280x800.png']) {
  fs.rmSync(path.join(IMG, old), { force: true });
}

// ---- find fresh ids with a plain browser (no extension, so the live results are visible) ----
const scout = await launch(false);
let liveId, normalId;
try {
  await acceptConsent(scout.page);
  liveId = await findLiveId(scout.page);
  // Shot 5 uses a fixed, ordinary upload with no watermark or broadcaster branding: a random
  // search pick brought creator watermarks and a presenter into the frame. If it ever
  // disappears, the shot throws instead of falling back to something unchecked.
  normalId = 'jNQXAC9IVRw';
  console.log('live id', liveId, '| normal id', normalId);

  // ---- Shot 2 (control): the live search without No Live. LIVE badges stay visible. ----
  await scout.page.goto(LIVE_SEARCH, { waitUntil: 'domcontentloaded' });
  await scout.page.waitForTimeout(7000);
  await dismissConsent(scout.page);
  await searchShot(scout.page, 'screenshot-2-live-search-without-no-live-1280x800',
    'Without No Live: live streams sit in the results.');
  console.log('shot 2 (control) done');
} finally {
  await scout.ctx.close();
}

const { ctx, page } = await launch(true);
try {
  await acceptConsent(page);

  // ---- Shot 1: a live stream with No Live on ----
  await page.goto(`https://www.youtube.com/watch?v=${liveId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('Live streams are blocked'),
    null, { timeout: 40000 });
  await page.waitForTimeout(1500);
  // The blocked player is YouTube's own error card, sized to the player. Crop to that card only:
  // the title, channel name, and sidebar sit outside the crop.
  const card = await page.evaluate(() => {
    const e = document.querySelector('yt-playability-error-supported-renderers') || document.querySelector('#movie_player');
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page.screenshot({ path: path.join(SCRATCH, 'player-blocked.png'), clip: card });
  await composeCard(page, path.join(SCRATCH, 'player-blocked.png'),
    'Live streams are blocked before they play',
    'The player says so. Ordinary videos are unaffected.',
    'screenshot-1-live-blocked-1280x800');
  console.log('shot 1 done');

  // ---- Shot 3: the same live search with No Live on. No live tiles. ----
  await page.goto(LIVE_SEARCH, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await dismissConsent(page);
  await searchShot(page, 'screenshot-3-live-search-with-no-live-1280x800',
    'With No Live: no live streams are listed.');
  console.log('shot 3 done');

  // ---- Shot 4: normal search, results still show ----
  await page.goto('https://www.youtube.com/results?search_query=how+to+boil+an+egg',
    { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await dismissConsent(page);
  await searchShot(page, 'screenshot-4-normal-search-1280x800',
    'Normal search: ordinary videos still show.');
  console.log('shot 4 done');

  // ---- Shot 5: an ordinary video playing (ads skipped or waited out) ----
  await page.goto(`https://www.youtube.com/watch?v=${normalId}`, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: HIDE_CHROME + `
    .ytp-ad-overlay-container, .ytp-ad-player-overlay, .ytp-ad-image-overlay, #player-ads, ytd-ad-slot-renderer { display: none !important; }` });
  const deadline = Date.now() + 330000;
  let st;
  while (Date.now() < deadline) {
    st = await page.evaluate(() => {
      const p = document.querySelector('#movie_player');
      const adShowing = !!(p && p.classList.contains('ad-showing'));
      if (adShowing) {
        const skip = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern');
        if (skip) skip.click();
      }
      const v = document.querySelector('video');
      return { adShowing, t: v ? v.currentTime : 0, paused: v ? v.paused : null };
    });
    if (!st.adShowing && st.t > 4) break;
    await dismissConsent(page);
    await page.waitForTimeout(1000);
  }
  console.log('normal video state', JSON.stringify(st));
  // Never keep a frame with an advert in it: stop here and write no image for shot 5.
  if (st.adShowing || !(st.t > 4)) throw new Error('shot 5 skipped: an advert was still playing');
  await page.mouse.move(1270, 790);
  await page.waitForTimeout(1500);
  await page.locator('#movie_player').screenshot({ path: path.join(SCRATCH, 'player-normal.png') });
  await composeCard(page, path.join(SCRATCH, 'player-normal.png'),
    'Ordinary videos, clips and replays still play',
    'Only live streams are blocked.',
    'screenshot-5-normal-video-1280x800');
  console.log('shot 5 done');

  // ---- Small promo tile, 440x280 ----
  const promoHtml = path.join(SCRATCH, 'promo.html');
  fs.writeFileSync(promoHtml, `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:440px;height:280px;overflow:hidden;background:#101418;color:#fff;
      font-family:"Segoe UI",Arial,sans-serif}
    .card{position:relative;width:440px;height:280px;background:radial-gradient(circle at 80% 20%,#1d3550,#101418 60%)}
    img{position:absolute;left:34px;top:70px;width:120px;height:120px}
    .t{position:absolute;left:182px;top:74px;font-size:46px;font-weight:700;letter-spacing:-0.5px}
    .s{position:absolute;left:184px;top:134px;width:230px;font-size:18px;line-height:1.35;color:#d6e4f0}
    .b{position:absolute;left:184px;top:206px;font-size:14px;color:#8fa3b5}
  </style></head><body><div class="card">
    <img src="${pathToFileURL(ICON)}">
    <div class="t">No Live</div>
    <div class="s">Blocks every live stream on YouTube in this browser.</div>
    <div class="b">Videos still play. By Hillmade.</div>
  </div></body></html>`);
  const tile = await ctx.newPage();
  await tile.setViewportSize({ width: 440, height: 280 });
  await tile.goto(pathToFileURL(promoHtml));
  await tile.waitForTimeout(400);
  await tile.screenshot({ path: path.join(IMG, 'promo-small-440x280.png') });
  await tile.close();
  console.log('promo done');
} finally {
  await ctx.close();
}
console.log('ALL IMAGES WRITTEN');
