"use client";

import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BiometricMonitor } from '@/components/biometric-monitor';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  onBreathingUpdate: (val: number) => void;
  onboardingStep: number | null;
  onNextOnboarding: () => void;
}

export function BiometricsSection({ onBreathingUpdate, onboardingStep, onNextOnboarding }: Props) {
  return (
    <AccordionItem value="biometrics" className={cn("border-none transition-all", onboardingStep === 0 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
      <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-headline text-[13px] text-black">BIOMETRIC SYNC</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 px-1 space-y-4">
        <BiometricMonitor onBreathingUpdate={onBreathingUpdate} />
        {onboardingStep === 0 && (
          <div className="mt-2 p-3 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-[10px] font-headline flex flex-col gap-2">
            Sync your breath and motion to influence the loop's pulse!
            <button onClick={onNextOnboarding} className="bg-primary text-white py-1.5 rounded-lg">NEXT: MELODY</button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
