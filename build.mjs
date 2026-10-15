// Copies src/guard.js into the extension and wraps it as a userscript. Run: node build.mjs
import fs from 'node:fs';
const guard = fs.readFileSync('src/guard.js', 'utf8');
const { version } = JSON.parse(fs.readFileSync('extension/manifest.json', 'utf8'));
fs.writeFileSync('extension/guard.js', guard);
const RAW = 'https://github.com/Hexakin/no-live/raw/main';
const header = `// ==UserScript==
// @name         No Live
// @namespace    https://lifewithai.co.uk/
// @version      ${version}
// @description  Blocks every live stream on YouTube in this browser, including live TV such as BBC News. Videos, replays and clips still play.
// @author       Hillmade
// @license      MIT
// @homepageURL  https://hillmade.uk/no-live
// @supportURL   https://github.com/Hexakin/no-live/issues
// @updateURL    ${RAW}/userscript/no-live.user.js
// @downloadURL  ${RAW}/userscript/no-live.user.js
// @icon         ${RAW}/extension/icons/icon-128.png
// @match        *://*.youtube.com/*
// @match        *://*.youtube-nocookie.com/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// ==/UserScript==

`;
fs.writeFileSync('userscript/no-live.user.js', header + guard);
console.log('built', version);
