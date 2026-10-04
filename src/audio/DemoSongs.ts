import { Song } from '../models/types';

function generateSynthWavUrl(
  durationSec: number,
  baseFreq: number,
  scale: number[],
  type: 'upbeat' | 'chill' | 'deep'
): string {
  const sampleRate = 22050;
  const numChannels = 1;
  const numSamples = Math.floor(sampleRate * durationSec);
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const bpm = type === 'upbeat' ? 128 : type === 'chill' ? 90 : 110;
  const beatSamples = Math.floor((60 / bpm) * sampleRate);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    const beatIndex = Math.floor(i / beatSamples);
    const noteFreq = scale[beatIndex % scale.length];

    let sample = 0;
    const noteEnv = Math.max(0, 1 - ((i % beatSamples) / beatSamples));

    if (type === 'upbeat') {
      const subBeat = Math.floor((i % beatSamples) / (beatSamples / 4));
      const arpFreq = noteFreq * Math.pow(2, (subBeat * 4) / 12);
      sample += Math.sin(2 * Math.PI * arpFreq * time) * 0.35 * noteEnv;
      const kickEnv = Math.max(0, 1 - ((i % beatSamples) / (beatSamples * 0.3)));
      sample += Math.sin(2 * Math.PI * (120 - 90 * (1 - kickEnv)) * time) * 0.45 * kickEnv;
    } else if (type === 'chill') {
      sample += Math.sin(2 * Math.PI * noteFreq * time) * 0.3 * noteEnv;
      sample += Math.sin(4 * Math.PI * noteFreq * time) * 0.15 * noteEnv;
      const bassFreq = baseFreq / 2;
      sample += Math.sin(2 * Math.PI * bassFreq * time) * 0.35;
    } else {
      sample += Math.sin(2 * Math.PI * noteFreq * time) * 0.25 * noteEnv;
      sample += Math.sin(2 * Math.PI * (noteFreq * 1.5) * time) * 0.2 * noteEnv;
      sample += Math.sin(2 * Math.PI * (baseFreq * 0.75) * time) * 0.3;
    }

    sample = Math.max(-1, Math.min(1, sample * 0.7));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export function getInitialDemoSongs(): Song[] {
  const synthwaveScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  const lofiScale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
  const cyberScale = [196.00, 233.08, 261.63, 293.66, 349.23, 392.00];
  const ambientScale = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
  const pulseScale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33];

  return [
    {
      id: 'track-1',
      title: 'Quantum Pulse',
      artist: 'AuraPulse Sound Lab',
      duration: 32,
      url: generateSynthWavUrl(32, 130.81, synthwaveScale, 'upbeat'),
      cover: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #000 100%)',
      fileType: 'audio/wav',
      fileName: 'quantum_pulse.mp3',
      sourceType: 'demo',
      addedAt: Date.now() - 400000
    },
    {
      id: 'track-2',
      title: 'Midnight Drift',
      artist: 'Lo-Fi Frequency',
      duration: 28,
      url: generateSynthWavUrl(28, 110.00, lofiScale, 'chill'),
      cover: 'linear-gradient(135deg, #7928ca 0%, #ff0080 50%, #12002b 100%)',
      fileType: 'audio/wav',
      fileName: 'midnight_drift.mp3',
      sourceType: 'demo',
      addedAt: Date.now() - 300000
    },
    {
      id: 'track-3',
      title: 'Cyber Genesis',
      artist: 'Binary Nodes',
      duration: 30,
      url: generateSynthWavUrl(30, 98.00, cyberScale, 'deep'),
      cover: 'linear-gradient(135deg, #00dfa2 0%, #0081a7 50%, #001e1d 100%)',
      fileType: 'audio/wav',
      fileName: 'cyber_genesis.mp3',
      sourceType: 'demo',
      addedAt: Date.now() - 200000
    },
    {
      id: 'track-4',
      title: 'Astral Stream',
      artist: 'Orbital Beats',
      duration: 35,
      url: generateSynthWavUrl(35, 164.81, ambientScale, 'chill'),
      cover: 'linear-gradient(135deg, #ff4d6d 0%, #c9184a 50%, #2b0914 100%)',
      fileType: 'audio/wav',
      fileName: 'astral_stream.mp3',
      sourceType: 'demo',
      addedAt: Date.now() - 100000
    },
    {
      id: 'track-5',
      title: 'Neon Horizon',
      artist: 'Synthwave District',
      duration: 34,
      url: generateSynthWavUrl(34, 123.47, pulseScale, 'upbeat'),
      cover: 'linear-gradient(135deg, #f72585 0%, #7209b7 50%, #3a0ca3 100%)',
      fileType: 'audio/wav',
      fileName: 'neon_horizon.mp3',
      sourceType: 'demo',
      addedAt: Date.now()
    }
  ];
}
