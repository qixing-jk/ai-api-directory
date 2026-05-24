"use client";

import { Check, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppLink } from "~/components/navigation/app-link";
import { shellTestIds } from "~/components/shell/test-ids";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { usePathname } from "~/i18n/navigation";
import { getLocaleByCode, locales, type LocaleCode } from "~/i18n/locales";

export function LocaleSwitcher({ currentLocale }: { currentLocale: LocaleCode }) {
  const t = useTranslations("PublicNav");
  const pathname = usePathname();
  const currentLocaleDefinition = getLocaleByCode(currentLocale);
  const currentLocaleLabel =
    currentLocaleDefinition?.nativeLabel ?? currentLocale;
  const label = t("language");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${label}: ${currentLocaleLabel}`}
          title={`${label}: ${currentLocaleLabel}`}
          data-testid={shellTestIds.localeMenuTrigger}
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {locales.map((locale) => {
          const active = locale.urlCode === currentLocale;

          return (
            <DropdownMenuItem key={locale.urlCode} asChild>
              <AppLink
                href={pathname}
                locale={locale.urlCode}
                aria-current={active ? "page" : undefined}
                className="w-full"
                data-testid={shellTestIds.localeMenuOption(locale.urlCode)}
              >
                <span>{locale.nativeLabel}</span>
                {active ? (
                  <Check
                    className="ml-auto h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </AppLink>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
