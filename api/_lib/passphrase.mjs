import { jwtVerify, SignJWT } from "jose";

// This cookie gates /major and /apply only. /studio is on Clerk, so the old
// `studio_session` name would be actively misleading.
const COOKIE = "gate_session";
const MAX_AGE = 7 * 24 * 60 * 60;

const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export async function signGate() {
  return new SignJWT({ role: "gate" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export function gateCookie(token) {
  const parts = [
    `${COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${MAX_AGE}`,
  ];
  if (process.env.VERCEL_ENV !== "development") parts.splice(2, 0, "Secure");
  return parts.join("; ");
}

export async function requireGate(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  try {
    await jwtVerify(token, secretKey());
    return true;
  } catch {
    res.status(401).json({ error: "Session expired" });
    return false;
  }
}
