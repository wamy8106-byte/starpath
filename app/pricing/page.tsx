"use client"; // 增加交互支持
import React, { useState } from 'react';
import Link from 'next/link';
import { Check, HelpCircle } from 'lucide-react';

export default function PricingPageV2() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Daily Snapshot",
      desc: "Perfect for a quick cosmic check-in.",
      price: "Free",
      features: ["Daily General Horoscope", "Basic AI Insights", "3 Queries/Day"],
      cta: "Current Plan",
      highlight: false
    },
    {
      name: "Cosmic Guidance",
      desc: "Deep dive into your love & career path.",
      price: isAnnual ? "$7.90" : "$9.90",
      features: ["Unlimited Insights", "Love & Career Specifics", "Priority AI Processing", "Save History"],
      cta: "Unlock My Destiny",
      highlight: true,
      badge: "Most Popular"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 font-sans">
      {/* 1. 顶部价值主张 */}
      <nav className="max-w-5xl mx-auto flex justify-between py-6">
        <Link href="/" className="opacity-60 hover:opacity-100 transition">← Back to Stars</Link>
      </nav>

      <div className="max-w-4xl mx-auto text-center mt-10 mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
          Your Future, <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent text-glow">Decoded.</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10">Stop guessing. Get personalized AI astrological guidance daily.</p>

        {/* 2. 月付/年付切换 */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={!isAnnual ? 'text-white' : 'text-gray-500'}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 bg-purple-900/50 rounded-full p-1 transition relative"
          >
            <div className={`w-5 h-5 bg-purple-500 rounded-full transition-all ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <span className={isAnnual ? 'text-white' : 'text-gray-500'}>
            Yearly <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
          </span>
        </div>

        {/* 3. 精简后的档位 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative p-8 rounded-3xl border transition-all duration-500 ${plan.highlight ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)] scale-105' : 'border-white/10 bg-white/5 opacity-80'}`}>
              {plan.badge && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</div>}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-400 mb-6">{plan.desc}</p>
              <div className="text-5xl font-bold mb-8">{plan.price}<span className="text-sm font-normal text-gray-500">/{isAnnual ? 'mo' : 'mo'}</span></div>
              <ul className="space-y-4 mb-10 text-left">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-400" /> {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.highlight ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-white/10 hover:bg-white/20'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FAQ 简易版 */}
      <div className="max-w-2xl mx-auto mt-24 mb-20 border-t border-white/10 pt-16">
        <h2 className="text-2xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-8">
          <div>
            <h4 className="flex items-center gap-2 font-bold mb-2 text-purple-300"><HelpCircle className="w-4 h-4"/> How accurate is the AI?</h4>
            <p className="text-sm text-gray-400">Our AI uses real-time planetary positions and advanced GPT models trained on vast astrological data for high-precision readings.</p>
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-bold mb-2 text-purple-300"><HelpCircle className="w-4 h-4"/> Can I cancel anytime?</h4>
            <p className="text-sm text-gray-400">Absolutely. No cosmic contracts here. Cancel with one click in your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}