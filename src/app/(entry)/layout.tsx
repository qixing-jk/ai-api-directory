import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { fontClassName } from "~/app/fonts";
import { ThemeInitializer } from "~/components/shell/theme-initializer";
import { DEFAULT_LOCALE_CODE } from "~/i18n/locales";
import messages from "~/messages/zh-cn.json";
import { buildPageMetadata } from "~/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  localeCode: "zh-cn",
  canonicalPath: "/",
  title: messages.Metadata.siteName,
  description: messages.Metadata.rootDescription,
  robots: { index: true, follow: true },
  localePaths: [{ localeCode: "zh-cn", path: "/", published: true }],
  includeXDefault: true,
});

export default function EntryRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  setRequestLocale(DEFAULT_LOCALE_CODE);

  return (
    <html lang="zh-CN" className={fontClassName} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeInitializer />
        <NextIntlClientProvider
          locale={DEFAULT_LOCALE_CODE}
          messages={messages}
        >
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
