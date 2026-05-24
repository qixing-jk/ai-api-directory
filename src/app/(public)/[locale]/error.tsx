"use client";

import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("errorTitle")}
      </h1>
      <p className="mt-3 text-muted-foreground">{t("errorDescription")}</p>
      <div className="mt-6">
        <Button type="button" onClick={reset}>
          {t("tryAgain")}
        </Button>
      </div>
    </main>
  );
}
