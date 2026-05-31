import type { ReactNode } from "react";

export const categoryMeta: Record<string, { emoji: string; tint: string }> = {
  experiment_stats: { emoji: "🧪", tint: "bg-sky-200/50 text-ink" },
  product_case: { emoji: "🧭", tint: "bg-rose-100 text-rose-600" },
  manager: { emoji: "🤝", tint: "bg-sage-100 text-sage-500" },
  sql: { emoji: "🗄️", tint: "bg-amber-100 text-amber-700" },
  python_coding: { emoji: "🐍", tint: "bg-sky-200/60 text-ink" },
};

// Chinese display labels for the UI shell. Question CONTENT stays English.
export const categoryLabelZh: Record<string, string> = {
  experiment_stats: "实验与统计",
  product_case: "产品 Case",
  manager: "Manager · 行为",
  sql: "SQL",
  python_coding: "Python / 编程",
};

export function categoryZh(id: string, fallback?: string): string {
  return categoryLabelZh[id] ?? fallback ?? id;
}

export const categoryBlurbZh: Record<string, string> = {
  experiment_stats: "实验设计、统计推断，以及如何解读不完美的证据。",
  product_case: "产品判断、指标设计、权衡取舍与建议表达。",
  manager: "影响力、冲突处理、优先级与领导力故事。",
  sql: "分析型 SQL：定义严谨、边界清楚。",
  python_coding: "pandas 数据处理、可复用分析代码与统计模拟。",
};

export function categoryBlurb(id: string, fallback?: string): string {
  return categoryBlurbZh[id] ?? fallback ?? "";
}

export const weaknessLabelZh: Record<string, string> = {
  metric_definition: "指标定义",
  tradeoff_thinking: "权衡取舍",
  experiment_design: "实验设计",
  statistical_reasoning: "统计推断",
  interpretation: "结果解读",
  product_judgment: "产品判断",
  sql_rigor: "SQL 严谨度",
  data_cleaning: "数据清洗",
  python_coding: "Python 编程",
  statistical_simulation: "统计模拟",
  communication_structure: "表达结构",
  stakeholder_management: "干系人管理",
  influence_without_authority: "无授权影响力",
  prioritization: "优先级",
  managing_up: "向上管理",
  mentorship: "带人 / 辅导",
  data_integrity: "数据严谨",
  leadership_storytelling: "领导力叙事",
};

export function weaknessZh(tag: string): string {
  return weaknessLabelZh[tag] ?? tag.replace(/_/g, " ");
}

export const difficultyLabelZh: Record<string, string> = {
  easy: "入门",
  medium: "进阶",
  hard: "挑战",
};

export function difficultyZh(d: string): string {
  return difficultyLabelZh[d] ?? d;
}

export function difficultyChip(d: string) {
  const map: Record<string, string> = {
    easy: "bg-sage-100 text-sage-500",
    medium: "bg-rose-100 text-rose-600",
    hard: "bg-rose-200 text-rose-600",
  };
  return map[d] ?? "bg-rose-50 text-ink-soft";
}

export const moods: { id: string; emoji: string; label: string }[] = [
  { id: "tough", emoji: "😣", label: "有点难" },
  { id: "okay", emoji: "😐", label: "还可以" },
  { id: "good", emoji: "🙂", label: "不错" },
  { id: "great", emoji: "😄", label: "很顺" },
  { id: "excellent", emoji: "🤩", label: "比想象中好" },
];

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function mmss(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`piggy-pill ${className}`}>{children}</span>;
}

export function ProgressBar({ pct, tone = "rose" }: { pct: number; tone?: "rose" | "sage" }) {
  const bar = tone === "sage" ? "bg-sage-300" : "bg-rose-400";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-rose-50">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
