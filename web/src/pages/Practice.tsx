import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { RichText } from "../components/RichText";
import {
  categoryZh,
  difficultyZh,
  difficultyChip,
  moods,
  Tag,
} from "../lib/ui";
import type { AiEvaluation, Question, QuestionSummary } from "../api/types";

export function Practice() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const difficulty = params.get("difficulty") ?? "";
  const random = params.get("random") === "1";
  const questionId = params.get("questionId") ?? "";

  const taxonomy = useAsync(() => api.taxonomy(), []);
  const list = useAsync(
    () => api.questions({ category, difficulty, random }),
    [category, difficulty, random],
  );

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [category, difficulty, random]);

  const questions: QuestionSummary[] = list.data?.questions ?? [];
  useEffect(() => {
    if (!questionId || questions.length === 0) return;
    const targetIndex = questions.findIndex((q) => q.id === questionId);
    if (targetIndex >= 0) setIndex(targetIndex);
  }, [questionId, questions]);

  const current = questions[index];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={category}
          onChange={(v) => updateParam(params, setParams, "category", v)}
          placeholder="全部模块"
          options={(taxonomy.data?.categories ?? []).map((c) => ({
            value: c.id,
            label: categoryZh(c.id, c.label),
          }))}
        />
        <FilterSelect
          value={difficulty}
          onChange={(v) => updateParam(params, setParams, "difficulty", v)}
          placeholder="全部难度"
          options={[
            { value: "easy", label: "入门" },
            { value: "medium", label: "进阶" },
            { value: "hard", label: "挑战" },
          ]}
        />
        <button
          className="btn-ghost"
          onClick={() => updateParam(params, setParams, "random", random ? "" : "1")}
        >
          {random ? "🎲 随机：开" : "🎲 随机练习"}
        </button>
        {questions.length > 0 && (
          <span className="ml-auto text-sm text-ink-faint">
            第 {index + 1} / {questions.length} 题
          </span>
        )}
      </div>

      {list.loading && <div className="piggy-card h-64 animate-pulse" />}
      {list.error && (
        <div className="piggy-card p-6 text-sm text-rose-600">加载失败：{list.error}</div>
      )}
      {!list.loading && questions.length === 0 && (
        <div className="piggy-card p-10 text-center text-ink-soft">
          这个筛选下还没有题目，换个条件试试～
        </div>
      )}

      {current && (
        <PracticeCard
          key={current.id}
          summary={current}
          hasNext={index < questions.length - 1}
          onNext={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}
          onSkip={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}
        />
      )}
    </div>
  );
}

