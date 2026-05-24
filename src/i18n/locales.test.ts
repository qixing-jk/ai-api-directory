import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE_CODE,
  getLocaleByCode,
  getPublicDiscoveryLocales,
  isLocaleCode,
  localeStaticParams,
  locales,
  toUrlLocale,
} from "./locales";

describe("locale registry", () => {
  it("maps lowercase URL codes to internal locale metadata", () => {
    expect(getLocaleByCode("zh-cn")).toMatchObject({
      urlCode: "zh-cn",
      locale: "zh-CN",
      htmlLang: "zh-CN",
      hreflang: "zh-CN",
      ogLocale: "zh_CN",
      formattingLocale: "zh-CN",
    });

    expect(getLocaleByCode("en")).toMatchObject({
      urlCode: "en",
      locale: "en",
      htmlLang: "en",
      hreflang: "en",
      ogLocale: "en_US",
      formattingLocale: "en",
    });
  });

  it("normalizes supported locale input to URL code", () => {
    expect(toUrlLocale("zh-CN")).toBe("zh-cn");
    expect(toUrlLocale("zh-cn")).toBe("zh-cn");
    expect(toUrlLocale("en")).toBe("en");
  });

  it("guards unsupported path codes", () => {
    expect(isLocaleCode("zh-cn")).toBe(true);
    expect(isLocaleCode("en")).toBe(true);
    expect(isLocaleCode("fr")).toBe(false);
    expect(getLocaleByCode("fr")).toBeUndefined();
  });

  it("provides public discovery locales independently from route support", () => {
    expect(DEFAULT_LOCALE_CODE).toBe("zh-cn");
    expect(locales.map((locale) => locale.urlCode)).toEqual(["zh-cn", "en"]);
    expect(getPublicDiscoveryLocales().map((locale) => locale.urlCode)).toEqual([
      "zh-cn",
    ]);
  });

  it("generates Next static params for supported route locales", () => {
    expect(localeStaticParams()).toEqual([{ locale: "zh-cn" }, { locale: "en" }]);
  });
});
