# Web Runtime Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js runtime shell for locale-aware public pages, admin entry routes, centralized SEO helpers, tokenized theming, local shadcn-style base components, and project-owned link boundaries.

**Architecture:** Use route groups with separate root layouts: `(entry)` for `/` and `/admin`, and `(public)/[locale]` for public locale pages so server-rendered HTML can emit the correct `<html lang>`. Keep public helpers pure and testable first, then wire them into Next.js routes and layouts. Keep data publishing, auth, tRPC, database schema, and business page UI out of this slice.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript, next-intl, shadcn/ui-style local components using the current shadcn-selected accessible primitive base, lucide-react, Vitest.

---

## Source Spec

Implement this plan against:

- `docs/superpowers/specs/2026-05-24-web-runtime-shell-design.md`

Before writing Next.js route/layout/metadata code, read the local Next.js 16
docs that govern the touched APIs. This repo pins Next.js 16.2.6, so do not
apply older App Router signatures from memory:

- `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/typedRoutes.md`

Next 16 breakage checklist for this shell:

- Treat `params` and `searchParams` as async page/layout inputs and await them
  before destructuring.
- Treat request APIs such as `cookies()` and `headers()` as async, and avoid
  pulling them into static shell code unless dynamic rendering is intentional.
- Re-check the local docs before changing `generateMetadata`, sitemap, robots,
  and typed route signatures or return shapes.

## File Structure

Create or modify these files:

- Modify `package.json`: add runtime dependencies, test scripts, and validation scripts.
- Modify `next.config.ts`: enable Next typed routes first, then add next-intl plugin wiring after request config exists.
- Create `vitest.config.ts`: unit-test configuration for pure helpers.
- Create `src/i18n/locales.ts`: locale registry and mapping helpers.
- Create `src/i18n/locales.test.ts`: locale registry unit tests.
- Create `src/i18n/routing.ts`: next-intl route configuration.
- Create `src/i18n/navigation.ts`: localized navigation helpers.
- Create `src/i18n/messages.ts`: typed message loader.
- Create `src/messages/zh-cn.json`: V1 Chinese UI messages.
- Create `src/messages/en.json`: V1 English UI messages.
- Create `src/seo/url.ts`: `siteUrl`, canonical URL, and path normalization helpers.
- Create `src/seo/url.test.ts`: URL helper unit tests.
- Create `src/seo/metadata.ts`: central Next `Metadata` helper and hreflang logic.
- Create `src/seo/metadata.test.ts`: metadata helper unit tests.
- Create `src/seo/sitemap.ts`: shell-level sitemap record helpers.
- Create `src/seo/sitemap.test.ts`: sitemap helper unit tests.
- Create `src/app/robots.ts`: global robots metadata route.
- Create `src/app/sitemap.ts`: initial sitemap metadata route.
- Create `src/app/global-error.tsx`: minimal root fallback for errors that escape root layouts.
- Delete `src/app/layout.tsx`: replaced by route-group root layouts.
- Move/replace `src/app/page.tsx` as `src/app/(entry)/page.tsx`.
- Create `src/app/(entry)/layout.tsx`: root entry/admin root layout.
- Create `src/app/(entry)/admin/layout.tsx`: admin shell layout.
- Create `src/app/(entry)/admin/page.tsx`: admin shell landing page.
- Create `src/app/(entry)/admin/not-found.tsx`: admin not-found surface.
- Create `src/app/(entry)/admin/error.tsx`: admin error boundary.
- Create `src/app/(entry)/admin/loading.tsx`: admin loading surface.
- Create `src/app/(public)/[locale]/layout.tsx`: public locale root layout.
- Create `src/app/(public)/[locale]/page.tsx`: public locale shell landing page.
- Create `src/app/(public)/[locale]/not-found.tsx`: localized public not-found surface.
- Create `src/app/(public)/[locale]/error.tsx`: localized public error boundary.
- Create `src/app/(public)/[locale]/loading.tsx`: localized public loading surface.
- Create `src/app/fonts.ts`: shared Next font setup.
- Create `src/components/shell/theme-init-script.tsx`: no-flash theme bootstrap.
- Create `src/components/shell/theme-toggle.tsx`: client theme toggle.
- Create `src/components/shell/locale-switcher.tsx`: locale switcher UI.
- Create `src/components/shell/public-shell.tsx`: public navigation and page wrapper.
- Create `src/components/shell/admin-shell.tsx`: admin navigation and page wrapper.
- Create `src/components/navigation/app-link.tsx`: localized internal link policy wrapper.
- Create `src/components/navigation/external-link.tsx`: external link policy wrapper.
- Create `src/lib/cn.ts`: class merge utility.
- Create/modify `components.json`: shadcn component generation configuration if the CLI initializes it.
- Create `src/components/ui/button.tsx`: local shadcn-style button.
- Create `src/components/ui/input.tsx`: local input.
- Create `src/components/ui/label.tsx`: local label.
- Create `src/components/ui/badge.tsx`: local badge shell.
- Create `src/components/ui/dialog.tsx`: local dialog wrapper.
- Create `src/components/ui/dropdown-menu.tsx`: local dropdown wrapper.
- Create `src/components/ui/tabs.tsx`: local tabs wrapper.
- Create `src/components/ui/tooltip.tsx`: local tooltip wrapper.
- Modify `src/app/globals.css`: replace create-next-app colors with semantic theme tokens.

## Task 1: Dependencies, Typed Routes, And Test Harness

**Files:**

- Modify: `package.json`
- Modify: `next.config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```powershell
pnpm add next-intl server-only lucide-react clsx tailwind-merge class-variance-authority
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected:

