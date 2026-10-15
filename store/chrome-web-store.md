# Chrome Web Store: No Live

AI DRAFT (Claude), 15 Oct 2026, for Jonathan's approval before anything is submitted.

Covers Chrome and Brave (Brave installs from the Chrome Web Store). Edge has its own form: see `edge-addons.md`.

## Before the form (one-off)

- **Developer registration:** a one-off fee, paid once for the whole account, not per extension. It was US$5 when this was written. The dashboard shows the current amount.
- **Account:** sign in with Jonathan's own Google account and verify the developer email. Check the publisher name shown in the account settings says Hillmade, and that the contact address is jonathan.hill@hillmade.uk so it matches `PRIVACY.md`.
- **Package:** `dist/no-live-0.2.0.zip`, made by `npm run pack`. The zip must have `manifest.json` at its top level and say version 0.2.0.

## Store listing

**Name** (75 characters max)

    No Live

**Short description** (132 characters max; this is 118)

    Blocks every live stream on YouTube in this browser, including live TV channels. Videos, clips and replays still play.

**Detailed description** (paste as plain text)

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

**Category**

    Productivity

(Use the closest option on the list. If the picker only offers a different group, Productivity is still the best fit.)

**Language:** English (United Kingdom)

**Single purpose** (the form asks for this)

    No Live has one purpose: to stop live streams from playing on YouTube (youtube.com and youtube-nocookie.com) in the browser it is installed in.

## Privacy tab

**Privacy policy URL**

    https://github.com/Hexakin/no-live/blob/main/PRIVACY.md

**Support URL**

    https://github.com/Hexakin/no-live/issues

**Website** (optional)

    https://hillmade.uk/no-live

**Host permission justification** (paste into the field for `*://*.youtube.com/*` and `*://*.youtube-nocookie.com/*`)

    No Live needs access to youtube.com and youtube-nocookie.com. Its content script runs on those pages before YouTube's own code, so it can see the video data YouTube is about to use. It marks live streams unplayable, removes "live now" tiles from lists, and stops any live player that gets through. It reads this data on the device only. It sends nothing and stores nothing.

**Remote code**

    No. The extension does not load or run any remote code. All of its code is in the package.

**Data usage** (the form's data categories)

    Tick nothing. No Live does not collect user data.

    If the form makes you explain: the extension reads the page's video data inside the browser to decide what to block. That data is not collected, transmitted or stored.

**Certifications** (tick all three; they are true for this code)

- I do not sell or transfer user data to third parties, apart from approved use cases.
- I do not use or transfer user data for purposes unrelated to the item's core functionality.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Images

- **Screenshots** (1 to 5, 1280 x 800): `store/images/screenshot-1-live-blocked-1280x800.png`, `screenshot-2-live-search-without-no-live-1280x800.png`, `screenshot-3-live-search-with-no-live-1280x800.png`, `screenshot-4-normal-search-1280x800.png`, `screenshot-5-normal-video-1280x800.png`. Upload in that order.
- **Small promo tile** (440 x 280): `store/images/promo-small-440x280.png`
- **Icon:** 128 x 128, taken from the package (`extension/icons/icon-128.png`). Nothing to upload.

## Notes for the reviewer (paste into the notes or test instructions box, if the form has one)

    No Live blocks live streams on YouTube. Only youtube.com and youtube-nocookie.com are matched.
    To test: open https://www.youtube.com, search for "news" with the Live filter on. No live tiles appear.
    Open any live stream directly: the player shows "Live streams are blocked in this browser (No Live)."
    An ordinary video plays normally.
    The code is not minified. src/guard.js is the source; extension/guard.js is a copy made by `node build.mjs`, which needs only Node.js.
    The content script runs in the page's main world (manifest "world": "MAIN") so it sees YouTube's data before the player does.
