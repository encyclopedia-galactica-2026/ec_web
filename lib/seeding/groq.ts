import Groq from "groq-sdk";
import type { z } from "zod/v4";

let _client: Groq | null = null;

function getClient(): Groq {
    if (!_client) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not set in environment");
        }
        _client = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return _client;
}

export async function promptGroq<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    model = "llama-3.3-70b-versatile"
): Promise<T> {
    const client = getClient();

    const completion = await client.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt + "\n\nIMPORTANT: Respond with valid JSON only tailored to the schema. Do not output markdown." },
        ],
        model: model,
        response_format: { type: "json_object" },
        temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Groq returned empty response");
    }

    try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
    } catch (error) {
        console.error("Groq JSON parsing/validation failed.");
        console.error("Content:", content);
        console.error("Error:", JSON.stringify(error, null, 2));
        throw error;
    }
}
