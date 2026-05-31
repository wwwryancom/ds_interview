import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { Mascot, PIGGY, PiggyArt } from "../components/Mascot";
import { RichText } from "../components/RichText";
import { categoryZh, difficultyChip, difficultyZh, mmss, moods, Tag } from "../lib/ui";
import type { AiFollowUp, Mood, MockSession } from "../api/types";

type Phase = "setup" | "running" | "done";

const STRUCTURE = [
  { step: "澄清", desc: "我们想要确认题目要解决的是什么。" },
  { step: "拆解", desc: "把问题拆成几个可以分析的部分。" },
  { step: "应用", desc: "用方法/指标/实验把它落到具体。" },
  { step: "举例", desc: "用一个例子把思路讲清楚。" },
  { step: "收尾", desc: "给出建议，并说明不确定性。" },
];

export function Mock() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<MockSession | null>(null);

  if (phase === "setup")
    return (
      <Setup
        onStart={(s) => {
          setSession(s);
          setPhase("running");
        }}
      />
    );
  if (phase === "running" && session)
    return <Running session={session} onDone={() => setPhase("done")} />;
  return <Done onRestart={() => { setSession(null); setPhase("setup"); }} />;
}

function Setup({ onStart }: { onStart: (s: MockSession) => void }) {
  const taxonomy = useAsync(() => api.taxonomy(), []);
  const [interviewType, setInterviewType] = useState<"mixed" | "technical" | "behavioral">("mixed");
  const [focus, setFocus] = useState<string[]>([]);
  const [durationMin, setDurationMin] = useState(45);
  const [numQuestions, setNumQuestions] = useState(3);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const start = async () => {
    setLoading(true);
    try {
      const s = await api.createMock({
        interviewType,
        focusAreas: focus,
        durationMin,
        numQuestions,
        level: "Senior",
      });
      onStart(s);
    } finally {
      setLoading(false);
    }
  };

  const types: { id: typeof interviewType; label: string }[] = [
    { id: "mixed", label: "混合" },
    { id: "technical", label: "技术" },
    { id: "behavioral", label: "行为" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">来做一轮安静的练习</h2>
        <Mascot size={48} />
      </div>
      <p className="soft-copy">这一段不评分也没关系，我们先把节奏找回来。</p>

      <div className="piggy-card space-y-5 p-6">
        <Field label="面试类型">
          <div className="flex gap-2">
            {types.map((t) => (
              <Chip key={t.id} active={interviewType === t.id} onClick={() => setInterviewType(t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="重点模块（不选＝全部）">
          <div className="flex flex-wrap gap-2">
            {(taxonomy.data?.categories ?? []).map((c) => (
              <Chip key={c.id} active={focus.includes(c.id)} onClick={() => toggle(c.id)}>
                {categoryZh(c.id, c.label)}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="时长">
            <select
              className="input"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            >
              {[15, 30, 45, 60].map((d) => (
                <option key={d} value={d}>
                  {d} 分钟
                </option>
              ))}
            </select>
          </Field>
          <Field label="题目数">
            <select
              className="input"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} 题
                </option>
              ))}
            </select>
          </Field>
        </div>

        <button className="btn-primary w-full" disabled={loading} onClick={start}>
          {loading ? "准备中…" : "开始这一轮 →"}
        </button>
      </div>
    </div>
  );
}

function Running({ session, onDone }: { session: MockSession; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [remaining, setRemaining] = useState(session.durationMin * 60);
  const [finishing, setFinishing] = useState(false);
  const [rating, setRating] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [followUps, setFollowUps] = useState<AiFollowUp[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [fuLoading, setFuLoading] = useState(false);
  const itemStart = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    itemStart.current = Date.now();
    setFollowUps([]);
  }, [index]);

  const items = session.items;
  const item = items[index];

  const persistScore = async (score: number) => {
    setScores((s) => ({ ...s, [item.itemId]: score }));
    await api.scoreMockItem(session.id, item.itemId, {
      answer: answers[item.itemId] || undefined,
      selfScore: score,
      timeSpentSec: Math.round((Date.now() - itemStart.current) / 1000),
    });
  };

  const persistAnswer = async () => {
    if (!item) return;
    await api.scoreMockItem(session.id, item.itemId, {
      answer: answers[item.itemId] || undefined,
      selfScore: scores[item.itemId],
      timeSpentSec: Math.round((Date.now() - itemStart.current) / 1000),
    });
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await api.finishMock(session.id, { overallRating: (rating as Mood) ?? undefined });
      onDone();
    } finally {
      setFinishing(false);
    }
  };

  const askFollowUp = async () => {
    if (!item) return;
    setFuLoading(true);
    try {
      const r = await api.aiFollowUp({
        questionId: item.question.id,
        answer: answers[item.itemId] ?? "",
        askedSoFar: followUps.map((f) => f.question),
      });
      setFollowUps((prev) => [...prev, r]);
    } finally {
      setFuLoading(false);
    }
  };

  if (!item) return null;
  const q = item.question;
  const low = remaining < 60;

  return (
    <div className="space-y-5">
      {/* Top bar: timer + progress */}
      <div className="flex items-center justify-between">
        <button className="text-sm text-ink-faint hover:underline" onClick={() => setShowRating(true)}>
          ✕ 结束
        </button>
        <Tag className="bg-rose-50 text-ink-soft">Mock 进行中</Tag>
        <span className="text-sm text-ink-faint">
          第 {index + 1} / {items.length} 题
        </span>
      </div>

      <div className="piggy-card flex flex-col items-center gap-1 p-6">
        <div className="text-xs text-ink-faint">剩余时间</div>
        <div className={`font-display text-5xl tabular-nums ${low ? "text-rose-500" : "text-ink"}`}>
          {mmss(remaining)}
        </div>
      </div>

      {/* Question (English content) */}
      <article className="piggy-card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className={difficultyChip(q.difficulty)}>{difficultyZh(q.difficulty)}</Tag>
          <Tag className="bg-rose-50 text-ink-soft">{categoryZh(q.category)}</Tag>
          <span className="ml-auto text-xs text-ink-faint">{q.id}</span>
        </div>
        <h3 className="font-question text-xl font-extrabold leading-snug text-ink">{q.title}</h3>
        <p className="question-copy whitespace-pre-wrap">{q.prompt}</p>
        {q.schemaText && (
          <pre className="overflow-x-auto rounded-2xl bg-ink/90 p-4 font-mono text-xs leading-6 text-rose-50">
            <code>{q.schemaText}</code>
          </pre>
        )}
      </article>

      {/* Structure helper */}
      <div className="piggy-card p-5">
        <div className="mini-title mb-3">结构提示</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {STRUCTURE.map((s, i) => (
            <div key={s.step} className="rounded-2xl bg-rose-50 p-3 text-center">
              <div className="text-sm font-semibold text-rose-600">
                {i + 1}. {s.step}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-ink-faint">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="mini-title">把刚才讲的要点记一下</label>
        <textarea
          className="input min-h-[110px] resize-y"
          placeholder="不用写成作文，先记主线、指标、取舍和结论。小猪会按这里的内容追问。"
          value={answers[item.itemId] ?? ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [item.itemId]: e.target.value }))}
          onBlur={persistAnswer}
        />
      </div>

      {/* Self-score for this item */}
      <div className="piggy-card space-y-3 p-5">
        <div className="mini-title">这一题给自己打个分</div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => persistScore(s)}
              className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                scores[item.itemId] === s
                  ? "bg-sage-300 text-white shadow-soft"
                  : "bg-white text-ink-soft ring-1 ring-rose-100 hover:bg-rose-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Collapsible title="看看参考答案（练完再看更好）">
          <RichText text={q.sampleStrongAnswer} />
        </Collapsible>
      </div>

      {/* Dynamic follow-ups */}
      <div className="piggy-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="mini-title">小猪的追问</div>
          <button
            className="text-xs text-rose-500 hover:underline disabled:opacity-50"
            disabled={fuLoading}
            onClick={askFollowUp}
          >
            {fuLoading ? "想一个…" : "让小猪追问一个 +"}
          </button>
        </div>
        {followUps.length === 0 ? (
          <p className="text-xs text-ink-faint">答完后让小猪像面试官一样追问，练习临场应变。</p>
        ) : (
          <ol className="space-y-2">
            {followUps.map((f, i) => (
              <li key={i} className="rounded-2xl bg-rose-50/70 p-3">
                <div className="rubric-copy text-ink">
                  {i + 1}. {f.question}
                </div>
                {f.rationale && <div className="mt-1 text-[11px] text-ink-faint">{f.rationale}</div>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3">
        <button
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          ← 上一题
        </button>
        {index < items.length - 1 ? (
          <button className="btn-primary ml-auto" onClick={() => setIndex((i) => i + 1)}>
            下一题 →
          </button>
        ) : (
          <button className="btn-primary ml-auto" onClick={() => setShowRating(true)}>
            结束并复盘
          </button>
        )}
      </div>

      {/* Rating modal */}
      {showRating && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/30 p-4">
          <div className="piggy-card w-full max-w-md space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Mascot size={44} />
              <div>
                <div className="section-title text-[1.45rem]">刚才感觉怎么样？</div>
                <div className="text-xs text-ink-faint">练完就是进步，结果先放一边。</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setRating(m.id)}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm transition ${
                    rating === m.id ? "bg-rose-400 text-white shadow-soft" : "bg-rose-50 text-ink-soft hover:bg-rose-100"
                  }`}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-ghost" onClick={() => setShowRating(false)}>
                再想想
              </button>
              <button className="btn-primary ml-auto" disabled={finishing} onClick={finish}>
                {finishing ? "保存中…" : "完成这一轮"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Done({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="piggy-card flex flex-col items-center gap-4 p-10 text-center">
      <PiggyArt src={PIGGY.mock} className="h-40 w-56" />
      <h2 className="section-title">这一轮完成啦，辛苦了</h2>
      <p className="soft-copy max-w-sm">
        你又往前走了一点。要不要看看进度，或者再来一轮？
      </p>
      <div className="flex gap-3">
        <a className="btn-ghost" href="/progress">
          看看进度
        </a>
        <button className="btn-primary" onClick={onRestart}>
          再来一轮
        </button>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="mini-title">{label}</label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        active ? "bg-rose-400 text-white shadow-soft" : "bg-white text-ink-soft ring-1 ring-rose-100 hover:bg-rose-50"
      }`}
    >
      {children}
    </button>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="text-sm font-medium text-rose-500 hover:underline" onClick={() => setOpen((o) => !o)}>
        {open ? "收起参考答案 ▲" : title + " ▼"}
      </button>
      {open && <div className="mt-3 border-t border-rose-100/70 pt-3">{children}</div>}
    </div>
  );
}
