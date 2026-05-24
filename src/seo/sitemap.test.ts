import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSitemapEntries } from "./sitemap";

describe("sitemap helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("SITE_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("excludes unpublished and noindex records", () => {
    const entries = buildSitemapEntries([
      { path: "/zh-cn", published: true, indexable: true },
      { path: "/en", published: false, indexable: true },
      { path: "/admin", published: true, indexable: false },
    ]);

    expect(entries).toEqual([
      {
        url: "http://localhost:3000/zh-cn",
      },
    ]);
  });

  it("passes through lastModified for indexable published records", () => {
    const lastModified = new Date("2026-05-24T00:00:00.000Z");

    expect(
      buildSitemapEntries([
        {
          path: "/zh-cn/directory",
          published: true,
          indexable: true,
          lastModified,
        },
      ]),
    ).toEqual([
      {
        url: "http://localhost:3000/zh-cn/directory",
        lastModified,
      },
    ]);
  });
});
