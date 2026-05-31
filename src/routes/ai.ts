import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { questionToApi } from "../mappers.js";
import { aiStatus, evaluateAnswer, followUpQuestion } from "../lib/ai.js";

const evaluateBody = z.object({
  questionId: z.string(),
  answer: z.string().default(""),
});

const followUpBody = z.object({
  questionId: z.string(),
  answer: z.string().default(""),
  askedSoFar: z.array(z.string()).optional(),
});

export function registerAiRoutes(app: FastifyInstance) {
  app.get("/api/ai/status", async () => aiStatus());

  app.post("/api/ai/evaluate", async (req, reply) => {
    const { questionId, answer } = evaluateBody.parse(req.body);
    const row = await prisma.question.findUnique({ where: { id: questionId } });
    if (!row) return reply.code(404).send({ error: "question_not_found" });
    return evaluateAnswer(questionToApi(row), answer);
  });

  app.post("/api/ai/follow-up", async (req, reply) => {
    const { questionId, answer, askedSoFar } = followUpBody.parse(req.body);
    const row = await prisma.question.findUnique({ where: { id: questionId } });
    if (!row) return reply.code(404).send({ error: "question_not_found" });
    return followUpQuestion(questionToApi(row), answer, askedSoFar ?? []);
  });
}
