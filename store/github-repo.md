# GitHub repo settings: Hexakin/no-live

AI DRAFT (Claude), 15 Oct 2026, for Jonathan's approval. Nothing here is set until he does it on GitHub.

## Description (under 350 characters)

    Blocks every live stream on YouTube in this browser, including live TV channels. Videos, clips and replays still play. Browser add-on and userscript. MIT.

## Website

    https://hillmade.uk/no-live

## Topics

    youtube, live-streams, browser-extension, userscript, tampermonkey, violentmonkey, content-blocker, privacy, manifest-v3, open-source

## Settings

- **Visibility:** public. Do this last, after the checks below.
- **Issues:** on. The support link in the userscript and the store listings points at the issues page.
- **Wiki, Projects, Discussions:** off, unless Jonathan wants them.
- **Releases:** the v0.2.0 release from `store/github-release.md`, marked as the latest release.
- **Social preview image:** none yet. A 1280 x 640 image would be needed; the 440 x 280 store tile is too small.
- **Issue template:** none yet. Add one later if issues need a form.

## Before making it public

1. `main` holds `userscript/no-live.user.js`, `extension/`, `PRIVACY.md`, `LICENSE` and the README.
2. Turn on 2FA on the Hexakin account (GitHub settings, Jonathan's).
3. Protect `main`: block force-push and deletion, and require reviewed pull requests or signed commits.
4. After publishing, check that these return 200: the raw userscript URL, the raw icon URL, and `releases/latest`.
