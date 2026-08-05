// ─── Brain Shader: Noise-displaced gyri/sulci with fresnel + region glow ──
// Vertex shader displaces an icosphere along normals using layered simplex
// noise at three frequencies — mimics the wrinkled cortical surface.
// Fragment shader adds fresnel rim light, subsurface scattering tint,
// and a region-based glow that intensifies for the active section.

import * as THREE from 'three'

// ─── Simplex Noise (Ashima Arts / Stefan Gustavson) ──────────
const noiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion — layered noise for organic displacement
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`

// ─── Vertex Shader ───────────────────────────────────────────
const vertexShader = `
uniform float uTime;
uniform float uDisplacementScale;
uniform float uGyriFrequency;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying float vDisplacement;
varying vec3 vLocalPos;

 ${noiseGLSL}

void main() {
  vLocalPos = position;
  vNormal = normalize(normalMatrix * normal);

  // Layered noise displacement — creates gyri (ridges) and sulci (grooves)
  float n1 = fbm(position * uGyriFrequency + vec3(uTime * 0.02), 4);
  float n2 = snoise(position * uGyriFrequency * 2.5 + vec3(uTime * 0.03)) * 0.3;
  float n3 = snoise(position * uGyriFrequency * 5.0) * 0.12;

  float displacement = (n1 + n2 + n3) * uDisplacementScale;
  vDisplacement = displacement;

  vec3 displaced = position + normal * displacement;

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPos.xyz;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`

// ─── Fragment Shader ─────────────────────────────────────────
const fragmentShader = `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uBaseColor;
uniform vec3 uGyriColor;
uniform vec3 uRimColor;
uniform vec3 uActiveColor;
uniform float uActiveIntensity;
uniform vec3 uActiveCenter;
uniform float uActiveRadius;
uniform vec3 uLightDir;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying float vDisplacement;
varying vec3 vLocalPos;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(vViewPosition);

  // ─── Diffuse lighting (half-lambert for softer falloff) ──
  float NdotL = dot(N, L);
  float halfLambert = NdotL * 0.5 + 0.5;
  halfLambert = halfLambert * halfLambert;

  // ─── Fresnel rim ─────────────────────────────────────────
  float fresnel = 1.0 - max(dot(N, V), 0.0);
  fresnel = pow(fresnel, 2.5);

  // ─── Tissue color: blend gyri and sulci by displacement ─
  float gyriMix = smoothstep(-0.04, 0.04, vDisplacement);
  vec3 tissueColor = mix(uGyriColor, uBaseColor, gyriMix);

  // ─── Subsurface scattering approximation ─────────────────
  // Warm glow where light passes through thin tissue
  float sss = pow(max(0.0, dot(-N, L)), 3.0);
  vec3 sssColor = vec3(0.9, 0.45, 0.35) * sss * 0.35;

  // ─── Active region glow ──────────────────────────────────
  float distToActive = length(vLocalPos - uActiveCenter);
  float regionGlow = 1.0 - smoothstep(0.0, uActiveRadius, distToActive);
  regionGlow = pow(regionGlow, 1.5);
  vec3 activeGlow = uActiveColor * regionGlow * uActiveIntensity;

  // ─── Combine ─────────────────────────────────────────────
  vec3 color = tissueColor * (halfLambert * 0.7 + 0.3);
  color += uRimColor * fresnel * 0.6;
  color += sssColor;
  color += activeGlow;

  // ─── Vignette around edges of the brain sphere ───────────
  float sphereFalloff = 1.0 - smoothstep(0.7, 1.0, length(vLocalPos));
  color *= (0.85 + sphereFalloff * 0.15);

  gl_FragColor = vec4(color, uOpacity);
}
`

// ─── Shader Material Factory ────────────────────────────────
export function createBrainMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uDisplacementScale: { value: 0.08 },
      uGyriFrequency: { value: 3.5 },
      uOpacity: { value: 1.0 },
      uBaseColor: { value: new THREE.Color('#d4a5a0') },     // soft tissue pink
      uGyriColor: { value: new THREE.Color('#9c6b6b') },     // darker groove
      uRimColor: { value: new THREE.Color('#6ee7d7') },      // cyan fresnel
      uActiveColor: { value: new THREE.Color('#6ee7d7') },   // active region
      uActiveIntensity: { value: 0.0 },
      uActiveCenter: { value: new THREE.Vector3(0, 0, 0) },
      uActiveRadius: { value: 1.0 },
      uLightDir: { value: new THREE.Vector3(0.5, 0.8, 0.6) },
    },
  })
}

// ─── Internal Structure Shader (hippocampus, amygdala, etc.) ─
const internalVertex = `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPos;

void main() {
  vLocalPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

const internalFragment = `
uniform float uTime;
uniform float uOpacity;
uniform float uGlow;
uniform vec3 uColor;
uniform vec3 uGlowColor;
uniform vec3 uLightDir;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPos;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(vViewPosition);

  float halfLambert = dot(N, L) * 0.5 + 0.5;
  halfLambert = halfLambert * halfLambert;

  float fresnel = 1.0 - max(dot(N, V), 0.0);
  fresnel = pow(fresnel, 2.0);

  vec3 color = uColor * (halfLambert * 0.6 + 0.4);
  color += uGlowColor * fresnel * (0.4 + uGlow * 1.5);
  color += uGlowColor * uGlow * 0.5;

  // Pulsing glow
  float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
  color *= pulse;

  gl_FragColor = vec4(color, uOpacity);
}
`

export function createInternalMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: internalVertex,
    fragmentShader: internalFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.0 },
      uGlow: { value: 0.0 },
      uColor: { value: new THREE.Color('#c38d9e') },
      uGlowColor: { value: new THREE.Color('#e8a87c') },
      uLightDir: { value: new THREE.Vector3(0.5, 0.8, 0.6) },
    },
  })
}
