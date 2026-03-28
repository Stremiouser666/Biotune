"use client";

import { Sliders, Upload, Loader2, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audioEngine, type AudioMode, type OscillatorType, type NoteLength } from '@/lib/audio-engine';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  audioMode: AudioMode;
  isLoaded: boolean;
  onFileUpload: (type: 'piano' | 'kick' | 'snare' | 'hat', e: React.ChangeEvent<HTMLInputElement>) => void;
  onMidiExport: () => void;
  sessionVersion: number;
  onSessionChange: () => void;
}

export function SoundSection({ audioMode, isLoaded, onFileUpload, onMidiExport, sessionVersion, onSessionChange }: Props) {
  return (
    <AccordionItem value="sound" className="border-none">
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">SOUND PALETTE</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1">
        <div className="p-4 bg-white/40 backdrop-blur-sm border rounded-2xl flex flex-col gap-4 shadow-sm">
          <div className="space-y-2">
            <div className="text-[8px] font-headline opacity-60 text-left">CUSTOM SAMPLES</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['piano', 'kick', 'snare', 'hat'] as const).map(type => (
                <div key={type} className="relative">
                  <label className="flex flex-col items-center gap-1 p-2 bg-white/40 rounded-lg cursor-pointer hover:bg-white/60 transition-all">
                    <Upload className="w-3 h-3 opacity-40" />
                    <span className="text-[8px] font-headline">{type.toUpperCase()}</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFileUpload(type, e)} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-[8px] font-headline opacity-60 text-center">WAVE</div>
              <div className="grid grid-cols-2 gap-1">
                {(['sine', 'triangle', 'square', 'sawtooth'] as OscillatorType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => { audioEngine?.setOscillator(type); onSessionChange(); }}
                    className={cn("py-1 text-[7px] rounded-md font-headline", audioEngine?.getOscillator() === type ? "bg-primary text-white" : "bg-white/40")}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[8px] font-headline opacity-60 text-center">LENGTH</div>
              <div className="grid grid-1 gap-1">
                {([{ id: '16n', label: 'SHORT' }, { id: '8n', label: 'MEDIUM' }, { id: '4n', label: 'LONG' }] as {id: NoteLength, label: string}[]).map(({id, label}) => (
                  <button
                    key={id}
                    onClick={() => { audioEngine?.setNoteLength(id); onSessionChange(); }}
                    className={cn("py-0.5 text-[7px] rounded-md font-headline", audioEngine?.getNoteLength() === id ? "bg-primary text-white" : "bg-white/40")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
            <span className="text-[10px] font-headline opacity-60">SAMPLES</span>
            <div className="flex items-center gap-2">
              {!isLoaded && audioMode === 'sampled' && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
              <button
                onClick={() => {
                  const modes: AudioMode[] = ['synth', 'sampled', 'custom'];
                  const next = modes[(modes.indexOf(audioMode) + 1) % 3];
                  audioEngine?.setMode(next);
                  onSessionChange();
                }}
                className="px-4 py-1.5 bg-primary text-white rounded-lg font-headline text-[9px] min-w-[70px]"
              >
                {audioMode.toUpperCase()}
              </button>
            </div>
          </div>

          <button
            onClick={onMidiExport}
            className="w-full py-2.5 bg-white/40 border border-primary/40 rounded-xl font-headline text-[10px] flex items-center justify-center gap-2"
          >
            <Link className="w-3 h-3" /> EXPORT PATTERN DATA
          </button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
