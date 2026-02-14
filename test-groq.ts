import Groq from "groq-sdk";

async function testGroqAPI() {
    console.log("Testing Groq API connection...\n");

    // Check if API key is set
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error("❌ GROQ_API_KEY is not set in environment variables");
        process.exit(1);
    }

    console.log("✓ GROQ_API_KEY found in environment");
    console.log(`  Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

    try {
        const client = new Groq({
            apiKey: apiKey,
        });

        console.log("Testing API with a simple completion request...");

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Say 'Hello! The Groq API is working correctly.' in JSON format with a 'message' field." },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Groq returned empty response");
        }

        const parsed = JSON.parse(content);
        console.log("\n✅ SUCCESS! Groq API is working correctly!");
        console.log("\nResponse from Groq:");
        console.log(JSON.stringify(parsed, null, 2));
        console.log("\nAPI Details:");
        console.log(`  Model: ${completion.model}`);
        console.log(`  Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);

    } catch (error) {
        console.error("\n❌ ERROR: Failed to connect to Groq API");
        if (error instanceof Error) {
            console.error(`  Message: ${error.message}`);
        }
        console.error("\nFull error:", error);
        process.exit(1);
    }
}

testGroqAPI();
