
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';
import { VolumeX, Volume2, Dice5 } from 'lucide-react';

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
  const [mutes, setMutes] = useState<boolean[]>([false, false, false, false]);
  const [currentStep, setCurrentStep] = useState(0);
  const [patternLength, setPatternLength] = useState(16);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    if (audioEngine) {
      setGrid([...audioEngine.getDrumGrid().map(row => [...row])]);
      setMutes([...audioEngine.getDrumMutes()]);
      setPatternLength(audioEngine.getDrumLength());
      const handleStep = (step: number) => setCurrentStep(step % audioEngine.getDrumLength());
      audioEngine.addOnStep(handleStep);
      return () => audioEngine.removeOnStep(handleStep);
    }
  }, [sessionVersion]);

  const toggleStep = (padIndex: number, stepIndex: number) => {
    audioEngine?.toggleDrumStep(padIndex, stepIndex);
    setGrid([...audioEngine!.getDrumGrid().map(r => [...r])]);
  };

  const toggleMute = (idx: number) => {
    audioEngine?.toggleDrumMute(idx);
    setMutes([...audioEngine!.getDrumMutes()]);
  };

  const startLongPress = (padIdx: number) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      audioEngine?.clearDrumRow(padIdx);
      setGrid([...audioEngine!.getDrumGrid().map(r => [...r])]);
    }, 600);
  };

  const stopLongPress = (padType: 'hard' | 'soft' | 'roll') => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      audioEngine?.triggerDrum(padType);
    }
    isLongPress.current = false;
  };

  const updateLength = (len: number) => {
    setPatternLength(len);
    audioEngine?.setDrumLength(len);
  };

  const handleRandomizeRow = (idx: number) => {
    audioEngine?.randomizeDrums(idx);
    setGrid([...audioEngine!.getDrumGrid().map(r => [...r])]);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      <div className="flex gap-2 justify-center mb-2">
        <span className="text-[10px] font-headline opacity-40 py-2">LENGTH</span>
        {[4, 8, 16].map(len => (
          <button 
            key={len} 
            onClick={() => updateLength(len)}
            className={cn(
              "px-3 py-1 rounded-md text-[10px] font-headline transition-all",
              patternLength === len ? "bg-primary text-white" : "bg-white/40"
            )}
          >
            {len}
          </button>
        ))}
      </div>
      {PADS.map((pad, padIdx) => (
        <div key={pad.id} className={cn(
          "bg-white/20 p-4 rounded-3xl border border-white/30 flex flex-col gap-4 transition-opacity",
          mutes[padIdx] && "opacity-40"
        )}>
          <div className="flex items-center gap-2">
            <button
              onPointerDown={() => startLongPress(padIdx)}
              onPointerUp={() => stopLongPress(pad.type)}
              onPointerLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
              className="px-6 py-2 bg-white/40 rounded-xl font-headline text-xs hover:bg-white/60 active:scale-95 transition-all select-none min-w-[80px]"
            >
              {pad.label}
            </button>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => toggleMute(padIdx)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/40 transition-all"
              >
                {mutes[padIdx] ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <button 
                onClick={() => handleRandomizeRow(padIdx)}
                className="p-2 bg-white/20 rounded-lg hover:bg-primary/40 transition-all"
              >
                <Dice5 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-1 flex-1 ml-2 overflow-x-auto py-2 scrollbar-hide">
              {grid[padIdx]?.slice(0, patternLength).map((active, stepIndex) => (
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
      <button 
        onClick={() => { audioEngine?.randomizeDrums(); setGrid([...audioEngine!.getDrumGrid().map(r => [...r])]); }}
        className="flex items-center justify-center gap-2 py-3 bg-white/40 border border-white/60 rounded-2xl font-headline text-xs hover:bg-white/60 transition-all active:scale-95 mt-2"
      >
        <Dice5 className="w-4 h-4 text-primary" />
        ✨ RANDOMIZE ALL
      </button>
    </div>
  );
}
