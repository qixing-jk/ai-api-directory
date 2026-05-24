import { createTranslator } from "next-intl";
import {
  DEFAULT_LOCALE_CODE,
  getLocaleByCode,
  isLocaleCode,
  locales,
  type LocaleCode,
} from "~/i18n/locales";
import enMessages from "~/messages/en.json";
import zhCnMessages from "~/messages/zh-cn.json";

const messageCatalogs = {
  "zh-cn": zhCnMessages,
  en: enMessages,
} satisfies Record<LocaleCode, typeof zhCnMessages>;

type MessageNamespace = keyof typeof zhCnMessages;

export function getGlobalErrorLocaleCode(pathname: string | null): LocaleCode {
  const firstSegment = pathname?.split("/").find(Boolean);

  return firstSegment && isLocaleCode(firstSegment)
    ? firstSegment
    : DEFAULT_LOCALE_CODE;
}

export function getClientTranslator<Namespace extends MessageNamespace>(
  pathname: string | null,
  namespace: Namespace,
) {
  const localeCode = getGlobalErrorLocaleCode(pathname);
  const locale = getLocaleByCode(localeCode) ?? locales[0];

  return {
    locale,
    localeCode,
    t: createTranslator({
      locale: locale.locale,
      messages: messageCatalogs[localeCode],
      namespace,
    }),
  };
}
