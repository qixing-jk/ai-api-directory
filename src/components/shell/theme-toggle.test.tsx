import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shellTestIds } from "~/components/shell/test-ids";
import {
  isThemePreference,
  ThemeToggle,
} from "~/components/shell/theme-toggle";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("exposes stable selectors for the trigger and theme options", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    expect(
      screen.getByTestId(shellTestIds.themeMenuTrigger).getAttribute("aria-label"),
    ).toBe("PublicNav.theme: Theme.system");

    await user.click(screen.getByTestId(shellTestIds.themeMenuTrigger));

    expect(screen.getByText("PublicNav.theme")).toBeTruthy();
    expect(
      screen.getByTestId(shellTestIds.themeMenuOption("system")).getAttribute(
        "data-state",
      ),
    ).toBe("checked");

    await user.click(screen.getByTestId(shellTestIds.themeMenuOption("dark")));

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("guards arbitrary menu values before applying a theme", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("solarized")).toBe(false);
  });
});
