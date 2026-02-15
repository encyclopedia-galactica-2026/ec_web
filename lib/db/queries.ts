import { db } from ".";
import { habitability } from "./schema";
import { desc } from "drizzle-orm";

const PAGE_SIZE = 50;

export async function getInitialPlanets() {
  try {
    const rows = await db
      .select()
      .from(habitability)
      .orderBy(desc(habitability.hi))
      .limit(PAGE_SIZE + 1);

    const hasMore = rows.length > PAGE_SIZE;
    return { planets: rows.slice(0, PAGE_SIZE), hasMore };
  } catch (err) {
    console.error("DB query failed:", err);
    return { planets: [], hasMore: false };
  }
}
