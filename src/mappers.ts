import type { Question as DbQuestion } from "@prisma/client";

export interface RubricBand {
  band: string;
  description: string;
}

/** The canonical question shape used both for seeding and for API responses. */
export interface QuestionInput {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  difficulty: string;
  primaryWeaknessTag: string;
  timeboxMinutes: number;
  isBehavioral?: boolean;
  prompt: string;
  schemaText?: string | null;
  companyEmphasis: string[];
  tags: string[];
  targetSkills: string[];
  expectedFramework: string[];
  sampleAnswerOutline: string[];
  sampleStrongAnswer: string;
  whatGoodLooksLike?: string | null;
  commonMistakes: string[];
  scoringRubric: RubricBand[];
  followUps: string[];
}

const parse = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

/** DB row -> rich API object (deserializes JSON string columns). */
export function questionToApi(q: DbQuestion) {
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    title: q.title,
    difficulty: q.difficulty,
    primaryWeaknessTag: q.primaryWeaknessTag,
    timeboxMinutes: q.timeboxMinutes,
    isBehavioral: q.isBehavioral,
    prompt: q.prompt,
    schemaText: q.schemaText,
    companyEmphasis: parse<string[]>(q.companyEmphasis, []),
    tags: parse<string[]>(q.tags, []),
    targetSkills: parse<string[]>(q.targetSkills, []),
    expectedFramework: parse<string[]>(q.expectedFramework, []),
    sampleAnswerOutline: parse<string[]>(q.sampleAnswerOutline, []),
    sampleStrongAnswer: q.sampleStrongAnswer,
    whatGoodLooksLike: q.whatGoodLooksLike,
    commonMistakes: parse<string[]>(q.commonMistakes, []),
    scoringRubric: parse<RubricBand[]>(q.scoringRubric, []),
    followUps: parse<string[]>(q.followUps, []),
  };
}

/** A trimmed shape for list views (cards). */
export function questionToSummary(q: DbQuestion) {
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    title: q.title,
    difficulty: q.difficulty,
    primaryWeaknessTag: q.primaryWeaknessTag,
    timeboxMinutes: q.timeboxMinutes,
    isBehavioral: q.isBehavioral,
    companyEmphasis: parse<string[]>(q.companyEmphasis, []),
    tags: parse<string[]>(q.tags, []),
    promptPreview: q.prompt.length > 220 ? q.prompt.slice(0, 217) + "..." : q.prompt,
  };
}

/** Canonical input -> Prisma create payload (serializes arrays to JSON strings). */
export function questionToDb(q: QuestionInput) {
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    title: q.title,
    difficulty: q.difficulty,
    primaryWeaknessTag: q.primaryWeaknessTag,
    timeboxMinutes: q.timeboxMinutes,
    isBehavioral: q.isBehavioral ?? false,
    prompt: q.prompt,
    schemaText: q.schemaText ?? null,
    companyEmphasis: JSON.stringify(q.companyEmphasis),
    tags: JSON.stringify(q.tags),
    targetSkills: JSON.stringify(q.targetSkills),
    expectedFramework: JSON.stringify(q.expectedFramework),
    sampleAnswerOutline: JSON.stringify(q.sampleAnswerOutline),
    sampleStrongAnswer: q.sampleStrongAnswer,
    whatGoodLooksLike: q.whatGoodLooksLike ?? null,
    commonMistakes: JSON.stringify(q.commonMistakes),
    scoringRubric: JSON.stringify(q.scoringRubric),
    followUps: JSON.stringify(q.followUps),
  };
}
