# Microsoft Edge Add-ons: No Live

AI DRAFT (Claude), 15 Oct 2026, for Jonathan's approval before anything is submitted.

Edge uses the same package as Chrome (Manifest V3), so the zip is the same file. The text is the Chrome text with the Edge form's field names.

## Before the form (one-off, free)

- **Developer account:** free for an individual. Register at Microsoft Partner Center (partner.microsoft.com/dashboard) with a Microsoft account. Use Jonathan's own account, and the same contact address as Chrome: jonathan.hill@hillmade.uk.
- **Package:** `dist/no-live-0.2.0.zip`, the same file as the Chrome upload.
- **If Partner Center offers to import the Chrome Web Store listing**, you can use it, then check every field below against this file. Otherwise fill the fields by hand.

## Listing

**Display name**

    No Live

**Short description** (the form's limit is shown on the field; this is 118 characters)

    Blocks every live stream on YouTube in this browser, including live TV channels. Videos, clips and replays still play.

**Description** (paste as plain text; the same as the Chrome text)

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

**Category:** Productivity (or Privacy and security, if you prefer that group; pick one and keep it)

**Search terms** (up to seven; each is a short phrase)

    live stream blocker, block live streams, live tv, no live, youtube live, live news, youtube blocker

**Language:** English (United Kingdom)

**Privacy policy URL:** https://github.com/Hexakin/no-live/blob/main/PRIVACY.md

**Support contact:** https://github.com/Hexakin/no-live/issues (or jonathan.hill@hillmade.uk if the form asks for an email)

**Website:** https://hillmade.uk/no-live

**Data collection:** none. Tick that the extension does not collect or transmit user data. The package says the same (`data_collection_permissions` set to `none` in the manifest).

**Host permissions justification** (if asked; the same text as Chrome)

    No Live needs access to youtube.com and youtube-nocookie.com. Its content script runs on those pages before YouTube's own code, so it can see the video data YouTube is about to use. It marks live streams unplayable, removes "live now" tiles from lists, and stops any live player that gets through. It reads this data on the device only. It sends nothing and stores nothing.

**Remote code:** No. All code is in the package.

**Notes for certification** (paste into the box, if there is one)

    No Live blocks live streams on YouTube. Only youtube.com and youtube-nocookie.com are matched.
    To test: open https://www.youtube.com, search for "news" with the Live filter on. No live tiles appear.
    Open any live stream directly: the player shows "Live streams are blocked in this browser (No Live)."
    An ordinary video plays normally.
    The code is not minified. src/guard.js is the source; extension/guard.js is a copy made by `node build.mjs`, which needs only Node.js.

## Images

- **Screenshots** (1 to 5, 1280 x 800): the same five files as Chrome, in `store/images/`, in order: `screenshot-1-live-blocked-1280x800.png` to `screenshot-5-normal-video-1280x800.png`.
- **Promo tile** (if asked for a small tile, 440 x 280): `store/images/promo-small-440x280.png`
- **Icon:** taken from the package.
