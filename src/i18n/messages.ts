import "server-only";
import { type LocaleCode } from "./locales";

const loaders = {
  "zh-cn": () => import("~/messages/zh-cn.json").then((module) => module.default),
  en: () => import("~/messages/en.json").then((module) => module.default),
} satisfies Record<LocaleCode, () => Promise<Record<string, unknown>>>;

export async function loadMessages(locale: LocaleCode) {
  return loaders[locale]();
}
