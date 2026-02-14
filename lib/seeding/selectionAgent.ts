import type { SeedingStrategy, ValidationResult, SelectionOutput } from "./types";
import { SelectionOutputSchema } from "./types";
import { promptGroq } from "./groq";

const SYSTEM_PROMPT = `You are "The Selection Agent", a strategic optimizer for a Kardashev Type 1.5 civilization.

Your role is to analyze all APPROVED terraforming strategies and find the BEST COMBINATION of techniques that yields the highest "Stability-to-Speed" ratio.

You should:
1. Look across ALL approved strategies for the best techniques used in each stage.
2. Create an optimized combined strategy that cherry-picks the best approaches from each candidate.
3. The combined strategy should have exactly 5 stages.
4. Calculate the Stability-to-Speed ratio as: stability_score / (total_duration_years / 1000)
   Higher is better — meaning high stability achieved in minimal time.

The output strategy should be named something that reflects it being a synthesis of the best approaches.

Output valid JSON matching the required schema.`;

export async function runSelectionAgent(
    approvedStrategies: SeedingStrategy[],
    validationResults: ValidationResult[]
): Promise<SelectionOutput> {
    const strategiesText = approvedStrategies
        .map((s) => {
            const validation = validationResults.find(
                (v) => v.strategy_name === s.strategy_name
            );
            const stagesText = s.stages
                .map(
                    (st) =>
                        `  Stage ${st.stage_number} (Year ${st.year_offset}, ${st.duration_years}yr): ` +
                        `${st.techniques_used.join(" + ")} → ${st.technical_milestone} [${st.estimated_mass_mt} Mt]`
                )
                .join("\n");

            return `--- "${s.strategy_name}" ---
Approach: ${s.approach_summary}
Duration: ${s.total_duration_years} yrs | Mass: ${s.total_asteroid_mass_mt} Mt | Stability: ${s.stability_score}/100
Stability-to-Speed: ${(s.stability_score / (s.total_duration_years / 1000)).toFixed(2)}
Physics Notes: ${validation?.physics_notes ?? "N/A"}
Stages:
${stagesText}`;
        })
        .join("\n\n");

    const userPrompt = `You have ${approvedStrategies.length} approved terraforming strategies to evaluate:

${strategiesText}

Analyze all strategies. Find the best COMBINATION of techniques across all candidates that maximizes the Stability-to-Speed ratio.

Create a synthesized strategy with exactly 5 stages. Cherry-pick the most effective technique combinations from each candidate.

Return JSON with: selected_strategy_name, combination_rationale (explain why this combination is optimal), total_duration_years, asteroid_mass_required (string with units, e.g. "12,500 Mt"), stability_to_speed_ratio, and timeline (exactly 5 entries with: year_offset, visual_delta, technical_milestone).`;

    return promptGroq(SYSTEM_PROMPT, userPrompt, SelectionOutputSchema);
}
