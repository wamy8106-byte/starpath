'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, Briefcase, Star, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

type Section = {
  score: number;
  message: string;
  advice: string;
};

type MicroInsight = {
  daily_focus?: string;
  caution?: string;
  luck_signals?: string;
};

type HoroscopeData = {
  theme?: string;
  micro_insight?: MicroInsight;
  personal_edge?: string;

  career?: Section;
  love?: Section;
  luck?: Section;

  affirmation?: string;
  error?: string;
};

function isMeaningful(value?: string) {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  if (v === '—' || v === '-' || v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined') return false;
  return true;
}

export default function ZodiacDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next 16 / React 19：params 是 Promise，要用 use() 解包
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);

  const [data, setData] = useState<HoroscopeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAIReading() {
      setLoading(true);
      try {
        const res = await fetch(`/api/horoscope?sign=${slug}`, { cache: 'no-store' });
        const result: HoroscopeData = await res.json();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error(err);
        if (!cancelled) setData({ error: 'Fetch failed' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAIReading();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const career = data?.career;
  const love = data?.love;
  const luck = data?.luck;

  // ✅ Micro blocks values (safe fallbacks)
  const dailyFocus = data?.micro_insight?.daily_focus ?? '—';
  const caution = data?.micro_insight?.caution ?? '—';
  const luckSignals = data?.micro_insight?.luck_signals ?? '—';

  // ✅ D2: hide if empty/meaningless
  const personalEdge = data?.personal_edge ?? '';
  const showPersonalEdge = useMemo(() => isMeaningful(personalEdge), [personalEdge]);

  // ✅ If we hide Personal Edge, switch grid cols automatically
  const microGridCols = showPersonalEdge ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="flex items-center text-gray-400 hover:text-white transition gap-2 mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Stars
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <span className="text-5xl font-bold">{sign[0]}</span>
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-6xl font-bold mb-2 tracking-tighter">{sign}</h1>
            <p className="text-purple-400 font-medium tracking-[0.3em] uppercase text-sm">
              Daily Cosmic Reading
            </p>

            {data?.theme ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                <span className="text-gray-400 tracking-widest text-xs uppercase">Theme</span>
                <span className="text-white/90">•</span>
                <span className="font-medium">{data.theme}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center py-20 text-purple-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="animate-pulse tracking-widest">DECODING THE UNIVERSE...</p>
          </div>
        ) : data?.error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-2xl">
            {data.error}
          </div>
        ) : (
          <>
            {/* Top micro blocks */}
            <div className={`grid grid-cols-1 ${microGridCols} gap-4 mb-8`}>
              <MiniBlock label="Daily Focus" value={dailyFocus} />
              <MiniBlock label="Caution" value={caution} />
              <MiniBlock label="Luck Signals" value={luckSignals} />

              {/* ✅ D1 + D2: highlighted block + hidden if empty */}
              {showPersonalEdge ? <PersonalEdgeBlock value={personalEdge.trim()} /> : null}
            </div>

            {/* Main cards */}
            <div className="grid gap-6">
              <InsightCard
                icon={<Briefcase className="text-blue-400" />}
                title="Career"
                score={career?.score ?? 0}
                message={career?.message ?? 'No reading yet.'}
                advice={career?.advice ?? ''}
              />
              <InsightCard
                icon={<Heart className="text-pink-400" />}
                title="Love"
                score={love?.score ?? 0}
                message={love?.message ?? 'No reading yet.'}
                advice={love?.advice ?? ''}
              />
              <InsightCard
                icon={<Star className="text-yellow-400" />}
                title="Luck"
                score={luck?.score ?? 0}
                message={luck?.message ?? 'No reading yet.'}
                advice={luck?.advice ?? ''}
              />
            </div>

            {/* Affirmation */}
            <div className="mt-8 bg-gradient-to-r from-purple-500/15 to-pink-500/10 border border-white/10 rounded-3xl p-6">
              <div className="text-xs tracking-[0.3em] uppercase text-white/50 mb-2">
                Affirmation
              </div>
              <div className="text-gray-200 italic">“{data?.affirmation || '—'}”</div>
            </div>
          </>
        )}

        <div className="mt-14 pt-8 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm">
            Want to go deeper? Unlock Love & Career rituals in Pro.
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="text-xs tracking-[0.3em] uppercase text-white/40 mb-1">{label}</div>
      <div className="text-white/90 font-medium">{value}</div>
    </div>
  );
}

/** ✅ D1: Personal Edge special styling */
function PersonalEdgeBlock({ value }: { value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-[1px]">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/70 via-pink-500/50 to-purple-500/70 opacity-80" />
      <div className="relative bg-[#0b0b1a]/70 border border-white/10 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.18)]">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs tracking-[0.3em] uppercase text-white/60">Personal Edge</div>
          <Sparkles className="w-4 h-4 text-pink-300/90" />
        </div>
        <div className="text-white/95 font-semibold leading-snug">{value}</div>
        <div className="mt-2 text-xs text-white/40">Tiny move, big shift.</div>
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  score,
  message,
  advice,
}: {
  icon: React.ReactNode;
  title: string;
  score: number;
  message: string;
  advice: string;
}) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-500 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <div className="text-2xl font-mono font-bold text-white/40 group-hover:text-white transition-colors">
          {safeScore}%
        </div>
      </div>

      <div className="h-1.5 w-full bg-white/5 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
          style={{ width: `${safeScore}%` }}
        />
      </div>

      <p className="text-gray-200 leading-relaxed">{message}</p>

      {advice ? (
        <div className="mt-4 border-l border-white/10 pl-4">
          <div className="text-xs tracking-widest uppercase text-purple-300/70 mb-1">
            Action
          </div>
          <div className="text-gray-300">{advice}</div>
        </div>
      ) : null}
    </div>
  );
}









