// Zips the extension into dist/no-live-<version>.zip, with manifest.json at the top level of the zip.
// That zip is what the Chrome Web Store, Edge Add-ons and the GitHub release take. Run: npm run pack
import fs from 'node:fs';
import { ZipArchive } from 'archiver';

const { version } = JSON.parse(fs.readFileSync('extension/manifest.json', 'utf8'));
fs.mkdirSync('dist', { recursive: true });
const out = `dist/no-live-${version}.zip`;

await new Promise((resolve, reject) => {
  const stream = fs.createWriteStream(out);
  const zip = new ZipArchive({ zlib: { level: 9 } });
  stream.on('close', resolve);
  stream.on('error', reject);
  zip.on('error', reject);
  zip.on('warning', reject);
  zip.pipe(stream);
  zip.directory('extension/', false);
  zip.finalize();
});

const files = fs.readdirSync('extension', { recursive: true }).filter((f) => fs.statSync(`extension/${f}`).isFile());
console.log(`packed ${out}: ${fs.statSync(out).size} bytes, ${files.length} files from extension/`);
