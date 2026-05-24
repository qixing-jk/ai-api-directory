import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "~/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "zh-cn" | "en" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    localeCode: locale,
    canonicalPath: `/${locale}`,
    title: t("siteName"),
    description: t("publicDescription"),
    robots: { index: locale === "zh-cn", follow: true },
    localePaths: [{ localeCode: "zh-cn", path: "/zh-cn", published: true }],
  });
}

export default async function PublicLocaleHomePage({
  params,
}: {
  params: Promise<{ locale: "zh-cn" | "en" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PublicHome" });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">{t("description")}</p>
      </section>
    </main>
  );
}
