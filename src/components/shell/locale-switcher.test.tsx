import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { LocaleSwitcher } from "~/components/shell/locale-switcher";
import { shellTestIds } from "~/components/shell/test-ids";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock("~/components/navigation/app-link", () => ({
  AppLink: ({
    href,
    locale,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    locale: string;
  }) => <a href={`/${locale}${href}`} {...props} />,
}));

vi.mock("~/i18n/navigation", () => ({
  usePathname: () => "/directory",
}));

describe("LocaleSwitcher", () => {
  it("exposes stable selectors for the trigger and locale options", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher currentLocale="zh-cn" />);

    expect(
      screen
        .getByTestId(shellTestIds.localeMenuTrigger)
        .getAttribute("aria-label"),
    ).toBe("PublicNav.language: 简体中文");

    await user.click(screen.getByTestId(shellTestIds.localeMenuTrigger));

    expect(screen.getByText("PublicNav.language")).toBeTruthy();
    expect(
      screen
        .getByTestId(shellTestIds.localeMenuOption("zh-cn"))
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByTestId(shellTestIds.localeMenuOption("en")).getAttribute("href"),
    ).toBe("/en/directory");
  });
});
