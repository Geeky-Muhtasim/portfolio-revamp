import { Mesh, Program, Renderer, Triangle } from "ogl";
import type { SlashRenderer } from "./runCut";

/*
 * The slash as a fragment shader: a jade core whose thickness wavers like
 * a loaded brush, a deep jade halo, and a bright leading tip while it
 * draws. Loaded only after the Threshold, only on capable desktops.
 */

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform vec2 uDir;
uniform vec2 uSpan;
uniform float uDrawn;
uniform float uFade;
uniform float uDpr;
uniform vec3 uJade;
uniform vec3 uDeep;
varying vec2 vUv;

float hash(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

void main() {
  vec2 p = vUv * uRes;
  vec2 rel = p - uOrigin;
  float along = dot(rel, uDir) / uDpr;
  float across = abs(dot(rel, vec2(-uDir.y, uDir.x))) / uDpr;
  float spanLen = uSpan.y - uSpan.x;
  float t = (along - uSpan.x) / spanLen;

  float drawn = step(t, uDrawn);
  float ink = 0.8 + 0.9 * noise(along * 0.025) + 0.4 * noise(along * 0.11);
  float core = 1.0 - smoothstep(ink * 0.6, ink, across);
  float halo = exp(-across / (9.0 + 7.0 * noise(along * 0.013 + 4.0)));
  float tip = exp(-pow((t - uDrawn) * spanLen / 40.0, 2.0)) * (1.0 - uFade);

  // Fading widens the halo and thins the core: the edge cools after the cut.
  float coreA = core * (1.0 - uFade);
  float haloA = halo * 0.7 * (1.0 - uFade * uFade);
  vec3 color = uJade * coreA + uDeep * haloA * 1.4 + vec3(0.86, 1.0, 0.94) * tip * core;
  float alpha = clamp(coreA + haloA + tip * core, 0.0, 1.0) * drawn;
  gl_FragColor = vec4(color * drawn, alpha);
}
`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

export function createWebglSlash(): SlashRenderer | null {
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderer = new Renderer({ dpr, alpha: true, premultipliedAlpha: true, antialias: false });
    const gl = renderer.gl;
    gl.canvas.className = "cut-canvas";
    gl.canvas.setAttribute("aria-hidden", "true");
    gl.clearColor(0, 0, 0, 0);
    document.body.append(gl.canvas);

    const css = getComputedStyle(document.documentElement);
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        uRes: { value: [1, 1] },
        uOrigin: { value: [0, 0] },
        uDir: { value: [1, 0] },
        uSpan: { value: [0, 1] },
        uDrawn: { value: 0 },
        uFade: { value: 0 },
        uDpr: { value: dpr },
        uJade: { value: hex(css.getPropertyValue("--jade").trim() || "#1fa37a") },
        uDeep: { value: hex(css.getPropertyValue("--deep-jade").trim() || "#0e5c45") },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => renderer.setSize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener("resize", resize);

    return {
      show(visible) {
        gl.canvas.style.visibility = visible ? "visible" : "hidden";
        if (!visible) {
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
      },
      draw({ origin, angleRad, span, drawn, fade }) {
        const w = gl.canvas.width, h = gl.canvas.height;
        const u = program.uniforms;
        u.uRes!.value = [w, h];
        // GL has y up; the DOM has y down.
        u.uOrigin!.value = [origin.x * dpr, h - origin.y * dpr];
        u.uDir!.value = [Math.cos(angleRad), Math.sin(angleRad)];
        u.uSpan!.value = span;
        u.uDrawn!.value = drawn;
        u.uFade!.value = fade;
        renderer.render({ scene: mesh });
      },
    };
  } catch {
    return null;
  }
}
