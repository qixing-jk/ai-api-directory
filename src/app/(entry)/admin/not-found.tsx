import { getTranslations } from "next-intl/server";

export default async function AdminNotFound() {
  const t = await getTranslations("Admin");

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundDescription")}</p>
    </section>
  );
}
