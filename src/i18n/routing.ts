import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE_CODE, locales } from "./locales";

export const routing = defineRouting({
  locales: locales.map((locale) => locale.urlCode),
  defaultLocale: DEFAULT_LOCALE_CODE,
  localePrefix: "always",
  pathnames: {
    "/": "/",
  },
});