- `package.json` gains the listed dependencies.
- `pnpm-lock.yaml` updates.
- The command exits with code `0`.
- shadcn/Radix primitive dependencies are not hand-pinned here; Task 6 adds
  them through the current shadcn CLI output.

- [ ] **Step 2: Update scripts in `package.json`**

Keep existing scripts and add test commands:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run --passWithNoTests",
    "validate": "pnpm lint && pnpm test:run && pnpm build"
  }
}
```

- [ ] **Step 3: Enable typed routes in `next.config.ts`**

Replace the file with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default nextConfig;
```

- [ ] **Step 4: Add `vitest.config.ts`**

Create:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 5: Run the empty test harness**

Run:

```powershell
pnpm test:run
```

Expected:

- Exit code `0`.
- Vitest reports no tests or no failures.

- [ ] **Step 6: Validate build tooling still starts**

Run:

```powershell
pnpm lint
```

Expected:

- Exit code `0`.

- [ ] **Step 7: Commit**

Run:

```powershell
git add package.json pnpm-lock.yaml next.config.ts vitest.config.ts
git commit -m "chore: add runtime shell dependencies"
```

## Task 2: Locale Registry

**Files:**

- Create: `src/i18n/locales.ts`
- Create: `src/i18n/locales.test.ts`

- [ ] **Step 1: Write failing locale registry tests**

Create `src/i18n/locales.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE_CODE,
  getLocaleByCode,
  getPublicDiscoveryLocales,
  isLocaleCode,
  localeStaticParams,
  locales,
  toUrlLocale,
} from "./locales";

describe("locale registry", () => {
  it("maps lowercase URL codes to internal locale metadata", () => {
    expect(getLocaleByCode("zh-cn")).toMatchObject({
      urlCode: "zh-cn",
      locale: "zh-CN",
      htmlLang: "zh-CN",
      hreflang: "zh-CN",
      ogLocale: "zh_CN",
      formattingLocale: "zh-CN",
    });

    expect(getLocaleByCode("en")).toMatchObject({
      urlCode: "en",
      locale: "en",
      htmlLang: "en",
      hreflang: "en",
      ogLocale: "en_US",
      formattingLocale: "en",
    });
  });

  it("normalizes supported locale input to URL code", () => {
    expect(toUrlLocale("zh-CN")).toBe("zh-cn");
    expect(toUrlLocale("zh-cn")).toBe("zh-cn");
    expect(toUrlLocale("en")).toBe("en");
  });

  it("guards unsupported path codes", () => {
    expect(isLocaleCode("zh-cn")).toBe(true);
    expect(isLocaleCode("en")).toBe(true);
    expect(isLocaleCode("fr")).toBe(false);
    expect(getLocaleByCode("fr")).toBeUndefined();
  });

  it("provides public discovery locales independently from route support", () => {
    expect(DEFAULT_LOCALE_CODE).toBe("zh-cn");
    expect(locales.map((locale) => locale.urlCode)).toEqual(["zh-cn", "en"]);
    expect(getPublicDiscoveryLocales().map((locale) => locale.urlCode)).toEqual([
      "zh-cn",
    ]);
  });

  it("generates Next static params for supported route locales", () => {
    expect(localeStaticParams()).toEqual([{ locale: "zh-cn" }, { locale: "en" }]);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm test:run src/i18n/locales.test.ts
```

Expected:

- Exit code is non-zero.
- Failure says `Cannot find module './locales'`.

- [ ] **Step 3: Implement `src/i18n/locales.ts`**

Create:

```ts
export type LocaleDefinition = {
  readonly urlCode: string;
  readonly locale: string;
  readonly htmlLang: string;
  readonly formattingLocale: string;
  readonly ogLocale: string;
  readonly hreflang: string;
  readonly label: string;
  readonly nativeLabel: string;
  readonly publicDiscovery: boolean;
};

export const locales = [
  {
    urlCode: "zh-cn",
    locale: "zh-CN",
    htmlLang: "zh-CN",
    formattingLocale: "zh-CN",
    ogLocale: "zh_CN",
    hreflang: "zh-CN",
    label: "Chinese (Simplified)",
    nativeLabel: "简体中文",
    publicDiscovery: true,
  },
  {
    urlCode: "en",
    locale: "en",
    htmlLang: "en",
    formattingLocale: "en",
    ogLocale: "en_US",
    hreflang: "en",
    label: "English",
    nativeLabel: "English",
    publicDiscovery: false,
  },
] as const satisfies readonly LocaleDefinition[];

export type LocaleCode = (typeof locales)[number]["urlCode"];
export type AppLocale = (typeof locales)[number]["locale"];
export type RegisteredLocale = (typeof locales)[number];

export const DEFAULT_LOCALE_CODE = "zh-cn" satisfies LocaleCode;
export const DEFAULT_APP_LOCALE = "zh-CN" satisfies AppLocale;

export function isLocaleCode(value: string): value is LocaleCode {
  return locales.some((locale) => locale.urlCode === value);
}

export function getLocaleByCode(value: string): RegisteredLocale | undefined {
  return locales.find((locale) => locale.urlCode === value);
}

export function getLocaleByAppLocale(
  value: string,
): RegisteredLocale | undefined {
  return locales.find((locale) => locale.locale === value);
}

export function toUrlLocale(value: string): LocaleCode {
  const normalized = value.toLowerCase();
  const byCode = getLocaleByCode(normalized);
  if (byCode) return byCode.urlCode as LocaleCode;

  const byAppLocale = getLocaleByAppLocale(value);
  if (byAppLocale) return byAppLocale.urlCode as LocaleCode;

  throw new Error(`Unsupported locale: ${value}`);
}

export function getPublicDiscoveryLocales(): RegisteredLocale[] {
  return locales.filter((locale) => locale.publicDiscovery);
}

export function localeStaticParams(): Array<{ locale: LocaleCode }> {
  return locales.map((locale) => ({ locale: locale.urlCode as LocaleCode }));
}
```

