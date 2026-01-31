import Link from 'next/link'
import { Star, Moon, Sun, Sparkles } from 'lucide-react'

export default function Home() {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio', 
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ]

  return (
    <div className="min-h-screen bg-[#0f0c29] text-white overflow-hidden relative">
      {/* 动态星空背景 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
      
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-32">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
            <Moon className="text-purple-400 fill-current" />
            <span>StarPath</span>
          </div>
          <Link href="/pricing" className="text-sm hover:text-purple-400 transition">Pricing</Link>
        </nav>

        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-400">
            Your Cosmic Journey <br/> Starts Here
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Unlock the mysteries of your birth chart with our AI-powered astrological insights. 
            Real-time transits, personalized horoscopes, and more.
          </p>
        </div>

        {/* 星座网格 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-20">
          {signs.map((sign) => (
            <Link 
              href={`/zodiac/${sign.toLowerCase()}`} 
              key={sign}
              className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-purple-500/50 transition-all text-center"
            >
              <div className="text-gray-400 group-hover:text-purple-400 mb-2 flex justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">{sign}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}