import type { ReactNode } from "react";
import { AppLink } from "~/components/navigation/app-link";
import { LocaleSwitcher } from "~/components/shell/locale-switcher";
import { ThemeToggle } from "~/components/shell/theme-toggle";
import type { LocaleCode } from "~/i18n/locales";

export function PublicShell({
  children,
  locale,
}: {
  children: ReactNode;
  locale: LocaleCode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <AppLink href="/" locale={locale} className="font-semibold">
            AI API Directory
          </AppLink>
          <nav className="flex items-center gap-3">
            <LocaleSwitcher currentLocale={locale} />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
