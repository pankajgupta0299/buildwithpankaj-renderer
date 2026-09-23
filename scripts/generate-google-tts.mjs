import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

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

const readWav = (bytes) => {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error('TTS did not return a WAV file');
  let format, data;
  for (let pos = 12; pos + 8 <= bytes.length;) {
    const name = bytes.toString('ascii', pos, pos + 4);
    const size = bytes.readUInt32LE(pos + 4);
    if (pos + 8 + size > bytes.length) throw new Error('Malformed WAV chunk');
    if (name === 'fmt ') format = {codec:bytes.readUInt16LE(pos+8),channels:bytes.readUInt16LE(pos+10),rate:bytes.readUInt32LE(pos+12),bits:bytes.readUInt16LE(pos+22)};
    if (name === 'data') data = bytes.subarray(pos+8,pos+8+size);
    pos += 8 + size + (size % 2);
  }
  if (!format || !data || format.codec !== 1 || format.bits !== 16 || ![1,2].includes(format.channels)) throw new Error('Unsupported TTS WAV format');
  return {format,data};
};

const writeWav = (format,data) => {
  const out=Buffer.alloc(44+data.length);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);
  out.writeUInt16LE(1,20);out.writeUInt16LE(format.channels,22);out.writeUInt32LE(format.rate,24);
  const alignment=format.channels*2;
  out.writeUInt32LE(format.rate*alignment,28);out.writeUInt16LE(alignment,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(data.length,40);data.copy(out,44);
  return out;
};

await fs.mkdir('public', {recursive: true});
if (segmented) {
  if (text) throw new Error('Use either scene voiceText or voiceoverText, not both.');
  if (segments.some((s) => !s)) throw new Error('Every scene must have voiceText in segmented mode.');
    const parts = [];
    let outputFormat;
    for (let i = 0; i < segments.length; i++) {
      const {format,data}=readWav(await synthesize(segments[i]));
      if (outputFormat && (format.rate!==outputFormat.rate || format.channels!==outputFormat.channels)) throw new Error('TTS segments have incompatible WAV formats');
      outputFormat=format;
      const speechSeconds = data.length / (format.rate * format.channels * 2);
      if (!Number.isFinite(speechSeconds) || speechSeconds <= 0) throw new Error(`Invalid voice duration in scene ${i}`);
      const holdFrames = Math.max(6, Number(spec.scenes[i].postSpeechFrames || 6));
      if (!Number.isInteger(holdFrames) || holdFrames > 90) throw new Error(`Invalid postSpeechFrames in scene ${i}`);
      const frames = Math.ceil(speechSeconds * 30) + holdFrames;
      spec.scenes[i].durationFrames = frames;
      const targetBytes=Math.ceil(frames*format.rate/30)*format.channels*2;
      const padded=Buffer.alloc(targetBytes);
      data.copy(padded,0,0,Math.min(data.length,targetBytes));
      parts.push(padded);
    }
    await fs.writeFile('public/generated-voice.wav',writeWav(outputFormat,Buffer.concat(parts)));
    spec.captions = [];
    spec.ttsTimingMode = 'measured-per-scene';
    console.log(`Generated ${parts.length} timed voice beats (${spec.scenes.reduce((n, s) => n + s.durationFrames, 0) / 30}s).`);
} else {
  await fs.writeFile('public/generated-voice.wav', await synthesize(text));
}

spec.audioSrc = 'generated-voice.wav';
spec.ttsResolvedVoice = voiceName;
await fs.writeFile(specPath, JSON.stringify(spec, null, 2));

console.log(`Generated Google Cloud TTS voiceover with ${voiceName}.`);
