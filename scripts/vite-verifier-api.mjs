// Dev-only: serves /api/verifier/* from the Vite dev server so the Workshop can show
// the Verifier dashboard without `vercel dev`. Uses the exact same handlers and Clerk
// owner check as production. Never part of a build.
import { loadEnv } from "vite";

export function verifierApi() {
  return {
    name: "verifier-api-dev",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv("development", process.cwd(), "");
      for (const k of ["CLERK_SECRET_KEY", "CLERK_ALLOWED_USER_IDS"]) if (env[k] && !process.env[k]) process.env[k] = env[k];
      process.env.VERIFIER_DIR ||= `${process.env.HOME}/Documents/Code/THE-VERIFIER`;
      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/api\/verifier\/(snapshot|action)(?:\?|$)/);
        if (!m) return next();
        let raw = "";
        for await (const c of req) raw += c;
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); return res; };
        try {
          const mod = await server.ssrLoadModule(`/api/verifier/${m[1]}.mjs`);
          await mod.default(req, res);
        } catch (err) {
          res.status(500).json({ error: String(err?.message || err) });
        }
      });
    },
  };
}
