import type { ExoplanetRecord } from "@/lib/mockDb";
import type { ArchitectOutput, SeedingStrategy } from "./types";
import { SeedingStrategySchema } from "./types";
import { promptGroq } from "./groq";

const SPECIALIST_PERSONAS = [
    {
        id: 1,
        name: "Rapid Thermal Optimizer",
        bias: "Prioritize speed above all else. Combine greenhouse bombardment with orbital mirrors to achieve the fastest temperature correction. Use aggressive timelines.",
    },
    {
        id: 2,
        name: "Geological Stabilizer",
        bias: "Prioritize long-term geological stability. Focus on core dynamo restart and tectonic activation first, then layer atmosphere and biosphere on a stable foundation.",
    },
    {
        id: 3,
        name: "Biosphere-First Strategist",
        bias: "Seed extremophile life early and let biology do the heavy lifting. Use synthetic biology and engineered ecosystems to terraform through biomass accumulation and atmospheric modification.",
    },
    {
        id: 4,
        name: "Mass-Efficient Engineer",
        bias: "Minimize total asteroid mass required. Use the most resource-efficient techniques — orbital reflectors, spin correction, atmospheric catalysis — even if it takes longer.",
    },
    {
        id: 5,
        name: "Hybrid Maximizer",
        bias: "Find the optimal combination of ALL available techniques. Run multiple approaches in parallel across stages. Maximize the Stability-to-Speed ratio through creative synergies.",
    },
];

const SYSTEM_PROMPT = `You are a Planetary Seeding Specialist for a Kardashev Type 1.5 civilization.

You are generating a 5-stage terraforming strategy for an exoplanet. You may freely MIX AND MATCH any combination of these techniques across stages to maximize efficiency:
- Atmospheric Injection (greenhouse gas bombardment, volatile delivery)
- Orbital Mirror Array (albedo manipulation, focused solar heating)
- Core Ignition (kinetic bombardment to restart core dynamo, magnetosphere generation)
- Biosphere Bootstrap (extremophile seeding, synthetic ecology, engineered organisms)
- Spin Modulation (tidal-lock correction via mass redistribution)
- Atmospheric Catalysis (chemical catalysts to accelerate reactions)
- Cryovolcanic Triggering (subsurface volatilization)
- Solar Wind Shielding (artificial magnetosphere via superconducting loops)

Constraints:
- Total strategy duration MUST NOT exceed 20,000 years.
- Assume Kardashev Type 1.5 capabilities (~10²⁶ W continuous power output).
- Resources are unlimited via asteroid mining; estimate required mineral mass in megatonnes.
- You are encouraged to manipulate ANY planetary variable (atmospheric density, albedo, spin rate, magnetic field) to reach goals fastest.
- Each stage must have a clear visual change (for 3D shader rendering) and a technical milestone.
- Assign a stability_score from 0-100 rating how stable the end-state will be over 10,000+ years.

Output valid JSON matching the required schema.`;

export async function runSpecialists(
    planet: ExoplanetRecord,
    architectOutput: ArchitectOutput
): Promise<SeedingStrategy[]> {
    const goalsText = architectOutput.goals
        .map((g) => `• ${g.parameter}: ${g.current_value} → ${g.target_value} (${g.delta_description})`)
        .join("\n");

    const strategies = await Promise.all(
        SPECIALIST_PERSONAS.map(async (persona) => {
            const userPrompt = `Planet: ${planet.name}
Radius: ${planet.radius_earth} R⊕ | Mass: ${planet.mass_earth} M⊕ | Eq. Temp: ${planet.equilibrium_temp_k} K

Habitability Gap Analysis:
${architectOutput.habitability_gap_summary}

Terraforming Goals:
${goalsText}

Your persona: "${persona.name}" — ${persona.bias}

Generate a unique 5-stage terraforming strategy. Name your strategy something creative and descriptive. Mix and match ANY techniques across stages for maximum efficiency.

Return JSON with: strategy_name, approach_summary, total_duration_years (≤20000), total_asteroid_mass_mt, stability_score (0-100), and stages array (exactly 5) where each stage has: stage_number, year_offset, duration_years, techniques_used (array), visual_delta (shader description), technical_milestone, estimated_mass_mt.`;

            return promptGroq(SYSTEM_PROMPT, userPrompt, SeedingStrategySchema);
        })
    );

    return strategies;
}
