import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const specPath = 'resolved-content.json';
const spec = JSON.parse(await fs.readFile(specPath, 'utf8'));

const text = String(spec.voiceoverText || '').trim();
if (!text) {
  console.log('No voiceoverText configured; skipping Google Cloud TTS.');
  process.exit(0);
}

const voiceName = spec.ttsVoice || 'en-IN-Wavenet-B';
const languageCode = spec.ttsLanguageCode || 'en-IN';
const speakingRate = Number(spec.ttsSpeakingRate || 1.0);
const pitch = Number(spec.ttsPitch || 0);

if (!(speakingRate >= 0.25 && speakingRate <= 4.0)) {
  throw new Error('ttsSpeakingRate must be between 0.25 and 4.0');
}
if (!(pitch >= -20 && pitch <= 20)) {
  throw new Error('ttsPitch must be between -20 and 20');
}

const accessToken = execFileSync('gcloud', ['auth', 'print-access-token'], {
  encoding: 'utf8',
}).trim();

if (!accessToken) throw new Error('Failed to obtain Google Cloud access token.');

const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Goog-User-Project': process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  },
  body: JSON.stringify({
    input: {text},
    voice: {languageCode, name: voiceName},
    audioConfig: {
      audioEncoding: 'LINEAR16',
      speakingRate,
      pitch,
    },
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Google Cloud TTS failed: HTTP ${response.status} ${body}`);
}

const payload = await response.json();
if (!payload.audioContent) throw new Error('Google Cloud TTS response did not contain audioContent.');

await fs.mkdir('public', {recursive: true});
await fs.writeFile('public/generated-voice.wav', Buffer.from(payload.audioContent, 'base64'));

spec.audioSrc = 'generated-voice.wav';
spec.ttsResolvedVoice = voiceName;
await fs.writeFile(specPath, JSON.stringify(spec, null, 2));

console.log(`Generated Google Cloud TTS voiceover with ${voiceName} (${text.length} chars).`);
