import type { Planet } from "@/lib/db/schema";
import type { TerraformAfterValues, SeedingStrategy } from "./types";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const RISK_RANK: Record<string, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

export function combineAfterValues(
  strategies: SeedingStrategy[],
): TerraformAfterValues {
  if (strategies.length === 1) return strategies[0].afterValues;

  const all = strategies.map((s) => s.afterValues);

  return {
    plEqt: closestTo(all.map((a) => a.plEqt), 273),
    hi: Math.max(...all.map((a) => a.hi)),
    tri: Math.max(...all.map((a) => a.tri)),
    flux: all[0].flux,
    atmosphereScore: Math.max(...all.map((a) => a.atmosphereScore)),
    tempScore: Math.max(...all.map((a) => a.tempScore)),
    radiusScore: all[0].radiusScore,
    massScore: all[0].massScore,
    fluxScore: all[0].fluxScore,
    hzScore: all[0].hzScore,
    riskLevel: all.reduce((best, cur) =>
      (RISK_RANK[cur.riskLevel] ?? 3) < (RISK_RANK[best.riskLevel] ?? 3)
        ? cur
        : best,
    ).riskLevel,
  };
}

function closestTo(values: number[], target: number): number {
  return values.reduce((best, v) =>
    Math.abs(v - target) < Math.abs(best - target) ? v : best,
  );
}

export function interpolatePlanet(
  original: Planet,
  afterValues: TerraformAfterValues,
  progress: number,
): Planet {
  const t = easeInOutCubic(Math.max(0, Math.min(1, progress)));

  return {
    ...original,
    plEqt: lerp(original.plEqt ?? 280, afterValues.plEqt, t),
    hi: lerp(original.hi ?? 0, afterValues.hi, t),
    tri: lerp(original.tri ?? 0, afterValues.tri, t),
    flux: lerp(original.flux ?? 0, afterValues.flux, t),
    atmosphereScore: lerp(
      original.atmosphereScore ?? 0,
      afterValues.atmosphereScore,
      t,
    ),
    tempScore: lerp(original.tempScore ?? 0, afterValues.tempScore, t),
    radiusScore: lerp(original.radiusScore ?? 0, afterValues.radiusScore, t),
    massScore: lerp(original.massScore ?? 0, afterValues.massScore, t),
    fluxScore: lerp(original.fluxScore ?? 0, afterValues.fluxScore, t),
    hzScore: lerp(original.hzScore ?? 0, afterValues.hzScore, t),
    riskLevel: t > 0.5 ? afterValues.riskLevel : original.riskLevel,
  };
}
