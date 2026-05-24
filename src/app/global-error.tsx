"use client";

import "./globals.css";
import { Button } from "~/components/ui/button";
import { getLocaleByCode, DEFAULT_LOCALE_CODE } from "~/i18n/locales";
import messages from "~/messages/zh-cn.json";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = getLocaleByCode(DEFAULT_LOCALE_CODE);
  const t = messages.Errors;

  return (
    <html lang={locale?.htmlLang ?? "zh-CN"}>
      <body className="min-h-dvh bg-background text-foreground">
        <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t.errorTitle}
          </h1>
          <p className="mt-3 text-muted-foreground">{t.errorDescription}</p>
          <div className="mt-6">
            <Button type="button" onClick={reset}>
              {t.tryAgain}
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
