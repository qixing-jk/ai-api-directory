import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function listSourceFiles(dir: string): string[] {
  const absoluteDir = join(repoRoot, dir);
  const entries = readdirSync(absoluteDir);

  return entries.flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return listSourceFiles(relative(repoRoot, absolutePath));
    }

    if (!entry.endsWith(".ts") && !entry.endsWith(".tsx")) {
      return [];
    }

    return [absolutePath];
  });
}

function extractModuleSpecifiers(filePath: string, sourceText: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers: string[] = [];

  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const [specifier] = node.arguments;

      if (specifier && ts.isStringLiteral(specifier)) {
        specifiers.push(specifier.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return specifiers;
}

function readModuleSpecifiers(filePath: string): string[] {
  return extractModuleSpecifiers(filePath, readFileSync(filePath, "utf8"));
}

function toSourcePath(specifier: string, fromFilePath: string): string | null {
  if (specifier.startsWith("~/")) {
    return normalize(join("src", specifier.slice(2)));
  }

  if (specifier.startsWith(".")) {
    return normalize(relative(repoRoot, join(dirname(fromFilePath), specifier)));
  }

  return null;
}

function hasPathPrefix(filePath: string, prefix: string): boolean {
  return filePath === prefix || filePath.startsWith(`${prefix}${sep}`);
}

function isForbiddenComponentSpecifier(
  specifier: string,
  fromFilePath: string,
): boolean {
  const sourcePath = toSourcePath(specifier, fromFilePath);

  return (
    sourcePath !== null &&
    (hasPathPrefix(sourcePath, normalize("src/db")) ||
      hasPathPrefix(sourcePath, normalize("src/server/db")))
  );
}

function isForbiddenDomainSpecifier(
  specifier: string,
  fromFilePath: string,
): boolean {
  if (
    specifier === "drizzle-orm" ||
    specifier.startsWith("drizzle-orm/") ||
    specifier === "postgres" ||
    specifier.startsWith("postgres/") ||
    specifier === "next" ||
    specifier.startsWith("next/") ||
    specifier === "react" ||
    specifier.startsWith("react/") ||
    specifier === "react-dom" ||
    specifier.startsWith("react-dom/")
  ) {
    return true;
  }

  const sourcePath = toSourcePath(specifier, fromFilePath);

  return (
    sourcePath !== null &&
    (hasPathPrefix(sourcePath, normalize("src/db")) ||
      hasPathPrefix(sourcePath, normalize("src/server")))
  );
}

describe("persistence import boundaries", () => {
  it("parses static imports, exports, and dynamic import string literals", () => {
    const specifiers = extractModuleSpecifiers(
      "module-specifier-sample.ts",
      `
        import defaultExport from "~/db/schema";
        import type { DomainType } from "../lifecycle";
        export { createRepository } from "../../server/db/repositories";
        export type { Policy } from "drizzle-orm";

        async function loadNavigation() {
          await import("next/navigation");
        }
      `,
    );

    expect(specifiers).toEqual(
      expect.arrayContaining([
        "~/db/schema",
        "../lifecycle",
        "../../server/db/repositories",
        "drizzle-orm",
        "next/navigation",
      ]),
    );
  });

  it("classifies alias and relative boundary targets", () => {
    const componentFile = join(
      repoRoot,
      "src/components/panel/example-widget.tsx",
    );
    const domainFile = join(repoRoot, "src/domain/publishing/example-policy.ts");

    expect(isForbiddenComponentSpecifier("~/db/schema", componentFile)).toBe(
      true,
    );
    expect(
      isForbiddenComponentSpecifier(
        "../../server/db/repositories",
        componentFile,
      ),
    ).toBe(true);
    expect(isForbiddenComponentSpecifier("../ui/button", componentFile)).toBe(
      false,
    );
    expect(
      isForbiddenDomainSpecifier("~/server/db/repositories", domainFile),
    ).toBe(true);
    expect(isForbiddenDomainSpecifier("../../db/schema", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("drizzle-orm/sql", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("postgres/cf", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("next", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("next/navigation", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("react", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("react/cache", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("react-dom/server", domainFile)).toBe(true);
    expect(isForbiddenDomainSpecifier("../lifecycle", domainFile)).toBe(false);
  });

  it("keeps components away from DB and repository modules", () => {
    const violations = listSourceFiles("src/components").flatMap((filePath) =>
      readModuleSpecifiers(filePath)
        .filter((specifier) =>
          isForbiddenComponentSpecifier(specifier, filePath),
        )
        .map((specifier) => `${relative(repoRoot, filePath)}: ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  it("keeps pure domain policy away from DB, server, and framework modules", () => {
    const violations = listSourceFiles("src/domain").flatMap((filePath) =>
      readModuleSpecifiers(filePath)
        .filter((specifier) => isForbiddenDomainSpecifier(specifier, filePath))
        .map((specifier) => `${relative(repoRoot, filePath)}: ${specifier}`),
    );

    expect(violations).toEqual([]);
  });
});
