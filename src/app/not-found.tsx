import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "~/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("Errors");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {t("notFoundDescription")}
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/">{t("returnHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
