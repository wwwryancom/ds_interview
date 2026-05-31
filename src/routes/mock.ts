import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { questionToApi } from "../mappers.js";
import { recordActivity } from "../lib/progress.js";
import { scheduleReview } from "../lib/review.js";

const createSession = z.object({
  role: z.string().default("Data Scientist"),
  level: z.string().default("Senior"),
  durationMin: z.number().int().min(5).max(120).default(45),
  focusAreas: z.array(z.string()).default([]),
  interviewType: z.enum(["mixed", "technical", "behavioral"]).default("mixed"),
  numQuestions: z.number().int().min(1).max(12).default(5),
});

const scoreItem = z.object({
  answer: z.string().optional(),
  selfScore: z.number().int().min(0).max(4).optional(),
  timeSpentSec: z.number().int().min(0).optional(),
});

const finishSession = z.object({
  overallRating: z.enum(["tough", "okay", "good", "great", "excellent"]).optional(),
});

export function registerMockRoutes(app: FastifyInstance) {
  // Create a session and pick questions matching the focus areas.
  app.post("/api/mock/sessions", async (req) => {
    const body = createSession.parse(req.body);

    const where: Record<string, unknown> = {};
    if (body.focusAreas.length) where.category = { in: body.focusAreas };
    if (body.interviewType === "behavioral") where.category = { in: ["manager"] };
    if (body.interviewType === "technical")
      where.category = { in: ["sql", "python_coding", "experiment_stats", "product_case"] };

    const pool = await prisma.question.findMany({ where });
    const picked = pool
      .sort(() => Math.random() - 0.5)
      .slice(0, body.numQuestions);

    const session = await prisma.mockSession.create({
      data: {
        role: body.role,
        level: body.level,
        durationMin: body.durationMin,
        focusAreas: JSON.stringify(body.focusAreas),
        interviewType: body.interviewType,
        items: {
          create: picked.map((q, i) => ({ questionId: q.id, orderIndex: i })),
        },
      },
      include: { items: { include: { question: true }, orderBy: { orderIndex: "asc" } } },
    });

    return {
      id: session.id,
      role: session.role,
      level: session.level,
      durationMin: session.durationMin,
      focusAreas: body.focusAreas,
      interviewType: session.interviewType,
      startedAt: session.startedAt,
      items: session.items.map((it) => ({
        itemId: it.id,
        orderIndex: it.orderIndex,
        question: questionToApi(it.question),
      })),
    };
  });

  app.get("/api/mock/sessions", async () => {
    const sessions = await prisma.mockSession.findMany({
      orderBy: { startedAt: "desc" },
      include: { items: true },
      take: 50,
    });
    return {
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        role: s.role,
        level: s.level,
        durationMin: s.durationMin,
        interviewType: s.interviewType,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        overallRating: s.overallRating,
        numItems: s.items.length,
      })),
    };
  });

  app.get("/api/mock/sessions/:id", async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const session = await prisma.mockSession.findUnique({
      where: { id },
      include: { items: { include: { question: true }, orderBy: { orderIndex: "asc" } } },
    });
    if (!session) return reply.code(404).send({ error: "session_not_found" });
    return {
      id: session.id,
      role: session.role,
      level: session.level,
      durationMin: session.durationMin,
      focusAreas: JSON.parse(session.focusAreas),
      interviewType: session.interviewType,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      overallRating: session.overallRating,
      items: session.items.map((it) => ({
        itemId: it.id,
        orderIndex: it.orderIndex,
        answer: it.answer,
        selfScore: it.selfScore,
        timeSpentSec: it.timeSpentSec,
        question: questionToApi(it.question),
      })),
    };
  });

  app.post("/api/mock/sessions/:sid/items/:iid", async (req, reply) => {
    const { sid, iid } = req.params as { sid: string; iid: string };
    const body = scoreItem.parse(req.body);
    const item = await prisma.mockItem.findFirst({
      where: { id: Number(iid), sessionId: Number(sid) },
    });
    if (!item) return reply.code(404).send({ error: "item_not_found" });

    const updated = await prisma.mockItem.update({
      where: { id: item.id },
      data: { answer: body.answer, selfScore: body.selfScore, timeSpentSec: body.timeSpentSec },
    });
    if (body.selfScore != null) await scheduleReview(item.questionId, body.selfScore);
    return updated;
  });

  app.post("/api/mock/sessions/:id/finish", async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const body = finishSession.parse(req.body);
    const session = await prisma.mockSession.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!session) return reply.code(404).send({ error: "session_not_found" });

    const studySeconds = session.items.reduce((s, it) => s + (it.timeSpentSec ?? 0), 0);
    const finished = await prisma.mockSession.update({
      where: { id },
      data: { endedAt: new Date(), overallRating: body.overallRating },
    });
    await recordActivity({ mockSessions: 1, studySeconds });
    return finished;
  });
}
