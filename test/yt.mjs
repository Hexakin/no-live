// Shared helpers for the probe and the tests.
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

// Real Edge by default: Playwright's own Chromium can't decode YouTube's live streams, so the
// control run (live plays without No Live) would prove nothing there.
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const CHROME = process.env.NO_LIVE_CHROME || (fs.existsSync(EDGE) ? EDGE :
  path.join(os.homedir(), 'AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'));

// UK visitors get a consent wall. Set the "rejected" consent cookie up front, and click
// Reject if the wall shows anyway. (The button's accessible name is "Reject the use of cookies...".)
export async function acceptConsent(page) {
  await page.context().addCookies(['.youtube.com', '.youtube-nocookie.com'].map((domain) =>
    ({ name: 'SOCS', value: 'CAI', domain, path: '/', secure: true, sameSite: 'Lax' })));
  await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
  if (page.url().includes('consent.')) {
    await page.getByRole('button', { name: /^reject/i }).first().click();
    await page.waitForURL(/www\.youtube\.com/, { timeout: 20000 });
  } else {
    const btn = page.getByRole('button', { name: /^reject/i }).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) await btn.click();
  }
}

// Search results carry the "Live" filter in sp=EgJAAQ%3D%3D. Hardcoded ids die, so pick one now.
export async function findLiveId(page, query = 'news') {
  await page.goto(`https://www.youtube.com/results?search_query=${query}&sp=EgJAAQ%253D%253D`,
    { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ytInitialData, null, { timeout: 30000 });
  const ids = await page.evaluate(() => {
    const found = [];
    JSON.stringify(window.ytInitialData, (k, v) => {
      if (v && typeof v === 'object' && v.videoId && JSON.stringify(v).includes('BADGE_STYLE_TYPE_LIVE_NOW')) found.push(v.videoId);
      return v;
    });
    return found;
  });
  if (!ids.length) throw new Error('no live stream found in search');
  return ids[0];
}

export async function findNormalId(page, query = 'how to boil an egg') {
  await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ytInitialData, null, { timeout: 30000 });
  return page.evaluate(() => {
    let id = null;
    JSON.stringify(window.ytInitialData, (k, v) => {
      if (!id && v && typeof v === 'object' && v.videoRenderer?.videoId) id = v.videoRenderer.videoId;
      return v;
    });
    return id;
  });
}
