import { describe, expect, it } from "vitest";
import { detectPreferredLocale } from "./locale-detection";

describe("locale detection", () => {
  it("uses the locale cookie before request headers", () => {
    expect(
      detectPreferredLocale({
        localeCookie: "en",
        acceptLanguage: "zh-CN,zh;q=0.9",
      }),
    ).toBe("en");
  });

  it("matches accept-language by exact locale and language fallback", () => {
    expect(
      detectPreferredLocale({
        acceptLanguage: "fr-CA, en-US;q=0.9, zh-CN;q=0.8",
      }),
    ).toBe("en");

    expect(
      detectPreferredLocale({
        acceptLanguage: "zh-Hans-CN, en;q=0.9",
      }),
    ).toBe("zh-cn");
  });

  it("respects q values and falls back to the default locale", () => {
    expect(
      detectPreferredLocale({
        acceptLanguage: "en;q=0.4, zh-CN;q=0.9",
      }),
    ).toBe("zh-cn");

    expect(
      detectPreferredLocale({
        localeCookie: "fr",
        acceptLanguage: "de-DE,fr;q=0.8",
      }),
    ).toBe("zh-cn");
  });
});
