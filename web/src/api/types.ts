export interface CategoryDef {
  id: string;
  label: string;
  blurb: string;
  subcategories: { id: string; label: string }[];
}

export interface Taxonomy {
  categories: CategoryDef[];
  difficulties: string[];
  companies: { id: string; label: string }[];
  weaknessTags: string[];
}

export interface RubricBand {
  band: string;
  description: string;
}

export interface QuestionSummary {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  difficulty: string;
  primaryWeaknessTag: string;
  timeboxMinutes: number;
  isBehavioral: boolean;
  companyEmphasis: string[];
  tags: string[];
  promptPreview: string;
}

export interface Question {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  difficulty: string;
  primaryWeaknessTag: string;
  timeboxMinutes: number;
  isBehavioral: boolean;
  prompt: string;
  schemaText: string | null;
  companyEmphasis: string[];
  tags: string[];
  targetSkills: string[];
  expectedFramework: string[];
  sampleAnswerOutline: string[];
  sampleStrongAnswer: string;
  whatGoodLooksLike: string | null;
  commonMistakes: string[];
  scoringRubric: RubricBand[];
  followUps: string[];
}

export type Mood = "tough" | "okay" | "good" | "great" | "excellent";

export interface MockItem {
  itemId: number;
  orderIndex: number;
  answer?: string | null;
  selfScore?: number | null;
  timeSpentSec?: number | null;
  question: Question;
}

export interface MockSession {
  id: number;
  role: string;
  level: string;
  durationMin: number;
  focusAreas: string[];
  interviewType: string;
  startedAt: string;
  endedAt?: string | null;
  overallRating?: string | null;
  items: MockItem[];
}

export interface Progress {
  overview: {
    studySeconds: number;
    questionsSolved: number;
    totalAttempts: number;
    mockInterviews: number;
    avgScore: number;
    avgScorePct: number;
    streakDays: number;
    totalQuestions: number;
  };
  categoryCoverage: { category: string; label: string; attempted: number; available: number }[];
  skillBreakdown: { weaknessTag: string; attempts: number; avgScore: number; masteryPct: number }[];
  weakAreas: { weaknessTag: string; attempts: number; avgScore: number; masteryPct: number }[];
}

export interface ReviewQueue {
  dueCount: number;
  due: { questionId: string; reason: string; dueAt: string; intervalDays: number; question: QuestionSummary }[];
  upcoming: { questionId: string; reason: string; dueAt: string; intervalDays: number; question: QuestionSummary }[];
}

export interface ActivityEvent {
  type: "practice" | "mock";
  at: string;
  title: string;
  category: string | null;
  selfScore?: number | null;
  overallRating?: string | null;
}

export interface AiEvaluation {
  score: number;
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

export interface AiStatus {
  enabled: boolean;
  provider: string;
  mode: "live" | "stub";
}
