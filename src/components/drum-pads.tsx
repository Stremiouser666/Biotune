
"use client";

import React, { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';

interface DrumPadsProps {
  sessionVersion?: number;
}

const PADS = [
  { id: 'kick', label: 'Kick', type: 'hard' },
  { id: 'snare', label: 'Snare', type: 'soft' },
  { id: 'hat', label: 'Hat', type: 'roll' },
  { id: 'perc', label: 'Perc', type: 'soft' },
] as const;

export function DrumPads({ sessionVersion = 0 }: DrumPadsProps) {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (audioEngine) {
      setGrid([...audioEngine.getDrumGrid().map(row => [...row])]);
      const handleStep = (step: number) => setCurrentStep(step);
      audioEngine.addOnStep(handleStep);
      return () => audioEngine.removeOnStep(handleStep);
    }
  }, [sessionVersion]);

  const toggleStep = (padIndex: number, stepIndex: number) => {
    audioEngine?.toggleDrumStep(padIndex, stepIndex);
    setGrid([...audioEngine!.getDrumGrid().map(r => [...r])]);
  };

  const manualTrigger = (padIndex: number, type: 'soft' | 'hard' | 'roll') => {
    audioEngine?.triggerDrum(type);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {PADS.map((pad, padIdx) => (
        <div key={pad.id} className="bg-white/20 p-4 rounded-3xl border border-white/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onPointerDown={() => manualTrigger(padIdx, pad.type)}
              className="px-6 py-2 bg-white/40 rounded-xl font-headline text-xs hover:bg-white/60 active:scale-95 transition-all"
            >
              {pad.label}
            </button>
            <div className="flex gap-1 flex-1 ml-4 overflow-x-auto py-2 scrollbar-hide">
              {grid[padIdx]?.map((active, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(padIdx, stepIndex)}
                  className={cn(
                    "w-4 h-4 rounded-full transition-all border border-black/5 shrink-0",
                    active ? "bg-primary shadow-[0_0_8px_primary]" : "bg-white/20",
                    currentStep === stepIndex && "scale-125 border-white ring-2 ring-primary/20"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
