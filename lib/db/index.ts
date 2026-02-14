import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to Railway Variables (or .env.local for local dev)."
  );
}
const client = postgres(url, { prepare: false });
export const db = drizzle(client, { schema });
