import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ThemeToggle } from "~/components/shell/theme-toggle";

export async function AdminShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Admin");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-semibold">{t("shellTitle")}</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
