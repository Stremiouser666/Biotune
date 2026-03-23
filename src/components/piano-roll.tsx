
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';

interface PianoRollProps {
  sessionVersion?: number;
}

export function PianoRoll({ sessionVersion = 0 }: PianoRollProps) {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentNotes, setCurrentNotes] = useState<string[]>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioEngine) {
      setGrid([...audioEngine.getMelodyGrid().map(row => [...row])]);
      setCurrentNotes(audioEngine.getNotes());
      const handleStep = (step: number) => setCurrentStep(step % 8);
      audioEngine.addOnStep(handleStep);
      return () => audioEngine.removeOnStep(handleStep);
    }
  }, [sessionVersion]);

  const toggleCell = (row: number, col: number) => {
    audioEngine?.toggleMelody(row, col);
    setGrid([...audioEngine!.getMelodyGrid().map(r => [...r])]);
    if (!grid[row][col]) {
      audioEngine?.triggerNote(row);
    }
  };

  const handleRandomize = () => {
    audioEngine?.randomizeMelody();
    setGrid([...audioEngine!.getMelodyGrid().map(r => [...r])]);
  };

  const startLongPress = (rowIdx: number) => {
    longPressTimer.current = setTimeout(() => {
      audioEngine?.clearMelodyRow(rowIdx);
      setGrid([...audioEngine!.getMelodyGrid().map(r => [...r])]);
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full bg-white/30 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-xl overflow-x-auto">
        <div className="flex flex-col gap-1 min-w-[300px]">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 h-10">
              <button 
                onPointerDown={() => startLongPress(rowIndex)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                className="w-10 flex items-center justify-center text-[10px] font-headline opacity-40 hover:opacity-100 transition-opacity bg-white/10 rounded-l-md select-none"
              >
                {currentNotes[rowIndex]}
              </button>
              {row.map((active, colIndex) => (
                <button
                  key={colIndex}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className={cn(
                    "flex-1 rounded-sm transition-all border border-black/5",
                    active ? "bg-primary shadow-[0_0_15px_#ff4dff66]" : "bg-white/20 hover:bg-white/40",
                    currentStep === colIndex && "border-white border-2 scale-105 z-10"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <button 
        onClick={handleRandomize}
        className="flex items-center justify-center gap-2 py-3 bg-white/40 border border-white/60 rounded-2xl font-headline text-xs hover:bg-white/60 transition-all active:scale-95"
      >
        <Wand2 className="w-4 h-4 text-primary" />
        ✨ SURPRISE ME
      </button>
    </div>
  );
}
