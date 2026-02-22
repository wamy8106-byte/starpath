"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Menu, X, Sparkles, User } from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  badge?: string;
};

function cx(...arr: Array<string | false | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links: NavLink[] = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pro", label: "Pro", badge: "Soon" }, // 先占位
    ],
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050510]/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white/90 hover:text-white transition"
          onClick={() => setOpen(false)}
        >
          <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-300" />
          </span>
          <span className="font-semibold tracking-tight">StarPath</span>
          <span className="hidden sm:inline text-[10px] font-mono tracking-widest text-white/40 uppercase">
            AI Reading
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "px-3 py-2 rounded-full text-sm border transition",
                  active
                    ? "text-white border-white/20 bg-white/10"
                    : "text-white/70 border-white/10 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {l.label}
                  {l.badge ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-200 bg-purple-500/10">
                      {l.badge}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-3 py-2 rounded-full text-sm border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition inline-flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Login
          </Link>

          <Link
            href="/pricing"
            className="px-4 py-2 rounded-full text-sm font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-100 hover:bg-purple-500/15 transition"
          >
            Upgrade
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div className="md:hidden border-t border-white/10 bg-[#050510]/90">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cx(
                    "px-4 py-3 rounded-2xl border transition flex items-center justify-between",
                    active
                      ? "text-white border-white/20 bg-white/10"
                      : "text-white/80 border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <span>{l.label}</span>
                  {l.badge ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-200 bg-purple-500/10">
                      {l.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-white/10 flex gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition text-center"
              >
                Login
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-100 hover:bg-purple-500/15 transition text-center font-semibold"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}