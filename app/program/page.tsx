'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Mail } from 'lucide-react';

const ZODIACS = [
  { key: 'aries', label: 'Aries' },
  { key: 'taurus', label: 'Taurus' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'cancer', label: 'Cancer' },
  { key: 'leo', label: 'Leo' },
  { key: 'virgo', label: 'Virgo' },
  { key: 'libra', label: 'Libra' },
  { key: 'scorpio', label: 'Scorpio' },
  { key: 'sagittarius', label: 'Sagittarius' },
  { key: 'capricorn', label: 'Capricorn' },
  { key: 'aquarius', label: 'Aquarius' },
  { key: 'pisces', label: 'Pisces' },
] as const;

type Zodiac = (typeof ZODIACS)[number]['key'];

function isZodiac(value: string): value is Zodiac {
  return ZODIACS.some((zodiac) => zodiac.key === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidEmail(s: string) {
  const v = s.trim();
  return v.includes('@') && v.includes('.') && v.length >= 6;
}

export default function ProgramLandingPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [zodiac, setZodiac] = useState<Zodiac>('libra');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => isValidEmail(email) && !loading, [email, loading]);

  async function onSubmit() {
    setErr(null);
    if (!isValidEmail(email)) {
      setErr('Please enter a valid email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/program/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email, zodiac }),
      });

      const json: unknown = await res.json().catch(() => ({}));
      const response = isRecord(json) ? json : {};

      if (!res.ok || response.success !== true) {
        setErr(
          typeof response.error === 'string'
            ? response.error
            : `Create failed (${res.status})`
        );
        return;
      }

      const url = typeof response.url === 'string' ? response.url : null;
      const token = typeof response.token === 'string' ? response.token : null;

      // Prefer server-returned URL
      const target = url ?? (token ? `/program/${token}` : null);
      if (!target) {
        setErr('Create succeeded but missing redirect URL.');
        return;
      }

      router.push(target);
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs tracking-widest text-slate-400 uppercase">
            <span className="text-purple-300">✦</span>
            <span>7-Day Edge Program</span>
          </div>

          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tighter">
            This isn’t astrology.
            <span className="block text-white/50">It’s behavior reconstruction.</span>
          </h1>

          <p className="mt-6 text-slate-400 max-w-2xl mx-auto">
            One purchase. One link. Your 7-day “Edge” grid.
            <br />
            No login. No subscriptions. No daily maintenance.
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: form */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold">
                  Start here
                </div>
                <h2 className="text-2xl font-bold mt-1">Generate your program link</h2>
              </div>
              <div className="text-[10px] px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
                MVP • Email + Token
              </div>
            </div>

            {/* Email */}
            <label className="block text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-2">
              Email
            </label>
            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <input
                className="w-full bg-transparent outline-none text-slate-200 placeholder:text-slate-600"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              We’ll email delivery later (not in this step yet).
            </div>

            {/* Zodiac */}
            <div className="mt-6">
              <label className="block text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-2">
                Zodiac
              </label>
              <select
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-slate-200 outline-none"
                value={zodiac}
                onChange={(event) => {
                  if (isZodiac(event.target.value)) {
                    setZodiac(event.target.value);
                  }
                }}
              >
                {ZODIACS.map((z) => (
                  <option key={z.key} value={z.key}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {err ? (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4">
                <div className="font-semibold">Program create failed</div>
                <div className="text-sm mt-1">{err}</div>
              </div>
            ) : null}

            {/* CTA */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`mt-6 w-full rounded-2xl px-5 py-4 font-semibold flex items-center justify-center gap-3 transition
                ${canSubmit ? 'bg-white/10 hover:bg-white/15 border border-white/15' : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'}
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Generate my link <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-4 text-xs text-slate-500">
              Token links are private — treat it like a password.
            </div>
          </div>

          {/* Right: value props */}
          <div className="lg:col-span-5 grid gap-4">
            <ValueCard
              title="Instant delivery"
              desc="Generate all 7 days at once. No waiting, no daily jobs."
            />
            <ValueCard
              title="Low maintenance"
              desc="No subscriptions right now. One-off purchase model fits indie speed."
            />
            <ValueCard
              title="Built for sharing"
              desc="A token link becomes a portable artifact (your growth loop)."
            />
            <Link
              href="/pricing"
              className="text-sm text-slate-300 hover:text-white transition inline-flex items-center gap-2 justify-end"
            >
              See pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="font-semibold text-white/90">{title}</div>
      <div className="text-sm text-slate-400 mt-2 leading-relaxed">{desc}</div>
    </div>
  );
}
