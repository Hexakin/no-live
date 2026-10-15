// No Live: blocks every live stream on YouTube in this browser.
// Runs in the page itself at document start, so it sees YouTube's data before the player does.
//
// Three layers:
//   1. Player data: when YouTube hands the player a stream that is live now, it is marked
//      unplayable before a single frame loads. Ended streams (replays) are on demand and still play.
//   2. Feed data: tiles badged "live now" are taken out of home, search, sidebar and channel data.
//   3. Backstop: a timer and YouTube's navigation events check the player itself; if a live
//      stream somehow got through, it is stopped and covered.
(() => {
  'use strict';
  if (window.__noLiveGuard) return;

  const MESSAGE = 'Live streams are blocked in this browser (No Live).';
  // Language-independent badge styles YouTube uses for "live now" tiles.
  const LIVE_BADGES = ['BADGE_STYLE_TYPE_LIVE_NOW', 'THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE'];
  const ID_KEYS = ['videoId', 'contentId'];
  // Last few things the guard did (never which video), for checking it in the console: window.__noLiveLog
  const log = (window.__noLiveLog = []);
  // Videos blocked from the data layer, so the backstop keeps them covered even after the
  // player drops its copy of the data.
  const blockedIds = new Set();
  const note = (what) => { log.push(what); if (log.length > 30) log.shift(); };
  const validId = (id) => typeof id === 'string' && id.length > 0;
  // Limits for the scan. YouTube's data is far shallower and smaller, so these only stop a
  // malformed or cyclic object from overflowing the stack or freezing the tab.
  const MAX_DEPTH = 200;
  const MAX_NODES = 1000000;

  // ---- Layer 1: player data ----

  function isLivePlayer(pr) {
    const details = pr.videoDetails;
    const broadcast = pr.microformat && pr.microformat.playerMicroformatRenderer &&
      pr.microformat.playerMicroformatRenderer.liveBroadcastDetails;
    return !!((details && details.isLive) || (broadcast && broadcast.isLiveNow));
  }

  function blockPlayer(pr) {
    pr.playabilityStatus = {
      status: 'UNPLAYABLE',
      reason: MESSAGE,
      playableInEmbed: false,
      errorScreen: { playerErrorMessageRenderer: { reason: { simpleText: MESSAGE } } },
    };
    delete pr.streamingData;
    delete pr.playerAds;
    delete pr.adPlacements;
  }

  // ---- Layer 2: feed data ----

  // Walks the tree bottom-up. Each node reports whether it holds a live badge and how many
  // distinct video ids it holds (0, 1 or "2 or more"). An array entry with a live badge and
  // exactly one video id is a single live tile, so it is removed. Shelves hold many ids and stay.
  function scan(node, depth = 0, seen = { set: new WeakSet(), count: 0 }) {
    if (node === null || typeof node !== 'object' || depth > MAX_DEPTH ||
        seen.set.has(node) || ++seen.count > MAX_NODES) return { live: false, id: null, many: false };
    seen.set.add(node);
    const acc = { live: false, id: null, many: false };
    const merge = (r) => {
      if (r.live) acc.live = true;
      if (r.many) acc.many = true;
      if (r.id) {
        if (acc.id === null) acc.id = r.id;
        else if (acc.id !== r.id) acc.many = true;
      }
    };
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        const r = scan(node[i], depth + 1, seen);
        if (r.live && r.id && !r.many && isTile(node[i])) {
          node.splice(i, 1);
          continue;
        }
        merge(r);
      }
      return acc;
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (typeof value === 'string') {
        if (LIVE_BADGES.includes(value)) acc.live = true;
        else if (ID_KEYS.includes(key)) merge({ live: false, id: value, many: false });
        else if (key === 'style' && value === 'LIVE') acc.live = true;
      } else if (value && typeof value === 'object') {
        merge(scan(value, depth + 1, seen));
      }
    }
    return acc;
  }

  // A tile is an entry like {videoRenderer: {...}} or {lockupViewModel: {...}}.
  function isTile(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const keys = Object.keys(entry);
    return keys.length === 1 && /(Renderer|ViewModel)$/.test(keys[0]);
  }

  // ---- Shared entry point for anything YouTube parses ----

  function process(data, via) {
    try {
      if (!data || typeof data !== 'object') return data;
      if (data.playabilityStatus && data.videoDetails) {
        const live = isLivePlayer(data);
        const id = data.videoDetails.videoId;
        note((live ? 'blocked a live stream' : 'allowed a video') + ' via ' + via);
        if (live) {
          if (validId(id)) blockedIds.add(id);
          blockPlayer(data);
        } else if (validId(id)) {
          // Not live now (a replay, or a stream that has ended): stop covering this id.
          blockedIds.delete(id);
        }
        return data;
      }
      // The /player response sometimes arrives wrapped, e.g. inside /next or reel responses.
      if (data.playerResponse && typeof data.playerResponse === 'object') process(data.playerResponse, via);
      scan(data);
    } catch (e) {
      // Never break YouTube because of a shape we didn't expect.
    }
    return data;
  }

  function mightMatter(text) {
    return text.length > 200 && (
      text.includes('"isLive"') || text.includes('isLiveNow') ||
      LIVE_BADGES.some((b) => text.includes(b)) || text.includes('"style":"LIVE"'));
  }

  // JSON.parse covers XHR, response.text() + parse, and data embedded as strings.
  const nativeParse = JSON.parse;
  const guardedParse = function (text, reviver) {
    const value = nativeParse.call(this, text, reviver);
    if (typeof text === 'string' && mightMatter(text)) process(value, 'parse');
    return value;
  };
  JSON.parse = guardedParse;

  // response.json() doesn't go through JSON.parse, so wrap it too. Only YouTube's hosts count.
  function isYouTubeUrl(url) {
    try {
      if (!url) return false;
      const host = new URL(url).hostname;
      return /(^|\.)youtube(-nocookie)?\.com$/.test(host) || host === 'youtubei.googleapis.com';
    } catch (e) {
      return false;
    }
  }
  const nativeJson = Response.prototype.json;
  const guardedJson = function () {
    return nativeJson.call(this).then((value) => {
      if (isYouTubeUrl(this.url)) process(value, 'json');
      return value;
    });
  };
  Response.prototype.json = guardedJson;

  // First page load: YouTube writes these as plain globals in an inline script.
  const GLOBALS = ['ytInitialPlayerResponse', 'ytInitialData'];
  const setters = {};
  function guardGlobal(name) {
    let stored = window[name];
    if (stored !== undefined) process(stored, name);
    const set = (value) => {
      if (typeof value === 'string' && mightMatter(value)) {
        try { value = JSON.stringify(process(nativeParse(value), name)); } catch (e) { /* leave it */ }
      } else {
        process(value, name);
      }
      stored = value;
    };
    setters[name] = set;
    try {
      // Configurable on purpose: YouTube's own "var ytInitialData = ..." must still work.
      Object.defineProperty(window, name, { configurable: true, get: () => stored, set });
    } catch (e) { /* already locked down; the backstop still runs */ }
  }
  GLOBALS.forEach(guardGlobal);

  // If anything puts the originals back, put the guard back (checked every second).
  function rearm() {
    try {
      if (JSON.parse !== guardedParse) { JSON.parse = guardedParse; note('re-armed JSON.parse'); }
      if (Response.prototype.json !== guardedJson) { Response.prototype.json = guardedJson; note('re-armed Response.json'); }
      for (const name of GLOBALS) {
        const d = Object.getOwnPropertyDescriptor(window, name);
        if (!d || d.set !== setters[name]) { guardGlobal(name); note('re-armed ' + name); }
      }
    } catch (e) { /* keep going; the backstop still runs */ }
  }

  // ---- Layer 3: backstop on the player itself ----

  const OVERLAY_ID = 'no-live-overlay';

  function players() {
    return document.querySelectorAll('#movie_player, .html5-video-player');
  }

  function playerIsLive(player) {
    try {
      if (player.getPlayerResponse) {
        const pr = player.getPlayerResponse();
        if (pr && isLivePlayer(pr)) return true;
      }
      if (player.getVideoData) {
        const vd = player.getVideoData();
        if (vd && (vd.isLive || (validId(vd.video_id) && blockedIds.has(vd.video_id)))) return true;
      }
    } catch (e) { /* not ready yet */ }
    return false;
  }

  function cover(player) {
    if (player.querySelector('#' + OVERLAY_ID)) return;
    const box = document.createElement('div');
    box.id = OVERLAY_ID;
    box.setAttribute('role', 'alert');
    box.style.cssText = [
      'position:absolute', 'inset:0', 'z-index:2147483647', 'display:flex',
      'align-items:center', 'justify-content:center', 'padding:24px', 'text-align:center',
      'background:#111', 'color:#fff', 'font:500 18px/1.4 Roboto,Arial,sans-serif',
    ].join(';');
    box.textContent = MESSAGE;
    player.appendChild(box);
  }

  function uncover(player) {
    const box = player.querySelector('#' + OVERLAY_ID);
    if (box) box.remove();
  }

  function check() {
    try {
      for (const player of players()) {
        if (playerIsLive(player)) {
          try { player.stopVideo && player.stopVideo(); } catch (e) { /* ignore */ }
          for (const video of player.querySelectorAll('video')) {
            video.pause();
            video.muted = true;
          }
          if (!player.querySelector('#' + OVERLAY_ID)) note('backstop stopped a live player');
          cover(player);
        } else {
          uncover(player);
        }
      }
    } catch (e) {
      note('backstop error: ' + (e && e.message));
    }
  }

  for (const event of ['yt-navigate-finish', 'yt-page-data-updated', 'yt-player-updated', 'state-navigateend']) {
    document.addEventListener(event, check, true);
  }
  // Media events don't bubble, but they do pass through the capture phase, so these fire as
  // soon as any video starts loading, well before the first frame is drawn. 'volumechange'
  // catches an unmute (by YouTube or by hand) and mutes again at once.
  for (const event of ['loadstart', 'loadedmetadata', 'play', 'playing', 'volumechange']) {
    document.addEventListener(event, check, true);
  }
  setInterval(() => { rearm(); check(); }, 1000);

  // Read-only marker, set last so a failed install can't leave a marker with no guard behind it.
  Object.defineProperty(window, '__noLiveGuard', { value: true });
})();
