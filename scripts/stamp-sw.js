// Runs as the Netlify build command. Stamps sw.js's cache name with this
// deploy's commit SHA so the service worker cache is guaranteed to change on
// every deploy — see sw.js for why that matters (stale-cache bugs that looked
// fixed in source but silently never reached users' browsers).
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'sw.js');
const buildId = (process.env.COMMIT_REF || String(Date.now())).slice(0, 12);

const before = fs.readFileSync(swPath, 'utf8');
if (!before.includes('__BUILD_ID__')) {
  console.error('stamp-sw.js: __BUILD_ID__ placeholder not found in sw.js — skipping stamp.');
  process.exit(0);
}
fs.writeFileSync(swPath, before.split('__BUILD_ID__').join(buildId));
console.log(`stamp-sw.js: stamped sw.js cache with build id "${buildId}"`);
