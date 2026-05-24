import { getTranslations } from "next-intl/server";
import { AppLink } from "~/components/navigation/app-link";
import { Button } from "~/components/ui/button";

export default async function PublicNotFound() {
  const t = await getTranslations("Errors");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-3 text-muted-foreground">{t("notFoundDescription")}</p>
      <div className="mt-6">
        <Button asChild>
          <AppLink href="/">{t("returnHome")}</AppLink>
        </Button>
      </div>
    </main>
  );
}
