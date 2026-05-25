import { pgEnum } from "drizzle-orm/pg-core";

export const evidenceLevelPgEnum = pgEnum("evidence_level", [
  "claimed",
  "listed",
  "observed",
  "tested",
  "manually_confirmed",
]);

export const candidateDispositionPgEnum = pgEnum("candidate_disposition", [
  "candidate",
  "ready_for_review",
  "merged",
  "dismissed",
]);

export const signalDispositionPgEnum = pgEnum("signal_disposition", [
  "active",
  "superseded",
  "dismissed",
  "withdrawn",
]);
