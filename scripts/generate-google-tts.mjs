import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const specPath = 'resolved-content.json';
const spec = JSON.parse(await fs.readFile(specPath, 'utf8'));

const segments = spec.scenes?.map((scene) => String(scene.voiceText || '').trim());
const segmented = segments?.some(Boolean);
const text = String(spec.voiceoverText || '').trim();
if (!text && !segmented) {
  console.log('No voiceoverText configured; skipping Google Cloud TTS.');
  process.exit(0);
}

const voiceName = spec.ttsVoice || 'en-IN-Wavenet-B';
const languageCode = spec.ttsLanguageCode || 'en-IN';
const speakingRate = Number(spec.ttsSpeakingRate || 1.0);
const pitch = Number(spec.ttsPitch || 0);
const isChirp = voiceName.includes('-Chirp3-HD-');

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

const synthesize = async (inputText) => {
const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Goog-User-Project': process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  },
  body: JSON.stringify({
    input: {text: inputText},
    voice: {languageCode, name: voiceName},
    audioConfig: {
      audioEncoding: 'LINEAR16',
      ...(!isChirp ? {speakingRate, pitch} : {}),
    },
  }),
});

if (!response.ok) throw new Error(`Google Cloud TTS failed: HTTP ${response.status}`);

const payload = await response.json();
if (!payload.audioContent) throw new Error('Google Cloud TTS response did not contain audioContent.');
return Buffer.from(payload.audioContent, 'base64');
};

await fs.mkdir('public', {recursive: true});
if (segmented) {
  if (text) throw new Error('Use either scene voiceText or voiceoverText, not both.');
  if (segments.some((s) => !s)) throw new Error('Every scene must have voiceText in segmented mode.');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'bwp-voice-'));
  try {
    const parts = [];
    for (let i = 0; i < segments.length; i++) {
      const source = path.join(temp, `source-${i}.wav`);
      const padded = path.join(temp, `padded-${i}.wav`);
      await fs.writeFile(source, await synthesize(segments[i]));
      const speechSeconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', source], {encoding: 'utf8'}).trim());
      if (!Number.isFinite(speechSeconds) || speechSeconds <= 0) throw new Error(`Invalid voice duration in scene ${i}`);
      const holdFrames = Math.max(6, Number(spec.scenes[i].postSpeechFrames || 6));
      if (!Number.isInteger(holdFrames) || holdFrames > 90) throw new Error(`Invalid postSpeechFrames in scene ${i}`);
      const frames = Math.ceil(speechSeconds * 30) + holdFrames;
      spec.scenes[i].durationFrames = frames;
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-af', `apad=whole_dur=${frames / 30}`, '-t', String(frames / 30), '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', padded]);
      parts.push(padded);
    }
    const list = path.join(temp, 'concat.txt');
    await fs.writeFile(list, parts.map((part) => `file '${part}'`).join('\n') + '\n');
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c:a', 'pcm_s16le', 'public/generated-voice.wav']);
    spec.captions = [];
    spec.ttsTimingMode = 'measured-per-scene';
    console.log(`Generated ${parts.length} timed voice beats (${spec.scenes.reduce((n, s) => n + s.durationFrames, 0) / 30}s).`);
  } finally {
    await fs.rm(temp, {recursive: true, force: true});
  }
} else {
  await fs.writeFile('public/generated-voice.wav', await synthesize(text));
}

spec.audioSrc = 'generated-voice.wav';
spec.ttsResolvedVoice = voiceName;
await fs.writeFile(specPath, JSON.stringify(spec, null, 2));

console.log(`Generated Google Cloud TTS voiceover with ${voiceName}.`);
