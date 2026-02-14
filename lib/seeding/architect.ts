import type { ExoplanetRecord } from "@/lib/mockDb";
import type { ArchitectOutput } from "./types";
import { ArchitectOutputSchema } from "./types";
import { promptGroq } from "./groq";

const SYSTEM_PROMPT = `You are "The Architect", a planetary terraforming manager for an advanced Kardashev Type 1.5 civilization.

Your role:
1. Analyze the given exoplanet's physical parameters.
2. Compare them to ideal Earth-like habitability targets:
   - Temperature: 288 K (15°C)
   - Surface gravity: ~9.8 m/s² (proportional to mass/radius²)
   - Atmosphere: 1 atm N₂/O₂ mix
   - Magnetic field: Active magnetosphere
   - Liquid water: Stable surface water
3. Identify the "Habitability Gap" — every parameter that deviates from ideal.
4. Produce specific, quantified terraforming goals.

Output valid JSON matching the schema. Be precise with numbers and units.`;

export async function runArchitect(
    planet: ExoplanetRecord
): Promise<ArchitectOutput> {
    const userPrompt = `Analyze this exoplanet and identify its Habitability Gap:

Planet: ${planet.name}
Radius: ${planet.radius_earth} R⊕ (Earth radii)
Mass: ${planet.mass_earth} M⊕ (Earth masses)
Equilibrium Temperature: ${planet.equilibrium_temp_k} K

Produce terraforming goals to make this planet habitable. Include goals for:
- Temperature adjustment (target 288 K)
- Atmosphere generation/modification
- Magnetosphere status
- Any other relevant planetary parameters

CRITICAL: All values must be flat strings or numbers. Do NOT nest objects inside string fields.
Example format:
{"planet_name":"X","habitability_gap_summary":"The planet is too cold by 70K and lacks atmosphere...","goals":[{"parameter":"Temperature","current_value":"218 K","target_value":"288 K","delta_description":"Raise temperature by 70 K"}]}`;

    return promptGroq(SYSTEM_PROMPT, userPrompt, ArchitectOutputSchema);
}
