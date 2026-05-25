import { includeIgnoreFile } from "@eslint/config-helpers";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));
const checkedRelativeDepths = Array.from({ length: 12 }, (_, index) => index + 1);
const componentBoundaryPatterns = [
  "~/db",
  "~/db/*",
  "~/server/db",
  "~/server/db/*",
];
const domainBoundaryPatterns = [
  "~/db",
  "~/db/*",
  "~/server",
  "~/server/*",
  "drizzle-orm",
  "drizzle-orm/*",
  "postgres",
  "next/*",
  "react",
];

function sourceDepthGlob(root, depth) {
  return `${root}/${"*/".repeat(depth - 1)}*.{ts,tsx}`;
}

function restrictedRelativePatterns(depth, targets) {
  const prefix = "../".repeat(depth);

  return targets.flatMap((target) => [
    `${prefix}${target}`,
    `${prefix}${target}/*`,
    `${prefix}${target}/**`,
  ]);
}

const componentRelativeBoundaryConfigs = checkedRelativeDepths.map((depth) => ({
  files: [sourceDepthGlob("src/components", depth)],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...componentBoundaryPatterns,
          ...restrictedRelativePatterns(depth, ["db", "server/db"]),
        ],
      },
    ],
  },
}));

const domainRelativeBoundaryConfigs = checkedRelativeDepths.map((depth) => ({
  files: [sourceDepthGlob("src/domain", depth)],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...domainBoundaryPatterns,
          ...restrictedRelativePatterns(depth, ["db", "server"]),
        ],
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  includeIgnoreFile(gitignorePath),
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: componentBoundaryPatterns,
        },
      ],
    },
  },
  ...componentRelativeBoundaryConfigs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: domainBoundaryPatterns,
        },
      ],
    },
  },
  ...domainRelativeBoundaryConfigs,
]);

export default eslintConfig;
