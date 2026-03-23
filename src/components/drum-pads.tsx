
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
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {PADS.map((pad) => (
        <button
          key={pad.id}
          onPointerDown={() => audioEngine?.triggerDrum(pad.type)}
          className={cn(
            "h-24 rounded-2xl border-2 border-white/10 flex flex-col items-center justify-center transition-all active:scale-95",
            "bg-gradient-to-br from-card to-background hover:border-primary/50 shadow-lg",
            "text-primary font-bold tracking-wider uppercase text-sm"
          )}
        >
          {pad.label}
          <div className="mt-2 w-8 h-1 bg-primary/20 rounded-full" />
        </button>
      ))}
    </div>
  );
}
