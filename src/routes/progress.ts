import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { buildProgress } from "../lib/progress.js";

export function registerProgressRoutes(app: FastifyInstance) {
  app.get("/api/progress", async () => buildProgress());

  app.get("/api/progress/recent-activity", async () => {
    const [attempts, sessions] = await Promise.all([
      prisma.practiceAttempt.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { question: { select: { title: true, category: true } } },
      }),
      prisma.mockSession.findMany({
        where: { endedAt: { not: null } },
        orderBy: { endedAt: "desc" },
        take: 10,
      }),
    ]);

    const events = [
      ...attempts.map((a) => ({
        type: "practice" as const,
        at: a.createdAt,
        title: a.question.title,
        category: a.question.category,
        selfScore: a.selfScore,
      })),
      ...sessions.map((s) => ({
        type: "mock" as const,
        at: s.endedAt!,
        title: `Mock interview (${s.interviewType})`,
        category: null,
        overallRating: s.overallRating,
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return { events: events.slice(0, 15) };
  });
}
