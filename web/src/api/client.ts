import type {
  ActivityEvent,
  AiEvaluation,
  AiFollowUp,
  AiStatus,
  Mood,
  Progress,
  Question,
  QuestionSummary,
  MockSession,
  ReviewQueue,
  Taxonomy,
} from "./types";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  taxonomy: () => req<Taxonomy>("/taxonomy"),

  questions: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== "all") qs.set(k, String(v));
    }
    const s = qs.toString();
    return req<{ count: number; questions: QuestionSummary[] }>(`/questions${s ? `?${s}` : ""}`);
  },

  question: (id: string) => req<Question>(`/questions/${id}`),

  createAttempt: (body: {
    questionId: string;
    notes?: string;
    selfScore?: number;
    reflection?: string;
    reflectionMood?: Mood;
    timeSpentSec?: number;
    aiEvaluation?: AiEvaluation;
  }) => req<{ id: number }>("/attempts", { method: "POST", body: JSON.stringify(body) }),

  createMock: (body: {
    role?: string;
    level?: string;
    durationMin?: number;
    focusAreas?: string[];
    interviewType?: "mixed" | "technical" | "behavioral";
    numQuestions?: number;
  }) => req<MockSession>("/mock/sessions", { method: "POST", body: JSON.stringify(body) }),

  mockSession: (id: number) => req<MockSession>(`/mock/sessions/${id}`),

  scoreMockItem: (sid: number, iid: number, body: { answer?: string; selfScore?: number; timeSpentSec?: number }) =>
    req(`/mock/sessions/${sid}/items/${iid}`, { method: "POST", body: JSON.stringify(body) }),

  finishMock: (id: number, body: { overallRating?: Mood }) =>
    req(`/mock/sessions/${id}/finish`, { method: "POST", body: JSON.stringify(body) }),

  progress: () => req<Progress>("/progress"),
  recentActivity: () => req<{ events: ActivityEvent[] }>("/progress/recent-activity"),
  reviewQueue: () => req<ReviewQueue>("/review-queue"),

  aiStatus: () => req<AiStatus>("/ai/status"),
  aiEvaluate: (body: { questionId: string; answer: string }) =>
    req<AiEvaluation>("/ai/evaluate", { method: "POST", body: JSON.stringify(body) }),
  aiFollowUp: (body: { questionId: string; answer: string; askedSoFar?: string[] }) =>
    req<AiFollowUp>("/ai/follow-up", { method: "POST", body: JSON.stringify(body) }),
};
