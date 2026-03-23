"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { audioEngine, type AudioMode } from '@/lib/audio-engine';
import { Sparkles, Music, Waves, Heart, Home, Plus, Minus, Layers, Upload, Wand2, Activity, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
          "fixed inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover bg-no-repeat transition-all [transition-duration:2500ms] cubic-bezier(0.23, 1, 0.32, 1)",
          step === 'intro' ? "opacity-40 blur-[8px]" : "opacity-100 blur-0 scale(1.05)",
          isPulsing && "animate-bg-pulse"
        )} 
      />

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
      <div className="relative z-10 w-full h-svh flex flex-col items-center pt-[60px] px-6 text-center overflow-auto scrollbar-hide">
        
        <div className="mb-10 shrink-0">
          <Mascot state={step === 'magic' || step === 'activation' ? 'reacting' : step === 'dashboard' ? 'active' : 'idle'} />
        </div>

        <div className="w-full max-w-4xl flex flex-col items-center gap-8 pb-20">
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
            <div className="w-full animate-scroll-open">
              <Accordion type="single" collapsible defaultValue="biometrics" className="w-full space-y-4">
                
                {/* 🧬 Biometric Sync Section */}
                <AccordionItem value="biometrics" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline hover:bg-white/60 transition-all group">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-[#ff4dff]" />
                      <span className="font-headline text-black text-left">BIOMETRIC SYNC</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/40">
                         <BiometricMonitor />
                      </div>
                      <div className="p-6 bg-white/30 rounded-2xl border border-white/40 shadow-lg flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-headline opacity-60 uppercase text-black">PULSE (BPM)</span>
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 🎨 Sound Palette Section */}
                <AccordionItem value="palette" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline hover:bg-white/60 transition-all">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-[#ff4dff]" />
                      <span className="font-headline text-black text-left">SOUND PALETTE</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <div className="p-6 bg-white/30 rounded-2xl border border-white/40 shadow-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-headline uppercase opacity-60 text-black">CURRENT MODE</span>
                        <button 
                          onClick={() => toggleAudioMode()}
                          className="px-6 py-2 bg-[#ff4dff] text-white rounded-xl font-headline text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
                        >
                          {audioMode === 'synth' ? 'SYNTHETIC' : audioMode === 'sampled' ? 'MAGICAL SAMPLES' : 'PERSONALIZED'}
                        </button>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="w-full flex items-center justify-center gap-2 py-4 bg-white/40 border border-[#ff4dff]/40 rounded-xl font-headline text-sm text-black hover:bg-white/60 transition-colors">
                            <Wand2 className="w-5 h-5 text-[#ff4dff]" />
                            CUSTOMIZE SAMPLES
                          </button>
                        </DialogTrigger>
                        <DialogContent className="font-headline bg-white/95 backdrop-blur-xl border-[#ff4dff]/40">
                          <DialogHeader>
                            <DialogTitle className="text-2xl text-[#ff4dff]">MAGIC SAMPLE IMPORTER</DialogTitle>
                            <DialogDescription className="text-black/60">Upload your own magical audio files for personalized mode.</DialogDescription>
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
                                  <div className="text-left">
                                    <p className="text-sm font-headline text-black">{item.label}</p>
                                    <p className="text-[10px] opacity-60 truncate max-w-[150px] text-black">
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
                  </AccordionContent>
                </AccordionItem>

                {/* 🎹 Melody Studio Section */}
                <AccordionItem value="melody" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline hover:bg-white/60 transition-all">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-[#ff4dff]" />
                      <span className="font-headline text-black text-left">MELODY STUDIO</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <PianoRoll />
                  </AccordionContent>
                </AccordionItem>

                {/* 🥁 Rhythm Studio Section */}
                <AccordionItem value="rhythm" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline hover:bg-white/60 transition-all">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-[#ff4dff]" />
                      <span className="font-headline text-black text-left">RHYTHM STUDIO</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <DrumPads />
                  </AccordionContent>
                </AccordionItem>

                {/* ⚙️ Loop Engine Section */}
                <AccordionItem value="engine" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline hover:bg-white/60 transition-all">
                    <div className="flex items-center gap-3">
                      <Settings2 className="w-5 h-5 text-[#ff4dff]" />
                      <span className="font-headline text-black text-left">LOOP ENGINE</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <div className="p-8 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-md gap-6">
                      <div className="text-center md:text-left">
                        <h4 className="font-headline text-black text-lg">Magical Sequence</h4>
                        <p className="text-xs text-black/60 font-body">Refine your musical architecture</p>
                      </div>
                      <div className="flex gap-12">
                        <div className="text-center flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateLoop(Math.max(1, loopNotes - 1), loopBars)}
                              className="p-2 bg-black/5 rounded-full hover:text-[#ff4dff] transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-3xl font-headline text-[#ff4dff] min-w-[40px]">{loopNotes}</div>
                            <button 
                              onClick={() => updateLoop(Math.min(16, loopNotes + 1), loopBars)}
                              className="p-2 bg-black/5 rounded-full hover:text-[#ff4dff] transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[10px] opacity-60 uppercase font-headline text-black">Notes per Bar</div>
                        </div>
                        <div className="text-center border-l border-black/10 pl-12 flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateLoop(loopNotes, Math.max(1, loopBars - 1))}
                              className="p-2 bg-black/5 rounded-full hover:text-[#ff4dff] transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-3xl font-headline text-[#ff4dff] min-w-[40px]">{loopBars}</div>
                            <button 
                              onClick={() => updateLoop(loopNotes, Math.min(16, loopBars + 1))}
                              className="p-2 bg-black/5 rounded-full hover:text-[#ff4dff] transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[10px] opacity-60 uppercase font-headline text-black">Loop Length (Bars)</div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
