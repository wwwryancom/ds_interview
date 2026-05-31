import { questionToApi } from "../mappers.js";

type ApiQuestion = ReturnType<typeof questionToApi>;

export interface AiEvaluation {
  score: number; // 0-4
  bandLabel: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  mistakes: string[];
  nextStep: string;
  mode: "live" | "stub";
  provider: string;
}

export interface AiFollowUp {
  question: string;
  rationale: string;
  mode: "live" | "stub";
  provider: string;
}

interface Provider {
  name: string;
  key?: string;
  model: string;
}

/**
 * Decide which model provider to use from the environment.
 * With no key present we run in "stub" mode: a rubric-grounded heuristic that
 * is fully usable offline. Drop an OPENAI_API_KEY / ANTHROPIC_API_KEY into .env
 * to switch to live grading with no other code changes.
 */
function detectProvider(): Provider {
  const explicit = (process.env.AI_PROVIDER ?? "").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (explicit === "anthropic" || (!explicit && anthropicKey && !openaiKey)) {
    return { name: "anthropic", key: anthropicKey, model: process.env.AI_MODEL ?? "claude-3-5-sonnet-latest" };
  }
  if (explicit === "openai" || openaiKey) {
    return { name: "openai", key: openaiKey, model: process.env.AI_MODEL ?? "gpt-4o-mini" };
  }
  // No key configured.
  return { name: anthropicKey ? "anthropic" : "openai", key: undefined, model: "stub" };
}

export function aiStatus() {
  const p = detectProvider();
  return { enabled: true, provider: p.name, mode: p.key ? "live" : ("stub" as const) };
}

/* ----------------------------- grading ----------------------------- */

export async function evaluateAnswer(q: ApiQuestion, answer: string): Promise<AiEvaluation> {
  const provider = detectProvider();
  if (provider.key) {
    try {
      return await liveEvaluate(provider, q, answer);
    } catch (err) {
      // Fall back to the heuristic so the feature never hard-fails.
      const stub = heuristicEvaluate(q, answer);
      stub.summary = `（模型调用失败，已回退到本地评分）${stub.summary}`;
      return stub;
    }
  }
  return heuristicEvaluate(q, answer);
}

export async function followUpQuestion(
  q: ApiQuestion,
  answer: string,
  askedSoFar: string[],
): Promise<AiFollowUp> {
  const provider = detectProvider();
  if (provider.key) {
    try {
      return await liveFollowUp(provider, q, answer, askedSoFar);
    } catch {
      return heuristicFollowUp(q, askedSoFar);
    }
  }
  return heuristicFollowUp(q, askedSoFar);
}

/* ----------------------- heuristic (stub) mode ---------------------- */

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "you", "your", "are", "but", "not", "what",
  "how", "why", "when", "from", "into", "have", "has", "was", "were", "they", "their", "them",
  "would", "could", "should", "about", "which", "will", "can", "want", "need", "use", "using",
  "make", "made", "also", "more", "most", "some", "such", "than", "then", "there", "here",
  "over", "under", "across", "between", "because", "while", "where", "whether", "given",
]);

function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

function coverage(point: string, answerKw: Set<string>): number {
  const pk = [...keywords(point)];
  if (!pk.length) return 0;
  const hit = pk.filter((w) => answerKw.has(w)).length;
  return hit / pk.length;
}

const BANDS = ["Missing", "Weak", "Developing", "Strong", "Excellent"];

function heuristicEvaluate(q: ApiQuestion, answer: string): AiEvaluation {
  const text = (answer ?? "").trim();
  const answerKw = keywords(text);
  const wordCount = text ? text.split(/\s+/).length : 0;

  const framework = q.expectedFramework.length ? q.expectedFramework : q.sampleAnswerOutline;
  const scored = framework.map((p) => ({ point: p, cov: coverage(p, answerKw) }));
  const covered = scored.filter((s) => s.cov >= 0.25);
  const missed = scored.filter((s) => s.cov < 0.25);
  const ratio = framework.length ? covered.length / framework.length : 0;

  // Score from coverage, then damp for very thin answers so length can't be gamed.
  let score = Math.round(ratio * 4);
  if (wordCount < 25) score = Math.min(score, 1);
  else if (wordCount < 60) score = Math.min(score, 2);
  if (text.length === 0) score = 0;
  score = Math.max(0, Math.min(4, score));

  const strengths = covered.slice(0, 3).map((s) => s.point);
  const gaps = missed.slice(0, 3).map((s) => s.point);

  // Surface the most relevant common mistakes when coverage is shaky.
  const mistakes = score <= 2 ? q.commonMistakes.slice(0, 2) : q.commonMistakes.slice(0, 1);

  const summaryByScore: Record<number, string> = {
    0: "目前还没有可评估的内容，先把结构和核心判断写下来。",
    1: "方向有了，但关键步骤还很薄。先补齐框架里的主干，再展开。",
    2: "结构在成形，但深度和权衡还不够。把缺失的环节讲透会明显加分。",
    3: "已经是一个扎实的回答，覆盖了大部分要点。再补上少量遗漏点就接近 strong+。",
    4: "覆盖全面、结构清晰，达到了资深候选人的水准。继续保持这种讲法。",
  };

  const nextStep = gaps.length
    ? `下一步重点补这一点：${gaps[0]}`
    : "下一步：用一个具体例子把推理讲得更可信，并主动点出不确定性。";

  return {
    score,
    bandLabel: `${score} — ${BANDS[score]}`,
    summary: `${summaryByScore[score]}（命中 ${covered.length}/${framework.length} 个框架要点，约 ${wordCount} 词）`,
    strengths,
    gaps,
    mistakes,
    nextStep,
    mode: "stub",
    provider: detectProvider().name,
  };
}

