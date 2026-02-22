'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface PersonalEdgeCardProps {
  text: string;
  moment?: string;
  label?: string;
}

export const PersonalEdgeCard = ({ text, moment, label }: PersonalEdgeCardProps) => {
  const [displayText, setDisplayText] = useState('');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&%*";

  useEffect(() => {
    let iteration = 0;
    let interval: NodeJS.Timeout;
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.05;

    interval = setInterval(() => {
      setDisplayText(prev => 
        text.split("").map((char, index) => {
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );

      if (Math.random() > 0.8) {
        audio.play().catch(() => {});
      }

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="relative group overflow-hidden rounded-4xl p-px animate-gradient-x bg-linear-to-r from-purple-600 via-blue-500 to-pink-500">
      <div className="relative bg-[#0b0b1a]/90 rounded-4xl p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-purple-300/70">
              {moment ? `Detected: ${moment}` : 'Cosmic Signal Detected'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Action Subtraction v2.0
          </span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight leading-tight">
          {displayText}
        </h2>

        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="text-[10px] font-mono text-white/40 italic">
            {label ? `> Targeting: ${label}` : '> Analyzing edge case...'}
          </div>
          <div className="h-1 w-1 bg-purple-500 rounded-full animate-blink" />
        </div>
      </div>
    </div>
  );
};