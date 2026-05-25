import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

export type DatabaseClient = {
  readonly db: ReturnType<typeof drizzle<typeof schema>>;
  readonly end: Sql["end"];
};

export function createDatabaseClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create the database client");
  }

  const queryClient = postgres(databaseUrl, { prepare: false });
  return {
    db: drizzle(queryClient, { schema }),
    end: queryClient.end.bind(queryClient),
  };
}
