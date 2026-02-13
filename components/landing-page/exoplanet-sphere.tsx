"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh, ShaderMaterial } from "three";
import type { Planet } from "@/lib/db/schema";

const exoplanetVertexShader = `
varying vec3 vNormal;
varying vec3 vSurfaceDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vSurfaceDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const exoplanetFragmentShader = `
uniform float uTime;
uniform float uTemp;
uniform float uHabitability;
uniform float uAtmosphere;
uniform float uMassDensity;
uniform float uFlux;
varying vec3 vNormal;
varying vec3 vSurfaceDir;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 191.999))) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 j = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash(j + vec3(0.0, 0.0, 0.0));
  float n100 = hash(j + vec3(1.0, 0.0, 0.0));
  float n010 = hash(j + vec3(0.0, 1.0, 0.0));
  float n110 = hash(j + vec3(1.0, 1.0, 0.0));
  float n001 = hash(j + vec3(0.0, 0.0, 1.0));
  float n101 = hash(j + vec3(1.0, 0.0, 1.0));
  float n011 = hash(j + vec3(0.0, 1.0, 1.0));
  float n111 = hash(j + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

vec3 lavaColor(float n) {
  vec3 dark = vec3(0.15, 0.02, 0.0);
  vec3 hot = vec3(1.0, 0.3, 0.05);
  vec3 bright = vec3(1.0, 0.7, 0.2);
  return mix(dark, mix(hot, bright, smoothstep(0.5, 0.8, n)), smoothstep(0.3, 0.6, n));
}

void main() {
  vec3 sphere = normalize(vSurfaceDir);
  float latitude = abs(sphere.y);

  // Terrain frequency scales with density — dense planets get rougher terrain
  float terrainFreq = mix(2.0, 4.0, uMassDensity);

  vec2 driftXZ = mat2(cos(uTime * 0.03), -sin(uTime * 0.03), sin(uTime * 0.03), cos(uTime * 0.03)) * sphere.xz;
  vec3 landNoisePos = vec3(driftXZ.x, sphere.y, driftXZ.y) * terrainFreq;
  float continents = fbm(landNoisePos);
  float ridges = fbm(landNoisePos * 2.2 + vec3(7.0, 11.0, 5.0)) * 0.22 * uMassDensity;

  // Land threshold: high habitability = ~40% land (threshold ~0.6), low = 80-100% land (threshold ~0.2)
  float landThreshold = mix(0.2, 0.6, uHabitability);
  float landMask = smoothstep(landThreshold, landThreshold + 0.15, continents + ridges - latitude * 0.06);

  // --- Color palettes by temperature ---

  // Icy (cold): blue/white
  vec3 coldOcean = mix(vec3(0.05, 0.1, 0.2), vec3(0.15, 0.25, 0.4), fbm(sphere * 5.4 + vec3(2.0, 3.0, 4.0)));
  vec3 coldLand = mix(vec3(0.5, 0.55, 0.6), vec3(0.75, 0.8, 0.85), fbm(sphere * 7.6 + vec3(13.0, 8.0, 3.0)));

  // Temperate: green/blue earth-like
  vec3 tempOcean = mix(vec3(0.01, 0.08, 0.18), vec3(0.03, 0.2, 0.36), fbm(sphere * 5.4 + vec3(2.0, 3.0, 4.0)));
  vec3 tempLand = mix(vec3(0.12, 0.24, 0.12), vec3(0.36, 0.34, 0.23), fbm(sphere * 7.6 + vec3(13.0, 8.0, 3.0)));

  // Hot/desert: orange/brown rocky
  vec3 hotOcean = mix(vec3(0.12, 0.06, 0.02), vec3(0.2, 0.1, 0.04), fbm(sphere * 5.4 + vec3(2.0, 3.0, 4.0)));
  vec3 hotLand = mix(vec3(0.35, 0.2, 0.1), vec3(0.55, 0.35, 0.18), fbm(sphere * 7.6 + vec3(13.0, 8.0, 3.0)));

  // Lava: red/orange glowing
  vec3 lavaOcean = vec3(0.08, 0.02, 0.0);
  vec3 lavaLand = mix(vec3(0.25, 0.08, 0.02), vec3(0.5, 0.15, 0.05), fbm(sphere * 7.6 + vec3(13.0, 8.0, 3.0)));

  // Blend palettes based on temperature
  // uTemp: 0 = cold (<200K), ~0.035 = 200K, ~0.086 = 350K, ~0.24 = 800K, ~0.48 = 1500K, 1.0 = 3000K
  // Remap to palette zones
  float tCold = smoothstep(0.0, 0.035, uTemp);       // 0→200K
  float tTemp = smoothstep(0.035, 0.086, uTemp);      // 200→350K
  float tHot = smoothstep(0.086, 0.24, uTemp);        // 350→800K
  float tLava = smoothstep(0.24, 0.48, uTemp);        // 800→1500K

  vec3 oceanColor = coldOcean;
  oceanColor = mix(oceanColor, tempOcean, tCold);
  oceanColor = mix(oceanColor, hotOcean, tTemp);
  oceanColor = mix(oceanColor, lavaOcean, tHot);

  vec3 landColor = coldLand;
  landColor = mix(landColor, tempLand, tCold);
  landColor = mix(landColor, hotLand, tTemp);
  landColor = mix(landColor, lavaLand, tHot);

  vec3 baseColor = mix(oceanColor, landColor, landMask);

  // --- Ice caps for cold planets ---
  float iceStrength = smoothstep(0.086, 0.0, uTemp);
  float iceMask = smoothstep(0.6, 0.9, latitude) * iceStrength * (1.0 - landMask * 0.35);
  vec3 iceColor = vec3(0.86, 0.9, 0.95);
  baseColor = mix(baseColor, iceColor, iceMask);

  // --- Lava veins for very hot planets ---
  float lavaStrength = smoothstep(0.24, 0.7, uTemp);
  float lavaVeins = fbm(sphere * 8.0 + vec3(uTime * 0.02, 0.0, uTime * 0.01));
  float lavaPattern = smoothstep(0.45, 0.55, lavaVeins) * lavaStrength;
  vec3 lavaGlow = lavaColor(lavaVeins);
  baseColor = mix(baseColor, lavaGlow, lavaPattern);

  // --- Cloud layer ---
  // More atmosphere + moderate flux = more clouds. Very high flux = burned off. Very low = thin.
  float cloudDensity = uAtmosphere * smoothstep(0.0, 0.3, uFlux) * smoothstep(1.0, 0.5, uFlux);
  vec2 cloudDrift = mat2(cos(-uTime * 0.05), -sin(-uTime * 0.05), sin(-uTime * 0.05), cos(-uTime * 0.05)) * sphere.xz;
  vec3 cloudPos = vec3(cloudDrift.x, sphere.y, cloudDrift.y) * 3.8 + vec3(30.0, 20.0, 10.0);
  float clouds = smoothstep(0.69, 0.86, fbm(cloudPos)) * cloudDensity;

  // --- Lighting ---
  vec3 lightDir = normalize(vec3(0.8, 0.35, 0.45));
  float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
  float ambient = 0.2;
  float nightSide = smoothstep(0.0, 0.15, diffuse);

  vec3 lit = baseColor * (ambient + diffuse * 0.9);
  lit = mix(lit * 0.2, lit, nightSide);

  // Lava glows even on night side
  lit += lavaGlow * lavaPattern * 0.4 * (1.0 - nightSide);

  lit = mix(lit, vec3(0.92, 0.95, 0.98), clouds * 0.22);

  // --- Rim glow for atmosphere ---
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.7);
  // Atmosphere color by temperature: hot=orange/red, temperate=blue, cold=pale blue/white
  vec3 atmColorCold = vec3(0.4, 0.5, 0.7);
  vec3 atmColorTemp = vec3(0.06, 0.22, 0.46);
  vec3 atmColorHot = vec3(0.5, 0.2, 0.05);
  vec3 atmColor = mix(atmColorCold, atmColorTemp, tCold);
  atmColor = mix(atmColor, atmColorHot, tHot);
  lit += atmColor * rim * 0.12 * uAtmosphere;

  gl_FragColor = vec4(lit, 1.0);
}
`;

const atmosphereVertexShader = `
varying vec3 vNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
uniform float uTemp;
uniform float uAtmosphere;
varying vec3 vNormal;

