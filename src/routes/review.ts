import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { questionToSummary } from "../mappers.js";

export function registerReviewRoutes(app: FastifyInstance) {
  // Items due now (dueAt <= now), plus an "upcoming" peek.
  app.get("/api/review-queue", async () => {
    const now = new Date();
    const items = await prisma.reviewQueueItem.findMany({
      orderBy: { dueAt: "asc" },
      include: { question: true },
      take: 100,
    });
    const due = items.filter((i) => i.dueAt <= now);
    const upcoming = items.filter((i) => i.dueAt > now);
    const shape = (i: (typeof items)[number]) => ({
      questionId: i.questionId,
      reason: i.reason,
      dueAt: i.dueAt,
      intervalDays: i.intervalDays,
      question: questionToSummary(i.question),
    });
    return {
      dueCount: due.length,
      due: due.map(shape),
      upcoming: upcoming.map(shape),
    };
  });
}
