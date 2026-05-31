import { NavLink, Outlet } from "react-router-dom";
import { Mascot } from "./Mascot";

const links = [
  { to: "/", label: "首页", end: true },
  { to: "/practice", label: "练习" },
  { to: "/mock", label: "Mock" },
  { to: "/progress", label: "进度" },
];

export function Layout() {
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
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-5 pb-10 pt-2">
        <div className="grid grid-cols-2 gap-3 text-xs text-ink-soft sm:grid-cols-4">
          {[
            { emoji: "🔒", title: "完全私密", desc: "只有你能看到" },
            { emoji: "💛", title: "温柔陪伴", desc: "不评判，只支持" },
            { emoji: "🌱", title: "专注成长", desc: "每天进步一点点" },
            { emoji: "🌙", title: "为你定制", desc: "专属你的练习空间" },
          ].map((v) => (
            <div key={v.title} className="flex items-center gap-2">
              <span className="text-base">{v.emoji}</span>
              <span>
                <span className="font-medium text-ink">{v.title}</span>
                <span className="ml-1 text-ink-faint">{v.desc}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-xs text-ink-faint">
          小步前进，明天继续就好 — 小猪
        </div>
      </footer>
    </div>
  );
}
