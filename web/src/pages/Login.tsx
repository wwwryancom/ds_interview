import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { PIGGY, PiggyArt } from "../components/Mascot";
import { useAsync } from "../hooks/useApi";

export function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const auth = useAsync(() => api.authStatus(), []);
  const [username, setUsername] = useState("piggy");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const next = params.get("next") || "/";

  useEffect(() => {
    if (auth.data?.username) setUsername(auth.data.username);
  }, [auth.data?.username]);

  useEffect(() => {
    if (auth.data && (!auth.data.enabled || auth.data.authenticated)) {
      nav(next, { replace: true });
    }
  }, [auth.data, nav, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.login({ username, password });
      window.location.assign(next);
    } catch (err) {
      setError("用户名或密码不对，再试一下。");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(217,127,146,0.22),transparent_58%)]" />
      <div className="absolute -left-10 top-16 h-44 w-44 rounded-full bg-rose-100/60 blur-3xl" />
      <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-sage-100/70 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="piggy-card overflow-hidden p-7 sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink-soft ring-1 ring-rose-100">
            <span>私密入口</span>
            <span className="text-rose-400">只给小猪本人</span>
          </div>

          <div className="mt-5 space-y-3">
            <h1 className="page-title">先轻轻登录一下，我们就进去练题</h1>
            <p className="soft-copy max-w-xl">
              这个小空间是专门为她准备的，所以入口也想做得温柔一点。进去之后，所有进度和记录都会留在里面。
            </p>
          </div>

          <div className="mt-8 rounded-[1.6rem] bg-rose-50/80 p-5 ring-1 ring-rose-100/70">
            <div className="eyebrow-title">为什么不是系统弹窗</div>
            <div className="mt-2 question-copy text-[15px] leading-7 text-ink-soft">
              因为原生弹窗实在太不小猪了。现在这个登录页会跟主站保持同一套字体、颜色和情绪。
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["温柔一点", "不是冷冰冰的后台工具"],
              ["私密一点", "只有账号密码能进去"],
              ["安心一点", "进度都保存在你的专属空间"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-rose-100/70">
                <div className="mini-title">{title}</div>
                <div className="mt-1 text-sm leading-6 text-ink-faint">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="piggy-card p-6 sm:p-7">
          <PiggyArt src={PIGGY.reading} className="mx-auto h-40 w-full max-w-[18rem]" />

          <div className="mt-3 text-center">
            <div className="section-title text-[1.7rem]">欢迎回来，小猪</div>
            <p className="mt-2 text-sm leading-6 text-ink-faint">
              不用一口气准备完全部。先进去，练一题，也算今天有在往前走。
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <div className="mini-title mb-2">用户名</div>
              <input
                className="input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="mini-title mb-2">密码</div>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="输入你们的专属密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-100">
                {error}
              </div>
            ) : null}

            <button className="btn-primary w-full justify-center py-3 text-base" disabled={submitting || auth.loading}>
              {submitting ? "小猪正在开门..." : "进入小猪练习室"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
