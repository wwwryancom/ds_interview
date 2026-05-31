import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { questionToApi, questionToSummary } from "../mappers.js";

const listQuery = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  company: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
  random: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export function registerQuestionRoutes(app: FastifyInstance) {
  app.get("/api/questions", async (req) => {
    const query = listQuery.parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.q) where.prompt = { contains: query.q };

    // company/tag are stored as JSON strings; filter with a contains on the serialized array.
    const and: Record<string, unknown>[] = [];
    if (query.company && query.company !== "all") {
      and.push({ companyEmphasis: { contains: `"${query.company}"` } });
    }
    if (query.tag) and.push({ tags: { contains: `"${query.tag}"` } });
    if (and.length) where.AND = and;

    let rows = await prisma.question.findMany({ where, orderBy: { id: "asc" } });

    if (query.random) rows = rows.sort(() => Math.random() - 0.5);
    if (query.limit) rows = rows.slice(0, query.limit);

    return { count: rows.length, questions: rows.map(questionToSummary) };
  });

  app.get("/api/questions/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.question.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ error: "question_not_found" });
    return questionToApi(row);
  });
}
