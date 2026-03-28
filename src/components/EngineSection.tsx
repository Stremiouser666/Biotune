"use client";

import { Settings2, Play, Pause, Mic, Square, Timer, Volume2, Activity, Sparkles, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";
import { audioEngine } from '@/lib/audio-engine';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  masterVolume: number;
  swing: number;
  reverbWet: number;
  delayWet: number;
  filterFreq: number;
  onTogglePlay: () => void;
  onToggleRecording: () => void;
  onTapTempo: () => void;
  onBpmChange: (val: number) => void;
  onMasterVolumeChange: (val: number) => void;
  onSwingChange: (val: number) => void;
  onReverbChange: (val: number) => void;
  onDelayChange: (val: number) => void;
  onFilterChange: (val: number) => void;
}

export function EngineSection({
  isPlaying, isRecording, bpm, masterVolume, swing, reverbWet, delayWet, filterFreq,
  onTogglePlay, onToggleRecording, onTapTempo,
  onBpmChange, onMasterVolumeChange, onSwingChange, onReverbChange, onDelayChange, onFilterChange
}: Props) {
  return (
    <AccordionItem value="engine" className="border-none">
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">LOOP ENGINE</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1">
        <div className="p-5 bg-white/40 backdrop-blur-sm border rounded-2xl flex flex-col gap-6 shadow-sm">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              <button onClick={onTogglePlay} className="p-4 bg-primary text-white rounded-full shadow-lg active:scale-95 transition-all">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                onClick={onToggleRecording}
                className={cn("p-4 rounded-full shadow-lg transition-all", isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white/40 text-black/60")}
              >
                {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="text-2xl font-headline text-primary leading-none">{bpm.toFixed(0)}</div>
              <button onClick={onTapTempo} className="flex items-center gap-1.5 px-2 py-0.5 bg-white/40 rounded-lg text-[8px] font-headline active:scale-90 transition-all">
                <Timer className="w-2.5 h-2.5" /> TAP
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[8px] font-headline opacity-40 text-left">BPM CONTROL</div>
            <Slider value={[bpm]} max={180} min={40} step={1} onValueChange={([val]) => onBpmChange(val)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 opacity-40 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="text-[8px] font-headline opacity-40 text-left">MASTER</div>
                <Slider value={[masterVolume]} max={1} step={0.01} onValueChange={([val]) => onMasterVolumeChange(val)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 opacity-40 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="text-[8px] font-headline opacity-40 text-left">SWING</div>
                <Slider value={[swing]} max={0.5} step={0.01} onValueChange={([v]) => onSwingChange(v)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 opacity-40 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="text-[8px] font-headline opacity-40 text-left">REVERB</div>
                <Slider value={[reverbWet]} max={1} step={0.01} onValueChange={([v]) => onReverbChange(v)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 opacity-40 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="text-[8px] font-headline opacity-40 text-left">DELAY</div>
                <Slider value={[delayWet]} max={1} step={0.01} onValueChange={([v]) => onDelayChange(v)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Activity className="w-4 h-4 opacity-40 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="text-[8px] font-headline opacity-40 text-left">FILTER</div>
              <Slider value={[filterFreq]} max={20000} min={100} step={1} onValueChange={([v]) => onFilterChange(v)} />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
