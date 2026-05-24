import { getTranslations } from "next-intl/server";
import { Badge } from "~/components/ui/badge";

export default async function AdminPage() {
  const t = await getTranslations("Admin");

  return (
    <section className="space-y-4">
      <Badge variant="secondary">{t("shellOnly")}</Badge>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-2xl text-muted-foreground">{t("notReady")}</p>
    </section>
  );
}
