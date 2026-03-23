
"use client";

import React, { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';

export function PianoRoll() {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (audioEngine) {
      setGrid([...audioEngine.getMelodyGrid()]);
      audioEngine.setOnStep((step) => setCurrentStep(step % 8));
    }
  }, []);

  const toggleCell = (row: number, col: number) => {
    audioEngine?.toggleMelody(row, col);
    setGrid([...audioEngine!.getMelodyGrid()]);
    if (!grid[row][col]) {
      const notes = ["C5", "A4", "G4", "F4", "E4", "D4", "C4", "G3"];
      audioEngine?.triggerNote(notes[row]);
    }
  };

  const notes = ["C5", "A4", "G4", "F4", "E4", "D4", "C4", "G3"];

  return (
    <div className="w-full bg-white/30 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-xl overflow-x-auto">
      <div className="flex flex-col gap-1 min-w-[300px]">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 h-10">
            <div className="w-8 flex items-center justify-center text-[10px] font-headline opacity-40">
              {notes[rowIndex]}
            </div>
            {row.map((active, colIndex) => (
              <button
                key={colIndex}
                onClick={() => toggleCell(rowIndex, colIndex)}
                className={cn(
                  "flex-1 rounded-md transition-all border border-black/5",
                  active ? "bg-[#ff4dff] shadow-[0_0_15px_#ff4dff66]" : "bg-white/20 hover:bg-white/40",
                  currentStep === colIndex && "border-white border-2 scale-105 z-10"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
