
"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { audioEngine, type AudioMode } from '@/lib/audio-engine';
import { Sparkles, Music, Save, RotateCcw, Trash2, Home, Layers, Upload, Wand2, Activity, Settings2, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('sampled');
  const [isPulsing, setIsPulsing] = useState(false);
  const [breathingIntensity, setBreathingIntensity] = useState(0);
  const [rootNote, setRootNote] = useState("C");
  const [sessionVersion, setSessionVersion] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (audioEngine) {
      const handleHit = () => {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 150);
      };
      audioEngine.addOnDrumHit(handleHit);
      return () => audioEngine.removeOnDrumHit(handleHit);
    }
  }, []);

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

  const handleCreateSound = async () => {
    await audioEngine?.start();
    setIsPlaying(true);
    setStep('activation');
    setTimeout(() => {
      setStep('magic');
      setTimeout(() => setStep('dashboard'), 4000);
    }, 3000);
  };

  const togglePlay = () => {
    audioEngine?.togglePlay();
    setIsPlaying(!isPlaying);
  };

  const handleGoHome = () => {
    audioEngine?.stop();
    setIsPlaying(false);
    setStep('intro');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'piano') audioEngine?.setCustomPiano(url);
    else audioEngine?.setCustomDrums(type as any, url);
    toast({ title: "Sample Imported", description: `${type.toUpperCase()} is now customized!` });
  };

  const handleSaveSession = () => {
    audioEngine?.saveSession();
    toast({ title: "Session Saved", description: "Your magical creation is safe in your browser." });
  };

  const handleLoadSession = () => {
    const data = audioEngine?.loadSession();
    if (data) {
      setSessionVersion(v => v + 1);
      setRootNote(data.rootNote);
      setBpm(audioEngine?.getBPM() || 80);
      toast({ title: "Session Loaded", description: "Welcome back to your creation!" });
    } else {
      toast({ variant: "destructive", title: "Load Failed", description: "No saved session found." });
    }
  };

  const handleResetSession = () => {
    audioEngine?.resetSession();
    setSessionVersion(v => v + 1);
    toast({ title: "Session Reset", description: "Starting with a clean magical canvas." });
  };

  return (
    <main className="relative min-h-svh w-full overflow-hidden">
      <div 
        className={cn(
          "fixed inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover bg-no-repeat transition-all [transition-duration:1500ms]",
          step === 'intro' ? "opacity-40 blur-[8px]" : "opacity-100 blur-0 scale-[1.05] [filter:brightness(0.6)_saturate(0.7)]",
          isPulsing && "animate-bg-pulse scale-110 saturate-150 brightness-90"
        )} 
      />
      <div className="fixed inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.3)_1px,_transparent_1px)] bg-[length:40px_40px] animate-sparkle-move pointer-events-none" />

      {step === 'dashboard' && (
        <button onClick={handleGoHome} className="fixed top-6 right-6 p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 active:scale-95 transition-all z-50">
          <Home className="w-6 h-6 text-primary" />
        </button>
      )}

      <div className="relative z-10 w-full h-svh flex flex-col items-center pt-[60px] px-6 text-center overflow-auto scrollbar-hide">
        <div className="mb-10 shrink-0">
          <Mascot 
            state={step === 'magic' || step === 'activation' ? 'reacting' : step === 'dashboard' ? 'active' : 'idle'} 
            intensity={breathingIntensity}
          />
        </div>

        <div className="w-full max-w-4xl flex flex-col items-center gap-8 pb-20">
          {step === 'intro' && (
            <div className="flex flex-col items-center gap-10">
              <AnimatedText text="Hi… let’s create magical music from you together 🎶" className="text-2xl md:text-4xl font-headline" />
              <button onClick={handleCreateSound} className="px-8 py-5 text-xl bg-primary text-white rounded-2xl shadow-[0_0_30px_rgba(255,77,255,0.8)] transition-all hover:scale-105 active:scale-95 font-headline whitespace-nowrap">
                ✨ CREATE MY SOUND
              </button>
            </div>
          )}

          {step === 'activation' && (
            <div className="flex flex-col items-center gap-6">
              <AnimatedText text="Listening to your presence..." className="text-xl md:text-3xl font-headline" />
              <div className="flex gap-2 items-center text-primary/60">
                <Activity className="w-6 h-6 animate-pulse" />
                <span className="text-xs font-headline">CALIBRATING BIOMETRICS</span>
              </div>
            </div>
          )}

          {step === 'magic' && (
            <div className="flex flex-col items-center gap-6">
              <AnimatedText text="A unique musical theme is coming alive ✨" className="text-xl md:text-3xl font-headline" />
              <AnimatedText text="Connecting rhythm to your movement..." delayPerWord={300} className="text-sm opacity-60" />
            </div>
          )}

          {step === 'dashboard' && (
            <div className="w-full animate-scroll-open space-y-4">
              <Accordion type="single" collapsible defaultValue="biometrics" className="w-full space-y-4">
                <AccordionItem value="biometrics" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-primary" /><span className="font-headline text-black">BIOMETRIC SYNC</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <BiometricMonitor onBreathingUpdate={setBreathingIntensity} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="palette" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Layers className="w-5 h-5 text-primary" /><span className="font-headline text-black">SOUND PALETTE</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2 space-y-4">
                    <div className="p-6 bg-white/30 rounded-2xl border border-white/40 shadow-lg space-y-6">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["C", "D", "E", "F", "G"].map(note => (
                          <button key={note} onClick={() => { setRootNote(note); audioEngine?.updateScale(note); setSessionVersion(v => v + 1); }} className={cn("px-4 py-2 rounded-xl font-headline transition-all", rootNote === note ? "bg-primary text-white scale-110" : "bg-white/40")}>
                            {note}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-headline opacity-60">MODE</span>
                        <button onClick={() => { const modes: AudioMode[] = ['synth', 'sampled', 'custom']; const next = modes[(modes.indexOf(audioMode) + 1) % 3]; setAudioMode(next); audioEngine?.setMode(next); }} className="px-6 py-2 bg-primary text-white rounded-xl font-headline text-xs">
                          {audioMode.toUpperCase()}
                        </button>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild><button className="w-full py-4 bg-white/40 border border-primary/40 rounded-xl font-headline text-sm"><Wand2 className="w-5 h-5 inline mr-2" />CUSTOMIZE SAMPLES</button></DialogTrigger>
                        <DialogContent className="font-headline">
                          <DialogHeader>
                            <DialogTitle className="text-primary">SAMPLE IMPORTER</DialogTitle>
                            <DialogDescription className="text-xs opacity-60">
                              Import your own magical .wav or .mp3 files to customize your sound palette.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            {['piano', 'kick', 'snare', 'hat'].map(id => (
                              <div key={id} className="flex items-center justify-between bg-black/5 p-3 rounded-xl">
                                <span className="text-sm">{id.toUpperCase()}</span>
                                <label className="cursor-pointer bg-primary p-2 rounded-lg text-white"><Upload className="w-4 h-4" /><input type="file" className="hidden" accept="audio/*" onChange={e => handleFileUpload(e, id)} /></label>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="memory" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Save className="w-5 h-5 text-primary" /><span className="font-headline text-black">MAGIC MEMORY</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-white/30 rounded-2xl border border-white/40 shadow-lg">
                      <button onClick={handleSaveSession} className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-xl hover:bg-primary/20 transition-all active:scale-95">
                        <Save className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-headline">SAVE</span>
                      </button>
                      <button onClick={handleLoadSession} className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-xl hover:bg-primary/20 transition-all active:scale-95">
                        <RotateCcw className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-headline">LOAD</span>
                      </button>
                      <button onClick={handleResetSession} className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-xl hover:bg-destructive/20 transition-all active:scale-95">
                        <Trash2 className="w-6 h-6 text-destructive" />
                        <span className="text-[10px] font-headline text-destructive">RESET</span>
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="melody" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Music className="w-5 h-5 text-primary" /><span className="font-headline text-black">MELODY STUDIO</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2"><PianoRoll sessionVersion={sessionVersion} /></AccordionContent>
                </AccordionItem>

                <AccordionItem value="rhythm" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /><span className="font-headline text-black">RHYTHM STUDIO</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2"><DrumPads sessionVersion={sessionVersion} /></AccordionContent>
                </AccordionItem>

                <AccordionItem value="engine" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Settings2 className="w-5 h-5 text-primary" /><span className="font-headline text-black">LOOP ENGINE</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <div className="p-8 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl flex flex-col gap-8 shadow-md">
                      <div className="flex justify-between items-center w-full">
                        <button onClick={togglePlay} className="p-6 bg-primary text-white rounded-full shadow-xl active:scale-95 transition-all">
                          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                        </button>
                        <div className="text-right">
                          <div className="text-4xl font-headline text-primary">{bpm.toFixed(0)}</div>
                          <div className="text-[10px] font-headline opacity-60">LIVE PULSE (BPM)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 w-full">
                        <Volume2 className="w-5 h-5 opacity-40" />
                        <Slider defaultValue={[0.8]} max={1} step={0.01} onValueChange={([val]) => audioEngine?.setMasterVolume(val)} className="flex-1" />
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
