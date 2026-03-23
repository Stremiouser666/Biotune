
"use client";

import React from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';

const PADS = [
  { id: 'kick', label: 'Kick', type: 'hard' },
  { id: 'snare', label: 'Snare', type: 'soft' },
  { id: 'hat', label: 'Hat', type: 'soft' },
  { id: 'roll', label: 'Roll', type: 'roll' },
] as const;

export function DrumPads() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
      {PADS.map((pad) => (
        <button
          key={pad.id}
          onPointerDown={() => audioEngine?.triggerDrum(pad.type)}
          className={cn(
            "h-28 rounded-3xl border-2 border-white/60 flex flex-col items-center justify-center transition-all active:scale-95",
            "bg-white/40 backdrop-blur-sm hover:border-[#ff4dff] shadow-lg hover:shadow-[#ff4dff]/20",
            "text-black font-headline tracking-wider uppercase text-lg"
          )}
        >
          {pad.label}
          <div className="mt-3 w-12 h-2 bg-[#ff4dff] rounded-full shadow-[0_0_10px_rgba(255,77,255,0.5)]" />
        </button>
      ))}
    </div>
  );
}
