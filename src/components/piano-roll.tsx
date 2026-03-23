
"use client";

import React, { useState } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';

const NOTES = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];

export function PianoRoll() {
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const handleNoteClick = (note: string) => {
    setActiveNote(note);
    audioEngine?.triggerNote(note);
    setTimeout(() => setActiveNote(null), 300);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/30 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl overflow-hidden">
      <div className="flex flex-col gap-2">
        {NOTES.map((note) => (
          <button
            key={note}
            onClick={() => handleNoteClick(note)}
            className={cn(
              "h-12 w-full flex items-center px-6 border-l-8 transition-all rounded-r-xl group",
              activeNote === note 
                ? "bg-[#ff4dff]/40 border-[#ff4dff] translate-x-2" 
                : "bg-white/40 hover:bg-[#ff4dff]/20 border-[#ff4dff]"
            )}
          >
            <span className={cn(
              "text-sm font-headline text-black transition-transform",
              activeNote === note && "scale-110"
            )}>
              {note}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
