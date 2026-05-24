"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { shellTestIds } from "~/components/shell/test-ids";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type ThemePreference = "light" | "dark" | "system";

const options: Array<{
  value: ThemePreference;
  icon: typeof Sun;
}> = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

const themeChangeEvent = "aah-theme-change";

export function isThemePreference(value: string): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  } catch {
    return "system";
  }
}

function subscribeThemeChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(themeChangeEvent, onStoreChange);
  let mediaQuery: MediaQueryList | undefined;

  try {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", onStoreChange);
  } catch {
    mediaQuery = undefined;
  }

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(themeChangeEvent, onStoreChange);
    mediaQuery?.removeEventListener("change", onStoreChange);
  };
}

function applyTheme(theme: ThemePreference) {
  try {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved =
      theme === "system" ? (systemDark ? "dark" : "light") : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event(themeChangeEvent));
  } catch {
    document.documentElement.dataset.theme = "system";
  }
}

export function ThemeToggle() {
  const tNav = useTranslations("PublicNav");
  const tTheme = useTranslations("Theme");
  const theme = useSyncExternalStore(
    subscribeThemeChange,
    readStoredTheme,
    () => "system",
  );
  const activeOption =
    options.find((option) => option.value === theme) ?? options[2];
  const ActiveIcon = activeOption.icon;
  const label = tNav("theme");
  const activeThemeLabel = tTheme(activeOption.value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${label}: ${activeThemeLabel}`}
          title={`${label}: ${activeThemeLabel}`}
          data-testid={shellTestIds.themeMenuTrigger}
        >
          <ActiveIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isThemePreference(value)) {
              applyTheme(value);
            }
          }}
        >
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                data-testid={shellTestIds.themeMenuOption(option.value)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tTheme(option.value)}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
