import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Pakai service role — bypass RLS
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // diperlukan untuk Supabase
});

export const db = drizzle(client, { schema });