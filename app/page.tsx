import Link from 'next/link';
import { 
  Flame, Mountain, Sparkles, Moon, Sun, Leaf, 
  Scale, Zap, Target, Crown, Waves, Fish, Star 
} from 'lucide-react';

const zodiacs = [
  { name: 'Aries', date: 'Mar 21 - Apr 19', icon: Flame, color: 'group-hover:text-red-400' },
  { name: 'Taurus', date: 'Apr 20 - May 20', icon: Mountain, color: 'group-hover:text-emerald-400' },
  { name: 'Gemini', date: 'May 21 - Jun 20', icon: Sparkles, color: 'group-hover:text-yellow-400' },
  { name: 'Cancer', date: 'Jun 21 - Jul 22', icon: Moon, color: 'group-hover:text-slate-300' },
  { name: 'Leo', date: 'Jul 23 - Aug 22', icon: Sun, color: 'group-hover:text-orange-400' },
  { name: 'Virgo', date: 'Aug 23 - Sep 22', icon: Leaf, color: 'group-hover:text-green-400' },
  { name: 'Libra', date: 'Sep 23 - Oct 22', icon: Scale, color: 'group-hover:text-pink-400' },
  { name: 'Scorpio', date: 'Oct 23 - Nov 21', icon: Zap, color: 'group-hover:text-purple-400' },
  { name: 'Sagittarius', date: 'Nov 22 - Dec 21', icon: Target, color: 'group-hover:text-indigo-400' },
  { name: 'Capricorn', date: 'Dec 22 - Jan 19', icon: Crown, color: 'group-hover:text-stone-400' },
  { name: 'Aquarius', date: 'Jan 20 - Feb 18', icon: Waves, color: 'group-hover:text-cyan-400' },
  { name: 'Pisces', date: 'Feb 19 - Mar 20', icon: Fish, color: 'group-hover:text-teal-400' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans selection:bg-purple-500/30 pb-24">
      {/* 背景星空装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24">
        {/* 头部标题区 */}
        <header className="text-center mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest text-slate-400 uppercase">
            <Star className="w-4 h-4 text-purple-400" />
            <span>StarPath AI Reading</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent">
            Choose Your Zodiac
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Discover your daily cosmic alignment, behavioral edges, and actionable insights powered by AI.
          </p>
        </header>

        {/* 12星座网格区 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {zodiacs.map((zodiac) => {
            const Icon = zodiac.icon;
            return (
              <Link 
                key={zodiac.name}
                href={`/zodiac/${zodiac.name.toLowerCase()}`}
                className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-white/10 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.2)]"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:bg-slate-800">
                  <Icon className={`w-8 h-8 text-slate-400 transition-colors duration-300 ${zodiac.color}`} />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-1">{zodiac.name}</h2>
                <p className="text-xs font-mono text-slate-500 tracking-wider">{zodiac.date}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}