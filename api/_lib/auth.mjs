import { verifyToken } from "@clerk/backend";

// Same export and signature as the previous jose implementation, so the five
// vault and exemplar routes that call it need no edit. Only the verification
// changes: Clerk's __session cookie instead of our own signed one.
//
// The passphrase that gates /major and /apply lives in _lib/passphrase.mjs and
// has nothing to do with this. That separation is the point: the passphrase can
// be shared without also handing over the GitHub token this path protects.
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function allowlist() {
  return (process.env.CLERK_ALLOWED_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function requireSession(req, res) {
  // A misconfigured env is a server problem and should say so, rather than
  // surfacing as an opaque failure. It also fails closed: no key, no vault.
  if (!process.env.CLERK_SECRET_KEY) {
    res.status(500).json({ error: "CLERK_SECRET_KEY is missing on the server." });
    return false;
  }

  const token = parseCookies(req.headers.cookie).__session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }

  // verifyToken in @clerk/backend v3 resolves to the JwtPayload and throws on
  // failure. It does not return a { data, errors } pair — that is the internal
  // verifyJwt, and following the wrong one silently accepts every token.
  let payload;
  try {
    payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    res.status(401).json({ error: "Session expired" });
    return false;
  }

  // Clerk permits open sign-up unless it is turned off in the dashboard, so
  // authenticating is not the same as being allowed in. This is the server-side
  // backstop for that. The userId is echoed back deliberately: it is how the
  // allowlist gets populated the first time, and it is the caller's own id.
  if (!allowlist().includes(payload.sub)) {
    res.status(403).json({
      error: "This account is not on the allowlist.",
      userId: payload.sub,
    });
    return false;
  }

  return true;
}
