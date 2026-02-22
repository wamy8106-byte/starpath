'use client';

import { use, useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { ArrowLeft, Heart, Briefcase, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { PersonalEdgeCard } from '@/components/horoscope/PersonalEdgeCard';
import { ProPreviewCard } from '@/components/horoscope/ProPreviewCard';

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
  moment?: string;
  label?: string;
  career?: Section;
  love?: Section;
  luck?: Section;
  affirmation?: string;
  error?: string;
};

const getZodiacIcon = (slug: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    aries: Icons.Flame,
    taurus: Icons.Mountain,
    gemini: Icons.Sparkles,
    cancer: Icons.Moon,
    leo: Icons.Sun,
    virgo: Icons.Leaf,
    libra: Icons.Scale,
    scorpio: Icons.Zap,
    sagittarius: Icons.Target,
    capricorn: Icons.Crown,
    aquarius: Icons.Waves,
    pisces: Icons.Fish,
  };

  return iconMap[slug.toLowerCase()] ?? Icons.Star;
};

function isMeaningful(value?: string) {
  if (!value) return false;
  const v = value.trim();
  return v !== '' && v !== '—' && v !== '-' && v.toLowerCase() !== 'null' && v.toLowerCase() !== 'undefined';
}

export default function ZodiacDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);

  const [data, setData] = useState<HoroscopeData | null>(null);
  const [loading, setLoading] = useState(true);

  const IconComponent = useMemo(() => getZodiacIcon(slug), [slug]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAIReading() {
      setLoading(true);
      try {
        const res = await fetch(`/api/horoscope?sign=${slug}`, { cache: 'no-store' });
        const result = (await res.json()) as HoroscopeData;
        if (!cancelled) setData(result);
      } catch (err) {
        console.error('Fetch error:', err);
        if (!cancelled) setData({ error: 'Celestial connection lost.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAIReading();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const personalEdge = data?.personal_edge ?? '';
  const showPersonalEdge = useMemo(() => isMeaningful(personalEdge), [personalEdge]);

  // micro fallbacks
  const dailyFocus = data?.micro_insight?.daily_focus ?? 'Stay centered.';
  const caution = data?.micro_insight?.caution ?? 'Observe.';
  const luckSignals = data?.micro_insight?.luck_signals ?? 'Silver • 7';

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center text-gray-400 hover:text-white transition gap-2 mb-10 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Stars
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="w-32 h-32 bg-linear-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)] border border-white/10 text-white">
            <IconComponent className="w-16 h-16" />
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-6xl font-bold mb-2 tracking-tighter">{sign}</h1>
            <p className="text-purple-400 font-medium tracking-[0.3em] uppercase text-sm">Daily Cosmic Reading</p>

            {data?.theme && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                <span className="text-gray-500 tracking-widest text-xs uppercase text-[10px]">Theme</span>
                <span className="font-medium text-purple-200">{data.theme}</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading / Error / Content */}
        {loading ? (
          <div className="flex flex-col items-center py-32 text-purple-400">
            <Loader2 className="w-12 h-12 animate-spin mb-6 opacity-80" />
            <p className="animate-pulse tracking-[0.2em] uppercase text-sm">Decoding celestial signals...</p>
          </div>
        ) : data?.error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-2xl">
            {data.error}
          </div>
        ) : (
          <div className="space-y-10">
            {/* ✅ Personal Edge (Free) */}
            {showPersonalEdge ? (
              <section>
                <PersonalEdgeCard
                  text={personalEdge.trim()}
                  moment={data?.moment ?? 'typing'}
                  label={data?.label ?? 'Personal Edge'}
                />
              </section>
            ) : null}

            {/* ✅ Pro Preview (Locked teaser) */}
            <section>
              <ProPreviewCard sign={sign} />
            </section>

            {/* Micro blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MiniBlock label="Daily Focus" value={dailyFocus} />
              <MiniBlock label="Caution" value={caution} />
              <MiniBlock label="Luck Signals" value={luckSignals} />
            </div>

            {/* Main cards */}
            <div className="grid gap-6">
              <InsightCard
                icon={<Briefcase className="text-blue-400" />}
                title="Career"
                score={data?.career?.score ?? 60}
                message={data?.career?.message ?? ''}
                advice={data?.career?.advice ?? ''}
              />
              <InsightCard
                icon={<Heart className="text-pink-400" />}
                title="Love"
                score={data?.love?.score ?? 60}
                message={data?.love?.message ?? ''}
                advice={data?.love?.advice ?? ''}
              />
              <InsightCard
                icon={<Star className="text-yellow-400" />}
                title="Luck"
                score={data?.luck?.score ?? 60}
                message={data?.luck?.message ?? ''}
                advice={data?.luck?.advice ?? ''}
              />
            </div>

            {/* Affirmation */}
            <div className="bg-linear-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-4xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent" />
              <p className="text-2xl font-light text-purple-100 italic">“{data?.affirmation ?? '—'}”</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-900/60 transition-colors">
      <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-2 font-bold">{label}</div>
      <div className="text-slate-200 font-medium">{value}</div>
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
    <div className="bg-white/5 border border-white/10 p-8 rounded-4xl group hover:bg-white/10 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">{icon}</div>
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        </div>
        <div className="text-3xl font-mono font-black text-white/20 group-hover:text-purple-400/80 transition-colors tracking-tighter">
          {safeScore}%
        </div>
      </div>

      <div className="h-2 w-full bg-white/5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-purple-600 via-fuchsia-500 to-blue-600 transition-all duration-1000 ease-out"
          style={{ width: `${safeScore}%` }}
        />
      </div>

      <p className="text-slate-300 text-lg leading-relaxed mb-6">{message}</p>

      {advice ? (
        <div className="bg-white/5 rounded-xl p-4 border-l-2 border-purple-500 text-slate-400 text-sm italic">
          {advice}
        </div>
      ) : null}
    </div>
  );
}






