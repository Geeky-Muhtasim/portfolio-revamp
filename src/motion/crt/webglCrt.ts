import { Mesh, Program, Renderer, Triangle } from "ogl";

/*
 * The CRT and film layer as one fragment shader over the whole viewport:
 * animated grain, faint scanlines, a soft edge vignette and a little
 * flicker, with the scanlines intensifying on demand (the slash's freeze).
 * Loaded only after the Threshold, only on capable desktops; runs at 24 fps
 * and stops while the tab is hidden. The CSS layer stands in everywhere else.
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
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;
uniform float uRoll;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 px = vUv * uRes;
  // Grain: new every frame, very low amplitude.
  float g = hash(floor(px / 1.5) + floor(uTime * 24.0)) - 0.5;
  // Scanlines every 3 px, stronger during the freeze.
  float scan = 1.0 - step(1.0, mod(px.y, 3.0));
  // A slow bright band rolling down the screen while idle.
  float band = smoothstep(0.0, 0.08, 0.08 - abs(fract(vUv.y + uRoll) - 0.5));
  // Edges darken like curved glass.
  vec2 c = vUv - 0.5;
  float vig = smoothstep(0.42, 0.75, length(c * vec2(1.0, 1.15)));

  vec3 tint = vec3(0.055, 0.122, 0.106);
  float alpha = scan * (0.05 + 0.24 * uIntensity) + vig * 0.38 + abs(g) * 0.05;
  vec3 color = tint * (1.0 - band * 4.0) + vec3(0.5, 0.88, 0.63) * band * 0.25 + vec3(g * 0.3);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export interface CrtLayer {
  setIntensity: (value: number) => void;
  setRolling: (on: boolean) => void;
  destroy: () => void;
}

export function createWebglCrt(): CrtLayer | null {
  try {
    const renderer = new Renderer({ dpr: 1, alpha: true, premultipliedAlpha: true, antialias: false });
    const gl = renderer.gl;
    gl.canvas.className = "crt-canvas";
    gl.canvas.setAttribute("aria-hidden", "true");
    gl.clearColor(0, 0, 0, 0);
    document.body.append(gl.canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: { uRes: { value: [1, 1] }, uTime: { value: 0 }, uIntensity: { value: 0 }, uRoll: { value: 0 } },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.uRes!.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    window.addEventListener("resize", resize);

    let target = 0;
    let rolling = false;
    let roll = 0;
    let last = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 1000 / 24) return;
      last = now;
      const u = program.uniforms;
      u.uTime!.value = now / 1000;
      u.uIntensity!.value += (target - u.uIntensity!.value) * 0.6;
      if (rolling) roll = (roll + 0.006) % 1;
      u.uRoll!.value = rolling ? roll : 0.5;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(frame);
    document.documentElement.classList.add("crt-gl");

    return {
      setIntensity: (value) => (target = value),
      setRolling: (on) => (rolling = on),
      destroy: () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        document.documentElement.classList.remove("crt-gl");
        gl.canvas.remove();
      },
    };
  } catch {
    return null;
  }
}
