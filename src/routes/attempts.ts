import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { recordActivity } from "../lib/progress.js";
import { scheduleReview } from "../lib/review.js";

const createAttempt = z.object({
  questionId: z.string(),
  notes: z.string().optional(),
  selfScore: z.number().int().min(0).max(4).optional(),
  reflection: z.string().optional(),
  reflectionMood: z.enum(["tough", "okay", "good", "great", "excellent"]).optional(),
  timeSpentSec: z.number().int().min(0).optional(),
  aiEvaluation: z
    .object({
      score: z.number().int().min(0).max(4),
      bandLabel: z.string(),
      summary: z.string(),
      strengths: z.array(z.string()).default([]),
      gaps: z.array(z.string()).default([]),
      mistakes: z.array(z.string()).default([]),
      nextStep: z.string().optional(),
      mode: z.enum(["live", "stub"]),
      provider: z.string(),
    })
    .optional(),
});

export function registerAttemptRoutes(app: FastifyInstance) {
  app.post("/api/attempts", async (req, reply) => {
    const body = createAttempt.parse(req.body);

    const question = await prisma.question.findUnique({ where: { id: body.questionId } });
    if (!question) return reply.code(404).send({ error: "question_not_found" });

    const attempt = await prisma.practiceAttempt.create({
      data: {
        questionId: body.questionId,
        notes: body.notes,
        selfScore: body.selfScore,
        reflection: body.reflection,
        reflectionMood: body.reflectionMood,
        timeSpentSec: body.timeSpentSec,
        aiScore: body.aiEvaluation?.score,
        aiBandLabel: body.aiEvaluation?.bandLabel,
        aiSummary: body.aiEvaluation?.summary,
        aiStrengths: body.aiEvaluation ? JSON.stringify(body.aiEvaluation.strengths) : undefined,
        aiGaps: body.aiEvaluation ? JSON.stringify(body.aiEvaluation.gaps) : undefined,
        aiMistakes: body.aiEvaluation ? JSON.stringify(body.aiEvaluation.mistakes) : undefined,
        aiNextStep: body.aiEvaluation?.nextStep,
        aiMode: body.aiEvaluation?.mode,
        aiProvider: body.aiEvaluation?.provider,
      },
    });

    await recordActivity({ attempts: 1, studySeconds: body.timeSpentSec ?? 0 });
    await scheduleReview(body.questionId, body.selfScore);

    return reply.code(201).send(attempt);
  });

  app.get("/api/attempts", async (req) => {
    const { questionId } = req.query as { questionId?: string };
    const attempts = await prisma.practiceAttempt.findMany({
      where: questionId ? { questionId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { count: attempts.length, attempts };
  });
}
