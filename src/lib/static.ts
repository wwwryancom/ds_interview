import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "fs";
import { join } from "path";

/** Serve the Vite build in production so one URL serves UI + /api. */
export async function registerWebStatic(app: FastifyInstance) {
  if (process.env.NODE_ENV !== "production") return;

  const webRoot = join(process.cwd(), "web/dist");
  if (!existsSync(join(webRoot, "index.html"))) {
    app.log.warn("web/dist missing — run `npm run build` before production start");
    return;
  }

  await app.register(fastifyStatic, {
    root: webRoot,
    prefix: "/",
    wildcard: false,
  });

  app.setNotFoundHandler((req, reply) => {
    const path = req.url.split("?")[0] ?? "";
    if (path.startsWith("/api")) {
      return reply.code(404).send({ error: "not_found" });
    }
    return reply.sendFile("index.html", webRoot);
  });

  app.log.info(`Serving web from ${webRoot}`);
}