- [ ] **Step 4: Run locale tests**

Run:

```powershell
pnpm test:run src/i18n/locales.test.ts
```

Expected:

- Exit code `0`.
- All locale registry tests pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/i18n/locales.ts src/i18n/locales.test.ts
git commit -m "feat: add locale registry"
```

## Task 3: URL, Canonical, Hreflang, And Sitemap Helpers

**Files:**

- Create: `src/seo/url.ts`
- Create: `src/seo/url.test.ts`
- Create: `src/seo/metadata.ts`
- Create: `src/seo/metadata.test.ts`
- Create: `src/seo/sitemap.ts`
- Create: `src/seo/sitemap.test.ts`

- [ ] **Step 1: Write failing URL tests**

Create `src/seo/url.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildAbsoluteUrl,
  buildCanonicalPath,
  buildCanonicalUrl,
  getSiteUrl,
  normalizePathname,
} from "./url";

describe("URL helpers", () => {
  it("uses localhost as the development site URL fallback", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("normalizes pathnames without trailing slashes except root", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("zh-cn/directory/")).toBe("/zh-cn/directory");
    expect(normalizePathname("/zh-cn//directory///models")).toBe(
      "/zh-cn/directory/models",
    );
  });

  it("removes query strings and hashes from canonical paths", () => {
    expect(buildCanonicalPath("/zh-cn/directory?sort=price#table")).toBe(
      "/zh-cn/directory",
    );
  });

  it("builds absolute URLs through one site URL source", () => {
    expect(buildAbsoluteUrl("/zh-cn/directory")).toBe(
      "http://localhost:3000/zh-cn/directory",
    );
  });

  it("builds canonical URLs with normalized paths", () => {
    expect(buildCanonicalUrl("/zh-cn/directory/?sort=price")).toBe(
      "http://localhost:3000/zh-cn/directory",
    );
  });
});
```

- [ ] **Step 2: Write failing metadata tests**

Create `src/seo/metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPageMetadata, buildPublishedLanguageAlternates } from "./metadata";

