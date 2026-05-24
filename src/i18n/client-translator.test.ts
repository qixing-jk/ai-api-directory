import { describe, expect, it } from "vitest";
import {
  getClientTranslator,
  getGlobalErrorLocaleCode,
} from "./client-translator";

describe("getGlobalErrorLocaleCode", () => {
  it("uses the current URL locale segment when global error UI renders", () => {
    expect(getGlobalErrorLocaleCode("/en")).toBe("en");
    expect(getGlobalErrorLocaleCode("/en/guides")).toBe("en");
  });

  it("falls back to the default locale outside localized routes", () => {
    expect(getGlobalErrorLocaleCode("/admin")).toBe("zh-cn");
    expect(getGlobalErrorLocaleCode(null)).toBe("zh-cn");
  });
});

describe("getClientTranslator", () => {
  it("returns a next-intl compatible translator for client-only fallbacks", () => {
    const { locale, t } = getClientTranslator("/en/problem", "Errors");

    expect(locale.htmlLang).toBe("en");
    expect(t("errorTitle")).toBe("This page cannot be displayed");
    expect(t("tryAgain")).toBe("Try again");
  });
});
