import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

export function createDatabaseClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create the database client");
  }

  const queryClient = postgres(databaseUrl, { prepare: false });
  return drizzle(queryClient, { schema });
}
