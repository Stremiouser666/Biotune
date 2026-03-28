"use client";

import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { audioEngine } from '@/lib/audio-engine';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  isChaining: boolean;
  onToggleChaining: (val: boolean) => void;
  activeScene: number;
  onSceneClick: (idx: number) => void;
  onSceneLongPressStart: (idx: number) => void;
  onSceneLongPressEnd: () => void;
}

export function ScenesSection({ isChaining, onToggleChaining, activeScene, onSceneClick, onSceneLongPressStart, onSceneLongPressEnd }: Props) {
  return (
    <AccordionItem value="scenes" className="border-none">
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">PATTERN SCENES</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1 space-y-3">
        <div className="p-4 bg-white/30 rounded-2xl border border-white/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-headline opacity-60">AUTO-CHAIN</span>
            <Switch className="scale-75" checked={isChaining} onCheckedChange={onToggleChaining} />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map(idx => (
              <div key={idx} className="flex-1 flex flex-col gap-1">
                <button
                  onPointerDown={() => onSceneLongPressStart(idx)}
                  onPointerUp={onSceneLongPressEnd}
                  onPointerLeave={onSceneLongPressEnd}
                  onClick={() => onSceneClick(idx)}
                  className={cn(
                    "py-3 rounded-xl font-headline text-xs transition-all relative",
                    activeScene === idx ? "bg-primary text-white shadow-md scale-105" : "bg-white/40"
                  )}
                >
                  {idx + 1}
                  {audioEngine?.hasContent(idx) && (
                    <div className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", activeScene === idx ? "bg-white" : "bg-primary")} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
