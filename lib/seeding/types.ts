import { z } from "zod/v4";

// ─── Helper: LLMs sometimes return objects where strings are expected ──
// This transform JSON.stringifies any non-string value into a string.
const flexStr = z.preprocess(
    (val) => (typeof val === "string" ? val : JSON.stringify(val)),
    z.string()
);

// ─── Architect output ────────────────────────────────────────────
export const TerraformingGoalSchema = z.object({
    parameter: flexStr,
    current_value: flexStr,
    target_value: flexStr,
    delta_description: flexStr,
});

export const ArchitectOutputSchema = z.object({
    planet_name: flexStr,
    habitability_gap_summary: flexStr,
    goals: z.array(TerraformingGoalSchema),
});

export type TerraformingGoal = z.infer<typeof TerraformingGoalSchema>;
export type ArchitectOutput = z.infer<typeof ArchitectOutputSchema>;

// ─── Seeding Specialist output ───────────────────────────────────
export const SeedingStageSchema = z.object({
    stage_number: z.coerce.number(),
    year_offset: z.coerce.number(),
    duration_years: z.coerce.number(),
    techniques_used: z.array(flexStr),
    visual_delta: flexStr,
    technical_milestone: flexStr,
    estimated_mass_mt: z.coerce.number(),
});

export const SeedingStrategySchema = z.object({
    strategy_name: flexStr,
    approach_summary: flexStr,
    total_duration_years: z.coerce.number(),
    total_asteroid_mass_mt: z.coerce.number(),
    stability_score: z.coerce.number(),
    stages: z.array(SeedingStageSchema).length(5),
});

export type SeedingStage = z.infer<typeof SeedingStageSchema>;
export type SeedingStrategy = z.infer<typeof SeedingStrategySchema>;

// ─── Physics Reviewer output ─────────────────────────────────────
export const ValidationResultSchema = z.object({
    strategy_name: flexStr,
    approved: z.preprocess(
        (val) => (typeof val === "string" ? val === "true" : val),
        z.boolean()
    ),
    rejection_reasons: z.array(flexStr),
    physics_notes: flexStr,
});

export const ReviewerOutputSchema = z.object({
    reviews: z.array(ValidationResultSchema),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;

// ─── Selection Agent output ──────────────────────────────────────
export const TimelineEntrySchema = z.object({
    year_offset: z.coerce.number(),
    visual_delta: flexStr,
    technical_milestone: flexStr,
});

export const SelectionOutputSchema = z.object({
    selected_strategy_name: flexStr,
    combination_rationale: flexStr,
    total_duration_years: z.coerce.number(),
    asteroid_mass_required: flexStr,
    stability_to_speed_ratio: z.coerce.number(),
    timeline: z.array(TimelineEntrySchema).length(5),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type SelectionOutput = z.infer<typeof SelectionOutputSchema>;

// ─── Full orchestrator response ──────────────────────────────────
export interface OrchestratorResponse {
    planet_name: string;
    architect_analysis: ArchitectOutput;
    strategies_generated: number;
    strategies_approved: number;
    selected_strategy_name: string;
    total_duration_years: number;
    asteroid_mass_required: string;
    timeline: TimelineEntry[];
    combination_rationale: string;
    all_strategies: SeedingStrategy[];
    validation_results: ValidationResult[];
}
