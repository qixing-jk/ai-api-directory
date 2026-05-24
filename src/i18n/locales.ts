export type LocaleDefinition = {
  readonly urlCode: string;
  readonly locale: string;
  readonly htmlLang: string;
  readonly formattingLocale: string;
  readonly ogLocale: string;
  readonly hreflang: string;
  readonly label: string;
  readonly nativeLabel: string;
  readonly publicDiscovery: boolean;
};

export const locales = [
  {
    urlCode: "zh-cn",
    locale: "zh-CN",
    htmlLang: "zh-CN",
    formattingLocale: "zh-CN",
    ogLocale: "zh_CN",
    hreflang: "zh-CN",
    label: "Chinese (Simplified)",
    nativeLabel: "简体中文",
    publicDiscovery: true,
  },
  {
    urlCode: "en",
    locale: "en",
    htmlLang: "en",
    formattingLocale: "en",
    ogLocale: "en_US",
    hreflang: "en",
    label: "English",
    nativeLabel: "English",
    publicDiscovery: false,
  },
] as const satisfies readonly LocaleDefinition[];

export type LocaleCode = (typeof locales)[number]["urlCode"];
export type AppLocale = (typeof locales)[number]["locale"];
export type RegisteredLocale = (typeof locales)[number];

export const DEFAULT_LOCALE_CODE = "zh-cn" satisfies LocaleCode;
export const DEFAULT_APP_LOCALE = "zh-CN" satisfies AppLocale;

export function isLocaleCode(value: string): value is LocaleCode {
  return locales.some((locale) => locale.urlCode === value);
}

export function getLocaleByCode(value: string): RegisteredLocale | undefined {
  return locales.find((locale) => locale.urlCode === value);
}

export function getLocaleByAppLocale(
  value: string,
): RegisteredLocale | undefined {
  return locales.find((locale) => locale.locale === value);
}

export function toUrlLocale(value: string): LocaleCode {
  const normalized = value.toLowerCase();
  const byCode = getLocaleByCode(normalized);
  if (byCode) return byCode.urlCode as LocaleCode;

  const byAppLocale = getLocaleByAppLocale(value);
  if (byAppLocale) return byAppLocale.urlCode as LocaleCode;

  throw new Error(`Unsupported locale: ${value}`);
}

export function getPublicDiscoveryLocales(): RegisteredLocale[] {
  return locales.filter((locale) => locale.publicDiscovery);
}

export function localeStaticParams(): Array<{ locale: LocaleCode }> {
  return locales.map((locale) => ({ locale: locale.urlCode as LocaleCode }));
}
