import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// CRA compat: legacy source reads process.env.REACT_APP_* at runtime
// (src/auth/RequireClerk.js, src/lib/supabase.js). In dev/build we statically
// replace those accesses, CRA-style. In Vitest (mode === "test") we leave them
// alone so the auth tests can mutate the real process.env.
const REACT_APP_VARS = [
  "REACT_APP_CLERK_PUBLISHABLE_KEY",
  "REACT_APP_SUPABASE_URL",
  "REACT_APP_SUPABASE_ANON_KEY",
];

export default defineConfig(({ command, mode }) => {
  // loadEnv reads .env/.env.local plus real process.env (Vercel build env).
  const env = loadEnv(mode, process.cwd(), "REACT_APP_");
  const define =
    mode === "test"
      ? {}
      : Object.fromEntries(
          REACT_APP_VARS.map((k) => [
            `process.env.${k}`,
            env[k] !== undefined ? JSON.stringify(env[k]) : "undefined",
          ]),
        );

  return {
    // plugin-react's default include (/\.[tj]sx?$/) puts every .js file on the
    // native transform plugin's jsxRefreshInclude list, which build-transforms
    // them with lang derived from the extension (js) and chokes on their JSX.
    // Narrow it to real .jsx/.tsx — fast-refresh never applied to raw-JSX .js
    // files anyway (their source lacks the jsx-runtime import it keys on).
    plugins: [react({ include: /\.[tj]sx$/ }), tailwindcss()],
    define,
    // JSX-in-.js (CRA legacy, ~97 files) needs two different switches:
    // - dev server + Vitest run the vite:oxc JS transform plugin, which
    //   excludes .js by default and derives `lang` from the extension —
    //   include .js/.jsx and force the jsx parser (repo has no .ts sources).
    // - build runs rolldown's native transform plugin, which ignores the
    //   `lang` override — leave oxc at its defaults there (skips .js) and let
    //   rolldown parse .js as JSX via build.rollupOptions.moduleTypes below.
    oxc:
      command === "build"
        ? undefined
        : {
            include: [/\.jsx?$/],
            exclude: [/node_modules/],
            lang: "jsx",
          },
    // CRA legacy: ~97 src files contain JSX in .js. Vite 8 (rolldown) maps
    // extensions to parsers via moduleTypes; '.js' -> 'jsx' everywhere.
    // graph-dev.html (exec-graph's standalone harness) is served by the dev
    // server automatically and is intentionally NOT a build input, so it never
    // ships to prod.
    build: {
      rollupOptions: {
        input: "index.html",
        moduleTypes: { ".js": "jsx" },
      },
    },
    optimizeDeps: {
      rolldownOptions: { moduleTypes: { ".js": "jsx" } },
    },
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    server: { port: 3000 },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.js",
      css: false,
      // e2e/ is Playwright's, not Vitest's.
      exclude: [...configDefaults.exclude, "e2e/**"],
    },
  };
});
