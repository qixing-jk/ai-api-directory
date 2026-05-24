"use client";

import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations("Admin");
  const tErrors = useTranslations("Errors");

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{t("errorDescription")}</p>
      <Button type="button" onClick={reset}>
        {tErrors("tryAgain")}
      </Button>
    </section>
  );
}
