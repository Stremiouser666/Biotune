
"use client";

import React from 'react';
import { audioEngine } from '@/lib/audio-engine';

const NOTES = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];

export function PianoRoll() {
  const handleNoteClick = (note: string) => {
    audioEngine?.triggerNote(note);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/30 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl overflow-hidden">
      <div className="flex flex-col gap-2">
        {NOTES.map((note) => (
          <button
            key={note}
            onClick={() => handleNoteClick(note)}
            className="h-12 w-full flex items-center px-6 bg-white/40 hover:bg-[#ff4dff]/20 border-l-8 border-[#ff4dff] transition-all rounded-r-xl group"
          >
            <span className="text-sm font-headline text-black group-hover:scale-110 transition-transform">{note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
