import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = 'content.json';
const outputPath = 'resolved-content.json';
const publicDir = path.resolve('public/private-media');

const spec = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const baseUrl = process.env.PRIVATE_MEDIA_BASE_URL;
const token = process.env.PRIVATE_MEDIA_TOKEN;

const privateRefs = [];
for (const scene of spec.scenes || []) {
  if (scene.assetId) privateRefs.push({kind: 'scene', target: scene});
}
if (spec.audioAssetId) privateRefs.push({kind: 'audio', target: spec});

if (privateRefs.length > 0 && (!baseUrl || !token)) {
  throw new Error('Private asset references exist, but PRIVATE_MEDIA_BASE_URL / PRIVATE_MEDIA_TOKEN are not configured. Failing closed.');
}

await fs.mkdir(publicDir, {recursive: true});

const downloadAsset = async (assetId, extensionHint = 'bin') => {
  if (!/^[A-Za-z0-9._-]+$/.test(assetId)) throw new Error(`Unsafe assetId: ${assetId}`);
  const url = `${baseUrl.replace(/\/$/, '')}/media/${encodeURIComponent(assetId)}`;
  const response = await fetch(url, {headers: {Authorization: `Bearer ${token}`}});
  if (!response.ok) throw new Error(`Private media fetch failed for ${assetId}: HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  const ext = contentType.includes('video/mp4') ? 'mp4'
    : contentType.includes('image/png') ? 'png'
    : contentType.includes('image/jpeg') ? 'jpg'
    : contentType.includes('audio/mpeg') ? 'mp3'
    : contentType.includes('audio/wav') ? 'wav'
    : extensionHint;
  const base = assetId.replace(/\.[A-Za-z0-9]+$/, '');
  const filename = `${base}.${ext}`;
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(publicDir, filename), bytes);
  return `private-media/${filename}`;
};

for (const scene of spec.scenes || []) {
  if (!scene.assetId) continue;
  const hint = scene.mediaKind === 'video' ? 'mp4' : scene.mediaKind === 'image' ? 'png' : 'bin';
  scene.mediaSrc = await downloadAsset(scene.assetId, hint);
}
if (spec.audioAssetId) spec.audioSrc = await downloadAsset(spec.audioAssetId, 'mp3');

await fs.writeFile(outputPath, JSON.stringify(spec, null, 2));
console.log(`Resolved render spec created. Private assets: ${privateRefs.length}`);
