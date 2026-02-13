import { db } from ".";
import { habitability } from "./schema";
import { desc } from "drizzle-orm";

const PAGE_SIZE = 50;

export async function getInitialPlanets() {
  const rows = await db
    .select()
    .from(habitability)
    .orderBy(desc(habitability.hi))
    .limit(PAGE_SIZE);

  return {
    planets: rows,
    hasMore: rows.length === PAGE_SIZE,
  };
}
