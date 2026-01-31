'use client';

import { use, useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, Heart, Briefcase, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'

// 定义一下数据结构，让 TypeScript 不再抱怨
interface Reading {
  score: number;
  prediction: string;
}

interface HoroscopeData {
  career: Reading;
  love: Reading;
  luck: Reading;
}

export default function ZodiacDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);

  const [data, setData] = useState<HoroscopeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAIReading() {
      try {
        const res = await fetch(`/api/horoscope?sign=${slug}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Fetch failed");
      } finally {
        setLoading(false);
      }
    }
    fetchAIReading();
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center text-gray-400 hover:text-white transition gap-2 mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Stars
        </Link>

        {/* 头部：星座标志 */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <span className="text-5xl font-bold">{sign[0]}</span>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-6xl font-bold mb-2 tracking-tighter">{sign}</h1>
            <p className="text-purple-400 font-medium tracking-[0.3em] uppercase text-sm">Celestial Insights</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 text-purple-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="animate-pulse tracking-widest">DECODING THE UNIVERSE...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* 事业卡片 */}
            <InsightCard 
              icon={<Briefcase className="text-blue-400" />} 
              title="Career" 
              score={data?.career.score || 0} 
              text={data?.career.prediction || ""} 
            />
            {/* 爱情卡片 */}
            <InsightCard 
              icon={<Heart className="text-pink-400" />} 
              title="Love" 
              score={data?.love.score || 0} 
              text={data?.love.prediction || ""} 
            />
            {/* 运气卡片 */}
            <InsightCard 
              icon={<Star className="text-yellow-400" />} 
              title="Luck" 
              score={data?.luck.score || 0} 
              text={data?.luck.prediction || ""} 
            />
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500 text-sm">Want to know more? Unlock Personalized Rituals for $9.99</p>
        </div>
      </div>
    </div>
  )
}

// 这是一个专门用来展示每个维度的小组件
function InsightCard({ icon, title, score, text }: { icon: any, title: string, score: number, text: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-500 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <div className="text-2xl font-mono font-bold text-white/40 group-hover:text-white transition-colors">
          {score}%
        </div>
      </div>
      {/* 进度条 */}
      <div className="h-1.5 w-full bg-white/5 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000" 
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-gray-300 leading-relaxed italic">"{text}"</p>
    </div>
  )
}