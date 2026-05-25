import { pgEnum } from "drizzle-orm/pg-core";

export const actorTypePgEnum = pgEnum("actor_type", ["admin", "system"]);
