import { createClient } from "@supabase/supabase-js";

// /pull has no login — identity is a name the visitor types, kept in localStorage — so
// unlike api/decision/save.mjs there is no gate to require here. What this route buys is
// the removal of every write primitive except the one the page actually needs.
//
// Before: the public role held SELECT, INSERT, UPDATE and DELETE on pull_picks with
// USING (true), so anyone reading the bundle could rewrite any column or wipe the table.
// After: the browser holds no write access at all, and the only reachable mutation is
// "set or clear one (player, weekend) pair to one of five allowed amounts".
//
// Residual risk, stated plainly: someone who knows a player's name can still change that
// player's pick. That is inherent to a page with no accounts, and it is a far smaller
// blast radius than DELETE on the whole table.

// Mirrors LEVELS in src/pages/pull.js. Duplicated rather than imported because the server
// cannot take the client's word for what a legal amount is.
const ALLOWED_AMOUNTS = new Set([20, 100, 500, 5000, 1000000]);

const MAX_PLAYER_LEN = 40;

// The page only ever offers upcoming Saturdays up to 2027-01-01. Bounding the range keeps
// the table from being used as free storage via arbitrary date keys.
function isLegalWeekend(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  if (d.getUTCDay() !== 6) return false; // Saturdays only
  const year = d.getUTCFullYear();
  return year >= 2025 && year <= 2027;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { player, weekend, amount } = req.body || {};

  const name = typeof player === "string" ? player.trim() : "";
  if (!name || name.length > MAX_PLAYER_LEN) {
    res.status(400).json({ error: "Missing or oversized player name" });
    return;
  }
  if (!isLegalWeekend(weekend)) {
    res.status(400).json({ error: "Not an offered weekend" });
    return;
  }
  // null is the page's "clear my pick" signal and is the only non-number accepted.
  if (amount !== null && !ALLOWED_AMOUNTS.has(amount)) {
    res.status(400).json({ error: "Not an offered amount" });
    return;
  }

  // Checked after request validation so a malformed request still gets a 400 that says
  // what is wrong, rather than being masked by a config error.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing on the server." });
    return;
  }
  if (!process.env.REACT_APP_SUPABASE_URL) {
    res.status(500).json({ error: "REACT_APP_SUPABASE_URL is missing on the server." });
    return;
  }

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Both branches are scoped to this one (player, weekend) server-side. The client never
  // gets to say which rows are affected.
  const { error } =
    amount === null
      ? await supabase.from("pull_picks").delete().eq("player", name).eq("weekend", weekend)
      : await supabase
          .from("pull_picks")
          .upsert({ player: name, weekend, amount }, { onConflict: "player,weekend" });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ ok: true });
}
