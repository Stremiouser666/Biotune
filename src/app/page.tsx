"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { audioEngine, type AudioMode } from '@/lib/audio-engine';
import { Sparkles, Music, Waves, Heart, Home, Plus, Minus, Layers, Upload, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FlowStep = 'intro' | 'activation' | 'magic' | 'dashboard';

export default function BiotuneApp() {
  const [step, setStep] = useState<FlowStep>('intro');
  const [bpm, setBpm] = useState(80);
  const [loopNotes, setLoopNotes] = useState(8);
  const [loopBars, setLoopBars] = useState(4);
  const [audioMode, setAudioMode] = useState<AudioMode>('sampled');
  const [customFiles, setCustomFiles] = useState<{ [key: string]: string }>({});
  const [isPulsing, setIsPulsing] = useState(false);

  // Wire up drum hit reaction
  useEffect(() => {
    if (audioEngine) {
      audioEngine.setOnDrumHit(() => {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 150);
      });
    }
  }, []);

  // Poll BPM and Mode for live display updates
  useEffect(() => {
    if (step !== 'dashboard') return;
    const interval = setInterval(() => {
      if (audioEngine) {
        setBpm(audioEngine.getBPM());
        setAudioMode(audioEngine.getMode());
      }
    }, 500);
    return () => clearInterval(interval);
  }, [step]);

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

  const handleGoHome = () => {
    audioEngine?.stop();
    setStep('intro');
  };

  const updateLoop = (notes: number, bars: number) => {
    setLoopNotes(notes);
    setLoopBars(bars);
    audioEngine?.updateLoop(notes, bars);
  };

  const toggleAudioMode = (mode?: AudioMode) => {
    const nextModes: AudioMode[] = ['synth', 'sampled', 'custom'];
    const currentIndex = nextModes.indexOf(audioMode);
    const newMode = mode || nextModes[(currentIndex + 1) % nextModes.length];
    setAudioMode(newMode);
    audioEngine?.setMode(newMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomFiles(prev => ({ ...prev, [type]: file.name }));

    if (type === 'piano') {
      audioEngine?.setCustomPiano(url);
    } else {
      audioEngine?.setCustomDrums(type as any, url);
    }
  };

  return (
    <main className="relative min-h-svh w-full overflow-hidden">
      {/* 🌌 Background Layer */}
      <div 
        className={cn(
          "fixed inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover bg-no-repeat transition-all [transition-duration:2500ms] cubic-bezier(0.23, 1, 0.32, 1) animate-wavy",
          step === 'intro' ? "opacity-40 blur-[8px]" : "opacity-100 blur-0",
          isPulsing && "animate-bg-pulse"
        )} 
      />

      {/* 🌊 Magical Wave Layers */}
      <div className="waves-layer">
        <svg className="w-full h-full" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className="parallax">
            <use href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7)" />
            <use href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
            <use href="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
            <use href="#gentle-wave" x="48" y="7" fill="rgba(255,255,255,1)" />
          </g>
        </svg>
      </div>

      {/* 🌑 Subtle Atmosphere Overlay */}
      <div 
        className={cn(
          "fixed inset-0 transition-all [transition-duration:2500ms] ease-in-out pointer-events-none",
          step === 'intro' ? "bg-white/20 backdrop-blur-[1px]" : "bg-transparent"
        )} 
      />

      {/* ✨ Sparkles Layer */}
      <div className="fixed inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.3)_1px,_transparent_1px)] bg-[length:40px_40px] animate-sparkle-move pointer-events-none" />

      {/* 🏠 Home Button */}
      {step === 'dashboard' && (
        <button
          onClick={handleGoHome}
          className="fixed top-6 right-6 p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 active:scale-95 transition-all z-50 group animate-in fade-in duration-1000"
          title="Go Home"
        >
          <Home className="w-6 h-6 text-[#ff4dff] group-hover:rotate-[-10deg] transition-transform" />
        </button>
      )}

      {/* 🎭 Main Content Container */}
      <div className="relative z-10 w-full h-svh flex flex-col items-center pt-[60px] px-6 text-center overflow-auto">
        
        <div className="mb-10">
          <Mascot state={step === 'magic' || step === 'activation' ? 'reacting' : step === 'dashboard' ? 'active' : 'idle'} />
        </div>

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
            <div className="flex flex-col items-center gap-12 text-center animate-scroll-open">
              <AnimatedText 
                text={step === 'activation' ? texts[1] : texts[2]} 
                className="text-3xl md:text-5xl font-headline"
              />
              {step === 'magic' && (
                <div className="flex gap-4 animate-bounce">
                  <Waves className="w-10 h-10 text-[#ff4dff]" />
                  <Music className="w-10 h-10 text-[#ff4dff]" />
                  <Heart className="w-10 h-10 text-[#ff4dff]" />
                </div>
              )}
            </div>
          )}

          {step === 'dashboard' && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-scroll-open pb-20 text-black">
              <div className="lg:col-span-4 flex flex-col items-center gap-6">
                <div className="w-full p-8 bg-white/20 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl">
                  <h3 className="text-black font-headline text-center mb-6 flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-[#ff4dff]" /> BIOMETRIC SYNC
                  </h3>
                  <BiometricMonitor />
                </div>
                
                <div className="w-full p-6 bg-white/30 rounded-2xl border border-white/40 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-headline opacity-60 uppercase">PULSE (BPM)</span>
                    <span className="text-2xl font-headline text-[#ff4dff]">
                      {bpm.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                     <div 
                      className="h-full bg-[#ff4dff] transition-all duration-500" 
                      style={{ width: `${Math.min(100, (bpm / 200) * 100)}%` }} 
                     />
                  </div>
                </div>

                <div className="w-full p-6 bg-white/30 rounded-2xl border border-white/40 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-[#ff4dff]" />
                      <span className="text-sm font-headline uppercase opacity-60">Palette</span>
                    </div>
                    <button 
                      onClick={() => toggleAudioMode()}
                      className="px-4 py-2 bg-[#ff4dff] text-white rounded-xl font-headline text-[10px] shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      {audioMode === 'synth' ? 'SYNTHETIC' : audioMode === 'sampled' ? 'MAGICAL SAMPLES' : 'PERSONALIZED'}
                    </button>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/40 border border-[#ff4dff]/40 rounded-xl font-headline text-xs hover:bg-white/60 transition-colors">
                        <Wand2 className="w-4 h-4 text-[#ff4dff]" />
                        CUSTOMIZE SOUNDS
                      </button>
                    </DialogTrigger>
                    <DialogContent className="font-headline bg-white/90 backdrop-blur-xl border-[#ff4dff]/40">
                      <DialogHeader>
                        <DialogTitle className="text-2xl text-[#ff4dff]">MAGIC SAMPLE IMPORTER</DialogTitle>
                        <DialogDescription className="text-black/60">Upload your own magical audio files to use in personalized mode.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {[
                          { id: 'piano', label: 'Piano Sample', icon: Music },
                          { id: 'kick', label: 'Kick Drum', icon: Heart },
                          { id: 'snare', label: 'Snare Drum', icon: Waves },
                          { id: 'hat', label: 'Hi-Hat', icon: Sparkles },
                        ].map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-black/5 p-3 rounded-xl border border-black/5">
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4 text-[#ff4dff]" />
                              <div>
                                <p className="text-sm font-headline">{item.label}</p>
                                <p className="text-[10px] opacity-60 truncate max-w-[150px]">
                                  {customFiles[item.id] || 'No file selected'}
                                </p>
                              </div>
                            </div>
                            <label className="cursor-pointer bg-[#ff4dff] p-2 rounded-lg hover:scale-105 transition-transform">
                              <Upload className="w-4 h-4 text-white" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="audio/*" 
                                onChange={(e) => handleFileUpload(e, item.id)}
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => toggleAudioMode('custom')}
                        className="w-full py-4 bg-[#ff4dff] text-white rounded-2xl font-headline shadow-lg"
                      >
                        ACTIVATE PERSONALIZED SOUNDS
                      </button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

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
                    <h4 className="font-headline text-black text-lg text-left">Loop Engine</h4>
                    <p className="text-xs text-black/60 font-body">Adjust your magical sequence settings</p>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => updateLoop(Math.max(1, loopNotes - 1), loopBars)}
                           className="p-1 hover:text-[#ff4dff] transition-colors"
                         >
                           <Minus className="w-4 h-4" />
                         </button>
                         <div className="text-2xl font-headline text-[#ff4dff] min-w-[30px]">{loopNotes}</div>
                         <button 
                           onClick={() => updateLoop(Math.min(16, loopNotes + 1), loopBars)}
                           className="p-1 hover:text-[#ff4dff] transition-colors"
                         >
                           <Plus className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="text-[10px] opacity-60 uppercase font-headline">Notes</div>
                    </div>
                    <div className="text-center border-l border-black/10 pl-8 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateLoop(loopNotes, Math.max(1, loopBars - 1))}
                          className="p-1 hover:text-[#ff4dff] transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-2xl font-headline text-[#ff4dff] min-w-[30px]">{loopBars}</div>
                        <button 
                          onClick={() => updateLoop(loopNotes, Math.min(16, loopBars + 1))}
                          className="p-1 hover:text-[#ff4dff] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
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