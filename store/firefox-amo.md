# Firefox Add-ons (addons.mozilla.org): No Live

AI DRAFT (Claude), 15 Oct 2026, for Jonathan's approval before anything is submitted.

Minimum versions, from the manifest: Firefox 140 or later on desktop, Firefox 142 or later on Android. Firefox for Android installs only add-ons that are listed on addons.mozilla.org, so the listing is what makes No Live work on Android.

## How to publish (two routes)

- **Listed (recommended):** on addons.mozilla.org. Public, reviewed by Mozilla, installable on Firefox desktop and Firefox for Android.
- **Unlisted (self-distribution):** Mozilla signs the file and returns an `.xpi` to install yourself. Desktop Firefox only; Android needs the listed version. Command: `npm run sign:firefox`.

Both need one free Firefox account. The signing command needs an API key pair (issuer and secret) from addons.mozilla.org, under Developer Hub, then API Keys. Keep the secret out of the repo and out of chat.

## Listed submission

**Upload:** `dist/no-live-0.2.0.zip` (made by `npm run pack`). Check that `manifest.json` is at the top of the zip and says 0.2.0.

**Source code:** Mozilla asks for source when code is built or transformed. Upload a zip of the repo, without `node_modules`. Note in the box that the build is `node build.mjs`.

**Add-on ID:** `no-live@hillmade.uk` (already in the manifest).

**Name:** No Live

**Summary** (250 characters max; this is 137)

    Blocks every live stream on YouTube in this browser, including live TV channels. Videos, clips and replays still play. No data collected.

**Description** (paste as plain text; the same as the Chrome text, with Firefox wording)

    No Live blocks every live stream on YouTube in the browser it is installed in. That includes live TV channels and live news, and live streams from individual creators too.

    Ordinary videos, clips and replays of streams that have ended still play as normal.

    HOW IT WORKS
    No Live runs inside YouTube's own pages, before YouTube's code does, in three layers:
    - Player data: a live stream is marked as unplayable before any video loads. The player shows "Live streams are blocked in this browser (No Live)."
    - Lists: tiles marked "live now" are removed from home, search, the sidebar and channel pages.
    - Backstop: if a live player still gets past the first two layers, it is stopped and covered.

    WHAT IT DOES NOT DO
    - It does not work inside the YouTube apps on phones, tablets, smart TVs or consoles.
    - It does not change other websites or apps, including live TV sites and streaming services.
    - It does not decide whether you need a TV licence. In the UK that depends on what you watch, on any device or service. Check your own position on the official TV licence checker.

    PRIVACY
    No Live collects nothing, stores nothing and sends nothing. It has no analytics and no settings. It runs only on youtube.com and youtube-nocookie.com. Full policy: https://github.com/Hexakin/no-live/blob/main/PRIVACY.md

    OPEN SOURCE
    Free, under the MIT licence. Source code and issues: https://github.com/Hexakin/no-live
    Made by Hillmade: https://hillmade.uk/no-live

**Categories** (choose up to two; Firefox's own list is the reference)

- Primary: Privacy & Security
- Second: Photos, Music & Videos (it is about video playback on YouTube)

These names are from memory, not checked against the live picker. Check them there before choosing.

**Tags** (optional): youtube, live, blocker, privacy

**Support email:** jonathan.hill@hillmade.uk

**Support website:** https://github.com/Hexakin/no-live/issues

**Homepage:** https://hillmade.uk/no-live

**Privacy policy:** https://github.com/Hexakin/no-live/blob/main/PRIVACY.md

**License:** MIT

**Data collection declaration:** tick nothing. The add-on does not collect or share data. This matches `data_collection_permissions` in the manifest (`"required": ["none"]`).

**Notes for reviewers** (paste into the notes box)

    Source code: src/guard.js is the only hand-written code. extension/guard.js is a plain copy of it (not minified, not bundled). extension/manifest.json and extension/icons/ are the rest of the add-on.
    Build: `node build.mjs` copies src/guard.js into extension/guard.js and writes the userscript. It needs only Node.js; there are no dependencies to install for the build. The test suite (test/) uses Playwright and is not needed to review or run the add-on.
    No minified or obfuscated code. No remote code, no eval, no network requests, no storage.
    Permissions: host access to *://*.youtube.com/* and *://*.youtube-nocookie.com/* only, for the content script. The content script runs in the page's main world so it sees YouTube's data before the player does.
    To test: open https://www.youtube.com, search for "news" with the Live filter on (no live tiles appear). Open any live stream directly: the player shows "Live streams are blocked in this browser (No Live)." An ordinary video plays normally.
    Minimum Firefox version: 140 on desktop, 142 on Android (strict_min_version in the manifest).

## Unlisted (self-distribution), in short

1. On the same Developer Hub page, choose "On your own" instead of "On this site".
2. Upload the same zip. Mozilla signs it automatically, usually within minutes; wait for the signed `.xpi` to appear.
3. Or run `npm run sign:firefox` from the repo. It signs the extension folder and puts the `.xpi` in `dist/`. Set the key pair for that one terminal session only, as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` (the names web-ext reads). Never write them into a file in the repo.
4. Install the signed `.xpi` on desktop Firefox. It will not appear on Firefox for Android.
