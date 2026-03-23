
"use client";

import React, { useState } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';

const PADS = [
  { id: 'kick', label: 'Kick', type: 'hard' },
  { id: 'snare', label: 'Snare', type: 'soft' },
  { id: 'hat', label: 'Hat', type: 'soft' },
  { id: 'roll', label: 'Roll', type: 'roll' },
] as const;

export function DrumPads() {
  const [activePad, setActivePad] = useState<string | null>(null);

  const handlePadTrigger = (id: string, type: 'soft' | 'hard' | 'roll') => {
    setActivePad(id);
    audioEngine?.triggerDrum(type);
    setTimeout(() => setActivePad(null), 150);
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
      {PADS.map((pad) => (
        <button
          key={pad.id}
          onPointerDown={() => handlePadTrigger(pad.id, pad.type)}
          className={cn(
            "h-28 rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-95",
            "bg-white/40 backdrop-blur-sm shadow-lg",
            activePad === pad.id 
              ? "border-[#ff4dff] bg-[#ff4dff]/20 shadow-[#ff4dff]/40" 
              : "border-white/60 hover:border-[#ff4dff] shadow-black/5",
            "text-black font-headline tracking-wider uppercase text-lg"
          )}
        >
          {pad.label}
          <div className={cn(
            "mt-3 w-12 h-2 rounded-full transition-all",
            activePad === pad.id 
              ? "bg-white shadow-[0_0_15px_white]" 
              : "bg-[#ff4dff] shadow-[0_0_10px_rgba(255,77,255,0.5)]"
          )} />
        </button>
      ))}
    </div>
  );
}
