import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE_CODE, getLocaleByCode } from "./locales";
import { loadMessages } from "./messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const localeDefinition = locale
    ? getLocaleByCode(locale)
    : getLocaleByCode(DEFAULT_LOCALE_CODE);

  if (!localeDefinition) {
    notFound();
  }

  return {
    locale: localeDefinition.urlCode,
    messages: await loadMessages(localeDefinition.urlCode),
  };
});
