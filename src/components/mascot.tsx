"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface MascotProps {
  state: 'idle' | 'active' | 'reacting';
  intensity?: number;
  isDancing?: boolean;
}

export function Mascot({ state, intensity = 0, isDancing = false }: MascotProps) {
  // Map intensity (0-1) to scale and glow
  const scale = 1 + (intensity * 0.2);
  const glowSize = 40 + (intensity * 60);
  const glowOpacity = 0.2 + (intensity * 0.6);

  return (
    <div 
      className={cn(
        "relative w-40 h-40 flex items-center justify-center transition-transform duration-300",
        state === 'reacting' && !isDancing && "animate-mascot-float",
        isDancing && "animate-mascot-dance"
      )}
      style={{ transform: `scale(${scale})` }}
    >
      {/* Outer Glow layers */}
      <div 
        className="absolute rounded-full blur-[60px] transition-all duration-300" 
        style={{ 
          width: `${glowSize * 1.5}px`, 
          height: `${glowSize * 1.5}px`, 
          backgroundColor: '#ff4dff',
          opacity: glowOpacity * 0.4
        }}
      />
      <div 
        className="absolute rounded-full blur-[30px] transition-all duration-300" 
        style={{ 
          width: `${glowSize}px`, 
          height: `${glowSize}px`, 
          backgroundColor: '#ffffff',
          opacity: glowOpacity
        }}
      />

      {/* Mascot Body */}
      <img 
        src="https://i.postimg.cc/CxDqyny4/Mascot_Body.png" 
        alt="Mascot Body"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* Mascot Face */}
      <img 
        src="https://i.postimg.cc/4xt9CHCv/Mascot_Face.png" 
        alt="Mascot Face"
        className={cn(
          "absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-200",
          "mascot-blink",
          (state === 'reacting' || intensity > 0.4) && "mascot-talk"
        )}
      />
    </div>
  );
}