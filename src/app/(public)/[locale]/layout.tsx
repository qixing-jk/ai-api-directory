import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../../globals.css";
import { fontClassName } from "~/app/fonts";
import { PublicShell } from "~/components/shell/public-shell";
import { ThemeInitializer } from "~/components/shell/theme-initializer";
import {
  getLocaleByCode,
  localeStaticParams,
  type LocaleCode,
} from "~/i18n/locales";
import { loadMessages } from "~/i18n/messages";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeStaticParams();
}

export default async function PublicLocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localeDefinition = getLocaleByCode(locale);

  if (!localeDefinition) {
    notFound();
  }

  const localeCode = localeDefinition.urlCode as LocaleCode;
  setRequestLocale(localeCode);
  const messages = await loadMessages(localeCode);

  return (
    <html
      lang={localeDefinition.htmlLang}
      className={fontClassName}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeInitializer />
        <NextIntlClientProvider locale={localeCode} messages={messages}>
          <PublicShell locale={localeCode}>{children}</PublicShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