describe("metadata helpers", () => {
  it("includes only published locale alternates", () => {
    const alternates = buildPublishedLanguageAlternates({
      canonicalPath: "/zh-cn/directory/models/gpt-4o",
      localePaths: [
        { localeCode: "zh-cn", path: "/zh-cn/directory/models/gpt-4o", published: true },
        { localeCode: "en", path: "/en/directory/models/gpt-4o", published: false },
      ],
      includeXDefault: false,
    });

    expect(alternates).toEqual({
      canonical: "/zh-cn/directory/models/gpt-4o",
      languages: {
        "zh-CN": "/zh-cn/directory/models/gpt-4o",
      },
    });
  });

  it("builds Next metadata with canonical, robots, and Open Graph fields", () => {
    const metadata = buildPageMetadata({
      localeCode: "zh-cn",
      canonicalPath: "/zh-cn",
      title: "AI API Directory",
      description: "Find AI API relay sites and model prices.",
      robots: { index: true, follow: true },
      localePaths: [{ localeCode: "zh-cn", path: "/zh-cn", published: true }],
    });

    expect(metadata.title).toBe("AI API Directory");
    expect(metadata.description).toBe("Find AI API relay sites and model prices.");
    expect(metadata.alternates).toMatchObject({
      canonical: "/zh-cn",
      languages: { "zh-CN": "/zh-cn" },
    });
    expect(metadata.openGraph).toMatchObject({
      title: "AI API Directory",
      description: "Find AI API relay sites and model prices.",
      url: "http://localhost:3000/zh-cn",
      locale: "zh_CN",
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
```

- [ ] **Step 3: Write failing sitemap tests**

Create `src/seo/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSitemapEntries } from "./sitemap";

describe("sitemap helpers", () => {
  it("excludes unpublished and noindex records", () => {
    const entries = buildSitemapEntries([
      { path: "/zh-cn", published: true, indexable: true },
      { path: "/en", published: false, indexable: true },
      { path: "/admin", published: true, indexable: false },
    ]);

    expect(entries).toEqual([
      {
        url: "http://localhost:3000/zh-cn",
      },
    ]);
  });
});
```

- [ ] **Step 4: Run tests and verify they fail**

Run:

```powershell
pnpm test:run src/seo/url.test.ts src/seo/metadata.test.ts src/seo/sitemap.test.ts
```

Expected:

- Exit code is non-zero.
- Failures mention missing `url`, `metadata`, and `sitemap` modules.

- [ ] **Step 5: Implement `src/seo/url.ts`**

Create:

```ts
const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (!configured) return DEFAULT_SITE_URL;

  return configured.replace(/\/+$/, "");
}

export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, "/");

  if (collapsed === "/") return "/";
  return collapsed.replace(/\/+$/, "");
}

export function buildCanonicalPath(pathname: string): string {
  return normalizePathname(pathname);
}

export function buildAbsoluteUrl(pathname: string): string {
  return `${getSiteUrl()}${normalizePathname(pathname)}`;
}

export function buildCanonicalUrl(pathname: string): string {
  return buildAbsoluteUrl(buildCanonicalPath(pathname));
}
```

- [ ] **Step 6: Implement `src/seo/metadata.ts`**

Create:

```ts
import type { Metadata } from "next";
import { getLocaleByCode, type LocaleCode } from "~/i18n/locales";
import { buildAbsoluteUrl, buildCanonicalPath, getSiteUrl } from "./url";

export type PublishedLocalePath = {
  localeCode: LocaleCode;
  path: string;
  published: boolean;
};

export type RobotsPolicy = {
  index: boolean;
  follow: boolean;
};

export type PageMetadataInput = {
  localeCode: LocaleCode;
  canonicalPath: string;
  title: string;
  description: string;
  robots: RobotsPolicy;
  localePaths: PublishedLocalePath[];
  openGraphImage?: string;
  includeXDefault?: boolean;
};

export function buildPublishedLanguageAlternates({
  canonicalPath,
  localePaths,
  includeXDefault = false,
}: {
  canonicalPath: string;
  localePaths: PublishedLocalePath[];
  includeXDefault?: boolean;
}): NonNullable<Metadata["alternates"]> {
  const languages = localePaths.reduce<Record<string, string>>((acc, localePath) => {
    if (!localePath.published) return acc;

    const locale = getLocaleByCode(localePath.localeCode);
    if (!locale) return acc;

    acc[locale.hreflang] = buildCanonicalPath(localePath.path);
    return acc;
  }, {});

  if (includeXDefault) {
    languages["x-default"] = "/";
  }

  return {
    canonical: buildCanonicalPath(canonicalPath),
    languages,
  };
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const locale = getLocaleByCode(input.localeCode);
  if (!locale) {
    throw new Error(`Unsupported metadata locale: ${input.localeCode}`);
  }

  const canonicalPath = buildCanonicalPath(input.canonicalPath);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: input.title,
    description: input.description,
    alternates: buildPublishedLanguageAlternates({
      canonicalPath,
      localePaths: input.localePaths,
      includeXDefault: input.includeXDefault,
    }),
    openGraph: {
      title: input.title,
      description: input.description,
      url: buildAbsoluteUrl(canonicalPath),
      locale: locale.ogLocale,
      images: input.openGraphImage ? [input.openGraphImage] : undefined,
    },
    robots: input.robots,
  };
}
```

- [ ] **Step 7: Implement `src/seo/sitemap.ts`**

Create:

```ts
import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "./url";

export type SitemapSourceRecord = {
  path: string;
  published: boolean;
  indexable: boolean;
  lastModified?: Date;
};

export function buildSitemapEntries(
  records: SitemapSourceRecord[],
): MetadataRoute.Sitemap {
  return records
    .filter((record) => record.published && record.indexable)
    .map((record) => {
      const entry: MetadataRoute.Sitemap[number] = {
        url: buildAbsoluteUrl(record.path),
      };

      if (record.lastModified) {
        entry.lastModified = record.lastModified;
      }

      return entry;
    });
}
```

- [ ] **Step 8: Run helper tests**

Run:

```powershell
pnpm test:run src/seo/url.test.ts src/seo/metadata.test.ts src/seo/sitemap.test.ts
```

Expected:

- Exit code `0`.
- URL, metadata, and sitemap helper tests pass.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/seo/url.ts src/seo/url.test.ts src/seo/metadata.ts src/seo/metadata.test.ts src/seo/sitemap.ts src/seo/sitemap.test.ts
git commit -m "feat: add SEO runtime helpers"
```

## Task 4: next-intl Configuration And Messages

**Files:**

- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/messages/zh-cn.json`
- Create: `src/messages/en.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create next-intl routing config**

Create `src/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE_CODE, locales } from "./locales";

export const routing = defineRouting({
  locales: locales.map((locale) => locale.urlCode),
  defaultLocale: DEFAULT_LOCALE_CODE,
  localePrefix: "always",
  pathnames: {
    "/": "/"
  },
});
```

- [ ] **Step 2: Create next-intl request config**

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { getLocaleByCode } from "./locales";
import { loadMessages } from "./messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const localeDefinition = locale ? getLocaleByCode(locale) : undefined;

  if (!localeDefinition) {
    notFound();
  }

  return {
    locale: localeDefinition.urlCode,
    messages: await loadMessages(localeDefinition.urlCode),
  };
});
```

- [ ] **Step 3: Create typed message loader**

Create `src/i18n/messages.ts`:

```ts
import "server-only";
import { type LocaleCode } from "./locales";

const loaders = {
  "zh-cn": () => import("~/messages/zh-cn.json").then((module) => module.default),
  en: () => import("~/messages/en.json").then((module) => module.default),
} satisfies Record<LocaleCode, () => Promise<Record<string, unknown>>>;

export async function loadMessages(locale: LocaleCode) {
  return loaders[locale]();
}
```

- [ ] **Step 4: Create localized navigation exports**

Create `src/i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 5: Wire next-intl plugin into `next.config.ts`**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Create Chinese UI messages**

Create `src/messages/zh-cn.json`:

```json
{
  "Root": {
    "title": "AI API Directory",
    "description": "发现、比较和评估 AI API 中转、聚合与模型访问站点。",
    "chooseLanguage": "选择语言",
    "enterChinese": "进入中文站",
    "enterEnglish": "English"
  },
  "PublicNav": {
    "home": "首页",
    "directory": "目录",
    "pricing": "模型价格",
    "guides": "指南",
    "language": "语言",
    "theme": "主题"
  },
  "Admin": {
    "title": "管理后台",
    "description": "内容审核、发布与运行维护入口。",
    "notReady": "后台认证和数据工作流将在后续规格中实现。"
  },
  "Metadata": {
    "siteName": "AI API Directory",
    "rootDescription": "发现、比较和评估 AI API 中转、聚合与模型访问站点。",
    "publicDescription": "比较 AI API 模型、价格、站点证据与风险信息。",
    "adminDescription": "AI API Directory 管理后台。"
  },
  "Errors": {
    "notFoundTitle": "页面不存在",
    "notFoundDescription": "该页面不存在或尚未以当前语言发布。",
    "errorTitle": "页面暂时无法显示",
    "errorDescription": "请稍后重试。"
  },
  "Theme": {
    "light": "浅色",
    "dark": "深色",
    "system": "跟随系统"
  }
}
```

