import {
  observationBatchSchema,
  type ObservationBatchInput,
} from "../observation";
import { DomainPolicyError, domainPolicyErrorCode } from "~/domain/errors";

type ObservationWithOrigin = {
  readonly origin: string;
};

function hasOrigin(
  observation: ObservationBatchInput["observations"][number],
): observation is ObservationBatchInput["observations"][number] &
  ObservationWithOrigin {
  return "origin" in observation;
}

function isSyntheticHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid") ||
    hostname.endsWith(".example.com") ||
    hostname.endsWith(".example.org") ||
    hostname.endsWith(".example.net") ||
    hostname === "example.com" ||
    hostname === "example.org" ||
    hostname === "example.net"
  );
}

export function assertProductionSeedBatchHasNoSyntheticSites(
  batch: ObservationBatchInput,
): void {
  const parsedBatch = observationBatchSchema.parse(batch);

  for (const observation of parsedBatch.observations) {
    if (!hasOrigin(observation)) continue;

    const hostname = new URL(observation.origin).hostname.toLowerCase();
    if (!isSyntheticHostname(hostname)) continue;

    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      `Production seed cannot use synthetic fixture origin: ${observation.origin}`,
    );
  }
}
