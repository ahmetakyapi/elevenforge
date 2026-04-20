import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The original React prototype lives in design-reference/ as a historical
    // reference — it isn't compiled into the Next app. Without this ignore the
    // lint run drowns out real issues with 220+ "not defined" errors from
    // ESM-less JSX files that nothing imports.
    "design-reference/**",
  ]),
  {
    rules: {
      // React 19 flags Date.now() inside server-component render as "impure",
      // but for server components resolved at request time this is the
      // canonical way to compute time-sensitive copy. Demoting to warn so
      // genuinely accidental impurity still surfaces without blocking CI.
      "react-hooks/purity": "warn",
      // Synchronous setState in useEffect is called out by the new hooks
      // linter. Our mount-only initialisation patterns (reading theme from
      // localStorage, push-subscription detection, tactic preset hydration)
      // are deliberate one-shot syncs where the cascade is exactly one render;
      // refactoring each to useSyncExternalStore is a bigger task. Demoted
      // to warn so it shows up in review without breaking builds.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
