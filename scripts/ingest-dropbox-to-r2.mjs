import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const BASE = (process.env.PRIVATE_MEDIA_BASE_URL || '').trim();
const MEDIA_TOKEN = (process.env.PRIVATE_MEDIA_TOKEN || '').trim();
const APP_KEY = (process.env.DROPBOX_APP_KEY || '').trim();
const APP_SECRET = (process.env.DROPBOX_APP_SECRET || '').trim();
const REFRESH_TOKEN = (process.env.DROPBOX_REFRESH_TOKEN || '').trim();
const MANIFEST = process.env.DROPBOX_INGEST_MANIFEST || 'dropbox-ingest-manifest.json';

for (const [k,v] of Object.entries({
  PRIVATE_MEDIA_BASE_URL: BASE,
  PRIVATE_MEDIA_TOKEN: MEDIA_TOKEN,
  DROPBOX_APP_KEY: APP_KEY,
  DROPBOX_APP_SECRET: APP_SECRET,
  DROPBOX_REFRESH_TOKEN: REFRESH_TOKEN,
})) {
  if (!v) throw new Error(`Missing required secret: ${k}`);
}

const manifest = JSON.parse(await fs.readFile(MANIFEST,'utf8'));
if (manifest.brand !== 'BuildWithPankaj') throw new Error('Wrong brand');
if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('No files to ingest');

async function getDropboxAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: APP_KEY,
    client_secret: APP_SECRET,
  });
  const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body
  });
  if (!r.ok) throw new Error(`Dropbox token exchange failed HTTP ${r.status}: ${await r.text()}`);
  const j = await r.json();
  if (!j.access_token) throw new Error('Dropbox access token missing');
  return j.access_token;
}

console.log(JSON.stringify({
  diagnostics: {
    appKeyLength: APP_KEY.length,
    appSecretLength: APP_SECRET.length,
    refreshTokenLength: REFRESH_TOKEN.length,
    refreshTokenHasWhitespace: /\\s/.test(REFRESH_TOKEN),
    refreshTokenPrefixLooksPlausible: /^[A-Za-z0-9._~-]+$/.test(REFRESH_TOKEN)
  }
}, null, 2));

const accessToken = await getDropboxAccessToken();
const results=[];

for (const item of manifest.files) {
  if (!item.dropboxPath?.startsWith('/BUILDWITHPANKAJ/Instagram-Staging/')) {
    throw new Error(`Refusing Dropbox path outside staging folder: ${item.dropboxPath}`);
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(item.r2Key || '')) {
    throw new Error(`Invalid R2 key: ${item.r2Key}`);
  }

  const dl = await fetch('https://content.dropboxapi.com/2/files/download', {
    method:'POST',
    headers:{
      'Authorization':`Bearer ${accessToken}`,
      'Dropbox-API-Arg':JSON.stringify({path:item.dropboxPath}),
    }
  });
  if (!dl.ok) throw new Error(`Dropbox download failed for ${item.dropboxPath}: HTTP ${dl.status} ${await dl.text()}`);

  const bytes = await dl.arrayBuffer();
  const contentType = item.contentType || dl.headers.get('content-type') || 'application/octet-stream';
  if (item.expectedSha256) {
    const actual = crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    if (actual !== item.expectedSha256) throw new Error(`Content SHA-256 mismatch for ${item.dropboxPath}`);
  }

  const put = await fetch(`${BASE}/media/${encodeURIComponent(item.r2Key)}`, {
    method:'PUT',
    headers:{
      'Authorization':`Bearer ${MEDIA_TOKEN}`,
      'Content-Type':contentType,
    },
    body:bytes,
  });
  if (!put.ok) throw new Error(`R2 upload failed for ${item.r2Key}: HTTP ${put.status} ${await put.text()}`);

  const head = await fetch(`${BASE}/media/${encodeURIComponent(item.r2Key)}`, {
    method:'HEAD',
    headers:{'Authorization':`Bearer ${MEDIA_TOKEN}`},
  });
  if (!head.ok) throw new Error(`R2 verification failed for ${item.r2Key}: HTTP ${head.status}`);

  results.push({
    dropboxPath:item.dropboxPath,
    r2Key:item.r2Key,
    bytes:bytes.byteLength,
    contentType,
    verified:true,
  });
}

console.log(JSON.stringify({ok:true,count:results.length,results},null,2));