function heuristicFollowUp(q: ApiQuestion, askedSoFar: string[]): AiFollowUp {
  const remaining = q.followUps.filter((f) => !askedSoFar.includes(f));
  const pick = remaining[0] ?? q.followUps[0];
  if (pick) {
    return {
      question: pick,
      rationale: "顺着这道题预设的追问方向，进一步考察深度。",
      mode: "stub",
      provider: detectProvider().name,
    };
  }
  return {
    question: "If a senior stakeholder pushed back on your conclusion, how would you defend it — and what evidence would change your mind?",
    rationale: "通用追问：考察论证强度与对不确定性的诚实度。",
    mode: "stub",
    provider: detectProvider().name,
  };
}

/* --------------------------- live mode ----------------------------- */

function gradingPrompt(q: ApiQuestion, answer: string): string {
  return [
    "You are a strict but fair senior data-science interviewer. Grade the candidate's answer.",
    "Use ONLY the rubric and framework below as your standard. Be specific and honest.",
    "",
    `QUESTION (${q.id}, ${q.category}, difficulty=${q.difficulty}):`,
    q.prompt,
    "",
    "EXPECTED FRAMEWORK:",
    ...q.expectedFramework.map((p, i) => `${i + 1}. ${p}`),
    "",
    "SCORING RUBRIC (0-4):",
    ...q.scoringRubric.map((b) => `- Band ${b.band}: ${b.description}`),
    "",
    "COMMON MISTAKES TO WATCH FOR:",
    ...q.commonMistakes.map((m) => `- ${m}`),
    "",
    "CANDIDATE ANSWER:",
    answer || "(empty)",
    "",
    "Respond with ONLY a JSON object of this exact shape:",
    `{"score": <int 0-4>, "summary": "<one short paragraph, Chinese ok>", "strengths": ["..."], "gaps": ["framework points they missed"], "mistakes": ["common mistakes they actually made"], "nextStep": "<one concrete next action>"}`,
  ].join("\n");
}

async function liveEvaluate(provider: Provider, q: ApiQuestion, answer: string): Promise<AiEvaluation> {
  const raw = await callModel(provider, gradingPrompt(q, answer));
  const parsed = JSON.parse(extractJson(raw)) as Partial<AiEvaluation> & { score?: number };
  const score = Math.max(0, Math.min(4, Math.round(Number(parsed.score ?? 0))));
  return {
    score,
    bandLabel: `${score} — ${BANDS[score]}`,
    summary: parsed.summary ?? "",
    strengths: parsed.strengths ?? [],
    gaps: parsed.gaps ?? [],
    mistakes: parsed.mistakes ?? [],
    nextStep: parsed.nextStep ?? "",
    mode: "live",
    provider: provider.name,
  };
}

async function liveFollowUp(
  provider: Provider,
  q: ApiQuestion,
  answer: string,
  askedSoFar: string[],
): Promise<AiFollowUp> {
  const prompt = [
    "You are a senior data-science interviewer running a mock interview.",
    "Based on the candidate's answer, ask ONE sharp follow-up that probes the weakest or most interesting part.",
    "Do not repeat any already-asked follow-up.",
    "",
    `QUESTION: ${q.prompt}`,
    "",
    "CANDIDATE ANSWER:",
    answer || "(empty)",
    "",
    askedSoFar.length ? `ALREADY ASKED: ${askedSoFar.join(" | ")}` : "ALREADY ASKED: (none)",
    "",
    'Respond with ONLY JSON: {"question": "<the follow-up, in English>", "rationale": "<why you asked, Chinese ok>"}',
  ].join("\n");
  const raw = await callModel(provider, prompt);
  const parsed = JSON.parse(extractJson(raw)) as { question?: string; rationale?: string };
  return {
    question: parsed.question ?? "Can you walk me through the biggest risk in your approach?",
    rationale: parsed.rationale ?? "",
    mode: "live",
    provider: provider.name,
  };
}

function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

async function callModel(provider: Provider, prompt: string): Promise<string> {
  if (provider.name === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": provider.key!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data: any = await res.json();
    return data?.content?.[0]?.text ?? "";
  }
  // default: OpenAI-compatible chat completions
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