- [ ] **Step 7: Create English UI messages**

Create `src/messages/en.json`:

```json
{
  "Root": {
    "title": "AI API Directory",
    "description": "Discover, compare, and evaluate AI API relay, aggregation, and model access sites.",
    "chooseLanguage": "Choose language",
    "enterChinese": "简体中文",
    "enterEnglish": "Enter English site"
  },
  "PublicNav": {
    "home": "Home",
    "directory": "Directory",
    "pricing": "Model pricing",
    "guides": "Guides",
    "language": "Language",
    "theme": "Theme"
  },
  "Admin": {
    "title": "Admin",
    "description": "Content review, publishing, and operations entry.",
    "notReady": "Admin authentication and data workflows will be implemented in later specs."
  },
  "Metadata": {
    "siteName": "AI API Directory",
    "rootDescription": "Discover, compare, and evaluate AI API relay, aggregation, and model access sites.",
    "publicDescription": "Compare AI API models, prices, site evidence, and risk signals.",
    "adminDescription": "AI API Directory admin."
  },
  "Errors": {
    "notFoundTitle": "Page not found",
    "notFoundDescription": "This page does not exist or has not been published in the current language.",
    "errorTitle": "This page cannot be displayed",
    "errorDescription": "Please try again later."
  },
  "Theme": {
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  }
}
```

- [ ] **Step 8: Run TypeScript-aware validation**

Run:

```powershell
pnpm test:run
pnpm lint
```

Expected:

- Both commands exit `0`.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/i18n/routing.ts src/i18n/request.ts src/i18n/messages.ts src/i18n/navigation.ts src/messages/zh-cn.json src/messages/en.json next.config.ts
git commit -m "feat: configure localized messages"
```

## Task 5: Theme Tokens And Shared Shell Utilities

**Files:**

- Modify: `src/app/globals.css`
- Create: `src/app/fonts.ts`
- Create: `src/components/shell/theme-init-script.tsx`
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Replace `src/app/globals.css` with semantic tokens**

Use:

```css
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #111827;
  --surface: #ffffff;
  --surface-muted: #eef2f7;
  --muted-foreground: #526071;
  --border: #d8dee8;
  --focus: #2563eb;
  --brand: #1455d9;
  --brand-foreground: #ffffff;
  --success: #0f766e;
  --warning: #a15c07;
  --danger: #b42318;
  --danger-foreground: #ffffff;
  --neutral: #64748b;
  --risk-low: #0f766e;
  --risk-caution: #a15c07;
  --risk-high: #b42318;
  --radius: 0.5rem;
}

.dark {
  --background: #0b1020;
  --foreground: #eef2ff;
  --surface: #111827;
  --surface-muted: #1f2937;
  --muted-foreground: #aab4c6;
  --border: #344155;
  --focus: #60a5fa;
  --brand: #60a5fa;
  --brand-foreground: #08111f;
  --success: #2dd4bf;
  --warning: #fbbf24;
  --danger: #f87171;
  --danger-foreground: #08111f;
  --neutral: #94a3b8;
  --risk-low: #2dd4bf;
  --risk-caution: #fbbf24;
  --risk-high: #f87171;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-focus: var(--focus);
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-danger-foreground: var(--danger-foreground);
  --color-neutral: var(--neutral);
  --color-risk-low: var(--risk-low);
  --color-risk-caution: var(--risk-caution);
  --color-risk-high: var(--risk-high);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --radius-sm: calc(var(--radius) - 0.25rem);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 0.25rem);
}

* {
  border-color: var(--border);
}

html {
  min-height: 100%;
  background: var(--background);
}

body {
  min-height: 100%;
  background: var(--background);
  color: var(--foreground);
  font-family:
    var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Add shared font setup**

Create `src/app/fonts.ts`:

```ts
import { Geist, Geist_Mono } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const fontClassName = `${geistSans.variable} ${geistMono.variable} antialiased`;
```

- [ ] **Step 3: Add class merge utility**

Create `src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Add no-flash theme script**

Create `src/components/shell/theme-init-script.tsx`:

```tsx
const themeInitCode = `
(() => {
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
})();
`;

export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitCode }} />;
}
```

- [ ] **Step 5: Run validation for token changes**

Run:

```powershell
pnpm lint
pnpm build
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/app/globals.css src/app/fonts.ts src/lib/cn.ts src/components/shell/theme-init-script.tsx
git commit -m "feat: add theme token foundation"
```

## Task 6: Base UI Components

**Files:**

- Create/modify: `components.json`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/tooltip.tsx`

- [ ] **Step 1: Initialize shadcn component generation if needed**

Use the current shadcn CLI rather than hand-pinning Radix package names:

```powershell
pnpm dlx shadcn@latest init
```

When prompted, choose settings compatible with this repo:

- Next.js / React Server Components.
- Tailwind CSS v4.
- CSS variables enabled.
- Components alias pointing at `~/components`.
- Utils alias pointing at `~/lib/cn` or adjust the generated utility import to this repo's `cn` helper.

Expected:

- `components.json` is created or updated.
- Any shadcn-added dependencies are reflected in `package.json` and
  `pnpm-lock.yaml`.
- Do not manually replace the shadcn-selected primitive package style unless
  the generated code fails validation.

- [ ] **Step 2: Add base components with shadcn CLI**

Run:

```powershell
pnpm dlx shadcn@latest add button input label badge dialog dropdown-menu tabs tooltip
```

Expected:

- The listed components are created under `src/components/ui`.
- Interactive components use the current shadcn-selected accessible primitive
  base, commonly Radix-backed primitives.
- Imports and dependency names follow the CLI output for the installed shadcn
  version.

