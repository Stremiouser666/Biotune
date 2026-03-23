
"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface MascotProps {
  state: 'idle' | 'active' | 'reacting';
  bpm?: number;
  intensity?: number;
}

export function Mascot({ state, bpm = 80, intensity = 0.5 }: MascotProps) {
  // Map BPM to float speed
  const floatDuration = Math.max(1, 4 - (bpm - 60) / 40);

  return (
    <div 
      className={cn(
        "relative w-48 h-48 flex items-center justify-center transition-all duration-1000",
        state === 'idle' ? "animate-float opacity-80 scale-90" : "animate-float scale-110",
        state === 'active' && "brightness-125"
      )}
      style={{ animationDuration: `${floatDuration}s` }}
    >
      {/* Glow */}
      <div className={cn(
        "absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-all duration-500",
        state !== 'idle' ? "scale-150 opacity-60" : "scale-100 opacity-20"
      )} />

      {/* Mascot Body */}
      <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-2xl">
        {/* Core body */}
        <circle 
          cx="100" 
          cy="100" 
          r="60" 
          fill="url(#bodyGradient)" 
          className={cn(
            "transition-all duration-500",
            state === 'reacting' && "animate-pulse"
          )}
        />
        
        {/* Eyes */}
        <g className="mascot-blink">
          <circle cx="80" cy="90" r="8" fill="white" />
          <circle cx="120" cy="90" r="8" fill="white" />
          {/* Pupils */}
          <circle cx="80" cy="90" r="4" fill="black" />
          <circle cx="120" cy="90" r="4" fill="black" />
        </g>

        {/* Mouth */}
        <path 
          d={state === 'reacting' ? "M 85 130 Q 100 150 115 130" : "M 85 130 Q 100 135 115 130"} 
          stroke="white" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
          className="transition-all duration-200"
        />

        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E526AB" />
            <stop offset="100%" stopColor="#EE80FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
