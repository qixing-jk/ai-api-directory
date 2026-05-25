import { z } from "zod";
import { locales, type LocaleCode } from "~/i18n/locales";

const localeCodes = locales.map((locale) => locale.urlCode) as [
  LocaleCode,
  ...LocaleCode[],
];

export const localeCodeSchema = z.enum(localeCodes);
