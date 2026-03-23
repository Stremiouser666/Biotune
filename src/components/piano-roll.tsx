
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';
import { Wand2, Plus, Minus } from 'lucide-react';

interface PianoRollProps {
  sessionVersion?: number;
}

export function PianoRoll({ sessionVersion = 0 }: PianoRollProps) {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentNotes, setCurrentNotes] = useState<string[]>([]);
  const [patternLength, setPatternLength] = useState(8);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    if (audioEngine) {
      setGrid([...audioEngine.getMelodyGrid().map(row => [...row])]);
      setOffsets([...audioEngine.getPitchOffsets()]);
      setCurrentNotes([...audioEngine.getNotes()]);
      setPatternLength(audioEngine.getMelodyLength());
      const handleStep = (step: number) => setCurrentStep(step % audioEngine.getMelodyLength());
      audioEngine.addOnStep(handleStep);
      return () => {
        audioEngine.removeOnStep(handleStep);
      };
    }
  }, [sessionVersion]);

  const toggleCell = (row: number, col: number) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    audioEngine?.toggleMelody(row, col);
    setGrid([...audioEngine!.getMelodyGrid().map(r => [...r])]);
    if (audioEngine?.getMelodyGrid()[row][col]) {
      audioEngine?.triggerNote(row);
    }
  };

  const adjustPitch = (row: number, delta: number) => {
    const next = (offsets[row] || 0) + delta;
    audioEngine?.setPitchOffset(row, next);
    setOffsets(prev => {
      const copy = [...prev];
      copy[row] = next;
      return copy;
    });
    audioEngine?.triggerNote(row);
  };

  const handleRandomize = () => {
    audioEngine?.randomizeMelody();
    setGrid([...audioEngine!.getMelodyGrid().map(r => [...r])]);
  };

  const startLongPress = (rowIdx: number) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      audioEngine?.clearMelodyRow(rowIdx);
      setGrid([...audioEngine!.getMelodyGrid().map(r => [...r])]);
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const updateLength = (len: number) => {
    setPatternLength(len);
    audioEngine?.setMelodyLength(len);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2 justify-center mb-2">
        <span className="text-[10px] font-headline opacity-40 py-2">LENGTH</span>
        {[4, 8, 16].map(len => (
          <button key={len} onClick={() => updateLength(len)} className={cn("px-3 py-1 rounded-md text-[10px] font-headline transition-all", patternLength === len ? "bg-primary text-white" : "bg-white/40")}>{len}</button>
        ))}
      </div>
      <div className="w-full bg-white/30 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-xl overflow-x-auto">
        <div className="flex flex-col gap-1 min-w-[340px]">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 h-10">
              <div className="flex flex-col items-center justify-center bg-white/10 rounded-l-md w-16 select-none shrink-0 border-r border-black/5">
                <span className="text-[8px] font-headline opacity-50 mb-0.5">{currentNotes[rowIndex] || "-"}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjustPitch(rowIndex, -1)} className="p-0.5 hover:bg-white/20 rounded"><Minus className="w-2.5 h-2.5 opacity-40" /></button>
                  <span className={cn("text-[7px] font-headline", (offsets[rowIndex] || 0) !== 0 ? "text-primary" : "opacity-30")}>
                    {(offsets[rowIndex] || 0) > 0 ? `+${offsets[rowIndex]}` : offsets[rowIndex] || 0}
                  </span>
                  <button onClick={() => adjustPitch(rowIndex, 1)} className="p-0.5 hover:bg-white/20 rounded"><Plus className="w-2.5 h-2.5 opacity-40" /></button>
                </div>
              </div>
              {row.slice(0, patternLength).map((active, colIndex) => (
                <button
                  key={colIndex}
                  onPointerDown={() => startLongPress(rowIndex)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
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
      <button onClick={handleRandomize} className="flex items-center justify-center gap-2 py-3 bg-white/40 border border-white/60 rounded-2xl font-headline text-xs hover:bg-white/60 active:scale-95"><Wand2 className="w-4 h-4 text-primary" /> ✨ SURPRISE ME</button>
    </div>
  );
}
