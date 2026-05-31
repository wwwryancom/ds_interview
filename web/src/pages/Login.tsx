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
            <span>🐷 小猪入口</span>
            <span className="text-rose-400">敲敲门</span>
          </div>

          <div className="mt-5">
            <h1 className="page-title">哼唧一下，进去练题</h1>
          </div>

          <div className="mt-8 rounded-[1.8rem] bg-rose-50/80 p-5 ring-1 ring-rose-100/70">
            <div className="flex flex-wrap gap-2">
              {[
                "🐽 呼噜通过",
                "🔐 专属入口",
                "💾 自动记住",
                "🍓 练一点点",
              ].map((sticker) => (
                <span
                  key={sticker}
                  className="rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-ink-soft ring-1 ring-rose-100/80"
                >
                  {sticker}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["🐷", "拱一下"],
              ["💗", "记住啦"],
              ["🌷", "慢慢来"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-rose-100/70">
                <div className="text-2xl">{title}</div>
                <div className="mt-2 text-sm leading-6 text-ink-soft">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="piggy-card p-6 sm:p-7">
          <PiggyArt src={PIGGY.reading} className="mx-auto h-40 w-full max-w-[18rem]" />

          <div className="mt-3 text-center">
            <div className="section-title text-[1.7rem]">回来啦，小猪</div>
            <p className="mt-2 text-sm leading-6 text-ink-faint">练一题就好。</p>
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
                placeholder="专属密码"
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
