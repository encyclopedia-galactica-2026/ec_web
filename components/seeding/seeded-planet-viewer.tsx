"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh, ShaderMaterial } from "three";
import type { ShaderKeyframe } from "@/lib/seeding/shader-timeline";
import { resolveUniforms } from "@/lib/seeding/shader-timeline";

// ─── Import vertex/fragment shaders from exoplanet-sphere ─────────
// We duplicate the shader strings here to avoid coupling. They are
// identical to the ones in exoplanet-sphere.tsx.
import {
    exoplanetVertexShader,
    exoplanetFragmentShader,
    atmosphereVertexShader,
    atmosphereFragmentShader,
} from "./planet-shaders";

// ─── SeedingPlanetMesh ────────────────────────────────────────────
// Renders a planet sphere whose uniforms morph smoothly based on
// a `progress` value (0 = current, 5 = fully seeded).
export function SeedingPlanetMesh({
    keyframes,
    progress,
}: {
    keyframes: ShaderKeyframe[];
    progress: number;
}) {
    const planetRef = useRef<Mesh>(null);
    const atmosphereRef = useRef<Mesh>(null);
    const planetMatRef = useRef<ShaderMaterial>(null);
    const atmosphereMatRef = useRef<ShaderMaterial>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uTemp: { value: 0 },
            uHabitability: { value: 0 },
            uAtmosphere: { value: 0 },
            uMassDensity: { value: 0 },
            uFlux: { value: 0 },
        }),
        [],
    );

    const atmosphereUniforms = useMemo(
        () => ({
            uTemp: { value: 0 },
            uAtmosphere: { value: 0 },
        }),
        [],
    );

    useFrame((_, delta) => {
        // Rotate
        if (planetRef.current) planetRef.current.rotation.y += delta * 0.2;
        if (atmosphereRef.current) atmosphereRef.current.rotation.y += delta * 0.22;

        // Advance shader time
        if (planetMatRef.current) {
            planetMatRef.current.uniforms.uTime.value += delta;
        }

        // Resolve interpolated uniforms from keyframes + progress
        if (keyframes.length > 0) {
            const resolved = resolveUniforms(keyframes, progress);

            if (planetMatRef.current) {
                const u = planetMatRef.current.uniforms;
                u.uTemp.value = resolved.uTemp;
                u.uHabitability.value = resolved.uHabitability;
                u.uAtmosphere.value = resolved.uAtmosphere;
                u.uMassDensity.value = resolved.uMassDensity;
                u.uFlux.value = resolved.uFlux;
            }

            if (atmosphereMatRef.current) {
                const u = atmosphereMatRef.current.uniforms;
                u.uTemp.value = resolved.uTemp;
                u.uAtmosphere.value = resolved.uAtmosphere;
            }
        }
    });

    return (
        <group>
            <mesh ref={planetRef}>
                <sphereGeometry args={[1.8, 128, 128]} />
                <shaderMaterial
                    ref={planetMatRef}
                    uniforms={uniforms}
                    vertexShader={exoplanetVertexShader}
                    fragmentShader={exoplanetFragmentShader}
                />
            </mesh>
            <mesh ref={atmosphereRef}>
                <sphereGeometry args={[1.86, 128, 128]} />
                <shaderMaterial
                    ref={atmosphereMatRef}
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

// ─── Wrapper with Canvas ──────────────────────────────────────────
export function SeedingPlanetViewer({
    keyframes,
    progress,
}: {
    keyframes: ShaderKeyframe[];
    progress: number;
}) {
    return (
        <div className="h-full w-full">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.16} />
                <directionalLight position={[5, 3, 5]} intensity={0.82} />
                <SeedingPlanetMesh keyframes={keyframes} progress={progress} />
                <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
