import {
  DEFAULT_LOCALE_CODE,
  getLocaleByCode,
  locales,
  type LocaleCode,
} from "./locales";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

type LocaleDetectionInput = {
  readonly localeCookie?: string | null;
  readonly acceptLanguage?: string | null;
};

function getSupportedLocale(value: string): LocaleCode | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;

  const byUrlCode = getLocaleByCode(normalized);
  if (byUrlCode) return byUrlCode.urlCode as LocaleCode;

  const byAppLocale = locales.find(
    (locale) => locale.locale.toLowerCase() === normalized,
  );
  if (byAppLocale) return byAppLocale.urlCode as LocaleCode;

  const language = normalized.split("-")[0];
  const byLanguage = locales.find((locale) => {
    return (
      locale.urlCode.split("-")[0] === language ||
      locale.locale.toLowerCase().split("-")[0] === language
    );
  });

  return byLanguage?.urlCode as LocaleCode | undefined;
}

function parseAcceptLanguage(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        tag: tag.trim(),
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((left, right) => right.q - left.q || left.index - right.index)
    .map((entry) => entry.tag);
}

export function detectPreferredLocale({
  localeCookie,
  acceptLanguage,
}: LocaleDetectionInput): LocaleCode {
  if (localeCookie) {
    const cookieLocale = getSupportedLocale(localeCookie);
    if (cookieLocale) return cookieLocale;
  }

  if (acceptLanguage) {
    for (const language of parseAcceptLanguage(acceptLanguage)) {
      const headerLocale = getSupportedLocale(language);
      if (headerLocale) return headerLocale;
    }
  }

  return DEFAULT_LOCALE_CODE;
}
