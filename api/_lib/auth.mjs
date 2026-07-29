import { jwtVerify, SignJWT } from "jose";

const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function signSession() {
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

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

export async function requireSession(req, res) {
  const token = parseCookies(req.headers.cookie).studio_session;
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

export function sessionCookie(token) {
  const parts = [
    `studio_session=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${7 * 24 * 60 * 60}`,
  ];
  if (process.env.VERCEL_ENV !== "development") parts.splice(2, 0, "Secure");
  return parts.join("; ");
}
