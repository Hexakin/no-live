# No Live

AI DRAFT (Claude), 15 Oct 2026. Not yet reviewed by Jonathan.

No Live blocks every live stream on YouTube in the browser it is installed in. Ordinary videos, clips,
and replays of streams that have ended still play.

It exists for households that don't watch live TV. On YouTube, live news and other live channels sit
between ordinary videos, and one click puts you in front of live TV. No Live takes that click away.

## What it does not do

- **It does not decide whether you need a TV licence.** In the UK that depends on what you watch:
  any channel live, on any device or service, or anything at all on BBC iPlayer. No Live only covers
  YouTube, in the browsers it is installed in. Check your own position at
  [tvlicensing.co.uk](https://www.tvlicensing.co.uk/check-if-you-need-one).
- **It does not work inside the YouTube apps** on phones, tablets, smart TVs or consoles. Those apps
  don't allow add-ons, and network blocking can't separate live streams from the rest of YouTube.
- **It does not touch other sites or services:** BBC iPlayer, ITVX, Channel 4, Sky, other live TV
  sites, or live TV through a TV aerial or set-top box.

## How it works

It runs inside YouTube's own pages, before YouTube's code does, in three layers:

1. **Player data.** When YouTube hands the player a stream that is live now, No Live marks it
   unplayable before any video loads, and the player shows "Live streams are blocked in this browser".
2. **Lists.** Tiles marked "live now" are removed from home, search, the sidebar and channel pages.
3. **Backstop.** The moment any video starts loading, No Live asks the player whether it is live.
   If it is, it stops the video and covers the player.

It sends nothing anywhere, stores nothing and has no settings. To turn it off, remove it.

## Install

| Where | How | Status |
|---|---|---|
| Chrome, Edge, Brave (Windows, Mac, Linux) | `chrome://extensions` (or `edge://extensions`), turn on Developer mode, Load unpacked, choose the `extension` folder | Tested (Edge) |
| Firefox (desktop) | `about:debugging`, This Firefox, Load Temporary Add-on, choose `extension/manifest.json`. Until it is signed on addons.mozilla.org, this lasts only until Firefox restarts | Passes Mozilla's lint, not run in Firefox yet |
| Firefox for Android | Needs the addons.mozilla.org listing | Not yet |
| iPhone and iPad (Safari) | Install the free Userscripts app, turn it on in Safari's extensions, add `userscript/no-live.user.js` | Same code tested in Edge, not on an iPhone yet |
| Any browser with Tampermonkey or Violentmonkey | Install `userscript/no-live.user.js` | Same code tested in Edge |
| YouTube apps (phone, TV, console) | Not possible | See above |

For a household setup, use No Live in a browser and sign out of or remove the YouTube apps on the
devices you want covered.

## Develop

```
npm install
npm run build             # copies src/guard.js into extension/ and wraps it as the userscript
npm test                  # end-to-end against real YouTube, in Edge, with the extension
npm run test:userscript   # the same checks with the userscript
node tools-icons.mjs      # redraws the icons
node test/probe.mjs       # dumps a live and a normal player response to test/out/
```

The source is `src/guard.js`. `extension/guard.js` and `userscript/no-live.user.js` are built from it.

The test picks a live stream from YouTube's live search at run time, so it doesn't rot. It checks:

- Control (without No Live): the live stream plays and live tiles show. This proves the checks can fail.
- With No Live: a normal video plays; a live stream is blocked on direct load and after moving to it
  inside YouTube without a page load; live search shows no live tiles; normal search still shows
  results; live is blocked in embeds on youtube.com and youtube-nocookie.com, while a normal embed
  plays; the mobile site (m.youtube.com) blocks live and plays normal videos.

The tests run in real Edge because Playwright's own Chromium can't decode YouTube's live streams.
Without them, the control run would prove nothing.

`window.__noLiveLog` in the page console lists the last things the guard did.

## Known gaps

- After moving to a live stream inside YouTube without a page load, the player sometimes fetches
  the stream again by a route the data layer can't see. When it does, the backstop stops it before
  the first frame (the test shows 0 seconds played), but this case relies on the backstop.
- Premieres that are showing now, and streams that go live while you are on their page, are
  expected to be caught by the backstop but are not tested yet.
- YouTube changes its pages often. If live tiles start showing again, run `node test/probe.mjs`
  and check the badge names in `src/guard.js` (`LIVE_BADGES`).

Licence: MIT.
