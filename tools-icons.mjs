// Draws the icons from one SVG. Run: node tools-icons.mjs
import { chromium } from 'playwright';
import { CHROME } from './test/yt.mjs';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#16161a"/>
  <g fill="none" stroke="#e5212a" stroke-width="9" stroke-linecap="round">
    <path d="M42 42 a31 31 0 0 0 0 44"/><path d="M86 42 a31 31 0 0 1 0 44"/>
    <path d="M28 28 a51 51 0 0 0 0 72"/><path d="M100 28 a51 51 0 0 1 0 72"/>
  </g>
  <circle cx="64" cy="64" r="15" fill="#e5212a"/>
  <line x1="26" y1="102" x2="102" y2="26" stroke="#16161a" stroke-width="15" stroke-linecap="round"/>
  <line x1="26" y1="102" x2="102" y2="26" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
</svg>`;
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}">`);
  await page.screenshot({ path: `extension/icons/icon-${size}.png`, omitBackground: true });
}
await browser.close();
console.log('icons drawn');
