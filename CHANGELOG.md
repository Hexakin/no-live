# Changelog

## 0.2.0 - 15 Oct 2026

Launch version. Under Hillmade and Life with AI, page at https://hillmade.uk/no-live.

- The app stops all live streams on YouTube, live TV included (for example BBC News, which now streams live on YouTube in the UK). Ordinary videos, clips and replays of ended streams still play.
- Userscript header now carries its update and download URLs (the raw GitHub file), homepage, support page, author, licence and icon, so Tampermonkey and Violentmonkey can update it.
- Add-on manifest: `homepage_url`, and minimum Firefox versions raised to 140 (desktop) and 142 (Android). Those are the versions that support `data_collection_permissions`; `web-ext lint` now reports no warnings.
- Backstop: a live player is muted again on `volumechange`, so an unmute by YouTube or by hand is undone at once. The backstop also can no longer throw into YouTube's own code.
- Tests: offline checks with synthetic data (`npm run test:offline`), Firefox and WebKit modes (`npm run test:firefox`, `npm run test:webkit`), and a timing check of the guard (`npm run perf`).
- Packaging: `npm run pack` builds `dist/no-live-0.2.0.zip`. `npm run lint` runs `web-ext lint`. `npm run sign:firefox` is written but has not been run (needs Jonathan's addons.mozilla.org keys).
- Security review before launch, round 1 (an independent Opus review; findings checked against the code):
  - A replay of a stream first seen live is no longer covered. The guard forgets a video id once the data says it is not live.
  - A live payload with no video id no longer makes empty players count as live.
  - The guard marker `window.__noLiveGuard` is read-only, so a page script can't overwrite it.
  - The `response.json()` filter matches YouTube's hosts, not any URL containing "youtube".
  - The feed scan stops at a depth of 200, so a deeply nested response can't overflow the stack.
  - `web-ext` 10.8.0 is a pinned dev dependency, not fetched fresh by `npx`. `npm audit` still reports three high advisories through it (see README).
  - The store-image script no longer contains a personal path.
  - Three offline checks added for the above. `npm run test:offline` is 20 of 20 in Edge, Firefox and WebKit.
  - Not changed: the userscript's update URL (fixed at `main`, as the one-click link), and the 1-second backstop timer (it is the safety net for players that get no media event).
- Security review, round 2 (Grok 4.7 Build Fast; findings checked against the code):
  - The guard marker is set last, so a failed install can't leave a marker with no guard behind it.
  - The feed scan never revisits an object and stops after a million nodes, so a looping object can't freeze the tab (the old build hangs on this check).
  - A `Response` built in script, with no URL, is no longer treated as YouTube's.
  - If anything puts back the original `JSON.parse`, `response.json()` or the `ytInitial*` globals, the guard puts itself back within a second.
  - The troubleshooting log (`window.__noLiveLog`) no longer names videos. PRIVACY.md now mentions it.
  - The backstop no longer runs on every `timeupdate` (several times a second); play events, navigation events and the one-second timer cover it.
  - Four offline checks added. `npm run test:offline`: 24 of 24.
  - Accepted, not changed: it runs inside YouTube's own page, so YouTube's code could switch it off if it tried. It is a guard against live TV by accident, not a lock. The userscript updates from `main`, so the GitHub account's security protects every install (2FA, protected branch).

## 0.1.0 - 15 Oct 2026

First build. Browser extension (Manifest V3) and userscript, tested end to end in Edge: 13 of 13 checks on real YouTube, with a control run showing live plays without the guard.
