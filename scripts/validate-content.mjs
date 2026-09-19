import fs from 'node:fs/promises';

const spec = JSON.parse(await fs.readFile('content.json', 'utf8'));
const fail = (msg) => { throw new Error(msg); };

if (!Array.isArray(spec.scenes) || spec.scenes.length === 0) fail('scenes must be a non-empty array');

let total = 0;
for (const [i, scene] of spec.scenes.entries()) {
  if (!Number.isInteger(scene.durationFrames) || scene.durationFrames <= 0) fail(`scene ${i}: durationFrames must be a positive integer`);
  total += scene.durationFrames;
  if (scene.mediaSrc) fail(`scene ${i}: mediaSrc must never be committed to the public repository; use assetId instead`);
  if (scene.assetId && !/^[A-Za-z0-9._-]+$/.test(scene.assetId)) fail(`scene ${i}: invalid assetId`);
}
if (spec.audioSrc) fail('audioSrc must never be committed to the public repository; use audioAssetId instead');
if (spec.audioAssetId && !/^[A-Za-z0-9._-]+$/.test(spec.audioAssetId)) fail('invalid audioAssetId');

for (const [i, c] of (spec.captions || []).entries()) {
  if (!Number.isInteger(c.startFrame) || !Number.isInteger(c.endFrame) || c.startFrame < 0 || c.endFrame < c.startFrame) fail(`caption ${i}: invalid frame range`);
  if (c.endFrame >= total) fail(`caption ${i}: exceeds total duration`);
}
if (total > 5400) fail('Reel exceeds 180 seconds; refusing render');

console.log(`Content validation passed: ${spec.scenes.length} scenes, ${total} frames`);
