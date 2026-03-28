"use client";

import { Save, RotateCcw, Trash2, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  activeSlot: string;
  onSwitchSlot: (slot: string) => void;
  onUndo: () => void;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
}

export function MemorySection({ activeSlot, onSwitchSlot, onUndo, onSave, onLoad, onReset }: Props) {
  return (
    <AccordionItem value="memory" className="border-none">
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Save className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">MAGIC MEMORY</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1 space-y-3">
        <div className="flex justify-center gap-1.5 p-1.5 bg-white/20 rounded-2xl">
          {['A', 'B', 'C'].map(slot => (
            <button
              key={slot}
              onClick={() => onSwitchSlot(slot)}
              className={cn("flex-1 py-2 rounded-xl font-headline text-[9px] transition-all", activeSlot === slot ? "bg-primary text-white shadow-sm scale-105" : "bg-white/40")}
            >
              SLOT {slot}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-3 bg-white/30 rounded-2xl border border-white/40 shadow-sm">
          <button onClick={onUndo} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-primary/20">
            <Undo className="w-4 h-4 text-primary" />
            <span className="text-[7px] font-headline">UNDO</span>
          </button>
          <button onClick={onSave} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-primary/20">
            <Save className="w-4 h-4 text-primary" />
            <span className="text-[7px] font-headline">SAVE</span>
          </button>
          <button onClick={onLoad} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-primary/20">
            <RotateCcw className="w-4 h-4 text-primary" />
            <span className="text-[7px] font-headline">LOAD</span>
          </button>
          <button onClick={onReset} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-destructive/20">
            <Trash2 className="w-4 h-4 text-destructive" />
            <span className="text-[7px] font-headline text-destructive">CLR</span>
          </button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
