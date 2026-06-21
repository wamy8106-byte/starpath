"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight, BadgeCheck } from "lucide-react";

export function ProgramPreviewCard({
  sign,
}: {
  sign: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      {/* subtle glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-[10px] font-mono tracking-widest text-purple-200 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Optional 7-Day Program
          </div>

          <h3 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
            Turn today’s edge into a 7-day practice
          </h3>
          <p className="mt-2 text-white/70 max-w-2xl">
            Start with Day 1 as a free preview. A one-time purchase unlocks six more
            focused <span className="text-white/90 font-semibold">Personal Edge</span>{" "}
            practices built for your sign.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-white/60">
          <Lock className="h-4 w-4" />
          <span className="text-xs font-mono tracking-widest uppercase">Locked</span>
        </div>
      </div>

      {/* preview rows */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <PreviewItem
          title="Day 1 Preview"
          desc={`A focused, ${sign}-tuned behavioral edge you can try before paying.`}
        />
        <PreviewItem
          title="Days 2–4"
          desc="Three more concrete constraints for clearer choices and communication."
        />
        <PreviewItem
          title="Days 5–7"
          desc="Complete the full sequence with three additional behavioral practices."
        />
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 text-white/60">
          <BadgeCheck className="h-4 w-4 text-purple-300" />
          <span className="text-sm">
            One-time purchase: <span className="text-white/80">unlock Days 2–7</span>
          </span>
        </div>

        <Link
          href="/program"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 text-sm font-semibold text-purple-100 hover:bg-purple-500/15 transition"
        >
          Start Your 7-Day Program <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function PreviewItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-mono tracking-widest uppercase text-white/50">
        {title}
      </div>
      <div className="mt-2 text-white/80 leading-relaxed">
        {/* blurred text effect */}
        <span className="select-none blur-[2px] opacity-80">{desc}</span>
      </div>
    </div>
  );
}
