/*
 * Synthesises the placeholder sound sprite: a low held drone (Threshold)
 * and a guard click followed by air (every cut). Real recordings replace
 * public/audio/placeholder-sprite.wav and keep the same sprite map.
 */
import { writeFileSync } from "node:fs";

const RATE = 22050;
const sprite = { drone: [0, 4200], cut: [4500, 900] };
const total = Math.ceil(((sprite.cut[0] + sprite.cut[1]) / 1000) * RATE);
const out = new Float32Array(total);

let seed = 7;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;

// Drone: a low fundamental, its fifth and octave, a slow beat, a little breath.
{
  const start = 0, len = Math.floor((sprite.drone[1] / 1000) * RATE);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.9) * Math.min(1, (len / RATE - t) / 1.4);
    const tone = Math.sin(2 * Math.PI * 55 * t) * 0.5 + Math.sin(2 * Math.PI * 55.35 * t) * 0.25
      + Math.sin(2 * Math.PI * 82.5 * t) * 0.18 + Math.sin(2 * Math.PI * 110 * t) * 0.1;
    lp += 0.02 * (noise() - lp);
    out[start + i] = (tone + lp * 0.6) * env * 0.42;
  }
}

// Cut: a metallic guard click, then a short rush of air.
{
  const start = Math.floor((sprite.cut[0] / 1000) * RATE), len = Math.floor((sprite.cut[1] / 1000) * RATE);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const click = (Math.sin(2 * Math.PI * 2450 * t) * 0.5 + Math.sin(2 * Math.PI * 3720 * t) * 0.35 + Math.sin(2 * Math.PI * 5230 * t) * 0.2)
      * Math.exp(-t / 0.014) + noise() * Math.exp(-t / 0.003) * 0.6;
    const airT = t - 0.06;
    const airEnv = airT < 0 ? 0 : Math.min(1, airT / 0.09) * Math.exp(-airT / 0.22);
    lp += 0.18 * (noise() - lp);
    out[start + i] = click * 0.55 + lp * airEnv * 0.9;
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
