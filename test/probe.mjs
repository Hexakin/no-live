// Probe: dump the player response for one live and one normal video, so the guard
// keys off real field names rather than remembered ones.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { CHROME, acceptConsent, findLiveId, findNormalId } from './yt.mjs';

const out = new URL('./out/', import.meta.url);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ locale: 'en-GB' });
await acceptConsent(page);

const liveId = await findLiveId(page);
const normalId = await findNormalId(page);
console.log('live', liveId, 'normal', normalId);

for (const [name, id] of [['live', liveId], ['normal', normalId]]) {
  await page.goto(`https://www.youtube.com/watch?v=${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ytInitialPlayerResponse, null, { timeout: 30000 });
  const pr = await page.evaluate(() => window.ytInitialPlayerResponse);
  fs.writeFileSync(new URL(`${name}.json`, out), JSON.stringify(pr, null, 1));
  const vd = pr.videoDetails || {};
  const mf = pr.microformat?.playerMicroformatRenderer || {};
  console.log(name, {
    isLive: vd.isLive, isLiveContent: vd.isLiveContent, isUpcoming: vd.isUpcoming,
    liveBroadcastDetails: mf.liveBroadcastDetails,
    playability: pr.playabilityStatus?.status,
    liveStreamability: !!pr.playabilityStatus?.liveStreamability,
    hlsManifest: !!pr.streamingData?.hlsManifestUrl,
  });
}
await browser.close();
