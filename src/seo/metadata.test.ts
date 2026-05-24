import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPageMetadata,
  buildPublishedLanguageAlternates,
  getPublicDiscoveryLocalePaths,
} from "./metadata";

describe("metadata helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("SITE_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes only published locale alternates", () => {
    const alternates = buildPublishedLanguageAlternates({
      canonicalPath: "/zh-cn/directory/models/gpt-4o",
      localePaths: [
        {
          localeCode: "zh-cn",
          path: "/zh-cn/directory/models/gpt-4o",
          published: true,
        },
        {
          localeCode: "en",
          path: "/en/directory/models/gpt-4o",
          published: false,
        },
      ],
      includeXDefault: false,
    });

    expect(alternates).toEqual({
      canonical: "/zh-cn/directory/models/gpt-4o",
      languages: {
        "zh-CN": "/zh-cn/directory/models/gpt-4o",
      },
    });
  });

  it("derives published locale paths from the locale registry", () => {
    expect(getPublicDiscoveryLocalePaths()).toEqual([
      { localeCode: "zh-cn", path: "/zh-cn", published: true },
    ]);
  });

  it("builds Next metadata with canonical, robots, and Open Graph fields", () => {
    const metadata = buildPageMetadata({
      localeCode: "zh-cn",
      canonicalPath: "/zh-cn",
      title: "AI API Directory",
      description: "Find AI API relay sites and model prices.",
      robots: { index: true, follow: true },
      localePaths: [{ localeCode: "zh-cn", path: "/zh-cn", published: true }],
    });

    expect(metadata.title).toBe("AI API Directory");
    expect(metadata.description).toBe(
      "Find AI API relay sites and model prices.",
    );
    expect(metadata.alternates).toMatchObject({
      canonical: "/zh-cn",
      languages: { "zh-CN": "/zh-cn" },
    });
    expect(metadata.openGraph).toMatchObject({
      title: "AI API Directory",
      description: "Find AI API relay sites and model prices.",
      url: "http://localhost:3000/zh-cn",
      locale: "zh_CN",
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
