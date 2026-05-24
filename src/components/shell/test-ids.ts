export const shellTestIds = {
  localeMenuTrigger: "shell-locale-menu-trigger",
  localeMenuOption: (locale: string) => `shell-locale-menu-option-${locale}`,
  themeMenuTrigger: "shell-theme-menu-trigger",
  themeMenuOption: (theme: string) => `shell-theme-menu-option-${theme}`,
} as const;
