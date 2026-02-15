import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { terraformLog } from "@/lib/terraforming/logger";

function buildCurrentPrompt(planet: Record<string, unknown>): string {
  return `You are a planetary scientist writing a brief profile for an interstellar encyclopedia.

Describe exoplanet "${planet.plName}" in its current, untouched state.

Planet data:
- Equilibrium Temperature: ${planet.plEqt ?? "unknown"} K
- Radius: ${planet.plRade ?? "unknown"} Earth radii
- Mass: ${planet.plBmasse ?? "unknown"} Earth masses
- Orbital Distance: ${planet.plOrbsmax ?? "unknown"} AU
- Stellar Flux: ${planet.flux ?? "unknown"}
- Habitability Index: ${planet.hi ?? "unknown"}/100
- Atmosphere Score: ${planet.atmosphereScore ?? "unknown"} (0-1)
- Temperature Score: ${planet.tempScore ?? "unknown"} (0-1)
- Habitable Zone Score: ${planet.hzScore ?? "unknown"} (0-1)
- Risk Level: ${planet.riskLevel ?? "unknown"}

Cover: surface environment, atmosphere, resources, and any hazards or challenges.

Rules:
- Write 2-3 short paragraphs, around 120-150 words total.
- Use plain text only. No markdown, no bullet points, no headings, no bold/italic, no special formatting.
- Language should be clear, easy to read, and slightly professional. Avoid overly dramatic or poetic phrasing.
- Be scientifically grounded based on the data provided.`;
}

interface StrategyInfo {
  name: string;
  description: string;
  estimatedYears: number;
}

function buildTerraformedPrompt(
  planet: Record<string, unknown>,
  after: Record<string, unknown>,
  strategies: StrategyInfo[],
): string {
  const strategyBlock = strategies
    .map(
      (s) =>
        `- ${s.name} (${s.estimatedYears.toLocaleString()} years): ${s.description}`,
    )
    .join("\n");

  return `You are a planetary scientist writing a brief profile for an interstellar encyclopedia.

Describe exoplanet "${planet.plName}" AFTER successful terraforming.

Original state:
- Equilibrium Temperature: ${planet.plEqt ?? "unknown"} K
- Habitability Index: ${planet.hi ?? "unknown"}/100
- Atmosphere Score: ${planet.atmosphereScore ?? "unknown"}
- Risk Level: ${planet.riskLevel ?? "unknown"}

Terraforming approaches used:
${strategyBlock}

Post-terraforming projections:
- Equilibrium Temperature: ${after.plEqt} K
- Habitability Index: ${after.hi}/100
- Atmosphere Score: ${after.atmosphereScore}
- Risk Level: ${after.riskLevel}

Cover: the transformed environment, atmospheric conditions, available resources, and what living conditions would look like for colonists. Reference the specific terraforming approaches that were applied and how they contributed to the changes.

Rules:
- Write 2-3 short paragraphs, around 120-150 words total.
- Use plain text only. No markdown, no bullet points, no headings, no bold/italic, no special formatting.
- Language should be clear, easy to read, and slightly professional. Avoid overly dramatic or poetic phrasing.
- Briefly note how conditions improved compared to the original state.
- Be scientifically grounded based on the data provided.`;
}

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const { planet, mode, terraformedData, strategies } = await req.json();

    terraformLog.info("Describe request received", {
      planet: planet.plName,
      mode,
      hi: planet.hi,
      plEqt: planet.plEqt,
    });

    const prompt =
      mode === "terraformed"
        ? buildTerraformedPrompt(planet, terraformedData, strategies ?? [])
        : buildCurrentPrompt(planet);

    terraformLog.info("Sending describe prompt to Groq", {
      model: "moonshotai/kimi-k2-instruct",
      mode,
      promptLength: prompt.length,
    });

    const result = streamText({
      model: groq("moonshotai/kimi-k2-instruct"),
      prompt,
      onFinish: ({ usage }) => {
        terraformLog.info("Description stream finished", { mode, usage });
        terraformLog.timing("Describe API call", startMs);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    terraformLog.error("Failed to generate description", error);
    return Response.json(
      { error: "Failed to generate planet description" },
      { status: 500 },
    );
  }
}
