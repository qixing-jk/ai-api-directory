"use client";

import { useLayoutEffect } from "react";

function applyInitialTheme() {
  try {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "system";
  }
}

export function ThemeInitializer() {
  useLayoutEffect(() => {
    applyInitialTheme();
  }, []);

  return null;
}