- [ ] **Step 3: Align generated components with project tokens**

Review the generated files and make the narrowest edits needed so they compile
with this repo:

- Replace generated utility imports with `~/lib/cn` if needed.
- Keep `asChild` support on `Button` so links can compose through the button
  primitive.
- Make component colors consume semantic tokens from `globals.css`; do not add
  hard-coded brand colors inside component files.
- Preserve generated accessibility behavior, refs, portals, focus management,
  keyboard navigation, and ARIA wiring.

The expected final component set is:

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`

Do not add a broad wrapper layer over every Next.js built-in. Navigation
wrappers are created in Task 7 because locale, route, and external-link policy
are durable cross-cutting boundaries.

- [ ] **Step 4: Spot-check `Button` behavior**

The generated `Button` should keep this behavior shape:

- Variant styling is centralized through one variant helper.
- `asChild` composes with links and other primitives.
- Disabled and focus-visible states are styled consistently.
- Text/icon spacing does not require each caller to restyle the button.

If the generated component differs materially, adapt it to the same contract
instead of replacing the whole shadcn file.

- [ ] **Step 5: Run validation**

Run:

```powershell
pnpm lint
pnpm build
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add components.json package.json pnpm-lock.yaml src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/label.tsx src/components/ui/badge.tsx src/components/ui/dialog.tsx src/components/ui/dropdown-menu.tsx src/components/ui/tabs.tsx src/components/ui/tooltip.tsx
git commit -m "feat: add base UI primitives"
```

## Task 7: Route Groups, Root Layouts, And Shell Pages

**Files:**

- Delete: `src/app/layout.tsx`
- Delete: `src/app/page.tsx`
- Create: `src/app/(entry)/layout.tsx`
- Create: `src/app/(entry)/page.tsx`
- Create: `src/app/(entry)/admin/layout.tsx`
- Create: `src/app/(entry)/admin/page.tsx`
- Create: `src/app/(public)/[locale]/layout.tsx`
- Create: `src/app/(public)/[locale]/page.tsx`
- Create: `src/components/navigation/app-link.tsx`
- Create: `src/components/navigation/external-link.tsx`
- Create: `src/components/shell/theme-toggle.tsx`
- Create: `src/components/shell/public-shell.tsx`
- Create: `src/components/shell/admin-shell.tsx`
- Create: `src/components/shell/locale-switcher.tsx`

- [ ] **Step 1: Remove current create-next-app root files**

Run:

```powershell
git rm src/app/layout.tsx src/app/page.tsx
```

Expected:

- The two starter files are staged for deletion.

- [ ] **Step 2: Create entry root layout**

Create `src/app/(entry)/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "../globals.css";
import { fontClassName } from "~/app/fonts";
import { ThemeInitScript } from "~/components/shell/theme-init-script";
import { buildPageMetadata } from "~/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  localeCode: "zh-cn",
  canonicalPath: "/",
  title: "AI API Directory",
  description: "Discover, compare, and evaluate AI API relay and aggregation sites.",
  robots: { index: true, follow: true },
  localePaths: [{ localeCode: "zh-cn", path: "/", published: true }],
  includeXDefault: true,
});

export default function EntryRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={fontClassName} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create project link wrappers**

Create `src/components/navigation/app-link.tsx`:

```tsx
import type { ComponentProps } from "react";
import { Link as IntlLink } from "~/i18n/navigation";

type AppLinkProps = ComponentProps<typeof IntlLink>;

export function AppLink(props: AppLinkProps) {
  return <IntlLink {...props} />;
}
```

Create `src/components/navigation/external-link.tsx`:

```tsx
import { ExternalLinkIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/cn";

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  showIcon?: boolean;
};

export function ExternalLink({
  children,
  className,
  showIcon = true,
  target = "_blank",
  rel,
  ...props
}: ExternalLinkProps) {
  const safeRel =
    target === "_blank" ? rel ?? "noreferrer noopener" : rel;

  return (
    <a
      className={cn("inline-flex items-center gap-1", className)}
      target={target}
      rel={safeRel}
      {...props}
    >
      {children}
      {showIcon ? (
        <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
    </a>
  );
}
```

These wrappers are intentionally narrow. Do not create pass-through wrappers
for `Image`, `Script`, `Form`, or other Next.js built-ins until a concrete
project policy exists.

- [ ] **Step 4: Create root language entry page**

Create `src/app/(entry)/page.tsx`:

```tsx
import { Languages } from "lucide-react";
import { AppLink } from "~/components/navigation/app-link";
import { Button } from "~/components/ui/button";
import { getPublicDiscoveryLocales } from "~/i18n/locales";

export default function RootLanguageEntryPage() {
  const publicLocales = getPublicDiscoveryLocales();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <Languages className="h-5 w-5" aria-hidden="true" />
          <span>Choose language</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            AI API Directory
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Discover, compare, and evaluate AI API relay, aggregation, and model
            access sites.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {publicLocales.map((locale) => (
            <Button key={locale.urlCode} asChild>
              <AppLink href="/" locale={locale.urlCode}>
                {locale.nativeLabel}
              </AppLink>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Create public locale root layout**

Create `src/app/(public)/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../../globals.css";
import { fontClassName } from "~/app/fonts";
import { PublicShell } from "~/components/shell/public-shell";
import { ThemeInitScript } from "~/components/shell/theme-init-script";
import {
  getLocaleByCode,
  localeStaticParams,
  type LocaleCode,
} from "~/i18n/locales";
import { loadMessages } from "~/i18n/messages";

export function generateStaticParams() {
  return localeStaticParams();
}

