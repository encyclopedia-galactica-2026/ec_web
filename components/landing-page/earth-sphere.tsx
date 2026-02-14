"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh, ShaderMaterial } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ExoplanetMesh } from "./exoplanet-sphere";
import type { Planet } from "@/lib/db/schema";

const earthVertexShader = `
varying vec3 vNormal;
varying vec3 vSurfaceDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vSurfaceDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const earthFragmentShader = `
uniform float uTime;
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

void main() {
  vec3 sphere = normalize(vSurfaceDir);
  float latitude = abs(sphere.y);

  vec2 driftXZ = mat2(cos(uTime * 0.03), -sin(uTime * 0.03), sin(uTime * 0.03), cos(uTime * 0.03)) * sphere.xz;
  vec3 landNoisePos = vec3(driftXZ.x, sphere.y, driftXZ.y) * 2.4;
  float continents = fbm(landNoisePos);
  float ridges = fbm(landNoisePos * 2.2 + vec3(7.0, 11.0, 5.0)) * 0.22;
  float landMask = smoothstep(0.55, 0.7, continents + ridges - latitude * 0.06);

  float iceMask = smoothstep(0.78, 0.98, latitude) * (1.0 - landMask * 0.35);

  vec3 oceanColor = mix(vec3(0.01, 0.08, 0.18), vec3(0.03, 0.2, 0.36), fbm(sphere * 5.4 + vec3(2.0, 3.0, 4.0)));
  vec3 landColor = mix(vec3(0.12, 0.24, 0.12), vec3(0.36, 0.34, 0.23), fbm(sphere * 7.6 + vec3(13.0, 8.0, 3.0)));
  vec3 iceColor = vec3(0.86, 0.9, 0.95);

  vec3 baseColor = mix(oceanColor, landColor, landMask);
  baseColor = mix(baseColor, iceColor, iceMask);

  vec2 cloudDrift = mat2(cos(-uTime * 0.05), -sin(-uTime * 0.05), sin(-uTime * 0.05), cos(-uTime * 0.05)) * sphere.xz;
  vec3 cloudPos = vec3(cloudDrift.x, sphere.y, cloudDrift.y) * 3.8 + vec3(30.0, 20.0, 10.0);
  float clouds = smoothstep(0.69, 0.86, fbm(cloudPos));

  vec3 lightDir = normalize(vec3(0.8, 0.35, 0.45));
  float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
  float ambient = 0.2;
  float nightSide = smoothstep(0.0, 0.15, diffuse);

  float oceanSpecMask = (1.0 - landMask) * pow(diffuse, 42.0);
  vec3 lit = baseColor * (ambient + diffuse * 0.9);
  lit += vec3(0.36, 0.47, 0.58) * oceanSpecMask * 0.22;
  lit = mix(lit * 0.2, lit, nightSide);
  lit = mix(lit, vec3(0.92, 0.95, 0.98), clouds * 0.22);

  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.7);
  lit += vec3(0.06, 0.22, 0.46) * rim * 0.12;

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
varying vec3 vNormal;

void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 3.4);
  vec3 color = vec3(0.1, 0.26, 0.52) * rim;
  gl_FragColor = vec4(color, rim * 0.28);
}
`;

function RotatingSphere() {
  const planetRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const planetMaterialRef = useRef<ShaderMaterial>(null);

  const earthUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

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
          uniforms={earthUniforms}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
        />
      </mesh>
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.86, 128, 128]} />
        <shaderMaterial
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

interface EarthSphereProps {
  visible: boolean;
  targetPlanet?: Planet | null;
  onTravelComplete?: () => void;
}

function CameraAnimator({
  targetPlanet,
  onMidpoint,
  onTravelComplete,
  controlsRef,
}: {
  targetPlanet?: Planet | null;
  onMidpoint?: () => void;
  onTravelComplete?: () => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const phase = useRef<"idle" | "departing" | "arriving">("idle");
  const progress = useRef(0);
  const prevPlanet = useRef<string | null>("__earth__");
  const midpointFired = useRef(false);

  useFrame((_, delta) => {
    if (phase.current === "idle") return;

    // Disable OrbitControls during animation so it doesn't fight camera position
    if (controlsRef.current) controlsRef.current.enabled = false;

    progress.current += delta;

    if (phase.current === "departing") {
      const t = Math.min(progress.current / 1.2, 1);
      const ease = t * t;
      camera.position.z = 5 + ease * 45;

      if (t >= 1) {
        phase.current = "arriving";
        progress.current = 0;
        if (!midpointFired.current) {
          midpointFired.current = true;
          onMidpoint?.();
        }
      }
    } else if (phase.current === "arriving") {
      const t = Math.min(progress.current / 1.2, 1);
      const ease = 1 - (1 - t) * (1 - t);
      camera.position.z = 50 - ease * 45;

      if (t >= 1) {
        phase.current = "idle";
        camera.position.z = 5;
        // Reset OrbitControls so it syncs with the final camera position
        if (controlsRef.current) {
          controlsRef.current.reset();
          controlsRef.current.enabled = true;
        }
        onTravelComplete?.();
      }
    }
  });

  const planetKey = targetPlanet?.plName ?? "__earth__";
  if (planetKey !== prevPlanet.current && phase.current === "idle") {
    prevPlanet.current = planetKey;
    phase.current = "departing";
    progress.current = 0;
    midpointFired.current = false;
  }

  return null;
}

export function EarthSphere({ visible, targetPlanet, onTravelComplete }: EarthSphereProps) {
  const [showingPlanet, setShowingPlanet] = useState<Planet | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  if (!visible) return null;

  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.16} />
        <directionalLight position={[5, 3, 5]} intensity={0.82} />
        {!showingPlanet && <RotatingSphere />}
        {showingPlanet && <ExoplanetMesh planet={showingPlanet} />}
        <CameraAnimator
          targetPlanet={targetPlanet}
          onMidpoint={() => setShowingPlanet(targetPlanet ?? null)}
          onTravelComplete={onTravelComplete}
          controlsRef={controlsRef}
        />
        <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
