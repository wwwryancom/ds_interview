import type { FastifyInstance, FastifyRequest } from "fastify";

/** Optional HTTP Basic Auth for a private single-user deployment. */
export function registerAppAuth(app: FastifyInstance) {
  const password = process.env.APP_PASSWORD?.trim();
  if (!password) return;

  const username = (process.env.APP_USER ?? "piggy").trim();

  app.addHook("onRequest", async (req: FastifyRequest, reply) => {
    const path = req.url.split("?")[0] ?? "";
    if (path === "/api/health") return;

    const header = req.headers.authorization;
    if (!header?.startsWith("Basic ")) {
      reply.header("WWW-Authenticate", 'Basic realm="小猪"');
      return reply.code(401).send("需要登录才能访问");
    }

    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    const user = sep >= 0 ? decoded.slice(0, sep) : decoded;
    const pass = sep >= 0 ? decoded.slice(sep + 1) : "";

    if (user !== username || pass !== password) {
      reply.header("WWW-Authenticate", 'Basic realm="小猪"');
      return reply.code(401).send("用户名或密码不对");
    }
  });

  app.log.info(`App auth enabled (user=${username})`);
}