export default async function PublicLocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localeDefinition = getLocaleByCode(locale);

  if (!localeDefinition) {
    notFound();
  }

  const localeCode = localeDefinition.urlCode as LocaleCode;
  const messages = await loadMessages(localeCode);

  return (
    <html
      lang={localeDefinition.htmlLang}
      className={fontClassName}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeInitScript />
        <NextIntlClientProvider locale={localeCode} messages={messages}>
          <PublicShell locale={localeCode}>{children}</PublicShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create public shell and locale page**

Create `src/components/shell/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

type ThemePreference = "light" | "dark" | "system";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
];

function applyTheme(theme: ThemePreference) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === theme;

        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon"
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            onClick={() => {
              setTheme(option.value);
              applyTheme(option.value);
            }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
```

Create `src/components/shell/public-shell.tsx`:

```tsx
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
```

Create `src/components/shell/locale-switcher.tsx`:

```tsx
"use client";

import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  getPublicDiscoveryLocales,
  locales,
  type LocaleCode,
} from "~/i18n/locales";

function switchLocale(pathname: string, targetLocale: LocaleCode) {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  const localeCodes = locales.map((locale) => locale.urlCode);

  if (first && localeCodes.includes(first)) {
    parts[0] = targetLocale;
    return `/${parts.join("/")}`;
  }

  return `/${targetLocale}`;
}

export function LocaleSwitcher({ currentLocale }: { currentLocale: LocaleCode }) {
  const pathname = usePathname();
  const publicLocales = getPublicDiscoveryLocales();

  return (
    <div className="flex items-center gap-1">
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      {publicLocales.map((locale) => (
        <Button
          key={locale.urlCode}
          asChild
          size="sm"
          variant={locale.urlCode === currentLocale ? "secondary" : "ghost"}
        >
          <a href={switchLocale(pathname, locale.urlCode as LocaleCode)}>
            {locale.nativeLabel}
          </a>
        </Button>
      ))}
    </div>
  );
}
```

Create `src/app/(public)/[locale]/page.tsx`:

```tsx
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

export default function PublicLocaleHomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          AI API relay directory
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Compare AI API relay sites, models, prices, and evidence.
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          This runtime shell is ready for the later public directory, pricing,
          model, site, and guide pages.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Create admin shell**

Create `src/components/shell/admin-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { ThemeToggle } from "~/components/shell/theme-toggle";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-semibold">AI API Directory Admin</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
```

Create `src/app/(entry)/admin/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "~/components/shell/admin-shell";

export const metadata: Metadata = {
  title: "Admin - AI API Directory",
  description: "AI API Directory admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
```

Create `src/app/(entry)/admin/page.tsx`:

```tsx
import { Badge } from "~/components/ui/badge";

export default function AdminPage() {
  return (
    <section className="space-y-4">
      <Badge variant="warning">Shell only</Badge>
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
      <p className="max-w-2xl text-muted-foreground">
        Authentication, RBAC, content editing, review, and publishing workflows
        are intentionally reserved for later specs.
      </p>
    </section>
  );
}
```

- [ ] **Step 8: Run route build validation**

Run:

```powershell
pnpm lint
pnpm build
```

Expected:

- Both commands exit `0`.
- Build output includes `/`, `/admin`, `/zh-cn`, and `/en` route generation or equivalent App Router output.

- [ ] **Step 9: Commit**

Run:

```powershell
git add "src/app/(entry)" "src/app/(public)" src/components/navigation/app-link.tsx src/components/navigation/external-link.tsx src/components/shell/theme-toggle.tsx src/components/shell/public-shell.tsx src/components/shell/admin-shell.tsx src/components/shell/locale-switcher.tsx
git commit -m "feat: add route-group runtime shell"
```

## Task 8: Error, Loading, Robots, And Sitemap Routes

**Files:**

- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/global-error.tsx`
- Create: `src/app/(entry)/admin/not-found.tsx`
- Create: `src/app/(entry)/admin/error.tsx`
- Create: `src/app/(entry)/admin/loading.tsx`
- Create: `src/app/(public)/[locale]/not-found.tsx`
- Create: `src/app/(public)/[locale]/error.tsx`
- Create: `src/app/(public)/[locale]/loading.tsx`

- [ ] **Step 1: Add robots route**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "~/seo/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/zh-cn"],
        disallow: ["/admin", "/admin/", "/api", "/api/"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
```

- [ ] **Step 2: Add initial sitemap route**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "~/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries([
    { path: "/", published: true, indexable: true },
    { path: "/zh-cn", published: true, indexable: true },
    { path: "/en", published: false, indexable: true },
    { path: "/admin", published: true, indexable: false },
  ]);
}
```

- [ ] **Step 3: Add root global error fallback**

Create `src/app/global-error.tsx`:

```tsx
"use client";

import "./globals.css";
import { Button } from "~/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground">
        <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight">
            This page cannot be displayed
          </h1>
          <p className="mt-3 text-muted-foreground">
            Please try again. If the problem continues, return later.
          </p>
          <div className="mt-6">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
```

Expected:

- The file includes its own `<html>` and `<body>` tags.
- It does not depend on business data, route params, request state, metadata
  exports, or localized editorial content.
- It does not expose stack traces, digests, provider details, internal IDs, or
  unpublished content.

- [ ] **Step 4: Add public localized not-found/loading/error**

Create `src/app/(public)/[locale]/not-found.tsx`:

```tsx
import { AppLink } from "~/components/navigation/app-link";
import { Button } from "~/components/ui/button";

export default function PublicNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        This page does not exist or has not been published in the current
        language.
      </p>
      <div className="mt-6">
        <Button asChild>
          <AppLink href="/">Choose language</AppLink>
        </Button>
      </div>
    </main>
  );
}
```

Create `src/app/(public)/[locale]/loading.tsx`:

```tsx
export default function PublicLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="h-8 w-48 rounded-md bg-surface-muted" />
      <div className="mt-4 h-4 w-80 rounded-md bg-surface-muted" />
    </main>
  );
}
```

Create `src/app/(public)/[locale]/error.tsx`:

```tsx
"use client";

import { Button } from "~/components/ui/button";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        This page cannot be displayed
      </h1>
      <p className="mt-3 text-muted-foreground">
        Please try again later.
      </p>
      <div className="mt-6">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Add admin not-found/loading/error**

Create `src/app/(entry)/admin/not-found.tsx`:

```tsx
export default function AdminNotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Admin page not found</h1>
      <p className="text-muted-foreground">
        The requested admin page does not exist.
      </p>
    </section>
  );
}
```

Create `src/app/(entry)/admin/loading.tsx`:

```tsx
export default function AdminLoading() {
  return (
    <section className="space-y-4">
      <div className="h-7 w-40 rounded-md bg-surface-muted" />
      <div className="h-4 w-72 rounded-md bg-surface-muted" />
    </section>
  );
}
```

Create `src/app/(entry)/admin/error.tsx`:

```tsx
"use client";

