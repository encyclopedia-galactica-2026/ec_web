import type { Planet } from "@/lib/db/schema";
import type { OrchestratorResponse, TimelineEntry } from "./types";

// ─── Shader uniform keyframe ──────────────────────────────────────────
// Mirrors the uniforms consumed by exoplanet-sphere.tsx shaders.
export interface ShaderKeyframe {
    uTemp: number;        // 0–1, mapped from planet equilibrium temp
    uHabitability: number; // 0–1
    uAtmosphere: number;   // 0–1
    uMassDensity: number;  // 0–1
    uFlux: number;         // 0–1
    label: string;         // e.g. "Current" or stage milestone
    yearOffset: number;    // year marker on the timeline
}

// ─── Helpers ──────────────────────────────────────────────────────────
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Convert raw Kelvin temperature to the 0–1 shader range (100 K → 0, 3000 K → 1) */
function tempToShader(kelvin: number): number {
    return clamp((kelvin - 100) / (3000 - 100));
}

// ─── Derive the "Stage 0" keyframe from the current Planet data ──────
function deriveBaseKeyframe(planet: Planet): ShaderKeyframe {
    const temp = planet.plEqt ?? 280;
    const massS = planet.massScore ?? 0.5;
    const radiusS = planet.radiusScore ?? 0.5;

    return {
        uTemp: tempToShader(temp),
        uHabitability: clamp((planet.hi ?? 0) / 100),
        uAtmosphere: clamp(planet.atmosphereScore ?? 0),
        uMassDensity: clamp(massS * (1 - radiusS * 0.5)),
        uFlux: clamp(planet.fluxScore ?? 0),
        label: "Current",
        yearOffset: 0,
    };
}

// ─── Heuristic targets for a "fully seeded" world ────────────────────
// Earth-like reference values expressed in shader-uniform space.
const EARTH_TARGET: Omit<ShaderKeyframe, "label" | "yearOffset"> = {
    uTemp: tempToShader(288),       // 288 K → Earth equilibrium
    uHabitability: 0.85,
    uAtmosphere: 0.90,
    uMassDensity: 0.48,             // stays near original — we don't change mass
    uFlux: 0.55,
};

// ─── Build 6 keyframes (stage 0 = current, stages 1-5) ──────────────
export function computeSeedingKeyframes(
    planet: Planet,
    response: OrchestratorResponse,
): ShaderKeyframe[] {
    const base = deriveBaseKeyframe(planet);
    const stages = response.timeline; // 5 TimelineEntry items

    // Each stage moves linearly toward the earth-like target, with an
    // easing curve so early stages see bigger visual jumps.
    const keyframes: ShaderKeyframe[] = [base];

    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        // Non-linear progress: each stage covers more of the remaining gap.
        // Stage 1 = 35%, 2 = 55%, 3 = 72%, 4 = 86%, 5 = 95% of total change.
        const t = 1 - Math.pow(0.65, i + 1);

        // Keep massDensity nearly constant (±small perturbation from seeding mass)
        const massPerturbation = i * 0.01;

        keyframes.push({
            uTemp: lerp(base.uTemp, EARTH_TARGET.uTemp, t),
            uHabitability: lerp(base.uHabitability, EARTH_TARGET.uHabitability, t),
            uAtmosphere: lerp(base.uAtmosphere, EARTH_TARGET.uAtmosphere, t),
            uMassDensity: clamp(base.uMassDensity + massPerturbation),
            uFlux: lerp(base.uFlux, EARTH_TARGET.uFlux, t),
            label: stage.technical_milestone,
            yearOffset: stage.year_offset,
        });
    }

    return keyframes;
}

// ─── Interpolate between two keyframes ───────────────────────────────
export function lerpKeyframes(
    a: ShaderKeyframe,
    b: ShaderKeyframe,
    t: number,
): Omit<ShaderKeyframe, "label" | "yearOffset"> {
    const s = clamp(t);
    return {
        uTemp: lerp(a.uTemp, b.uTemp, s),
        uHabitability: lerp(a.uHabitability, b.uHabitability, s),
        uAtmosphere: lerp(a.uAtmosphere, b.uAtmosphere, s),
        uMassDensity: lerp(a.uMassDensity, b.uMassDensity, s),
        uFlux: lerp(a.uFlux, b.uFlux, s),
    };
}

// ─── Resolve a float progress (0–5) into interpolated uniforms ───────
// progress = 0 → Stage 0 (current), progress = 1.5 → halfway stage 1→2, etc.
export function resolveUniforms(
    keyframes: ShaderKeyframe[],
    progress: number,
): Omit<ShaderKeyframe, "label" | "yearOffset"> {
    const p = clamp(progress, 0, keyframes.length - 1);
    const lo = Math.floor(p);
    const hi = Math.min(lo + 1, keyframes.length - 1);
    const t = p - lo;
    return lerpKeyframes(keyframes[lo], keyframes[hi], t);
}
