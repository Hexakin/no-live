// Offline checks of the guard's logic with synthetic, YouTube-shaped data. No network needed and
// nothing here touches YouTube. These prove the code paths (JSON.parse, Response.json, XHR, the
// ytInitial* globals, the feed scan and the backstop) in each engine. They do not prove that
// YouTube sends data in these shapes; test/run.mjs does that.
//   node test/offline.mjs                     Edge (Chromium)
//   node test/offline.mjs --engine=firefox    Playwright's Firefox
//   node test/offline.mjs --engine=webkit     Playwright's WebKit
import { chromium, firefox, webkit } from 'playwright';
import path from 'node:path';
import { CHROME } from './yt.mjs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const ENGINE = arg('engine') || 'chromium';
const ENGINES = { chromium, firefox, webkit };
// NO_LIVE_USERSCRIPT lets a run point at another build, e.g. an older guard, to prove a check can fail.
const USERSCRIPT = process.env.NO_LIVE_USERSCRIPT ? path.resolve(process.env.NO_LIVE_USERSCRIPT) : path.resolve('userscript/no-live.user.js');

const MESSAGE = 'Live streams are blocked in this browser (No Live).';
const pad = { responseContext: { serviceTrackingParams: [] }, playbackTracking: {}, annotations: [] };
const live = (id) => ({
  ...pad,
  playabilityStatus: { status: 'OK', playableInEmbed: true },
  streamingData: { hlsManifestUrl: 'https://manifest.example/live.m3u8', formats: [], adaptiveFormats: [] },
  videoDetails: { videoId: id, title: 'Live news', isLive: true, isLiveContent: true, lengthSeconds: '0' },
  microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: true, startTimestamp: '2026-10-15T10:00:00+00:00' } } },
});
const waiting = (id) => ({
  ...pad,
  playabilityStatus: { status: 'LIVE_STREAM_OFFLINE', reason: 'Waiting for the live stream to start', playableInEmbed: true },
  videoDetails: { videoId: id, title: 'Upcoming stream', isLive: false, isUpcoming: true, isLiveContent: true, lengthSeconds: '0' },
  microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: false, startTimestamp: '2026-10-15T20:00:00+00:00' } } },
});
const replay = (id) => ({
  ...pad,
  playabilityStatus: { status: 'OK', playableInEmbed: true },
  streamingData: { formats: [], adaptiveFormats: [{ url: 'https://video.example/replay' }] },
  videoDetails: { videoId: id, title: 'Replay of a stream', isLive: false, isLiveContent: true, lengthSeconds: '5400' },
  microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: false, startTimestamp: '2026-10-14T10:00:00+00:00', endTimestamp: '2026-10-14T11:30:00+00:00' } } },
});
const premiere = (id) => ({
  ...pad,
  playabilityStatus: { status: 'OK', playableInEmbed: true },
  streamingData: { formats: [], adaptiveFormats: [{ url: 'https://video.example/premiere' }] },
  videoDetails: { videoId: id, title: 'Premiere showing now', isLiveContent: true, lengthSeconds: '0' },
  microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: true, startTimestamp: '2026-10-15T10:00:00+00:00' } } },
});
const tile = (id, isLive) => ({ videoRenderer: { videoId: id, title: { simpleText: id }, badges: isLive ? [{ metadataBadgeRenderer: { style: 'BADGE_STYLE_TYPE_LIVE_NOW', label: 'LIVE NOW' } }] : [] } });
const browse = {
  ...pad,
  contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { content: { sectionListRenderer: { contents: [{ itemSectionRenderer: { contents: [
    tile('LIVE1', true), tile('NORM1', false),
    { shelfRenderer: { title: { simpleText: 'Shelf' }, content: { horizontalListRenderer: { items: [
      { gridVideoRenderer: { videoId: 'LIVE2', badges: [{ metadataBadgeRenderer: { style: 'BADGE_STYLE_TYPE_LIVE_NOW' } }] } },
      { gridVideoRenderer: { videoId: 'NORM2' } }] } } } },
  ] } }] } } } }] } },
};
// Same video id: live first, then the replay of that stream after it ended.
const sameLive = live('SWAP1');
const sameReplay = replay('SWAP1');
// A live payload with no video id at all.
const noIdLive = live('NOID1');
delete noIdLive.videoDetails.videoId;
const FIXTURES = {
  '/api/live': live('LIVE1'), '/api/live-text': live('LIVE1'), '/api/waiting': waiting('WAIT1'),
  '/api/replay': replay('REPL1'), '/api/premiere': premiere('PREM1'), '/api/browse': browse,
  '/api/not-json': null,
};

