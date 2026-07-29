import bcrypt from "bcryptjs";
import { signSession, sessionCookie } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { passphrase } = req.body || {};
  if (!passphrase) {
    res.status(400).json({ error: "Missing passphrase" });
    return;
  }

  // bcrypt.compare throws "Illegal arguments" on a missing hash, which surfaces
  // as an opaque FUNCTION_INVOCATION_FAILED. A misconfigured env is a server
  // problem and should say so.
  const hash = process.env.AUTH_PASSPHRASE_HASH;
  if (!hash || !hash.startsWith("$2")) {
    res.status(500).json({ error: "AUTH_PASSPHRASE_HASH is missing or malformed on the server." });
    return;
  }

  const ok = await bcrypt.compare(passphrase, hash);
  if (!ok) {
    res.status(401).json({ error: "Wrong passphrase" });
    return;
  }

  const token = await signSession();
  res.setHeader("Set-Cookie", sessionCookie(token));
  res.status(200).json({ ok: true });
}
