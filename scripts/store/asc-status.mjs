// Read-only: prints the App Store state of each KeepMyProof version (App Store Connect API).
// The outcome check for the Apple 5.6 fix (store/review-notes.md). Keys come from the Boss OS vault, never a
// command line: cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/store/asc-status.mjs
// Exit 0 = the newest version is accepted (Pending Developer Release / Ready for Distribution / Ready for Sale);
// 1 = anything else (printed); 2 = NAMED STOP, the keys or the API are not there (never a pass).
import crypto from 'node:crypto';
const { ASC_API_KEY_P8, ASC_API_KEY_ID, ASC_API_ISSUER_ID } = process.env;
if (!ASC_API_KEY_P8 || !ASC_API_KEY_ID || !ASC_API_ISSUER_ID) { console.log('NAMED STOP [ASC_KEYS_MISSING] run through the Boss OS vault'); process.exit(2); }
const p8 = ASC_API_KEY_P8.includes('BEGIN') ? ASC_API_KEY_P8 : Buffer.from(ASC_API_KEY_P8, 'base64').toString();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'), now = Math.floor(Date.now() / 1e3);
const head = b64({ alg: 'ES256', kid: ASC_API_KEY_ID, typ: 'JWT' }), body = b64({ iss: ASC_API_ISSUER_ID, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' });
const jwt = `${head}.${body}.${crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key: p8, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
const get = async (path) => {
  const r = await fetch(`https://api.appstoreconnect.apple.com${path}`, { headers: { authorization: `Bearer ${jwt}` } }).catch(() => null);
  if (!r?.ok) { console.log(`NAMED STOP [ASC_UNREACHABLE] ${path}: ${r ? r.status : 'network'}`); process.exit(2); }
  return r.json();
};
const app = (await get('/v1/apps?filter[bundleId]=com.keepmyproof.app&limit=1')).data?.[0];
if (!app) { console.log('NAMED STOP [ASC_APP_NOT_FOUND] com.keepmyproof.app'); process.exit(2); }
const versions = (await get(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=5`)).data ?? [];
for (const v of versions) console.log(`${v.attributes.versionString}: ${v.attributes.appStoreState} (${v.attributes.createdDate?.slice(0, 10)})`);
const newest = versions[0]?.attributes.appStoreState;
process.exit(['PENDING_DEVELOPER_RELEASE', 'READY_FOR_DISTRIBUTION', 'READY_FOR_SALE', 'PROCESSING_FOR_DISTRIBUTION'].includes(newest) ? 0 : 1);
