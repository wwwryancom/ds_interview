import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const COOKIE_NAME = "piggy_session";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function readConfig() {
  const password = process.env.APP_PASSWORD?.trim();
  if (!password) return null;
  return {
    username: (process.env.APP_USER ?? "piggy").trim(),
    password,
    secure: process.env.NODE_ENV === "production",
  };
}

function sessionToken(username: string, password: string) {
  return createHash("sha256").update(`${username}:${password}`).digest("hex");
}

function parseCookies(header?: string) {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookies.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

function hasValidSession(req: FastifyRequest) {
  const config = readConfig();
  if (!config) return true;

  const token = parseCookies(req.headers.cookie).get(COOKIE_NAME);
  if (!token) return false;

  const expected = sessionToken(config.username, config.password);
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function setAuthCookie(reply: FastifyReply, token: string, secure: boolean) {
  const securePart = secure ? "; Secure" : "";
  reply.header(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SEC}${securePart}`,
  );
}

function clearAuthCookie(reply: FastifyReply, secure: boolean) {
  const securePart = secure ? "; Secure" : "";
  reply.header(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`,
  );
}

function isPublicPath(path: string) {
  return (
    path === "/login" ||
    path === "/api/health" ||
    path === "/api/auth/status" ||
    path === "/api/auth/login" ||
    path === "/api/auth/logout" ||
    path === "/favicon.ico" ||
    path.startsWith("/assets/") ||
    path.startsWith("/piggy/")
  );
}

const loginBody = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: FastifyInstance) {
  app.get("/api/auth/status", async (req) => {
    const config = readConfig();
    if (!config) {
      return { enabled: false, authenticated: true, username: null };
    }

    return {
      enabled: true,
      authenticated: hasValidSession(req),
      username: config.username,
    };
  });

  app.post("/api/auth/login", async (req, reply) => {
    const config = readConfig();
    if (!config) {
      return { ok: true, username: null };
    }

    const body = loginBody.parse(req.body);
    if (body.username !== config.username || body.password !== config.password) {
      clearAuthCookie(reply, config.secure);
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    setAuthCookie(reply, sessionToken(config.username, config.password), config.secure);
    return { ok: true, username: config.username };
  });

  app.post("/api/auth/logout", async (_req, reply) => {
    const config = readConfig();
    clearAuthCookie(reply, config?.secure ?? false);
    return { ok: true };
  });
}

/** Optional app auth with a custom in-app login page instead of browser basic auth. */
export function registerAppAuth(app: FastifyInstance) {
  const config = readConfig();
  if (!config) return;

  app.addHook("onRequest", async (req: FastifyRequest, reply) => {
    const path = req.url.split("?")[0] ?? "";
    if (isPublicPath(path) || hasValidSession(req)) return;

    if (path.startsWith("/api")) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const next = encodeURIComponent(req.url || "/");
    return reply.redirect(`/login?next=${next}`);
  });

  app.log.info(`App auth enabled (user=${config.username})`);
}
