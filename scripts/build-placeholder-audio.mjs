/*
 * Synthesises the placeholder sound sprite for the brief's sound table:
 *   power  the CRT powering on: a relay click, then a low mains hum
 *   slash  a short blade ring with a tape glitch under it
 *   tick   one soft key tick, for typing
 * Real recordings replace public/audio/placeholder-sprite.wav and keep the
 * same sprite map (src/motion/sound/sound.ts).
 */
import { writeFileSync } from "node:fs";

const RATE = 22050;
const sprite = { power: [0, 1600], slash: [1800, 900], tick: [2900, 60] };
const total = Math.ceil(((sprite.tick[0] + sprite.tick[1]) / 1000) * RATE);
const out = new Float32Array(total);

let seed = 7;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
const at = (ms) => Math.floor((ms / 1000) * RATE);

// Power: a relay click, then a 50 Hz hum with its harmonics, swelling in and settling.
{
  const start = at(sprite.power[0]), len = at(sprite.power[1]);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const click = noise() * Math.exp(-t / 0.004) * 0.9 + Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t / 0.01) * 0.3;
    const ht = Math.max(0, t - 0.05);
    const env = Math.min(1, ht / 0.25) * Math.min(1, (len / RATE - t) / 0.5);
    const hum = (Math.sin(2 * Math.PI * 50 * ht) * 0.5 + Math.sin(2 * Math.PI * 100 * ht) * 0.3 + Math.sin(2 * Math.PI * 150 * ht) * 0.15 + Math.sin(2 * Math.PI * 15750 * ht) * 0.02) * env;
    out[start + i] = click * 0.6 + hum * 0.35;
  }
}

// Slash: a bright metallic ring, with a few dropped and repeated tape fragments.
{
  const start = at(sprite.slash[0]), len = at(sprite.slash[1]);
  const ring = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    ring[i] =
      (Math.sin(2 * Math.PI * 1320 * t) * 0.45 + Math.sin(2 * Math.PI * 2980 * t) * 0.3 + Math.sin(2 * Math.PI * 4410 * t) * 0.18) * Math.exp(-t / 0.18) +
      noise() * Math.exp(-t / 0.012) * 0.7;
  }
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    // Tape glitch: between 40 and 160 ms the signal stutters, repeating 12 ms fragments.
    const glitch = t > 0.04 && t < 0.16;
    const src = glitch ? i - (i % at(12)) : i;
    const wow = glitch ? 0.6 + 0.4 * Math.sin(t * 400) : 1;
    out[start + i] = (ring[src] ?? 0) * wow * 0.7;
  }
}

// Tick: a soft, short key click.
{
  const start = at(sprite.tick[0]), len = at(sprite.tick[1]);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    lp += 0.35 * (noise() - lp);
    out[start + i] = (lp * 0.8 + Math.sin(2 * Math.PI * 3200 * t) * 0.2) * Math.exp(-t / 0.006) * 0.5;
  }
}

const data = Buffer.alloc(44 + total * 2);
data.write("RIFF", 0); data.writeUInt32LE(36 + total * 2, 4); data.write("WAVE", 8);
data.write("fmt ", 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
data.write("data", 36); data.writeUInt32LE(total * 2, 40);
for (let i = 0; i < total; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i])) * 32767), 44 + i * 2);
writeFileSync("public/audio/placeholder-sprite.wav", data);
console.log(`wrote public/audio/placeholder-sprite.wav (${(data.length / 1024).toFixed(0)} KB)`, JSON.stringify(sprite));
