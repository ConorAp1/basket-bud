/**
 * Downloads the Tesseract English language data file locally.
 * Run once after cloning: node scripts/download-tessdata.js
 *
 * Why: Tesseract.js v5 downloads eng.traineddata.gz from jsdelivr.net on first use.
 * Bundling it locally avoids CDN dependency on home servers / restricted networks.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TESSDATA_DIR = path.join(__dirname, '..', 'tessdata');
const OUT_FILE = path.join(TESSDATA_DIR, 'eng.traineddata.gz');
const URL = 'https://github.com/naptha/tessdata/raw/refs/heads/gh-pages/4.0.0_best_int/eng.traineddata.gz';

if (fs.existsSync(OUT_FILE)) {
  console.log('eng.traineddata.gz already exists — skipping download.');
  process.exit(0);
}

fs.mkdirSync(TESSDATA_DIR, { recursive: true });
console.log('Downloading eng.traineddata.gz (~3MB)...');

function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      file.close();
      fs.unlinkSync(dest);
      return download(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      file.close();
      fs.unlinkSync(dest);
      return cb(new Error(`HTTP ${res.statusCode}`));
    }
    res.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    cb(err);
  });
}

download(URL, OUT_FILE, (err) => {
  if (err) { console.error('Download failed:', err.message); process.exit(1); }
  console.log(`Saved to ${OUT_FILE}`);
});
