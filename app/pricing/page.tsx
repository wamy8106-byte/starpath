"use client";

import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    sub: "Good for daily curiosity",
    highlight: false,
    features: [
      "Daily reading (theme + 3 micro blocks)",
      "Career/Love/Luck scores + advice",
      "Personal Edge (basic rotation)",
    ],
    cta: "Continue Free",
    href: "/",
  },
  {
    name: "7-Day Personal Edge Program",
    price: "$9.99",
    priceNote: "one-time",
    sub: "A focused behavioral program built from your zodiac",
    highlight: true,
    features: [
      "Day 1 available as a free preview",
      "Payment unlocks Days 2–7",
      "Seven specific behavioral edges",
      "Private program link",
      "No account required",
    ],
    cta: "Start Your 7-Day Program",
    href: "/program",
  },
];

const valueBullets = [
  {
    title: "Personal Edge = the main character",
    desc: "Not generic horoscope lines—it's a targeted “action subtraction” for your day.",
  },
  {
    title: "Less repetition, more precision",
    desc: "We track what you’ve seen today, so the system avoids looping patterns.",
  },
  {
    title: "Built for trust",
    desc: "No morning/noon/night ambiguity. Same-day reading stays consistent globally.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans selection:bg-purple-500/30 pb-24">
      {/* background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stars
        </Link>

        {/* header */}
        <header className="text-center mb-14 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest text-slate-400 uppercase">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>StarPath Personal Edge Program</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            Go beyond today’s reading
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            Keep the daily horoscope free, or choose a one-time 7-day program for a deeper behavioral reset.
          </p>
        </header>

        {/* value bullets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {valueBullets.map((b) => (
            <div
              key={b.title}
              className="rounded-3xl bg-white/5 border border-white/10 p-6"
            >
              <div className="text-sm font-semibold text-white/90 mb-2">
                {b.title}
              </div>
              <div className="text-sm text-slate-400 leading-relaxed">
                {b.desc}
              </div>
            </div>
          ))}
        </section>

        {/* tiers */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={[
                "rounded-3xl p-[1px] overflow-hidden",
                t.highlight
                  ? "bg-gradient-to-r from-purple-600/70 via-fuchsia-500/50 to-blue-600/70"
                  : "bg-white/10",
              ].join(" ")}
            >
              <div
                className={[
                  "rounded-3xl p-8 h-full border border-white/10 bg-[#0b0b1a]/70",
                  t.highlight ? "shadow-[0_0_60px_rgba(168,85,247,0.18)]" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-xl font-bold">{t.name}</div>
                    <div className="text-sm text-slate-400 mt-1">{t.sub}</div>
                  </div>

                </div>

                <div className="flex items-end gap-2 mb-6">
                  <div className="text-4xl font-black tracking-tight">
                    {t.price}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">
                    {t.priceNote ?? "free"}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-slate-200">
                      <Check className="w-5 h-5 text-purple-300 mt-0.5" />
                      <span className="text-sm leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={t.href}
                  className={[
                    "block w-full text-center rounded-2xl py-3 text-sm font-semibold transition",
                    t.highlight
                      ? "bg-purple-600/90 hover:bg-purple-600 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]"
                      : "bg-white/5 border border-white/10 hover:bg-white/10",
                  ].join(" ")}
                >
                  {t.cta}
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* footer note */}
        <div className="mt-14 text-center text-xs text-slate-500">
          One purchase unlocks the complete program. Your daily horoscope remains free.
        </div>
      </main>
    </div>
  );
}
