/*
 * Synthesises the placeholder sound sprite for the brief's sound table:
 *   power  the CRT powering on: a relay click, then a low mains hum
 *   slash  a short blade ring with a tape glitch under it
 *   tick   one soft key tick, for typing
 *   charge the focus cut gathering: a tone rising over three seconds
 *   sting  Cross Blades: a tape stop, then a short closing chord
 *   rain   Security: rain on a window and a distant city, a clean loop
 * Real recordings replace public/audio/placeholder-sprite.wav and keep the
 * same sprite map (src/motion/sound/sound.ts).
 */
import { writeFileSync } from "node:fs";

const RATE = 22050;
const sprite = {
  power: [0, 1600],
  slash: [1800, 900],
  tick: [2900, 60],
  charge: [3100, 3000],
  sting: [6300, 1900],
  rain: [8400, 4000],
};
const end = Math.max(...Object.values(sprite).map(([s, d]) => s + d));
const total = Math.ceil((end / 1000) * RATE);
const out = new Float32Array(total);

let seed = 7;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
const at = (ms) => Math.floor((ms / 1000) * RATE);
const TAU = 2 * Math.PI;

// Power: a relay click, then a 50 Hz hum with its harmonics, swelling in and settling.
{
  const start = at(sprite.power[0]), len = at(sprite.power[1]);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const click = noise() * Math.exp(-t / 0.004) * 0.9 + Math.sin(TAU * 1900 * t) * Math.exp(-t / 0.01) * 0.3;
    const ht = Math.max(0, t - 0.05);
    const env = Math.min(1, ht / 0.25) * Math.min(1, (len / RATE - t) / 0.5);
    const hum = (Math.sin(TAU * 50 * ht) * 0.5 + Math.sin(TAU * 100 * ht) * 0.3 + Math.sin(TAU * 150 * ht) * 0.15 + Math.sin(TAU * 15750 * ht) * 0.02) * env;
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
      (Math.sin(TAU * 1320 * t) * 0.45 + Math.sin(TAU * 2980 * t) * 0.3 + Math.sin(TAU * 4410 * t) * 0.18) * Math.exp(-t / 0.18) +
      noise() * Math.exp(-t / 0.012) * 0.7;
  }
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
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
    out[start + i] = (lp * 0.8 + Math.sin(TAU * 3200 * t) * 0.2) * Math.exp(-t / 0.006) * 0.5;
  }
}

// Charge: a low tone climbing an octave and a half, a tremolo quickening, then held.
{
  const start = at(sprite.charge[0]), len = at(sprite.charge[1]);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const p = Math.min(1, t / 2.8);
    const f = 110 * Math.pow(2, p * 1.5);
    phase += (TAU * f) / RATE;
    const trem = 0.75 + 0.25 * Math.sin(TAU * (4 + p * 14) * t);
    const env = Math.min(1, t / 0.3) * Math.min(1, (len / RATE - t) / 0.08);
    out[start + i] = (Math.sin(phase) * 0.6 + Math.sin(phase * 2) * 0.2) * trem * env * (0.25 + 0.45 * p);
  }
}

// Sting: a chord whose tape slows to a stop, then a short low chord that settles.
{
  const start = at(sprite.sting[0]), len = at(sprite.sting[1]);
  let phase = 0;
  const stopLen = 0.75;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    let v = 0;
    if (t < stopLen) {
      const speed = Math.pow(1 - t / stopLen, 1.6);
      phase += (TAU * 330 * speed) / RATE;
      v = (Math.sin(phase) * 0.5 + Math.sin(phase * 1.5) * 0.3 + Math.sin(phase * 2) * 0.2) * speed * 0.6;
    } else {
      const s = t - stopLen - 0.12;
      if (s > 0) {
        const env = Math.min(1, s / 0.02) * Math.exp(-s / 0.45);
        v = (Math.sin(TAU * 98 * s) * 0.5 + Math.sin(TAU * 147 * s) * 0.35 + Math.sin(TAU * 196 * s) * 0.25) * env * 0.55;
      }
    }
    out[start + i] = v;
  }
}

// Rain: filtered noise, scattered drops, a low city rumble. Ends fade into each other so it loops cleanly.
{
  const start = at(sprite.rain[0]), len = at(sprite.rain[1]);
  const buf = new Float32Array(len);
  let lp = 0;
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const n = noise();
    lp += 0.25 * (n - lp);
    hp = 0.97 * (hp + lp - prev);
    prev = lp;
    const rumble = Math.sin(TAU * 41 * t) * 0.08 + Math.sin(TAU * 63 * t + 1) * 0.05;
    buf[i] = hp * 0.35 + rumble;
  }
  let dropSeed = 3;
  const drand = () => ((dropSeed = (dropSeed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let d = 0; d < 140; d++) {
    const pos = Math.floor(drand() * (len - at(30)));
    const f = 1800 + drand() * 2600;
    const amp = 0.08 + drand() * 0.18;
    for (let k = 0; k < at(30); k++) buf[pos + k] += Math.sin((TAU * f * k) / RATE) * Math.exp(-k / at(3)) * amp;
  }
  const fade = at(300);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    buf[i] = buf[i] * w + buf[len - fade + i] * (1 - w);
  }
  for (let i = 0; i < len - fade; i++) out[start + i] = buf[i] * 0.8;
  // The loop region stops where the crossfade begins, so the seam is inaudible.
  sprite.rain[1] = Math.floor(((len - fade) / RATE) * 1000);
}

const data = Buffer.alloc(44 + total * 2);
data.write("RIFF", 0); data.writeUInt32LE(36 + total * 2, 4); data.write("WAVE", 8);
data.write("fmt ", 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
data.write("data", 36); data.writeUInt32LE(total * 2, 40);
for (let i = 0; i < total; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i])) * 32767), 44 + i * 2);
writeFileSync("public/audio/placeholder-sprite.wav", data);
console.log(`wrote public/audio/placeholder-sprite.wav (${(data.length / 1024).toFixed(0)} KB)`);
console.log(JSON.stringify(sprite));
