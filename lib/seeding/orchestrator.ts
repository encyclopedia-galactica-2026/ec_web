import { getExoplanet, getAllExoplanetNames } from "@/lib/mockDb";
import { runArchitect } from "./architect";
import { runSpecialists } from "./seedingSpecialist";
import { runPhysicsReviewer } from "./physicsReviewer";
import { runSelectionAgent } from "./selectionAgent";
import type { OrchestratorResponse } from "./types";

export async function orchestrate(
    planetName: string
): Promise<OrchestratorResponse> {
    // 1. Look up the planet
    const planet = getExoplanet(planetName);
    if (!planet) {
        throw new Error(
            `Planet "${planetName}" not found. Available: ${getAllExoplanetNames().join(", ")}`
        );
    }

    // 2. The Architect — identify habitability gap & goals
    const architectOutput = await runArchitect(planet);

    // 3. Seeding Specialists — 5 parallel strategy generators
    const strategies = await runSpecialists(planet, architectOutput);

    // 4. Physics Reviewer — validate all strategies
    const reviewerOutput = await runPhysicsReviewer(planet, strategies);

    // 5. Filter to approved strategies
    const approvedNames = new Set(
        reviewerOutput.reviews
            .filter((r) => r.approved)
            .map((r) => r.strategy_name)
    );

    let approvedStrategies = strategies.filter((s) =>
        approvedNames.has(s.strategy_name)
    );

    // Fallback: if all were rejected, take the one with fewest rejection reasons
    if (approvedStrategies.length === 0) {
        const leastRejected = reviewerOutput.reviews.reduce((prev, curr) =>
            curr.rejection_reasons.length < prev.rejection_reasons.length
                ? curr
                : prev
        );
        const fallback = strategies.find(
            (s) => s.strategy_name === leastRejected.strategy_name
        );
        if (fallback) approvedStrategies = [fallback];
    }

    // 6. Selection Agent — find the best combination
    const selection = await runSelectionAgent(
        approvedStrategies,
        reviewerOutput.reviews
    );

    return {
        planet_name: planet.name,
        architect_analysis: architectOutput,
        strategies_generated: strategies.length,
        strategies_approved: approvedStrategies.length,
        selected_strategy_name: selection.selected_strategy_name,
        total_duration_years: selection.total_duration_years,
        asteroid_mass_required: selection.asteroid_mass_required,
        timeline: selection.timeline,
        combination_rationale: selection.combination_rationale,
        all_strategies: strategies,
        validation_results: reviewerOutput.reviews,
    };
}
