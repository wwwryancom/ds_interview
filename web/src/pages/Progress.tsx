import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { PIGGY, PiggyArt } from "../components/Mascot";
import { categoryZh, formatDuration, moods, ProgressBar, weaknessZh } from "../lib/ui";

export function Progress() {
  const nav = useNavigate();
  const progress = useAsync(() => api.progress(), []);
  const activity = useAsync(() => api.recentActivity(), []);
  const review = useAsync(() => api.reviewQueue(), []);

  const o = progress.data?.overview;
  const moodLabel = (id?: string | null) => moods.find((m) => m.id === id)?.label ?? "";

  return (
    <div className="space-y-7">
      {/* Header */}
      <section className="piggy-card flex items-center justify-between gap-6 overflow-hidden bg-gradient-to-br from-sage-50/70 via-white/70 to-rose-50/60 p-7">
        <div className="space-y-2">
          <h1 className="page-title text-3xl sm:text-3xl">这些都是你已经做过的努力</h1>
          <p className="soft-copy">你不是在原地，你一直在往前走。</p>
        </div>
        <PiggyArt src={PIGGY.growth} className="hidden h-32 w-44 shrink-0 sm:block" />
      </section>

      {/* Overview */}
      <section className="piggy-card p-6">
        <h2 className="section-title mb-4 text-[1.6rem]">这段时间的练习</h2>
        {o ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat emoji="⏱" label="练习时长" value={formatDuration(o.studySeconds)} />
            <Stat emoji="📘" label="完成题目" value={`${o.questionsSolved}`} sub={`共 ${o.totalQuestions} 题`} />
            <Stat emoji="🎤" label="Mock 轮数" value={`${o.mockInterviews}`} />
            <Stat emoji="🌟" label="平均 rubric" value={`${o.avgScorePct}%`} sub={`${o.avgScore.toFixed(1)} / 4`} />
          </div>
        ) : (
          <div className="text-sm text-ink-faint">加载中…</div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Skill breakdown */}
        <section className="piggy-card p-6">
          <h2 className="section-title mb-4 text-[1.6rem]">各模块掌握度</h2>
          {progress.data && progress.data.skillBreakdown.length === 0 && (
            <p className="text-sm text-ink-faint">先练几题，这里就会长出你的能力图谱。</p>
          )}
          <div className="space-y-3">
            {progress.data?.skillBreakdown.map((s) => (
              <div key={s.weaknessTag}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{weaknessZh(s.weaknessTag)}</span>
                  <span className="text-ink-faint">{s.masteryPct}%</span>
                </div>
                <ProgressBar pct={s.masteryPct} tone={s.masteryPct < 60 ? "rose" : "sage"} />
              </div>
            ))}
          </div>
        </section>

        {/* Weak areas */}
        <section className="piggy-card p-6">
          <h2 className="section-title mb-4 text-[1.6rem]">接下来值得再练一点的地方</h2>
          {progress.data && progress.data.weakAreas.length === 0 ? (
            <p className="text-sm text-ink-faint">还没有明显的薄弱项，继续保持～</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {progress.data?.weakAreas.map((w) => (
                <div key={w.weaknessTag} className="rounded-2xl bg-rose-50 px-3 py-2">
                  <div className="text-sm font-medium text-rose-600">{weaknessZh(w.weaknessTag)}</div>
                  <div className="text-[11px] text-ink-faint">掌握度约 {w.masteryPct}%</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Next: review queue */}
      <section className="piggy-card p-6">
        <h2 className="section-title mb-1 text-[1.6rem]">下一步只做这一个</h2>
        <p className="mb-4 text-sm text-ink-faint">从需要再巩固的题里，挑一题就好。</p>
        {review.data && review.data.due.length + review.data.upcoming.length === 0 && (
          <p className="text-sm text-ink-faint">复习队列是空的，做几题、给自己打个分就会出现。</p>
        )}
        <div className="space-y-2">
          {(review.data?.due.length ? review.data.due : review.data?.upcoming ?? [])
            .slice(0, 4)
            .map((r) => (
              <div
                key={r.questionId}
                className="flex items-center gap-3 rounded-2xl bg-rose-50/70 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{r.question.title}</div>
                  <div className="text-[11px] text-ink-faint">
                    {categoryZh(r.question.category)} · 间隔 {r.intervalDays} 天
                  </div>
                </div>
                <button
                  className="btn-primary shrink-0 px-4 py-2 text-xs"
                  onClick={() => nav(`/practice?category=${r.question.category}&questionId=${r.questionId}`)}
                >
                  去练这题
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="piggy-card p-6">
        <h2 className="section-title mb-4 text-[1.6rem]">最近的练习记录</h2>
        {activity.data && activity.data.events.length === 0 && (
          <p className="text-sm text-ink-faint">还没有记录，去练一题吧～</p>
        )}
        <div className="divide-y divide-rose-100/70">
          {activity.data?.events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <span className="text-lg">{e.type === "mock" ? "🎤" : "📘"}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-ink">{e.title}</div>
                <div className="text-[11px] text-ink-faint">
                  {e.type === "mock" ? "Mock" : categoryZh(e.category ?? "")} · {relTime(e.at)}
                </div>
              </div>
              <span className="shrink-0 text-xs text-ink-faint">
                {e.type === "mock"
                  ? moodLabel(e.overallRating)
                  : e.selfScore != null
                    ? `${e.selfScore} / 4`
                    : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm text-ink-faint">
        你已经很努力了，我为你骄傲，我们明天继续就好～
      </p>
    </div>
  );
}

function Stat({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-xs text-ink-faint">{emoji} {label}</div>
      <div className="mt-0.5 text-2xl font-bold text-ink">{value}</div>
      {sub && <div className="text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}
