import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { PIGGY, PiggyArt } from "../components/Mascot";
import { categoryMeta, categoryZh, categoryBlurb, ProgressBar } from "../lib/ui";

export function Home() {
  const nav = useNavigate();
  const taxonomy = useAsync(() => api.taxonomy(), []);
  const progress = useAsync(() => api.progress(), []);

  const quickStart = [
    { emoji: "↩️", title: "继续刚刚那一题", desc: "接着上次的节奏", action: () => nav("/practice") },
    { emoji: "🎲", title: "随机练习", desc: "随便来一题", action: () => nav("/practice?random=1") },
    { emoji: "📚", title: "选一个主题", desc: "深入练一个方向", action: () => nav("/practice") },
    { emoji: "🎤", title: "来一轮 Mock", desc: "计时、拟真", action: () => nav("/mock") },
  ];

  const o = progress.data?.overview;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="piggy-card relative flex items-center justify-between gap-6 overflow-hidden bg-gradient-to-br from-rose-50/80 via-white/70 to-sage-50/60 p-8">
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-rose-500 ring-1 ring-rose-100">
            🌸 小猪陪练 · 完全私密
          </span>
          <h1 className="page-title">今天先练一题就好</h1>
          <p className="soft-copy max-w-md">
            不需要一次准备完全部，我们先把今天一点做好。这是我专门为你做的 DS 面试准备小空间。
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button className="btn-primary" onClick={() => nav("/practice")}>
              先亮一题 →
            </button>
            <button className="btn-secondary" onClick={() => nav("/mock")}>
              开始这一轮
            </button>
          </div>
        </div>
        <PiggyArt
          src={PIGGY.reading}
          className="hidden h-44 w-44 shrink-0 drop-shadow-sm sm:block lg:h-52 lg:w-52"
        />
      </section>

      {/* Quick start */}
      <section className="space-y-3">
        <h2 className="section-title text-[1.6rem]">快速开始</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickStart.map((q) => (
            <button
              key={q.title}
              onClick={q.action}
              className="piggy-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="text-2xl">{q.emoji}</div>
              <div className="mt-2 text-[15px] font-bold text-ink">{q.title}</div>
              <div className="text-xs font-medium text-ink-faint">{q.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Practice areas */}
      <section className="space-y-3">
        <h2 className="section-title text-[1.6rem]">练习模块</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {taxonomy.loading && <div className="piggy-card h-20 animate-pulse" />}
          {taxonomy.data?.categories.map((c) => {
            const meta = categoryMeta[c.id] ?? { emoji: "✨", tint: "bg-rose-50 text-ink" };
            return (
              <button
                key={c.id}
                onClick={() => nav(`/practice?category=${c.id}`)}
                className="piggy-card flex items-start gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${meta.tint}`}>
                  {meta.emoji}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-ink">{categoryZh(c.id, c.label)}</div>
                  <div className="mt-0.5 text-xs font-medium leading-5 text-ink-faint">{categoryBlurb(c.id, c.blurb)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Progress mini */}
      <section className="piggy-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title text-[1.6rem]">你的进度</h2>
          <button className="text-sm text-rose-500 hover:underline" onClick={() => nav("/progress")}>
            查看完整进度 →
          </button>
        </div>
        {o ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="平均 rubric" value={`${o.avgScorePct}%`} sub={`${o.avgScore.toFixed(1)} / 4`} />
            <Stat label="完成题目" value={`${o.questionsSolved}`} sub={`共 ${o.totalQuestions} 题`} />
            <Stat label="Mock 轮数" value={`${o.mockInterviews}`} />
            <Stat label="连续天数" value={`${o.streakDays}`} sub="天" />
          </div>
        ) : (
          <div className="text-sm text-ink-faint">加载中…</div>
        )}
        {o && (
          <div className="mt-4">
            <ProgressBar pct={o.avgScorePct} tone="sage" />
          </div>
        )}
      </section>

      <p className="text-center text-sm text-ink-faint">
        在这里慢慢练，今天做一点也很好。
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="mini-title text-xs">{label}</div>
      {sub && <div className="text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}
