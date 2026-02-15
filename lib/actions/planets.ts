"use server";

import { db } from "@/lib/db";
import { habitability } from "@/lib/db/schema";
import { and, desc, gte, ilike, inArray, lte, type SQL } from "drizzle-orm";

const PAGE_SIZE = 50;

export interface PlanetFilters {
  hiMin?: number;
  hiMax?: number;
  tempMin?: number;
  tempMax?: number;
  radiusMin?: number;
  radiusMax?: number;
  massMin?: number;
  massMax?: number;
  riskLevels?: string[];
}

export async function searchPlanets(query: string, offset = 0, filters?: PlanetFilters) {
  try {
    const conditions: SQL[] = [];

    if (query.trim()) {
      conditions.push(ilike(habitability.plName, `%${query.trim()}%`));
    }

    if (filters) {
      if (filters.hiMin !== undefined) conditions.push(gte(habitability.hi, filters.hiMin));
      if (filters.hiMax !== undefined) conditions.push(lte(habitability.hi, filters.hiMax));
      if (filters.tempMin !== undefined) conditions.push(gte(habitability.plEqt, filters.tempMin));
      if (filters.tempMax !== undefined) conditions.push(lte(habitability.plEqt, filters.tempMax));
      if (filters.radiusMin !== undefined) conditions.push(gte(habitability.plRade, filters.radiusMin));
      if (filters.radiusMax !== undefined) conditions.push(lte(habitability.plRade, filters.radiusMax));
      if (filters.massMin !== undefined) conditions.push(gte(habitability.plBmasse, filters.massMin));
      if (filters.massMax !== undefined) conditions.push(lte(habitability.plBmasse, filters.massMax));
      if (filters.riskLevels?.length) conditions.push(inArray(habitability.riskLevel, filters.riskLevels));
    }

    const baseQuery = db
      .select()
      .from(habitability)
      .orderBy(desc(habitability.hi))
      .limit(PAGE_SIZE + 1)
      .offset(offset);

    const rows = conditions.length
      ? await baseQuery.where(and(...conditions))
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
