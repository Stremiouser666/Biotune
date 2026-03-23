
"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { audioEngine } from '@/lib/audio-engine';
import { Sparkles, Music, Waves, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

type FlowStep = 'intro' | 'activation' | 'magic' | 'dashboard';

export default function BiotuneApp() {
  const [step, setStep] = useState<FlowStep>('intro');
  const [textIndex, setTextIndex] = useState(0);

  const texts = [
    "Hi… let’s create magical music from you together 🎶",
    "your magical music journey begins now 🎶",
    "🎧 listen… this is your magic"
  ];

  const handleCreateSound = async () => {
    await audioEngine?.start();
    setStep('activation');
    // Transition to magic moment after a short delay
    setTimeout(() => {
      setStep('magic');
      setTimeout(() => {
        setStep('dashboard');
      }, 4000);
    }, 3000);
  };

  return (
    <main className={cn(
      "relative min-h-svh w-full flex flex-col items-center justify-center p-6 transition-all duration-1000 ease-in-out",
      step === 'intro' ? "bg-[#251520] blur-[1px]" : "bg-[#361F30] blur-0"
    )}>
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full transition-all duration-1000",
          step !== 'intro' && "bg-primary/30 scale-150"
        )} />
        <div className={cn(
          "absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full transition-all duration-1000",
          step !== 'intro' && "bg-accent/30 scale-125 translate-x-10"
        )} />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Step 1: Intro */}
        {step === 'intro' && (
          <div className="flex flex-col items-center gap-12 animate-in fade-in duration-1000">
            <Mascot state="idle" />
            <div className="h-24 flex flex-col items-center">
              <AnimatedText 
                text={texts[0]} 
                className="text-2xl md:text-4xl font-bold text-center text-white drop-shadow-lg"
              />
            </div>
            <button
              onClick={handleCreateSound}
              className="group relative px-8 py-4 bg-primary text-white rounded-full text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(229,38,171,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                CREATE MY SOUND
              </span>
            </button>
          </div>
        )}

        {/* Step 2 & 3: Activation & Magic */}
        {(step === 'activation' || step === 'magic') && (
          <div className="flex flex-col items-center gap-12 text-center">
             <Mascot 
              state={step === 'magic' ? 'reacting' : 'active'} 
              bpm={audioEngine?.getBPM()}
            />
            <div className="h-24">
              <AnimatedText 
                text={step === 'activation' ? texts[1] : texts[2]} 
                className="text-3xl md:text-5xl font-bold text-accent"
              />
            </div>
            {step === 'magic' && (
              <div className="flex gap-2 animate-bounce">
                <Waves className="w-8 h-8 text-primary" />
                <Music className="w-8 h-8 text-accent" />
                <Heart className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Final Dashboard */}
        {step === 'dashboard' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in zoom-in-95 duration-1000">
            {/* Left: Mascot & Controls */}
            <div className="lg:col-span-4 flex flex-col items-center gap-6">
              <div className="p-8 bg-card/30 backdrop-blur-xl rounded-3xl border border-white/5 w-full flex flex-col items-center shadow-2xl">
                <Mascot state="active" bpm={audioEngine?.getBPM()} />
                <div className="mt-8 w-full">
                  <h3 className="text-accent font-bold text-center mb-2 flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" /> BIOMETRIC SYNC
                  </h3>
                  <BiometricMonitor />
                </div>
              </div>
              
              <div className="w-full p-6 bg-card/20 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold opacity-60">PULSE (BPM)</span>
                  <span className="text-xl font-headline text-primary">
                    {audioEngine?.getBPM()?.toFixed(0)}
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${(audioEngine?.getBPM() || 80) / 2}%` }} 
                   />
                </div>
              </div>
            </div>

            {/* Right: Instruments */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Music className="w-5 h-5" />
                  PIANO ROLL
                </div>
                <PianoRoll />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent font-bold">
                  <Sparkles className="w-5 h-5" />
                  RHYTHM PADS
                </div>
                <DrumPads />
              </div>

              <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Loop Engine</h4>
                  <p className="text-xs text-muted-foreground">Adjust your magical sequence settings</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">8</div>
                    <div className="text-[10px] opacity-50 uppercase">Notes</div>
                  </div>
                  <div className="text-center border-l border-white/10 pl-4">
                    <div className="text-lg font-bold">4</div>
                    <div className="text-[10px] opacity-50 uppercase">Bars</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Sparkles Decor */}
      <div className="fixed top-12 right-12 opacity-30 animate-pulse-slow">
        <Sparkles className="w-12 h-12 text-accent" />
      </div>
      <div className="fixed bottom-12 left-12 opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }}>
        <Waves className="w-12 h-12 text-primary" />
      </div>
    </main>
  );
}
