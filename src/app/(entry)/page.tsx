import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  detectPreferredLocale,
  LOCALE_COOKIE_NAME,
} from "~/i18n/locale-detection";

export default async function RootEntryPage() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const locale = detectPreferredLocale({
    localeCookie: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: headersList.get("accept-language"),
  });

  redirect(`/${locale}`);
}
