import type { FastifyInstance } from "fastify";
import { CATEGORIES, DIFFICULTIES, COMPANIES, WEAKNESS_TAGS } from "../taxonomy.js";

export function registerTaxonomyRoutes(app: FastifyInstance) {
  app.get("/api/taxonomy", async () => ({
    categories: CATEGORIES,
    difficulties: DIFFICULTIES,
    companies: COMPANIES,
    weaknessTags: WEAKNESS_TAGS,
  }));
}
