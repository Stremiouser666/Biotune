"use client";

import { Zap, Dice5 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrumPads } from '@/components/drum-pads';
import { audioEngine } from '@/lib/audio-engine';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  activeScene: number;
  sessionVersion: number;
  onboardingStep: number | null;
  onNextOnboarding: () => void;
}

export function RhythmSection({ activeScene, sessionVersion, onboardingStep, onNextOnboarding }: Props) {
  return (
    <AccordionItem value="rhythm" className={cn("border-none transition-all", onboardingStep === 2 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">RHYTHM STUDIO</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1 space-y-3">
        <div className="p-3 bg-white/30 rounded-2xl border border-white/40 shadow-sm space-y-3">
          <div className="flex justify-end px-1">
            <button
              onClick={() => { audioEngine?.randomiseDrums(); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 rounded-lg text-[9px] font-headline"
            >
              <Dice5 className="w-3 h-3" /> RANDOMISE
            </button>
          </div>
          <DrumPads key={`drums-${activeScene}-${sessionVersion}`} />
          {onboardingStep === 2 && (
            <div className="p-3 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-[10px] font-headline flex flex-col gap-2">
              Activate drum steps to build your beat!
              <button onClick={onNextOnboarding} className="bg-primary text-white py-1.5 rounded-lg">LET'S GO! 🚀</button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
