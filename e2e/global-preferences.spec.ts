import { expect, test } from "@playwright/test";
import { shellTestIds } from "../src/components/shell/test-ids";

test("global preference menus switch locale and theme", async ({ page }) => {
  await page.goto("/zh-cn");

  await expect(page.getByTestId(shellTestIds.localeMenuTrigger)).toBeVisible();
  await expect(page.getByTestId(shellTestIds.themeMenuTrigger)).toBeVisible();

  await page.getByTestId(shellTestIds.localeMenuTrigger).click();
  await expect(
    page.getByTestId(shellTestIds.localeMenuOption("zh-cn")),
  ).toBeVisible();
  await page.getByTestId(shellTestIds.localeMenuOption("en")).click();

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByTestId(shellTestIds.localeMenuTrigger)).toBeVisible();

  await page.getByTestId(shellTestIds.themeMenuTrigger).click();
  await expect(
    page.getByTestId(shellTestIds.themeMenuOption("system")),
  ).toBeChecked();
  await page.getByTestId(shellTestIds.themeMenuOption("dark")).click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
