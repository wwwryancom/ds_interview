import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerTaxonomyRoutes } from "./routes/taxonomy.js";
import { registerQuestionRoutes } from "./routes/questions.js";
import { registerAttemptRoutes } from "./routes/attempts.js";
import { registerMockRoutes } from "./routes/mock.js";
import { registerProgressRoutes } from "./routes/progress.js";
import { registerReviewRoutes } from "./routes/review.js";
import { registerAiRoutes } from "./routes/ai.js";
import { registerAppAuth, registerAuthRoutes } from "./lib/auth.js";
import { registerWebStatic } from "./lib/static.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  registerAppAuth(app);

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    app.register(cors, { origin: true });
  }

  app.get("/api/health", async () => ({ ok: true, service: "piggy-interview-prep" }));

  registerAuthRoutes(app);
  registerTaxonomyRoutes(app);
  registerQuestionRoutes(app);
  registerAttemptRoutes(app);
  registerMockRoutes(app);
  registerProgressRoutes(app);
  registerReviewRoutes(app);
  registerAiRoutes(app);

  await registerWebStatic(app);

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`小猪 prep listening on :${port} (${process.env.NODE_ENV ?? "development"})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
