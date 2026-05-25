import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const queryEnd = vi.fn();
  const queryClient = { end: queryEnd };

  return {
    db: { readonly: "db" },
    drizzle: vi.fn(() => ({ readonly: "db" })),
    postgres: vi.fn(() => queryClient),
    queryClient,
    queryEnd,
  };
});

vi.mock("server-only", () => ({}));
vi.mock("./schema", () => ({
  adminUsers: {},
}));
vi.mock("postgres", () => ({
  default: mocks.postgres,
}));
vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: mocks.drizzle,
}));

import { createDatabaseClient } from "./client";

describe("createDatabaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a database URL", () => {
    expect(() => createDatabaseClient("")).toThrow(
      "DATABASE_URL is required to create the database client",
    );
    expect(mocks.postgres).not.toHaveBeenCalled();
  });

  it("returns the Drizzle client with a connection closer", async () => {
    const client = createDatabaseClient("postgres://example.test/db");

    expect(mocks.postgres).toHaveBeenCalledWith("postgres://example.test/db", {
      prepare: false,
    });
    expect(mocks.drizzle).toHaveBeenCalledWith(
      mocks.queryClient,
      expect.objectContaining({
        schema: expect.any(Object),
      }),
    );
    expect(client.db).toEqual(mocks.db);

    await client.end();

    expect(mocks.queryEnd).toHaveBeenCalledOnce();
  });
});
