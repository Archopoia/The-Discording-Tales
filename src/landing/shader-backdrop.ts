// @ts-nocheck
/**
 * Fullscreen WebGL fragment that paints the burgundy / gold atmosphere
 * behind every chapter. Lerped uniforms follow the active chapter's
 * shader knobs. Pauses when document.hidden (checked by conductor).
 */
import type { Conductor } from './conductor';
import type { ChaptersResult, ChapterShader } from './chapters';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = (aPos + 1.0) * 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform float uHue;
uniform float uGrain;
uniform float uGlow;
uniform float uFlow;
uniform vec3 uField;   // burgundy field color in linear-ish sRGB
uniform vec3 uAccent;  // gold accent

// Simplex-ish noise (small, cheap) ---------------------------------------
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uRes.x / max(1.0, uRes.y), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  float t = uTime * (0.03 + uFlow * 0.08);
  vec2 flow = vec2(fbm(p * 1.3 + vec2(t, -t * 0.6)),
                   fbm(p * 1.3 + vec2(-t * 0.5, t)));
  float d = fbm(p * 1.9 + flow * (0.4 + uFlow));

  // Vertical scroll parallax: curtain of slow travel
  float scrollLift = smoothstep(0.0, 1.0, uScroll);
  d += 0.08 * sin((uv.y + scrollLift * 0.4) * 6.283);

  // Radial embers from top with chapter hue shift
  float r = length(p + vec2(0.0, 0.35));
  float embers = smoothstep(0.9, 0.0, r) * uGlow;

  vec3 field = uField;
  vec3 accent = uAccent;

  float warm = clamp(d + embers * 0.6, 0.0, 1.3);
  vec3 col = mix(field, accent * 0.55, pow(warm, 2.4));
  col += accent * embers * 0.25;

  // Hue shift chapter nudge
  col.r += uHue * 0.6;
  col.b -= uHue * 0.3;

  // Film grain
  float g = (hash(uv * uRes.xy + uTime) - 0.5) * uGrain * 0.12;
  col += g;

  // Vignette
  float vg = smoothstep(1.1, 0.3, length(uv - 0.5));
  col *= mix(0.65, 1.0, vg);

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h, 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function mountShaderBackdrop(conductor: Conductor, chapters: ChaptersResult) {
  const canvas = document.getElementById('tdt-landing-bg') as HTMLCanvasElement | null;
  if (!canvas) return;

  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  });

  if (!gl) {
    canvas.style.background = 'radial-gradient(120% 70% at 50% -10%, rgba(122,50,50,.55), transparent 55%), linear-gradient(180deg, #4a1818, #240a0a)';
    return;
  }

  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, VERT); gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, FRAG); gl.compileShader(fs);

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uScroll = gl.getUniformLocation(prog, 'uScroll');
  const uHue = gl.getUniformLocation(prog, 'uHue');
  const uGrain = gl.getUniformLocation(prog, 'uGrain');
  const uGlow = gl.getUniformLocation(prog, 'uGlow');
  const uFlow = gl.getUniformLocation(prog, 'uFlow');
  const uField = gl.getUniformLocation(prog, 'uField');
  const uAccent = gl.getUniformLocation(prog, 'uAccent');

  // Current smoothed shader state.
  const cur: ChapterShader = { hueShift: 0, grain: 0.4, glow: 0.5, flow: 0.3 };
  let curField = hexToRgb('#2a0d0d');
  let curAccent = hexToRgb('#e4c56a');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, conductor.isMobile ? 1.25 : 1.75);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  if (conductor.reduceMotion) {
    // Draw once, static.
    const b = chapters.blend();
    const f = hexToRgb(b.palette.field);
    const a = hexToRgb(b.palette.accent);
    gl.uniform1f(uTime, 0);
    gl.uniform1f(uScroll, 0);
    gl.uniform1f(uHue, b.shader.hueShift);
    gl.uniform1f(uGrain, b.shader.grain);
    gl.uniform1f(uGlow, b.shader.glow);
    gl.uniform1f(uFlow, 0);
    gl.uniform3f(uField, f[0], f[1], f[2]);
    gl.uniform3f(uAccent, a[0], a[1], a[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;
  }

  conductor.addStep(({ time, progress }) => {
    // Skip when canvas offscreen (fixed canvas is always onscreen, but
    // if display is none we bail).
    if (canvas.offsetParent === null && canvas.style.position !== 'fixed') return;

    const target = chapters.blend();
    const k = 0.08; // smoothing
    cur.hueShift = lerp(cur.hueShift, target.shader.hueShift, k);
    cur.grain = lerp(cur.grain, target.shader.grain, k);
    cur.glow = lerp(cur.glow, target.shader.glow, k);
    cur.flow = lerp(cur.flow, target.shader.flow, k);

    const tf = hexToRgb(target.palette.field);
    const ta = hexToRgb(target.palette.accent);
    curField = [lerp(curField[0], tf[0], k), lerp(curField[1], tf[1], k), lerp(curField[2], tf[2], k)];
    curAccent = [lerp(curAccent[0], ta[0], k), lerp(curAccent[1], ta[1], k), lerp(curAccent[2], ta[2], k)];

    gl.uniform1f(uTime, time * 0.001);
    gl.uniform1f(uScroll, progress);
    gl.uniform1f(uHue, cur.hueShift);
    gl.uniform1f(uGrain, cur.grain);
    gl.uniform1f(uGlow, cur.glow);
    gl.uniform1f(uFlow, cur.flow);
    gl.uniform3f(uField, curField[0], curField[1], curField[2]);
    gl.uniform3f(uAccent, curAccent[0], curAccent[1], curAccent[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });
}
