import { NextResponse } from "next/server";
import { orchestrate } from "@/lib/seeding/orchestrator";
import { getAllExoplanetNames } from "@/lib/mockDb";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const planetName = searchParams.get("planet");

    if (!planetName) {
        return NextResponse.json(
            {
                error: "Missing 'planet' query parameter",
                available_planets: getAllExoplanetNames(),
            },
            { status: 400 }
        );
    }

    try {
        const result = await orchestrate(planetName);
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            {
                error: message,
                available_planets: getAllExoplanetNames(),
            },
            { status: error instanceof Error && message.includes("not found") ? 404 : 500 }
        );
    }
}
