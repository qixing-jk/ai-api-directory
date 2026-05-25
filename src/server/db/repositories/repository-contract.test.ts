import { describe, expect, it } from "vitest";
import { createAuditEventAppender } from "./audit";
import { createEvidenceAppender } from "./evidence";
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
});
