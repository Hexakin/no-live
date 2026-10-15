# GitHub release: No Live 0.2.0

AI DRAFT (Claude), 15 Oct 2026, for Jonathan's approval before anything is published.

**Tag:** v0.2.0 (on main)
**Title:** No Live 0.2.0
**Attach:** `dist/no-live-0.2.0.zip` (made by `npm run pack`). The README's "latest release" link needs this file on the release.
**Pre-release:** no. Mark it as the latest release, or the README link will not point at it.

---

No Live 0.2.0 is the first public release. It stops every live stream on YouTube in the browser it is installed in, including live TV channels such as BBC News, which now streams live on YouTube in the UK. Ordinary videos, clips and replays of ended streams still play.

## Install

- **Desktop, one click (userscript):** install Tampermonkey or Violentmonkey, then open https://github.com/Hexakin/no-live/raw/main/userscript/no-live.user.js and confirm. The script updates through your manager when the version number goes up.
- **Desktop, add-on (Chrome, Edge, Brave):** download `no-live-0.2.0.zip` from this release and unzip it. Open `chrome://extensions` (or `edge://extensions`), turn on Developer mode, choose Load unpacked, and pick the unzipped folder. Keep that folder where it is.
- **Firefox, add-on (temporary):** download the zip, unzip it, open `about:debugging`, choose This Firefox, Load Temporary Add-on, and pick `manifest.json`. It lasts until Firefox restarts.
- **iPhone and iPad:** install the free Userscripts app, switch it on under Safari's extensions, then open the userscript link above in Safari. It passes our checks in Safari's engine; not yet tried on a real iPhone.
- **Store installs** (Chrome Web Store, Edge Add-ons, Firefox Add-ons) are coming. They are not listed yet.

## What changed in 0.2.0

- Live streams are blocked in the page data, live-now tiles are taken off the lists, and a backstop stops and covers any live player that still gets through.
- A live player is muted again at once if it is unmuted.
- A replay of a stream first seen live is no longer covered. A live payload with no video id no longer covers empty players.
- Hardening from two security reviews (Opus and Grok): the guard puts itself back if its hooks are replaced, a looping object can't freeze the tab, the troubleshooting log never names videos, and the backstop no longer runs several times a second during playback.
- The userscript header carries its update and download links, homepage, support page, licence and icon.
- Firefox minimums are 140 (desktop) and 142 (Android).

Full list and the security review notes: CHANGELOG.md.

## Tested

15 October 2026, real YouTube, against BBC News's own live stream. A control run with No Live off shows the stream playing, so the checks can fail.

- Microsoft Edge: 13 of 13 for the add-on and for the userscript.
- Google Chrome: userscript 13 of 13.
- Firefox's engine (Playwright's build): userscript 13 of 13.
- Safari's engine (Playwright's WebKit build): 11 pass, 2 inconclusive (that build does not decode the video).
- Offline checks with synthetic data: 24 of 24.

**Not tested:** Brave, the add-on in a real Firefox window, a real iPhone or iPad.

## Known gaps

- Premieres that are showing now, and streams that go live while you are on their page: synthetic checks only.
- Replays of ended streams: synthetic check only.
- After moving to a live stream inside YouTube without a page load, the player can sometimes fetch it by a route the data layer cannot see. The backstop stops it before the first frame in the test. That case relies on the backstop.
- YouTube changes its pages often. If live tiles reappear, open an issue with the page address.

## Not covered

- It is not a lock: anyone who wants to get round it can remove it, use another browser or use the app.

- The YouTube apps on phones, tablets, smart TVs and consoles. Those apps do not accept add-ons.
- Other sites and services, such as BBC iPlayer and ITVX.
- Smart TVs: being looked into, but probably not possible.

## TV licence

No Live does not decide whether anyone needs a TV licence, and it does not exempt anyone from one. In the UK that depends on what you watch: you need a licence to watch any channel live on any device or service, including YouTube, and to watch anything on BBC iPlayer. Check your own position at https://www.tvlicensing.co.uk/check-if-you-need-one

## Security and privacy

- It sends nothing, stores nothing and has no settings. See PRIVACY.md.
- The one-click userscript follows the `main` branch and runs with full access to YouTube's pages. Read `src/guard.js` before you install it.
- `npm audit` reports three high advisories that come through `web-ext`, a dev-only tool. No patched `node-forge` exists yet. Details are in the README.
- Firefox add-on signing has not been run for this release.

Licence: MIT.