function PracticeCard({
  summary,
  hasNext,
  onNext,
  onSkip,
}: {
  summary: QuestionSummary;
  hasNext: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const detail = useAsync<Question>(() => api.question(summary.id), [summary.id]);
  const q = detail.data;

  const [notes, setNotes] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const startedAt = useRef(Date.now());

  const [aiLoading, setAiLoading] = useState(false);
  const [ai, setAi] = useState<AiEvaluation | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);

  const reviewWithPiggy = async () => {
    if (!q || !notes.trim()) return;
    setAiLoading(true);
    setAiErr(null);
    try {
      const r = await api.aiEvaluate({ questionId: q.id, answer: notes });
      setAi(r);
      if (score == null) setScore(r.score);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "点评失败，稍后再试");
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    if (!q) return;
    setSaving(true);
    try {
      await api.createAttempt({
        questionId: q.id,
        notes: notes || undefined,
        selfScore: score ?? undefined,
        reflectionMood: (mood as any) ?? undefined,
        timeSpentSec: Math.round((Date.now() - startedAt.current) / 1000),
        aiEvaluation: ai ?? undefined,
      });
      setSaved(true);
      setTimeout(() => onNext(), 350);
    } finally {
      setSaving(false);
    }
  };

  if (detail.loading || !q) return <div className="piggy-card h-64 animate-pulse" />;

  return (
    <div className="space-y-5">
      <h2 className="section-title">我们先做这一题</h2>

      {/* Question card */}
      <article className="piggy-card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className={difficultyChip(q.difficulty)}>{difficultyZh(q.difficulty)}</Tag>
          <Tag className="bg-rose-50 text-ink-soft">{categoryZh(q.category)}</Tag>
          <Tag className="bg-sky-200/50 text-ink">⏱ {q.timeboxMinutes} 分钟</Tag>
          <span className="ml-auto text-xs text-ink-faint">{q.id}</span>
        </div>

        <h3 className="font-question text-xl font-extrabold leading-snug text-ink">{q.title}</h3>

        {/* English content (interview realism) */}
        <p className="question-copy whitespace-pre-wrap">{q.prompt}</p>

        {q.schemaText && (
          <pre className="overflow-x-auto rounded-2xl bg-ink/90 p-4 font-mono text-xs leading-6 text-rose-50">
            <code>{q.schemaText}</code>
          </pre>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {q.tags.map((t) => (
            <Tag key={t} className="bg-rose-50 text-ink-faint">
              {t}
            </Tag>
          ))}
        </div>
      </article>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="mini-title">先把想到的写下来 ✍️</label>
        <textarea
          className="input min-h-[120px] resize-y"
          placeholder="先列要点，再展开结构……结构清楚比文采更重要。"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* AI review */}
      <div className="space-y-3">
        <button
          className="btn-secondary flex w-full items-center justify-center gap-2"
          disabled={aiLoading || !notes.trim()}
          onClick={reviewWithPiggy}
        >
          <img src="/piggy/piggy-avatar.png" alt="" className="h-6 w-6 rounded-full" />
          {aiLoading ? "小猪正在认真读你的回答…" : "让小猪点评我的回答"}
        </button>
        {!notes.trim() && (
          <p className="text-center text-xs text-ink-faint">
            先在上面写下你的思路，小猪就能对照 rubric 给你反馈。
          </p>
        )}
        {aiErr && <div className="piggy-card p-4 text-sm text-rose-600">{aiErr}</div>}
        {ai && <AiCard ai={ai} />}
      </div>

      {/* Reference framework (collapsible) */}
      <Collapsible title="参考思路">
        <Layered label="Reference framework" items={q.expectedFramework} />
        <Layered label="Answer outline" items={q.sampleAnswerOutline} />
      </Collapsible>

      {/* Reveal answer */}
      {!revealed ? (
        <button className="btn-primary w-full" onClick={() => setRevealed(true)}>
          提示答案到这里
        </button>
      ) : (
        <article className="piggy-card space-y-5 p-6">
          {q.whatGoodLooksLike && (
            <Section title="What good looks like">
              <p className="rubric-copy">{q.whatGoodLooksLike}</p>
            </Section>
          )}
          <Section title="Sample strong answer">
            <RichText text={q.sampleStrongAnswer} />
          </Section>
          <Section title="Common mistakes">
            <BulletList items={q.commonMistakes} tone="rose" />
          </Section>
          <Section title="Scoring rubric (0–4)">
            <div className="space-y-1.5">
              {q.scoringRubric.map((b) => (
                <div key={b.band} className="flex gap-2 text-sm">
                  <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full bg-sage-100 px-2 text-xs font-semibold text-sage-500">
                    {b.band}
                  </span>
                  <span className="text-ink-soft">{b.description}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Follow-ups">
            <BulletList items={q.followUps} tone="sky" />
          </Section>
        </article>
      )}

      {/* Reflection */}
      <div className="piggy-card space-y-4 p-6">
        <div className="mini-title">这题现在感觉怎么样？</div>
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm transition ${
                mood === m.id ? "bg-rose-400 text-white shadow-soft" : "bg-rose-50 text-ink-soft hover:bg-rose-100"
              }`}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        <div>
          <div className="mini-title mb-1.5">给自己打个分（对照上面的 rubric）</div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setScore(s)}
                className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                  score === s ? "bg-sage-300 text-white shadow-soft" : "bg-white text-ink-soft ring-1 ring-rose-100 hover:bg-rose-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button className="btn-ghost" onClick={onSkip}>
            跳过
          </button>
          <button className="btn-primary ml-auto" disabled={saving} onClick={submit}>
            {saved ? "已记录 ✓" : saving ? "记录中…" : hasNext ? "记录并下一题 →" : "记录这一题 ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="rounded-full bg-white px-4 py-2 text-sm text-ink shadow-card ring-1 ring-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function updateParam(
  params: URLSearchParams,
  setParams: (p: URLSearchParams) => void,
  key: string,
  value: string,
) {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  setParams(next);
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="piggy-card overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-ink"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <span className="text-ink-faint">{open ? "收起 ▲" : "展开 ▼"}</span>
      </button>
      {open && <div className="space-y-4 border-t border-rose-100/70 px-6 py-4">{children}</div>}
    </div>
  );
}

function Layered({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="eyebrow-title mb-1">{label}</div>
      <BulletList items={items} tone="sage" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow-title mb-2">{title}</div>
      {children}
    </div>
  );
}

function AiCard({ ai }: { ai: AiEvaluation }) {
  const titled = (title: string, tone: "rose" | "sage" | "sky", items: string[]) =>
    items.length > 0 && (
      <div>
        <div className="mini-title mb-1.5">{title}</div>
        <BulletList items={items} tone={tone} />
      </div>
    );

  return (
    <article className="piggy-card space-y-4 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-sage-100 text-sage-500">
          <span className="text-2xl font-bold leading-none">{ai.score}</span>
          <span className="text-[10px]">/ 4</span>
        </div>
        <div>
          <div className="section-title text-[1.35rem]">小猪的点评</div>
          <div className="text-xs text-ink-faint">{ai.bandLabel}</div>
        </div>
      </div>
      <p className="rubric-copy">{ai.summary}</p>
      {titled("做得好的地方", "sage", ai.strengths)}
      {titled("还可以补上的点", "rose", ai.gaps)}
      {titled("注意别踩的坑", "rose", ai.mistakes)}
      {ai.nextStep && (
        <div className="rounded-2xl bg-rose-50/70 p-3 text-sm text-ink">
          <span className="font-medium text-rose-500">下一步 · </span>
          {ai.nextStep}
        </div>
      )}
      {ai.mode === "stub" && (
        <p className="text-[11px] leading-5 text-ink-faint">
          * 当前为本地演示评分（对照 rubric 的要点覆盖度）。在后端 .env 里配置模型 API key
          后会自动切换为更精准的 AI 点评。
        </p>
      )}
    </article>
  );
}

function BulletList({ items, tone }: { items: string[]; tone: "rose" | "sage" | "sky" }) {
  const dot = tone === "rose" ? "bg-rose-300" : tone === "sky" ? "bg-sky-300" : "bg-sage-300";
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 rubric-copy">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
