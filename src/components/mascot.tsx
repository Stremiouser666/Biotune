
"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface MascotProps {
  state: 'idle' | 'active' | 'reacting';
  intensity?: number;
  isDancing?: boolean;
}

export function Mascot({ state, intensity = 0, isDancing = false }: MascotProps) {
  // Map intensity (0-1) to scale, glow, and rotation speed
  const scale = 1 + (intensity * 0.25);
  const glowSize = 60 + (intensity * 100);
  const glowOpacity = 0.3 + (intensity * 0.7);
  const coreRotation = intensity * 10; // Speed multiplier

  return (
    <div 
      className={cn(
        "relative w-48 h-48 flex items-center justify-center transition-transform duration-300",
        state === 'reacting' && !isDancing && "animate-mascot-float",
        isDancing && "animate-mascot-dance"
      )}
      style={{ transform: `scale(${scale})` }}
    >
      {/* Layered Energy Aura */}
      <div 
        className="absolute rounded-full blur-[80px] transition-all duration-300" 
        style={{ 
          width: `${glowSize * 2}px`, 
          height: `${glowSize * 2}px`, 
          backgroundColor: '#ff4dff',
          opacity: glowOpacity * 0.3
        }}
      />
      <div 
        className="absolute rounded-full blur-[40px] transition-all duration-300 border-[3px] border-white/20 animate-spin" 
        style={{ 
          width: `${glowSize * 1.2}px`, 
          height: `${glowSize * 1.2}px`, 
          animationDuration: `${10 / (1 + coreRotation)}s`
        }}
      />
      
      {/* Central Heartbeat Glow */}
      <div 
        className="absolute rounded-full blur-[20px] transition-all duration-300" 
        style={{ 
          width: `${glowSize * 0.8}px`, 
          height: `${glowSize * 0.8}px`, 
          backgroundColor: '#ffffff',
          opacity: glowOpacity
        }}
      />

      {/* Mascot Body: Large and bold */}
      <img 
        src="https://i.postimg.cc/CxDqyny4/Mascot_Body.png" 
        alt="Mascot Body"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
      />

      {/* Mascot Face: Reactive facial expressions */}
      <img 
        src="https://i.postimg.cc/4xt9CHCv/Mascot_Face.png" 
        alt="Mascot Face"
        className={cn(
          "absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-200",
          "mascot-blink",
          (state === 'reacting' || intensity > 0.3) && "mascot-talk"
        )}
      />
      
      {/* Decorative Energy Particles (CSS only) */}
      {intensity > 0.5 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" />
          <div className="absolute bottom-1/4 right-0 w-1 h-1 bg-primary rounded-full animate-bounce" />
          <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
