"use client";

import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { Activity } from 'lucide-react';

type FlowStep = 'intro' | 'activation' | 'magic' | 'dashboard';

interface Props {
  step: FlowStep;
  breathingIntensity: number;
  isPlaying: boolean;
  bpm: number;
  onCreateSound: () => void;
}

export function IntroScreen({ step, breathingIntensity, isPlaying, bpm, onCreateSound }: Props) {
  return (
    <>
      <div className="mb-6 shrink-0">
        <Mascot
          state={['magic', 'activation'].includes(step) ? 'reacting' : step === 'dashboard' ? 'active' : 'idle'}
          intensity={breathingIntensity}
          isDancing={isPlaying && bpm > 110}
        />
      </div>

      {step === 'intro' && (
        <div className="flex flex-col items-center gap-8">
          <AnimatedText text="Hi… let's create magical music from you together 🎶" className="text-xl md:text-3xl font-headline" />
          <button
            onClick={onCreateSound}
            className="px-6 py-4 text-lg bg-primary text-white rounded-2xl shadow-[0_0_25px_rgba(255,77,255,0.7)] hover:scale-105 active:scale-95 font-headline"
          >
            ✨ CREATE MY SOUND
          </button>
        </div>
      )}

      {step === 'activation' && (
        <div className="flex flex-col items-center gap-4">
          <AnimatedText text="Listening to your presence..." className="text-lg md:text-2xl font-headline" />
          <div className="flex gap-2 items-center text-primary/60">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-headline">CALIBRATING BIOMETRICS</span>
          </div>
        </div>
      )}

      {step === 'magic' && (
        <div className="flex flex-col items-center gap-4">
          <AnimatedText text="A unique musical theme is coming alive ✨" className="text-lg md:text-2xl font-headline" />
          <AnimatedText text="Connecting rhythm to your movement..." delayPerWord={300} className="text-[10px] opacity-60" />
        </div>
      )}
    </>
  );
}
