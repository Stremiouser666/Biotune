"use client";

import { Music, Dice5 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { PianoRoll } from '@/components/piano-roll';
import { audioEngine } from '@/lib/audio-engine';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  chordMode: boolean;
  onToggleChordMode: (val: boolean) => void;
  rootNote: string;
  onRootNoteChange: (note: string) => void;
  activeScene: number;
  sessionVersion: number;
  onboardingStep: number | null;
  onNextOnboarding: () => void;
}

export function MelodySection({ chordMode, onToggleChordMode, rootNote, onRootNoteChange, activeScene, sessionVersion, onboardingStep, onNextOnboarding }: Props) {
  return (
    <AccordionItem value="melody" className={cn("border-none transition-all", onboardingStep === 1 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">MELODY STUDIO</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1 space-y-3">
        <div className="p-3 bg-white/30 rounded-2xl border border-white/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Switch className="scale-75" checked={chordMode} onCheckedChange={onToggleChordMode} />
              <span className="text-[10px] font-headline opacity-60">CHORD MODE</span>
            </div>
            <button
              onClick={() => { audioEngine?.randomiseMelody(); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 rounded-lg text-[9px] font-headline"
            >
              <Dice5 className="w-3 h-3" /> RANDOMISE
            </button>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-headline opacity-60">ROOT</span>
            <div className="flex gap-1 flex-wrap">
              {["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].map(note => (
                <button
                  key={note}
                  onClick={() => { onRootNoteChange(note); audioEngine?.setRootNote(note); }}
                  className={cn("px-1.5 py-0.5 text-[8px] rounded font-headline", rootNote === note ? "bg-primary text-white" : "bg-white/40")}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>
          <PianoRoll key={`piano-${activeScene}-${sessionVersion}`} />
          {onboardingStep === 1 && (
            <div className="p-3 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-[10px] font-headline flex flex-col gap-2">
              Tap the grid to place notes — your melody awaits!
              <button onClick={onNextOnboarding} className="bg-primary text-white py-1.5 rounded-lg">NEXT: RHYTHM</button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
