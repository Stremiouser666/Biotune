
"use client";

import React, { useState } from 'react';
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

  const texts = [
    "Hi… let’s create magical music from you together 🎶",
    "your magical music journey begins now 🎶",
    "🎧 listen… this is your magic"
  ];

  const handleCreateSound = async () => {
    await audioEngine?.start();
    setStep('activation');
    
    setTimeout(() => {
      setStep('magic');
      setTimeout(() => {
        setStep('dashboard');
      }, 4000);
    }, 3000);
  };

  return (
    <main className="relative min-h-svh w-full overflow-hidden">
      {/* 🌌 Background Layer */}
      <div 
        className={cn(
          "fixed inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover bg-no-repeat transition-all duration-[2000ms] ease-in-out",
          step === 'intro' ? "opacity-40 blur-[6px]" : "opacity-100 blur-0 scale-105"
        )} 
      />

      {/* 🌑 Overlay Layer */}
      <div 
        className={cn(
          "fixed inset-0 transition-all duration-[2000ms] ease-in-out",
          step === 'intro' ? "bg-white/40" : "bg-white/50"
        )} 
      />

      {/* ✨ Sparkles Layer */}
      <div className="fixed inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.3)_1px,_transparent_1px)] bg-[length:40px_40px] animate-sparkle-move pointer-events-none" />

      {/* 🎭 Main Content Container */}
      <div className="relative z-10 w-full h-svh flex flex-col items-center pt-[60px] px-6 text-center overflow-auto">
        
        {/* Mascot is always visible in different states */}
        <div className="mb-10">
          <Mascot state={step === 'magic' || step === 'activation' ? 'reacting' : step === 'dashboard' ? 'active' : 'idle'} />
        </div>

        {/* Step-specific UI */}
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
          {step === 'intro' && (
            <>
              <AnimatedText 
                text={texts[0]} 
                className="text-2xl md:text-4xl font-headline"
              />
              <button
                id="btn"
                onClick={handleCreateSound}
                className="fixed bottom-[30px] left-1/2 -translate-x-1/2 px-[25px] py-[15px] text-[20px] bg-[#ff4dff] text-white rounded-[12px] shadow-[0_0_30px_rgba(255,77,255,0.9)] transition-all hover:scale-105 active:scale-95 z-50 font-headline"
              >
                ✨ CREATE MY SOUND
              </button>
            </>
          )}

          {(step === 'activation' || step === 'magic') && (
            <div className="flex flex-col items-center gap-12 text-center animate-in fade-in duration-1000">
              <AnimatedText 
                text={step === 'activation' ? texts[1] : texts[2]} 
                className="text-3xl md:text-5xl font-headline"
              />
              {step === 'magic' && (
                <div className="flex gap-4 animate-bounce">
                  <Waves className="w-10 h-10 text-primary" />
                  <Music className="w-10 h-10 text-[#ff4dff]" />
                  <Heart className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
          )}

          {step === 'dashboard' && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in zoom-in-95 duration-1000 pb-20">
              {/* Left Column: Biometrics */}
              <div className="lg:col-span-4 flex flex-col items-center gap-6">
                <div className="w-full p-8 bg-white/20 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl">
                  <h3 className="text-black font-headline text-center mb-6 flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-[#ff4dff]" /> BIOMETRIC SYNC
                  </h3>
                  <BiometricMonitor />
                </div>
                
                <div className="w-full p-6 bg-white/30 rounded-2xl border border-white/40 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-headline opacity-60">PULSE (BPM)</span>
                    <span className="text-2xl font-headline text-[#ff4dff]">
                      {audioEngine?.getBPM()?.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                     <div 
                      className="h-full bg-[#ff4dff] transition-all duration-1000" 
                      style={{ width: `${(audioEngine?.getBPM() || 80) / 2}%` }} 
                     />
                  </div>
                </div>
              </div>

              {/* Right Column: Instruments */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-black font-headline">
                    <Music className="w-6 h-6 text-[#ff4dff]" />
                    PIANO ROLL
                  </div>
                  <PianoRoll />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-black font-headline">
                    <Sparkles className="w-6 h-6 text-[#ff4dff]" />
                    RHYTHM PADS
                  </div>
                  <DrumPads />
                </div>

                <div className="p-6 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <h4 className="font-headline text-black text-lg">Loop Engine</h4>
                    <p className="text-xs text-black/60 font-body">Adjust your magical sequence settings</p>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-headline text-[#ff4dff]">8</div>
                      <div className="text-[10px] opacity-60 uppercase font-headline">Notes</div>
                    </div>
                    <div className="text-center border-l border-black/10 pl-8">
                      <div className="text-2xl font-headline text-[#ff4dff]">4</div>
                      <div className="text-[10px] opacity-60 uppercase font-headline">Bars</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
