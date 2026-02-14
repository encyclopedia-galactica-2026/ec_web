"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh, ShaderMaterial } from "three";
import type { Planet } from "@/lib/db/schema";
import {
  exoplanetVertexShader,
  exoplanetFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from "@/components/seeding/planet-shaders";

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
