# Store steps: No Live (Jonathan)

AI DRAFT (Claude), 15 Oct 2026, for Jonathan's approval.

## Do first (once)

1. The repo must be public, with `PRIVACY.md` on `main`. The privacy links point there, and the store checks them.
2. In the terminal, in the repo folder: `npm run pack`. This makes `dist/no-live-0.2.0.zip`.
3. Open the zip. `manifest.json` must be at the top, not inside an `extension` folder.

## What to upload from where

| What | File |
|---|---|
| Package (Chrome, Edge, Firefox) | `dist\no-live-0.2.0.zip` |
| Screenshots (1 to 5, in order) | `store\images\screenshot-1-live-blocked-1280x800.png` to `screenshot-5-normal-video-1280x800.png` |
| Small promo tile (440 x 280) | `store\images\promo-small-440x280.png` |
| Text to paste | `store\chrome-web-store.md`, `store\edge-addons.md`, `store\firefox-amo.md` |

## Chrome Web Store (about 5 minutes, plus review)

1. Go to chrome.google.com/webstore/devconsole and sign in with your Google account.
2. Pay the one-off developer fee (once for the whole account) and verify the email.
3. New item, then upload `dist\no-live-0.2.0.zip`.
4. Store listing: paste name, short and detailed descriptions, category, language, screenshots, promo tile. Single purpose is in `chrome-web-store.md`.
5. Privacy practices: paste the privacy policy URL, host permission justification and single purpose. Tick "does not collect" and the three certifications.
6. Distribution: Public. Submit for review. Google emails you when it is decided.

## Microsoft Edge Add-ons (free, about 5 minutes, plus review)

1. Go to partner.microsoft.com/dashboard and sign in with a Microsoft account. Register as an individual developer (free).
2. Extensions, then New extension, then upload the same `dist\no-live-0.2.0.zip`.
3. Fill the listing from `store\edge-addons.md`. Upload the same screenshots and the promo tile.
4. Submit. Microsoft emails you when it is decided.

## Firefox (listed: needed for Android)

1. Go to addons.mozilla.org/developers and sign in with a Firefox account.
2. Submit a New Add-on. Choose "On this site" (listed).
3. Upload `dist\no-live-0.2.0.zip`. For source code, upload a zip of the repo (without `node_modules`).
4. Fill the listing from `store\firefox-amo.md`. Data collection: tick nothing.
5. Submit. Mozilla reviews listed add-ons.

## Firefox (unlisted: desktop only, self-distribution)

1. On the same page, choose "On your own" instead.
2. Get the API key pair from addons.mozilla.org, Developer Hub, API Keys.
3. In the terminal: `npm run sign:firefox`, with `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` set for that session only. The signed `.xpi` lands in `dist\`.
4. Never paste the key or secret into the repo, a file or the chat.

## Things to know

- Nothing is posted or submitted until you press the button yourself.
- Chrome and Brave share the Chrome Web Store listing. Edge is separate. Firefox is separate.
- Userscript users (Tampermonkey, Violentmonkey, Userscripts on iPhone) do not need any store. They use `userscript/no-live.user.js` from the repo.
- Store text does not name the BBC or other broadcasters. That is a choice to keep the listings to what the tool does, not a store rule we have checked. Jonathan decides whether the BBC point goes in a listing. It says "live TV channels" instead.
