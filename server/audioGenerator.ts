import fs from 'fs';
import path from 'path';

// Generate a valid 44.1kHz 16-bit stereo WAV buffer with harmonious ambient synthesizer chord progressions
export function generateSyntheticWav(durationSeconds: number, chordType: 'ambient' | 'chillhop'): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate chords
  // Ambient chords: Cmaj7, Am7, Fmaj7, G7
  // Chillhop chords: Dm9, G13, Cmaj9, A7alt
  const chords = chordType === 'ambient'
    ? [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23]  // G7
      ]
    : [
        [146.83, 220.00, 261.63, 329.63, 392.00], // Dm9
        [196.00, 246.94, 329.63, 349.23, 440.00], // G13
        [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9
        [220.00, 277.18, 329.63, 392.00, 466.16]  // A7
      ];

  const chordDuration = durationSeconds / chords.length;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(t / chordDuration), chords.length - 1);
    const currentChord = chords[chordIndex];
    const chordTime = t % chordDuration;

    // Smooth envelope per chord
    const attack = 0.4;
    const release = 0.5;
    let env = 1.0;
    if (chordTime < attack) {
      env = chordTime / attack;
    } else if (chordTime > chordDuration - release) {
      env = (chordDuration - chordTime) / release;
    }

    // Synthesize notes with soft harmonics
    let sampleVal = 0;
    for (const freq of currentChord) {
      const vibrato = 1.0 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
      const fundamental = Math.sin(2 * Math.PI * (freq * vibrato) * t);
      const overtone1 = 0.35 * Math.sin(2 * Math.PI * (freq * 2 * vibrato) * t);
      const overtone2 = 0.15 * Math.sin(2 * Math.PI * (freq * 3 * vibrato) * t);
      sampleVal += (fundamental + overtone1 + overtone2);
    }

    // Normalize and scale
    sampleVal = (sampleVal / (currentChord.length * 1.5)) * env * 0.45;

    // Gentle pan motion
    const pan = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.2 * t);
    const leftVal = sampleVal * (1 - pan);
    const rightVal = sampleVal * pan;

    const leftInt = Math.max(-32768, Math.min(32767, Math.floor(leftVal * 32767)));
    const rightInt = Math.max(-32768, Math.min(32767, Math.floor(rightVal * 32767)));

    const offset = 44 + i * 4;
    buffer.writeInt16LE(leftInt, offset);
    buffer.writeInt16LE(rightInt, offset + 2);
  }

  return buffer;
}
