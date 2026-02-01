import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: "Nebula (Free)",
      price: "$0",
      features: ["Daily Horoscope", "Standard AI Insights", "3 Queries/Day"],
      button: "Current Plan",
      highlight: false
    },
    {
      name: "Supernova (Pro)",
      price: "$9.90",
      features: ["Unlimited Insights", "Deep Birth Chart Analysis", "Priority Support", "No Ads"],
      button: "Upgrade Now",
      highlight: true
    },
    {
      name: "Galactic (VIP)",
      price: "$29.90",
      features: ["1-on-1 AI Astrologer", "Life Path Planning", "Beta Access to New Features"],
      button: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white p-8">
      <nav className="max-w-6xl mx-auto mb-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300">← Back to Universe</Link>
      </nav>

      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Choose Your Cosmic Plan
        </h1>
        <p className="text-gray-400 text-xl">Unlock the full potential of your stellar journey.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`p-8 rounded-3xl border ${plan.highlight ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-white/10 bg-white/5'} flex flex-col`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center text-gray-300 text-sm">
                  <Check className="w-4 h-4 mr-2 text-purple-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-xl font-bold transition ${plan.highlight ? 'bg-purple-500 hover:bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}>
              {plan.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}