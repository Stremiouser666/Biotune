
"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface MascotProps {
  state: 'idle' | 'active' | 'reacting';
}

export function Mascot({ state }: MascotProps) {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center animate-mascot-float">
      {/* Glow effect behind mascot */}
      <div className={cn(
        "absolute w-56 h-56 bg-white/30 rounded-full blur-3xl transition-opacity duration-1000",
        state === 'idle' ? "opacity-30" : "opacity-60"
      )} />

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
          "absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-200",
          "mascot-blink",
          state === 'reacting' && "mascot-talk"
        )}
      />
    </div>
  );
}