void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 3.4);

  float tCold = smoothstep(0.0, 0.035, uTemp);
  float tHot = smoothstep(0.086, 0.24, uTemp);

  vec3 atmColorCold = vec3(0.4, 0.5, 0.7);
  vec3 atmColorTemp = vec3(0.1, 0.26, 0.52);
  vec3 atmColorHot = vec3(0.5, 0.2, 0.05);
  vec3 color = mix(atmColorCold, atmColorTemp, tCold);
  color = mix(color, atmColorHot, tHot);

  color *= rim;
  gl_FragColor = vec4(color, rim * 0.28 * uAtmosphere);
}
`;

function deriveUniforms(planet: Planet) {
  const temp = planet.plEqt ?? 280;
  const uTemp = Math.max(0, Math.min(1, (temp - 100) / (3000 - 100)));
  const uHabitability = Math.max(0, Math.min(1, (planet.hi ?? 0) / 100));
  const uAtmosphere = planet.atmosphereScore ?? 0;
  const massS = planet.massScore ?? 0.5;
  const radiusS = planet.radiusScore ?? 0.5;
  const uMassDensity = Math.max(0, Math.min(1, massS * (1 - radiusS * 0.5)));
  const uFlux = planet.fluxScore ?? 0;

  return {
    uTime: { value: 0 },
    uTemp: { value: uTemp },
    uHabitability: { value: uHabitability },
    uAtmosphere: { value: uAtmosphere },
    uMassDensity: { value: uMassDensity },
    uFlux: { value: uFlux },
  };
}

export function ExoplanetMesh({ planet }: { planet: Planet }) {
  const planetRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const planetMaterialRef = useRef<ShaderMaterial>(null);

  const planetUniforms = useMemo(() => deriveUniforms(planet), [planet]);

  const atmosphereUniforms = useMemo(
    () => ({
      uTemp: { value: planetUniforms.uTemp.value },
      uAtmosphere: { value: planetUniforms.uAtmosphere.value },
    }),
    [planetUniforms],
  );

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.2;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.22;
    }
    if (planetMaterialRef.current) {
      planetMaterialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group>
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.8, 128, 128]} />
        <shaderMaterial
          ref={planetMaterialRef}
          uniforms={planetUniforms}
          vertexShader={exoplanetVertexShader}
          fragmentShader={exoplanetFragmentShader}
        />
      </mesh>
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.86, 128, 128]} />
        <shaderMaterial
          uniforms={atmosphereUniforms}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          blending={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function ExoplanetSphere({ planet }: { planet: Planet }) {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.16} />
        <directionalLight position={[5, 3, 5]} intensity={0.82} />
        <ExoplanetMesh planet={planet} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
