import { prisma } from "../db.js";
import { CATEGORIES } from "../taxonomy.js";

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Record activity for streak + study-time tracking (single user). */
export async function recordActivity(opts: {
  attempts?: number;
  mockSessions?: number;
  studySeconds?: number;
}) {
  const day = todayKey();
  await prisma.activityDay.upsert({
    where: { day },
    create: {
      day,
      attempts: opts.attempts ?? 0,
      mockSessions: opts.mockSessions ?? 0,
      studySeconds: opts.studySeconds ?? 0,
    },
    update: {
      attempts: { increment: opts.attempts ?? 0 },
      mockSessions: { increment: opts.mockSessions ?? 0 },
      studySeconds: { increment: opts.studySeconds ?? 0 },
    },
  });
}

/** Consecutive-day streak ending today (or yesterday if nothing yet today). */
export async function computeStreak(): Promise<number> {
  const days = await prisma.activityDay.findMany({ select: { day: true } });
  const set = new Set(days.map((d) => d.day));
  let streak = 0;
  const cursor = new Date();
  // allow the streak to count even if today has no activity yet
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function buildProgress() {
  const [attempts, mockSessions, activity, totalQuestions] = await Promise.all([
    prisma.practiceAttempt.findMany({
      include: { question: { select: { primaryWeaknessTag: true, category: true } } },
    }),
    prisma.mockSession.findMany({ where: { endedAt: { not: null } } }),
    prisma.activityDay.findMany(),
    prisma.question.count(),
  ]);

  const scored = attempts.filter((a) => a.selfScore != null);
  const distinctQuestionsSolved = new Set(attempts.map((a) => a.questionId)).size;
  const avgScore =
    scored.length > 0
      ? scored.reduce((s, a) => s + (a.selfScore ?? 0), 0) / scored.length
      : 0;
  const studySeconds = activity.reduce((s, a) => s + a.studySeconds, 0);

  // Skill breakdown by weakness tag: avg self-score (0-4) -> %.
  const byTag = new Map<string, { sum: number; n: number }>();
  for (const a of scored) {
    const tag = a.question.primaryWeaknessTag;
    const cur = byTag.get(tag) ?? { sum: 0, n: 0 };
    cur.sum += a.selfScore ?? 0;
    cur.n += 1;
    byTag.set(tag, cur);
  }
  const skillBreakdown = [...byTag.entries()]
    .map(([tag, { sum, n }]) => ({
      weaknessTag: tag,
      attempts: n,
      avgScore: +(sum / n).toFixed(2),
      masteryPct: Math.round((sum / n / 4) * 100),
    }))
    .sort((a, b) => a.masteryPct - b.masteryPct);

  const weakAreas = skillBreakdown.filter((s) => s.masteryPct < 60).slice(0, 5);

  // Category coverage: distinct questions attempted vs available.
  const byCategory = await Promise.all(
    CATEGORIES.map(async (c) => {
      const available = await prisma.question.count({ where: { category: c.id } });
      const attempted = new Set(
        attempts.filter((a) => a.question.category === c.id).map((a) => a.questionId),
      ).size;
      return { category: c.id, label: c.label, attempted, available };
    }),
  );

  return {
    overview: {
      studySeconds,
      questionsSolved: distinctQuestionsSolved,
      totalAttempts: attempts.length,
      mockInterviews: mockSessions.length,
      avgScore: +avgScore.toFixed(2),
      avgScorePct: Math.round((avgScore / 4) * 100),
      streakDays: await computeStreak(),
      totalQuestions,
    },
    categoryCoverage: byCategory,
    skillBreakdown,
    weakAreas,
  };
}