import { Button } from "~/components/ui/button";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin error</h1>
      <p className="text-muted-foreground">
        The admin shell could not display this page.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
```

- [ ] **Step 6: Run validation**

Run:

```powershell
pnpm test:run
pnpm lint
pnpm build
```

Expected:

- All commands exit `0`.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/app/robots.ts src/app/sitemap.ts src/app/global-error.tsx "src/app/(entry)/admin/not-found.tsx" "src/app/(entry)/admin/error.tsx" "src/app/(entry)/admin/loading.tsx" "src/app/(public)/[locale]/not-found.tsx" "src/app/(public)/[locale]/error.tsx" "src/app/(public)/[locale]/loading.tsx"
git commit -m "feat: add shell metadata routes and boundaries"
```

## Task 9: Final Contract Validation

**Files:**

- Modify only files needed to address validation failures discovered in this task.

- [ ] **Step 1: Run full validation**

Run:

```powershell
pnpm validate
```

Expected:

- `pnpm lint` exits `0`.
- `pnpm test:run` exits `0`.
- `pnpm build` exits `0`.

- [ ] **Step 2: Inspect routes manually from build output**

Confirm the build output includes these route families:

```text
/
/admin
/zh-cn
/en
/robots.txt
/sitemap.xml
```

If `/en` is generated, confirm it is non-discoverable by default:

- It is not in `getPublicDiscoveryLocales()`.
- It is not included as a published sitemap entry.
- Public discovery UI only lists `zh-cn`.

- [ ] **Step 3: Inspect architecture boundaries**

Run:

```powershell
rg -n "(from ['\"]~/(db|server|services|domain|crawler|publishing|trpc|rules)|@prisma|prisma|drizzle|fetch\\()" src/components src/app
rg -n "(parse[A-Z]|normalize[A-Z]|DTO|Dto|ViewModel|viewModel|RULES|Rules|REGISTRY|Registry)" src/components src/app
rg -n "['\"](new-api|sub2api|openai|anthropic|gemini|claude)['\"]" src/components src/app
```

Expected:

- No `src/components/ui/*` file imports database, provider, crawler,
  publishing, admin workflow, tRPC, future domain/service modules, or future
  rule parser modules.
- Any matches in route files are reviewed manually and remain shell-level,
  metadata-level, or placeholder-only.
- Any parser, normalization, DTO, view-model, registry, or raw taxonomy literal
  matches are reviewed manually. Shell-local registries such as locale metadata
  and SEO helper records are allowed; business-rule parsing and business DTO
  conversion must not be implemented in UI/page files.
- No error boundary exposes stack traces, digests, provider secrets, internal
  IDs, or unpublished content in rendered copy.

- [ ] **Step 4: Inspect final diff**

Run:

```powershell
git diff --stat
git diff --check
git status --porcelain=v1
```

Expected:

- `git diff --check` exits `0`.
- Worktree only contains task-scoped runtime shell files if any fixes were made after the previous commit.
- No unrelated files are modified.

- [ ] **Step 5: Commit remaining validation fixes**

If Step 4 shows task-scoped validation fixes, commit them:

```powershell
git add package.json pnpm-lock.yaml next.config.ts vitest.config.ts src
git commit -m "fix: stabilize runtime shell validation"
```

If Step 4 shows no remaining changes, do not create an empty commit.

## Execution Notes

- Keep commits task-scoped. Do not squash unless explicitly requested after implementation.
- Do not add database, tRPC, auth, RBAC, seed content, or business data models in this plan.
- Do not introduce domain services, business error taxonomy, retry/backoff policy, logging, alerting, or observability sinks in this shell slice.
- Do not introduce concrete business rule parsers, provider taxonomies, pricing normalization, capability/risk rules, source payload DTOs, public/admin DTO schemas, or UI view-model factories in this shell slice.
- Constants and registries introduced by this plan must stay shell-local and owned by their feature, such as locale metadata or SEO helper records. Do not create a broad catch-all `src/constants` file or global enum bucket.
- If later implementation needs business constants, rule parsing, or DTO conversion, stop and create a separate business data/rules spec instead of folding it into the runtime shell.
- UI and shell components must remain presentation-oriented; do not move business rules into `src/components`.
- Do not introduce localized public content fallback from `zh-CN` into `/en`.
- If `next-intl` APIs differ from the snippets after installation, stop and verify against installed package docs before adapting code.
- If the route-group root layout structure conflicts with Next.js build behavior, stop and revisit the spec before switching back to a single global root layout.
- If dependency installation fails because of network, registry, permission, or sandbox errors, classify the failure and retry once with the minimal approved escalation path.
