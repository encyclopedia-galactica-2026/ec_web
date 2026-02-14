async function testSeedingAPI() {
    console.log("Testing Seeding API endpoint...\n");

    try {
        // First, get the list of available planets
        console.log("1. Fetching available planets...");
        const errorResponse = await fetch("http://localhost:3000/api/seeding");
        const errorData = await errorResponse.json();

        console.log("   Available planets:", errorData.available_planets?.slice(0, 5).join(", "), "...");

        // Test with the first available planet
        const testPlanet = errorData.available_planets?.[0];
        if (!testPlanet) {
            throw new Error("No planets available for testing");
        }

        console.log(`\n2. Testing seeding for planet: ${testPlanet}`);
        console.log("   This may take a moment as it calls the Groq API...\n");

        const response = await fetch(`http://localhost:3000/api/seeding?planet=${encodeURIComponent(testPlanet)}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        console.log("✅ SUCCESS! Seeding API is working correctly!\n");
        console.log("Response summary:");
        console.log(`  Planet: ${data.planet || testPlanet}`);
        console.log(`  Status: ${data.status || 'completed'}`);

        if (data.result) {
            console.log("\n  Generated data structure:");
            console.log(`    - Selection: ${data.result.selection ? '✓' : '✗'}`);
            console.log(`    - Architecture: ${data.result.architecture ? '✓' : '✗'}`);
            console.log(`    - Physics Review: ${data.result.physicsReview ? '✓' : '✗'}`);
            console.log(`    - Seeding Strategy: ${data.result.seedingStrategy ? '✓' : '✗'}`);
        }

        console.log("\n  Full response:");
        console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...");

    } catch (error) {
        console.error("\n❌ ERROR: Failed to test seeding API");
        if (error instanceof Error) {
            console.error(`  Message: ${error.message}`);
        }
        console.error("\nFull error:", error);
        process.exit(1);
    }
}

testSeedingAPI();