const browser = await ENGINES[ENGINE].launch(ENGINE === 'chromium' ? { executablePath: CHROME, headless: true } : { headless: true });
const ctx = await browser.newContext({ locale: 'en-GB' });
await ctx.addInitScript({ path: USERSCRIPT });
await ctx.route('https://www.youtube.com/**', (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/not-json') return route.fulfill({ contentType: 'text/plain', body: 'not json at all' });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(FIXTURES[url.pathname]) });
  }
  return route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><title>offline</title><body></body>' });
});

const results = [];
const report = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  offline: ${name}  ${detail}`); };

// ---- data layer, in a page that behaves like www.youtube.com ----
const data = await ctx.newPage();
await data.goto('https://www.youtube.com/page');
const d = await data.evaluate(async (MESSAGE) => {
  const json = async (p) => (await fetch(p)).json();
  const text = async (p) => (await fetch(p)).text();
  const xhr = (p) => new Promise((resolve, reject) => {
    const x = new XMLHttpRequest(); x.open('GET', p); x.onload = () => resolve(x.responseText); x.onerror = reject; x.send();
  });
  const out = {};
  out.waiting = await json('/api/waiting');
  out.live = await json('/api/live');
  out.liveText = JSON.parse(await text('/api/live-text'));
  out.liveXhr = JSON.parse(await xhr('/api/live'));
  out.replay = JSON.parse(await text('/api/replay'));
  out.premiere = await json('/api/premiere');
  out.guardMarkerWritable = Object.getOwnPropertyDescriptor(window, '__noLiveGuard')?.writable;
  out.browseText = JSON.stringify(JSON.parse(await text('/api/browse')));
  try { JSON.parse('{not json'); out.badJsonError = 'none'; } catch (e) { out.badJsonError = e.name; }
  try { await json('/api/not-json'); out.badResponseError = 'none'; } catch (e) { out.badResponseError = e.name; }
  // Set as a plain object, the way YouTube's inline script does on a first page load.
  window.ytInitialPlayerResponse = {
    playabilityStatus: { status: 'OK' }, streamingData: { formats: [{ url: 'https://video.example/x' }] },
    videoDetails: { videoId: 'LIVE1', title: 'Live news', isLive: true },
    microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: true } } },
  };
  out.ytInitialPlayerResponse = window.ytInitialPlayerResponse;
  // Set as a string, the raw feed text, which the setter must clean before YouTube reads it.
  window.ytInitialData = await text('/api/browse');
  out.ytInitialDataText = window.ytInitialData;
  return out;
}, MESSAGE);

const reasonIs = (pr) => pr.playabilityStatus && pr.playabilityStatus.errorScreen &&
  pr.playabilityStatus.errorScreen.playerErrorMessageRenderer.reason.simpleText === MESSAGE;
const ids = (text) => [...text.matchAll(/"videoId":"([^"]+)"/g)].map((m) => m[1]);
const blockedLive = (pr) => pr.playabilityStatus.status === 'UNPLAYABLE' && !pr.streamingData && reasonIs(pr);

report('waiting stream (not live yet) is left alone', d.waiting.playabilityStatus.status === 'LIVE_STREAM_OFFLINE' && d.waiting.playabilityStatus.reason === 'Waiting for the live stream to start');
report('live now via fetch + res.json() is blocked', blockedLive(d.live), JSON.stringify(d.live.playabilityStatus));
report('live now via res.text() + JSON.parse is blocked', blockedLive(d.liveText), JSON.stringify(d.liveText.playabilityStatus));
report('live now via XHR responseText is blocked', blockedLive(d.liveXhr), JSON.stringify(d.liveXhr.playabilityStatus));
report('replay of an ended stream still plays', d.replay.playabilityStatus.status === 'OK' && !!d.replay.streamingData);
report('premiere showing now (isLiveNow only) is blocked', blockedLive(d.premiere), JSON.stringify(d.premiere.playabilityStatus));
report('guard marker cannot be overwritten by a page script', d.guardMarkerWritable === false, String(d.guardMarkerWritable));
report('live tiles removed from feed, normal tiles and shelf kept', JSON.stringify(ids(d.browseText)) === JSON.stringify(['NORM1', 'NORM2']), JSON.stringify(ids(d.browseText)));
report('live player set as an object on ytInitialPlayerResponse is blocked', blockedLive(d.ytInitialPlayerResponse));
report('live feed set as a string on ytInitialData is cleaned', !ids(d.ytInitialDataText).includes('LIVE1') && !ids(d.ytInitialDataText).includes('LIVE2') && ids(d.ytInitialDataText).includes('NORM1'), JSON.stringify(ids(d.ytInitialDataText)));
report('a bad JSON string still throws SyntaxError (not swallowed)', d.badJsonError === 'SyntaxError', d.badJsonError);
report('a bad response body still rejects with SyntaxError (not swallowed)', d.badResponseError === 'SyntaxError', d.badResponseError);

// ---- backstop, on a fake player element ----
const back = await ctx.newPage();
await back.goto('https://www.youtube.com/page');
const b = await back.evaluate(async (fx) => {
  const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));
  const player = (vid, pr) => {
    const p = document.createElement('div');
    p.id = 'movie_player'; p.className = 'html5-video-player';
    const v = document.createElement('video');
    p.appendChild(v); document.body.appendChild(p);
    p.getPlayerResponse = () => pr;
    p.getVideoData = () => ({ video_id: vid, isLive: false });
    p.stopVideo = () => {};
    return { p, v };
  };
  const overlay = (p) => !!p.querySelector('#no-live-overlay');
  const out = {};
  const { p, v } = player('LIVE1', fx.live);
  v.dispatchEvent(new Event('loadstart'));
  v.dispatchEvent(new Event('play'));
  await wait();
  out.backstopPaused = v.paused; out.backstopMuted = v.muted; out.backstopCovered = overlay(p);
  v.muted = false; v.dispatchEvent(new Event('volumechange'));
  await wait();
  out.unmuteReMuted = v.muted === true;
  p.querySelector('#no-live-overlay').remove();
  v.muted = false; v.dispatchEvent(new Event('play'));
  await wait();
  out.overlayRestoredOnPlay = overlay(p); out.muteAfterOverlayRemoved = v.muted === true;
  p.querySelector('#no-live-overlay').remove();
  await wait(1500);
  out.overlayRestoredByInterval = overlay(p);
  p.remove();
  const again = player('LIVE1', fx.live);
  again.v.muted = false; again.v.dispatchEvent(new Event('loadstart'));
  await wait();
  out.rerenderMuted = again.v.muted === true; out.rerenderCovered = overlay(again.p);
  again.p.getPlayerResponse = () => fx.normal; again.p.getVideoData = () => ({ video_id: 'NORM1', isLive: false });
  again.p.querySelector('#no-live-overlay')?.remove();
  again.v.muted = false; again.v.dispatchEvent(new Event('timeupdate'));
  await wait();
  out.normalNotCovered = !overlay(again.p); out.normalKeepsSound = again.v.muted === false;
  // Bare players: the backstop's checks above use a player that has a video id.
  const bare = (pr, vd) => {
    const p = document.createElement('div');
    p.id = 'movie_player'; p.className = 'html5-video-player';
    const v = document.createElement('video');
    p.appendChild(v); document.body.appendChild(p);
    p.getPlayerResponse = () => pr; p.getVideoData = () => vd; p.stopVideo = () => {};
    return { p, v };
  };
  // Same id, live then replay: once the stream has ended, its replay must not stay covered.
  JSON.parse(JSON.stringify(fx.sameLive));
  JSON.parse(JSON.stringify(fx.sameReplay));
  const r = bare(fx.sameReplay, { video_id: 'SWAP1', isLive: false });
  r.v.dispatchEvent(new Event('loadstart'));
  await wait();
  out.replayAfterLiveNotCovered = !overlay(r.p) && r.v.muted === false;
  r.p.remove();
  // A live payload with no video id must not make every empty player count as live.
  JSON.parse(JSON.stringify(fx.noIdLive));
  const u = bare(fx.normal, { isLive: false });
  u.v.dispatchEvent(new Event('loadstart'));
  await wait();
  out.noIdNotCovered = !overlay(u.p) && u.v.muted === false;
  u.p.remove();
  return out;
}, { live: live('LIVE1'), sameLive, sameReplay, noIdLive, normal: { ...pad, playabilityStatus: { status: 'OK' }, videoDetails: { videoId: 'NORM1', isLive: false } } });

report('backstop pauses, mutes and covers a live player', b.backstopPaused && b.backstopMuted && b.backstopCovered, JSON.stringify({ paused: b.backstopPaused, muted: b.backstopMuted, covered: b.backstopCovered }));
report('unmuting a live player is muted again at once (volumechange)', b.unmuteReMuted);
report('overlay removed by YouTube is restored and audio stays muted on play', b.overlayRestoredOnPlay && b.muteAfterOverlayRemoved);
report('overlay removed with no media event is restored by the timer', b.overlayRestoredByInterval);
report('live player re-rendered by YouTube is muted and covered on loadstart', b.rerenderMuted && b.rerenderCovered);
report('a normal player is not covered and keeps its sound', b.normalNotCovered && b.normalKeepsSound);
report('a replay of a stream first seen live is not covered (same video id)', b.replayAfterLiveNotCovered);
report('a live payload with no video id does not cover empty players', b.noIdNotCovered);

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`${ENGINE}: ${results.length - failed} of ${results.length} offline checks PASS`);
console.log(failed ? `${failed} FAILED` : 'ALL PASS');
process.exit(failed ? 1 : 0);
