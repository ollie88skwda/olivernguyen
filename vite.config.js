import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vercel's dashboard still injects these three under their CRA-era
// REACT_APP_* names, which this task cannot rename without a manual dashboard
// edit. `define` below bakes each one in as a literal (loadEnv reads both
// .env files and real process.env, exactly like Vercel's build-time
// injection), so the existing `process.env.REACT_APP_*` call sites
// (src/auth/RequireClerk.js, src/lib/supabase.js) keep working completely
// untouched — same static-replacement behavior CRA/webpack already gave
// them. Everything else about `process.env` (notably process.env.NODE_ENV,
// which libraries like React use to pick their production build) is left to
// Vite's own defaults.
const REACT_APP_VARS = [
  'REACT_APP_CLERK_PUBLISHABLE_KEY',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'REACT_APP_']);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: Object.fromEntries(
      REACT_APP_VARS.map((key) => [
        `process.env.${key}`,
        key in env ? JSON.stringify(env[key]) : 'undefined',
      ])
    ),
    // 63 files in src/ ship JSX with a plain .js extension (CRA/Babel handled
    // this; esbuild does not by default). Treat every .js under src/ as JSX
    // rather than mass-renaming the files.
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      outDir: 'dist',
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/setupTests.js'],
    },
  };
});
