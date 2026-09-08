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

async function authenticate(req, res) {
  // A misconfigured env is a server problem and should say so, rather than
  // surfacing as an opaque failure. It also fails closed: no key, no private data.
  if (!process.env.CLERK_SECRET_KEY) {
    res.status(500).json({ error: "CLERK_SECRET_KEY is missing on the server." });
    return null;
  }

  const token = parseCookies(req.headers.cookie).__session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  // verifyToken in @clerk/backend v3 resolves to the JwtPayload and throws on
  // failure. It does not return a { data, errors } pair — that is the internal
  // verifyJwt, and following the wrong one silently accepts every token.
  try {
    return await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    res.status(401).json({ error: "Session expired" });
    return null;
  }
}

export async function requireSession(req, res) {
  const payload = await authenticate(req, res);
  if (!payload) return false;

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

  // Attached so routes can scope data to the caller. The payload.sub is the
  // Clerk user id, and every private storage path is named under it.
  req.userId = payload.sub;
  return true;
}

export async function requireOwnerSession(req, res) {
  const payload = await authenticate(req, res);
  if (!payload) return false;

  // Reuse the established one-person allowlist unless a dedicated owner id is
  // supplied. Either way, identity stays in server configuration. Multiple
  // allowlisted accounts are ambiguous and fail closed rather than sharing data.
  const explicitOwner = (process.env.CLERK_OWNER_USER_ID || "").trim();
  const allowed = allowlist();
  const ownerId = explicitOwner || (allowed.length === 1 ? allowed[0] : "");
  if (!ownerId) {
    res.status(500).json({ error: "Exactly one tracker owner must be configured on the server." });
    return false;
  }
  if (payload.sub !== ownerId) {
    res.status(403).json({ error: "This tracker belongs to a different account." });
    return false;
  }

  req.userId = payload.sub;
  return true;
}
