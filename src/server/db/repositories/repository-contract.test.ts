import { describe, expect, it } from "vitest";
import { developmentObservationBatch } from "~/contracts/import/fixtures/development";
import {
  mapObservationBatchToDryRunImportPlan,
  type CliSupportEvidenceWriteInput,
  type ProbeEvidenceWriteInput,
} from "../mappers/observation-intake";
import { createAuditEventAppender } from "./audit";
import { createEvidenceAppender } from "./evidence";
import { createObservationCandidateAppender } from "./observation-candidates";
import { createProjectionReader } from "./projections";

const entityId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";

describe("repository contracts", () => {
  it("projection readers validate public DTO output", async () => {
    const reader = createProjectionReader({
      async listProjectionRows() {
        return [
          {
            projectionKey: "site/example-api",
            locale: "zh-cn",
            payload: {
              entityId,
              versionId,
              slug: "example-api",
              title: "Example API",
              summary: "Public summary",
              publicUrl: "https://example.com",
              evidence: [],
              updatedAt: "2026-05-24T00:00:00.000Z",
            },
          },
        ];
      },
    });

    await expect(reader.listPublicProjections()).resolves.toEqual([
      {
        entityId,
        versionId,
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
      },
    ]);
  });

  it("evidence appender exposes append-only operations", async () => {
    const writes: unknown[] = [];
    const appender = createEvidenceAppender({
      async appendPriceSnapshot(input) {
        writes.push(input);
        return { id: "price-1" };
      },
    });

    await expect(
      appender.appendPriceSnapshot({
        modelRouteId: "route-1",
        currency: "USD",
        billingUnit: "per_1m_tokens",
        observedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).resolves.toEqual({ id: "price-1" });
    expect(writes).toHaveLength(1);
  });

  it("audit appender requires actor and command context", async () => {
    const writes: unknown[] = [];
    const appender = createAuditEventAppender({
      async appendAuditEvent(input) {
        writes.push(input);
        return { id: "audit-1" };
      },
    });

    await expect(
      appender.appendAuditEvent({
        actor: { type: "system" },
        commandId: "cmd-1",
        objectFamily: "site",
        objectId: "site-1",
        action: "seed.imported",
      }),
    ).resolves.toEqual({ id: "audit-1" });
    expect(writes).toHaveLength(1);
  });

  it("observation candidate appender writes candidates and evidence without projections", async () => {
    const writes: string[] = [];
    const verificationProbeEvidenceWrites: ProbeEvidenceWriteInput[] = [];
    const cliSupportEvidenceWrites: CliSupportEvidenceWriteInput[] = [];
    const appender = createObservationCandidateAppender({
      async appendSiteCandidate() {
        writes.push("site");
        return { id: "site-candidate-1" };
      },
      async appendEndpointCandidate() {
        writes.push("endpoint");
        return { id: "endpoint-candidate-1" };
      },
      async appendModelCandidate() {
        writes.push("model");
        return { id: "model-candidate-1" };
      },
      async appendModelRouteCandidate() {
        writes.push("model_route");
        return { id: "route-candidate-1" };
      },
      async appendPriceCandidate() {
        writes.push("price");
        return { id: "price-candidate-1" };
      },
      async appendCapabilityCandidate() {
        writes.push("capability");
        return { id: "capability-candidate-1" };
      },
      async appendRiskReviewItem() {
        writes.push("risk_review");
        return { id: "risk-review-1" };
      },
      async appendVerificationProbeEvidence(input) {
        writes.push("verification_probe_evidence");
        verificationProbeEvidenceWrites.push(input);
        return { id: "verification-probe-evidence-1" };
      },
      async appendCliSupportEvidence(input) {
        writes.push("cli_support_evidence");
        cliSupportEvidenceWrites.push(input);
        return { id: "cli-support-evidence-1" };
      },
      async appendEvidenceRecord() {
        writes.push("evidence");
        return { id: "evidence-1" };
      },
    });

    const plan = mapObservationBatchToDryRunImportPlan(
      developmentObservationBatch,
    );

    await expect(appender.appendDryRunPlan(plan)).resolves.toEqual({
      siteCandidates: 1,
      endpointCandidates: 1,
      modelCandidates: 1,
      modelRouteCandidates: 1,
      priceCandidates: 1,
      capabilityCandidates: 1,
      riskReviewItems: 1,
      verificationProbeEvidence: 1,
      cliSupportEvidence: 1,
      evidenceRecords: 5,
      publicProjectionRecords: 0,
    });

    expect(writes).toEqual([
      "site",
      "endpoint",
      "model",
      "model_route",
      "price",
      "capability",
      "risk_review",
      "verification_probe_evidence",
      "cli_support_evidence",
      "evidence",
      "evidence",
      "evidence",
      "evidence",
      "evidence",
    ]);
    expect(verificationProbeEvidenceWrites[0]).toMatchObject({
      probeId: "synthetic-text-probe",
    });
    expect(cliSupportEvidenceWrites[0]).toMatchObject({
      tool: "codex_cli",
    });
  });
});
