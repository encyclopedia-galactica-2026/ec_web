import type { ExoplanetRecord } from "@/lib/mockDb";
import type { SeedingStrategy, ReviewerOutput } from "./types";
import { ReviewerOutputSchema } from "./types";
import { promptGroq } from "./groq";

const SYSTEM_PROMPT = `You are "The Physics Reviewer", a senior astrophysicist and terraforming validator for a Kardashev Type 1.5 civilization.

Your role is to rigorously review terraforming strategies and REJECT any that violate physical laws. You must check:

1. ENERGY BUDGET: A Type 1.5 civilization commands ~10²⁶ W continuous output (between Type 1 at ~10¹⁶ W and Type 2 at ~10²⁶ W on the full Kardashev scale, so roughly 10²⁶ W). Any strategy requiring energy output exceeding this sustained over its timeline must be rejected.

2. TEMPORAL FEASIBILITY: Planetary-scale heating/cooling follows thermal inertia laws. A rocky planet of ~1 R⊕ has enormous thermal mass. Temperature changes of >50 K across the entire surface in <500 years are physically implausible without extraordinary energy input. Check if stage timelines are realistic.

3. ATMOSPHERIC ESCAPE: Check if the planet's surface gravity (proportional to M/R²) can retain the proposed atmosphere. Lighter planets with low escape velocity will lose lighter gases (H₂, He) rapidly. If the strategy proposes a thick atmosphere on a low-gravity world, it should be flagged.

4. GENERAL PHYSICS: Any other violations of thermodynamics, orbital mechanics, or material science should be flagged.

For each strategy, output:
- strategy_name: the name of the strategy being reviewed
- approved: boolean (true if it passes all checks)
- rejection_reasons: array of strings describing violations (empty if approved)
- physics_notes: brief assessment of the strategy's physical soundness

Be strict but fair. Minor optimistic assumptions are acceptable for a Type 1.5 civilization. Major violations must be rejected.`;

export async function runPhysicsReviewer(
    planet: ExoplanetRecord,
    strategies: SeedingStrategy[]
): Promise<ReviewerOutput> {
    const strategiesSummary = strategies
        .map((s, i) => {
            const stagesText = s.stages
                .map(
                    (st) =>
                        `  Stage ${st.stage_number}: Year ${st.year_offset}, ${st.duration_years}yr, ` +
                        `${st.techniques_used.join(" + ")}, ${st.estimated_mass_mt} Mt`
                )
                .join("\n");

            return `--- Strategy ${i + 1}: "${s.strategy_name}" ---
Approach: ${s.approach_summary}
Total Duration: ${s.total_duration_years} years
Total Mass: ${s.total_asteroid_mass_mt} Mt
Stability Score: ${s.stability_score}/100
Stages:
${stagesText}`;
        })
        .join("\n\n");

    const userPrompt = `Review these ${strategies.length} terraforming strategies for ${planet.name}:

Planet Parameters:
- Radius: ${planet.radius_earth} R⊕
- Mass: ${planet.mass_earth} M⊕
- Equilibrium Temperature: ${planet.equilibrium_temp_k} K
- Surface gravity estimate: ${(planet.mass_earth / (planet.radius_earth ** 2) * 9.81).toFixed(2)} m/s²
- Escape velocity ratio vs Earth: ~${Math.sqrt(planet.mass_earth / planet.radius_earth).toFixed(2)}

${strategiesSummary}

Review each strategy. Return JSON with a "reviews" array containing one object per strategy with: strategy_name, approved (boolean), rejection_reasons (string array), physics_notes (string).`;

    return promptGroq(SYSTEM_PROMPT, userPrompt, ReviewerOutputSchema);
}
