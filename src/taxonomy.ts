/**
 * Aligned taxonomy for Piggy (小猪).
 *
 * This REPLACES the UI mockup's ML-leaning practice areas
 * ("Statistics & Probability / Machine Learning / SQL & Data Manipulation / ML System Design")
 * with the senior product/analytics DS taxonomy our question bank is actually built around.
 *
 * Single source of truth for: categories, subcategories, difficulties, companies, weakness tags.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface CategoryDef {
  id: string;
  label: string;
  blurb: string;
  /** ordered subcategory ids -> labels */
  subcategories: { id: string; label: string }[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "experiment_stats",
    label: "Experiment & Statistics",
    blurb: "Experiment design, statistical reasoning, and reading imperfect evidence.",
    subcategories: [
      { id: "experiment_design", label: "Experiment Design" },
      { id: "metric_guardrails_oec", label: "Metric Selection / Guardrails / OEC" },
      { id: "power_variance", label: "Power / Sample Size / Variance Reduction" },
      { id: "interpretation", label: "Interpretation of Results" },
      { id: "bias_validity", label: "Bias / Validity / Selection" },
      { id: "stats_fundamentals", label: "Statistics Fundamentals" },
    ],
  },
  {
    id: "product_case",
    label: "Product Case",
    blurb: "Product judgment, metric design, trade-offs, and recommendation framing.",
    subcategories: [
      { id: "success_metrics", label: "Success Metrics for New Features" },
      { id: "tradeoffs_guardrails", label: "Metric Trade-offs / Guardrails" },
      { id: "root_cause", label: "Root Cause / Diagnosis" },
      { id: "estimation_sizing", label: "Estimation / Sizing" },
      { id: "segmentation_insight", label: "Segmentation / Behavioral Insight" },
      { id: "recommendation_framing", label: "Recommendation / Decision Framing" },
    ],
  },
  {
    id: "manager",
    label: "Manager Interview",
    blurb: "Scope, ownership, influence, communication, and leadership stories.",
    subcategories: [
      { id: "influence", label: "Influence Without Authority" },
      { id: "conflict", label: "Conflict / Stakeholder Management" },
      { id: "prioritization", label: "Prioritization / Ambiguity" },
      { id: "managing_up", label: "Managing Up / Pushing Back" },
      { id: "mentorship", label: "Mentorship / Growing Others" },
      { id: "integrity", label: "Bad News / Data Integrity & Ethics" },
      { id: "failure", label: "Failure / Tough Decision / Learning" },
    ],
  },
  {
    id: "sql",
    label: "SQL",
    blurb: "Analytical SQL fluency with senior rigor on definitions and edge cases.",
    subcategories: [
      { id: "retention_cohort", label: "Retention / Cohort" },
      { id: "funnel_conversion", label: "Funnel / Conversion" },
      { id: "segmentation_breakdown", label: "Segmentation / Breakdown" },
      { id: "window_ranking", label: "Ranking / Window Functions" },
      { id: "experiment_readout", label: "Experiment Readout" },
      { id: "root_cause_anomaly", label: "Root Cause / Anomaly" },
      { id: "data_quality", label: "Data Quality / Edge Cases" },
    ],
  },
  {
    id: "python_coding",
    label: "Python / Coding",
    blurb: "Pandas data wrangling, reusable analysis code, and statistical simulation.",
    subcategories: [
      { id: "pandas_manipulation", label: "pandas Data Manipulation" },
      { id: "reusable_function", label: "Reusable Analysis Function" },
      { id: "stat_simulation", label: "Statistical Simulation" },
      { id: "log_processing", label: "Log / Event Processing" },
    ],
  },
];

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** Target companies for the `company_emphasis` filter. */
export const COMPANIES: { id: string; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "meta", label: "Meta" },
  { id: "tiktok", label: "TikTok" },
  { id: "airbnb", label: "Airbnb" },
  { id: "uber", label: "Uber" },
  { id: "doordash", label: "DoorDash" },
  { id: "stripe", label: "Stripe" },
  { id: "netflix", label: "Netflix" },
  { id: "microsoft", label: "Microsoft" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "booking", label: "Booking" },
  { id: "lyft", label: "Lyft" },
  { id: "all", label: "All / company-agnostic" },
];

/** Weakness tags used for progress tracking and the skill breakdown. */
export const WEAKNESS_TAGS: string[] = [
  "metric_definition",
  "tradeoff_thinking",
  "experiment_design",
  "statistical_reasoning",
  "interpretation",
  "product_judgment",
  "sql_rigor",
  "data_cleaning",
  "python_coding",
  "statistical_simulation",
  "communication_structure",
  "stakeholder_management",
  "influence_without_authority",
  "prioritization",
  "managing_up",
  "mentorship",
  "data_integrity",
  "leadership_storytelling",
];

export const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function isValidCategory(id: string): boolean {
  return CATEGORY_IDS.has(id);
}
