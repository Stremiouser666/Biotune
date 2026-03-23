
"use client";

import React from 'react';
import { audioEngine } from '@/lib/audio-engine';

const NOTES = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];

export function PianoRoll() {
  const handleNoteClick = (note: string) => {
    audioEngine?.triggerNote(note);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      <div className="flex flex-col gap-1">
        {NOTES.map((note) => (
          <button
            key={note}
            onClick={() => handleNoteClick(note)}
            className="h-10 w-full flex items-center px-4 bg-background/40 hover:bg-primary/20 border-l-4 border-accent transition-all rounded-r-md group"
          >
            <span className="text-xs font-bold text-muted-foreground group-hover:text-white">{note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
