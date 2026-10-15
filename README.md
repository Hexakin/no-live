# No Live

AI DRAFT (Claude), 15 Oct 2026. Not yet reviewed by Jonathan.

No Live stops **every** live stream on YouTube in the browser it is installed in. That includes live TV
channels, such as BBC News, which now streams live on YouTube in the UK. Ordinary videos, clips and
replays of streams that have ended still play.

It exists for households that don't watch live TV. On YouTube, live channels sit between ordinary videos,
and one click puts you in front of live TV. No Live takes that click away.

Page: [hillmade.uk/no-live](https://hillmade.uk/no-live) · Source: [github.com/Hexakin/no-live](https://github.com/Hexakin/no-live) · Licence: MIT

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
   If it is, it stops the video, mutes it and covers the player. If YouTube removes the cover or
   unmutes the video, No Live puts the cover back and mutes it again at once.

It sends nothing anywhere, stores nothing and has no settings. To turn it off, remove it.

## Install

The userscript is the one-click route. Install Tampermonkey or Violentmonkey, then open the link below
and confirm. Updates come through the same link.

**One-click (userscript):** [Install No Live](https://github.com/Hexakin/no-live/raw/main/userscript/no-live.user.js)

**Read this before you install a userscript.** The one-click link always points at the `main` branch of this
repository, and the userscript updates itself from there when your manager checks, once the version number goes up.
It runs inside YouTube's pages with the same access as any other script on them. If you want to check what it does,
the source is `src/guard.js`, and the built userscript is the same code with a header added.

| Where | How | Status |
|---|---|---|
| Chrome, Edge, Brave (desktop) | The one-click userscript above, or the add-on: download `no-live-0.2.0.zip` from the [latest release](https://github.com/Hexakin/no-live/releases/latest), unzip it, open `chrome://extensions` (or `edge://extensions`), turn on Developer mode, Load unpacked, and choose the unzipped folder | Tested: add-on and userscript in Edge, userscript in Chrome. Brave uses the same engine, not run |
| Firefox (desktop) | The one-click userscript above, with Tampermonkey or Violentmonkey. Or the add-on: `about:debugging`, This Firefox, Load Temporary Add-on, choose `manifest.json` (lasts until Firefox restarts) | Userscript passes the checks in Playwright's Firefox build, not a real Firefox window. Add-on passes Mozilla's lint, not run in Firefox yet |
| Chrome Web Store, Edge Add-ons, Firefox Add-ons | Coming soon: one-click store installs | Not listed yet |
| Firefox for Android | Coming soon, once the Firefox Add-ons listing is up | Not yet |
| iPhone and iPad (Safari) | Install the free Userscripts app, turn it on in Safari's extensions, then add the one-click userscript link | Playwright's WebKit build: 11 checks pass, 2 inconclusive. Not yet tested on a real iPhone or iPad |
| Smart TVs | Looking into it. Honestly, probably not possible: TV apps don't accept add-ons | Not possible yet |
| YouTube apps (phone, TV, console) | Not possible | See above |

For a household setup, use No Live in a browser and sign out of or remove the YouTube apps on the
devices you want covered.

## Test results

Run on 15 Oct 2026 against real YouTube, unless marked offline.

| Command | Browser | Result |
|---|---|---|
| `npm test` (add-on) | Edge | 13 of 13 PASS |
| `npm run test:userscript` | Edge | 13 of 13 PASS |
| `npm run test:userscript` with `NO_LIVE_CHROME` set to Chrome | Chrome | 13 of 13 PASS |
| `npm run test:firefox` (userscript) | Firefox (Playwright's build, 157.0) | 13 of 13 PASS |
| `npm run test:webkit` (userscript) | WebKit (Playwright's build, 27.2) | 11 PASS, 2 INCONCLUSIVE, 0 FAIL. The live control and the desktop normal video did not decode (no playback progress), so they are not counted as passes |
| `npm run test:offline` (synthetic data, no network) | Edge, Firefox, WebKit | 20 of 20 PASS in each |

These were re-run on the same day after the security review fixes (see CHANGELOG.md).

The control run (No Live off) proves the checks can fail. Each real-YouTube check picks a fresh live
stream and a fresh normal video from YouTube's search, so nothing is hard-coded. On 15 Oct the live
stream picked was BBC News's own "Watch BBC News Live".

WebKit is Safari's engine, but this is Playwright's build on Windows. **It is not a real iPhone.**
Where the bundled browser can't decode YouTube's video, the "plays" checks are reported INCONCLUSIVE,
not PASS, and blocking is judged by the player's status and its message.

Guard overhead, measured with `npm run perf` in Edge (median of 25 parses, extra time with the guard on; one run, so treat as rough):

| Captured response | Size | Extra time |
|---|---|---|
| Player response, normal video (`normal.json`) | 716 KB | +1.3 ms |
| Watch page data, live (`watch-live.json`) | 411 KB | +0.6 ms |
| Search results, live (`search-live.json`) | 315 KB | +0.5 ms |

## Develop

```
npm install
npm run build             # copies src/guard.js into extension/ and wraps it as the userscript
npm test                  # end-to-end against real YouTube, in Edge, with the add-on
npm run test:userscript   # the same checks with the userscript
npm run test:firefox      # the same checks, userscript, in Playwright's Firefox
npm run test:webkit       # the same checks, userscript, in Playwright's WebKit (not an iPhone)
npm run test:offline      # synthetic checks of the guard's logic, no network (also :firefox and :webkit)
npm run perf              # times the guard on the captured responses in test/out/
npm run lint              # Mozilla's web-ext lint on the add-on
npm run pack              # dist/no-live-<version>.zip, for the stores and the GitHub release
npm run sign:firefox      # Firefox signing, see below. Not run yet
node tools-icons.mjs      # redraws the icons
node test/probe.mjs       # dumps a live and a normal player response to test/out/
```

The source is `src/guard.js`. `extension/guard.js` and `userscript/no-live.user.js` are built from it.
`web-ext` 10.8.0 is a dev dependency, pinned in `package-lock.json`. `npm run lint` and `npm run sign:firefox`
use it. `npm audit` reports three high advisories that come through it: `node-forge` (RSA signature
verification), `@devicefarmer/adbkit` (the Android device helper, which depends on it) and `web-ext` itself.
No patched `node-forge` release exists yet (every version up to 1.4.0 is affected), so they stay open. Lint and
sign never talk to an Android device. This is accepted for a dev-only tool, not fixed, so review it before signing.

**Firefox signing** (`npm run sign:firefox`) needs Jonathan's addons.mozilla.org API keys in the
environment as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`. It signs as an unlisted add-on and writes
the signed file to `dist/`.

The real-YouTube checks in `test/run.mjs` pick a live stream from YouTube's live search at run time, so
they don't rot. They check that a normal video plays; that a live stream is blocked on direct load and
after moving to it inside YouTube without a page load; that live search shows no live tiles while normal
search still has results; that live is blocked in embeds on youtube.com and youtube-nocookie.com, while a
normal embed plays; and that the mobile site blocks live and plays normal videos. The control run (No
Live off) must show the live stream playing and live tiles, or the checks prove nothing.

`window.__noLiveLog` in the page console lists the last things the guard did.

## Known gaps

- **Premieres that are showing now, and streams that go live while you are on their page**, are
  covered by the synthetic checks only. The data layer checks every player response YouTube parses, so
  a refetch when a waiting stream starts should be caught too, and the backstop checks the player. There
  is no reliable way yet to find a currently-showing premiere or an upcoming stream with YouTube's search
  filters, so there is no real-YouTube test for them.
- **Replays of ended streams** are covered by a synthetic check only. The real-YouTube checks use normal videos.
- After moving to a live stream inside YouTube without a page load, the player sometimes fetches the
  stream again by a route the data layer can't see. When it does, the backstop stops it before the
  first frame (the test shows 0 seconds played), but this case relies on the backstop.
- Firefox and WebKit here are Playwright's builds, not the browsers you use. Not yet tested on a real
  iPhone, in Brave, or with the Firefox add-on installed.
- YouTube changes its pages often. If live tiles start showing again, run `node test/probe.mjs`
  and check the badge names in `src/guard.js` (`LIVE_BADGES`).

Licence: MIT. See [CHANGELOG.md](CHANGELOG.md) for what changed.
