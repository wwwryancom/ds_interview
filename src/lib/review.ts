import { prisma } from "../db.js";

/** Simple spaced-repetition: low self-scores schedule sooner, high scores push out. */
const INTERVAL_BY_SCORE: Record<number, number> = {
  0: 1,
  1: 1,
  2: 3,
  3: 7,
  4: 21,
};

export async function scheduleReview(questionId: string, selfScore: number | null | undefined) {
  // Only enqueue/keep questions that still need work (score <= 2). Strong answers graduate.
  if (selfScore != null && selfScore >= 3) {
    await prisma.reviewQueueItem.deleteMany({ where: { questionId } });
    return;
  }
  const intervalDays = INTERVAL_BY_SCORE[selfScore ?? 1] ?? 1;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  await prisma.reviewQueueItem.upsert({
    where: { questionId },
    create: { questionId, reason: "low_score", intervalDays, dueAt },
    update: { reason: "low_score", intervalDays, dueAt },
  });
}
