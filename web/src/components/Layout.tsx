import { NavLink, Outlet } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { Mascot } from "./Mascot";

const links = [
  { to: "/", label: "首页", end: true },
  { to: "/practice", label: "练习" },
  { to: "/mock", label: "Mock" },
  { to: "/progress", label: "进度" },
];

export function Layout() {
  const auth = useAsync(() => api.authStatus(), []);

  function onLogout() {
    window.location.assign("/logout");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-rose-100/70 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Mascot size={36} />
            <div className="leading-tight">
              <div className="font-display text-2xl leading-none text-ink">小猪</div>
              <div className="mt-0.5 text-[11px] font-semibold text-ink-faint">陪你准备 DS 面试</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      isActive ? "bg-rose-400 text-white shadow-soft" : "font-semibold text-ink-soft hover:bg-rose-50"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            {auth.data?.enabled ? (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={onLogout}>
                退出
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-5 pb-10 pt-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { emoji: "🐷", title: "呼噜一下", desc: "今天也算打卡" },
            { emoji: "🍓", title: "慢慢拱题", desc: "不急也没关系" },
            { emoji: "💤", title: "累了就歇", desc: "小猪不催进度" },
            { emoji: "💗", title: "专属小窝", desc: "记录都会留着" },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-2xl bg-white/75 px-3 py-3 text-center ring-1 ring-rose-100/70"
            >
              <div className="text-xl">{v.emoji}</div>
              <div className="mt-1 text-sm font-semibold text-ink">{v.title}</div>
              <div className="mt-1 text-xs text-ink-faint">{v.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-sm text-ink-faint">
          ૮ ˶ᵔ ᵕ ᵔ˶ ა  🐽  (oink oink)
        </div>
      </footer>
    </div>
  );
}
