"use server";

import { db } from "@/lib/db";
import { habitability } from "@/lib/db/schema";
import { desc, ilike } from "drizzle-orm";

const PAGE_SIZE = 50;

export async function searchPlanets(query: string, offset = 0) {
  try {
    const baseQuery = db
      .select()
      .from(habitability)
      .orderBy(desc(habitability.hi))
      .limit(PAGE_SIZE + 1)
      .offset(offset);

    const rows = query.trim()
      ? await baseQuery.where(ilike(habitability.plName, `%${query.trim()}%`))
      : await baseQuery;

    const hasMore = rows.length > PAGE_SIZE;
    return {
      planets: rows.slice(0, PAGE_SIZE),
      hasMore,
    };
  } catch (err) {
    console.error("searchPlanets failed:", err);
    return { planets: [], hasMore: false };
  }
}
