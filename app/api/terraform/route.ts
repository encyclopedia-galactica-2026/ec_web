import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { z } from "zod";
import { terraformLog } from "@/lib/terraforming/logger";

const strategySchema = z.object({
  strategies: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      estimatedYears: z.number(),
      afterValues: z.object({
        plEqt: z.number(),
        hi: z.number(),
        tri: z.number(),
        flux: z.number(),
        atmosphereScore: z.number(),
        tempScore: z.number(),
        radiusScore: z.number(),
        massScore: z.number(),
        fluxScore: z.number(),
        hzScore: z.number(),
        riskLevel: z.string(),
      }),
    }),
  ),
});

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const { planet } = await req.json();

    terraformLog.info("Request received", {
      planet: planet.plName,
      hi: planet.hi,
      plEqt: planet.plEqt,
    });

    const prompt = `You are a planetary scientist specializing in terraforming exoplanets.

Analyze this exoplanet and propose 3-4 distinct seeding/terraforming strategies.

Current planet data:
- Name: ${planet.plName}
- Equilibrium Temperature: ${planet.plEqt ?? "unknown"} K
- Radius: ${planet.plRade ?? "unknown"} Earth radii
- Mass: ${planet.plBmasse ?? "unknown"} Earth masses
- Orbital Distance: ${planet.plOrbsmax ?? "unknown"} AU
- Stellar Flux: ${planet.flux ?? "unknown"}
- Habitability Index: ${planet.hi ?? "unknown"} / 100
- Terrestrial Similarity Index: ${planet.tri ?? "unknown"}
- Atmosphere Score: ${planet.atmosphereScore ?? "unknown"} (0-1)
- Temperature Score: ${planet.tempScore ?? "unknown"} (0-1)
- Radius Score: ${planet.radiusScore ?? "unknown"} (0-1)
- Mass Score: ${planet.massScore ?? "unknown"} (0-1)
- Flux Score: ${planet.fluxScore ?? "unknown"} (0-1)
- Habitable Zone Score: ${planet.hzScore ?? "unknown"} (0-1)
- Risk Level: ${planet.riskLevel ?? "unknown"}

For each strategy, provide:
1. A creative but scientifically plausible name
2. A 2-3 sentence description of the approach
3. Estimated time in years (realistic, ranging from 50 to 10000 years)
4. The projected "after" values for all planet scores after terraforming completes

Rules for strategy descriptions:
- Use plain text only. No markdown, no bullet points, no bold/italic, no special formatting.
- Language should be clear, easy to read, and slightly professional. Avoid overly dramatic or poetic phrasing.
- Keep each description concise and grounded in science.

Rules for after values:
- plEqt should move toward 255-290 K (Earth-like) but the degree depends on the strategy's aggressiveness
- hi should improve but not exceed 95
- tri should improve toward 1.0 but respect physical limits
- flux value stays the same (cannot change stellar output)
- atmosphereScore should improve toward 0.7-0.9
- tempScore should improve toward 0.8-0.95
- radiusScore and massScore stay the same (cannot change planet size/mass)
- fluxScore stays the same (stellar property)
- hzScore stays the same (orbital property)
- riskLevel should reflect the improved state: "Low", "Moderate", "High", or "Critical"
- Each strategy should have different trade-offs: faster strategies should yield less optimal results, slower ones closer to ideal

Make the strategies range from aggressive/fast to conservative/slow.`;

    terraformLog.info("Sending prompt to Groq", {
      model: "openai/gpt-oss-20b",
      promptLength: prompt.length,
    });
    
    const { output, usage } = await generateText({
      model: groq("openai/gpt-oss-20b"),
      output: Output.object({ schema: strategySchema }),
      prompt,
    });

    if (!output) {
      throw new Error("No structured output returned from model");
    }

    terraformLog.info("Response received", {
      strategiesCount: output.strategies.length,
      usage,
    });
    terraformLog.timing("Total API call", startMs);

    return Response.json(output);
  } catch (error) {
    terraformLog.error("Failed to generate strategies", error);
    return Response.json(
      { error: "Failed to generate terraforming strategies" },
      { status: 500 },
    );
  }
}
