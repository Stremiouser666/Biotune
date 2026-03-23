
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { audioEngine, type AudioMode } from '@/lib/audio-engine';
import { Sparkles, Music, Save, RotateCcw, Trash2, Home, Layers, Upload, Wand2, Activity, Settings2, Play, Pause, Volume2, Share2, Timer, Mic, Square, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [isRecording, setIsRecording] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('sampled');
  const [isPulsing, setIsPulsing] = useState(false);
  const [breathingIntensity, setBreathingIntensity] = useState(0);
  const [rootNote, setRootNote] = useState("C");
  const [sessionVersion, setSessionVersion] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [chordMode, setChordMode] = useState(false);
  const [activeSlot, setActiveSlot] = useState('A');
  const tapTimes = useRef<number[]>([]);
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

  useEffect(() => {
    const isFirstTime = !localStorage.getItem('biotune_onboarded');
    if (step === 'dashboard' && isFirstTime) {
      setOnboardingStep(0);
    }
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

  const handleToggleRecording = async () => {
    if (!isRecording) {
      await audioEngine?.startRecording();
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Capturing your magical creation..." });
    } else {
      await audioEngine?.stopRecording();
      setIsRecording(false);
      toast({ title: "Recording Saved", description: "Audio exported successfully!" });
    }
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
    toast({ title: "Session Saved", description: `Slot ${activeSlot} is safe in your browser.` });
  };

  const handleLoadSession = () => {
    const data = audioEngine?.loadSession();
    if (data) {
      setSessionVersion(v => v + 1);
      setRootNote(data.rootNote || "C");
      setBpm(audioEngine?.getBPM() || 80);
      setChordMode(!!data.chordMode);
      toast({ title: "Session Loaded", description: `Restored slot ${activeSlot} successfully.` });
    } else {
      toast({ variant: "destructive", title: "Load Failed", description: `No saved data in slot ${activeSlot}.` });
    }
  };

  const handleResetSession = () => {
    audioEngine?.resetSession();
    setSessionVersion(v => v + 1);
    toast({ title: "Session Reset", description: `Slot ${activeSlot} has been cleared.` });
  };

  const handleSwitchSlot = (slot: string) => {
    setActiveSlot(slot);
    audioEngine?.setSlot(slot);
    // Auto-load slot when switched
    const data = audioEngine?.loadSession();
    if (data) {
      setSessionVersion(v => v + 1);
      setRootNote(data.rootNote || "C");
      setChordMode(!!data.chordMode);
    }
  };

  const handleToggleChordMode = (val: boolean) => {
    setChordMode(val);
    audioEngine?.setChordMode(val);
    audioEngine?.saveSession();
  };

  const handleTapTempo = () => {
    const now = performance.now();
    tapTimes.current = [...tapTimes.current, now].slice(-4);
    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const nextBpm = 60000 / avgInterval;
      audioEngine?.setBPM(nextBpm);
      setBpm(nextBpm);
    }
  };

  const handleShare = () => {
    const data = audioEngine?.getSessionData();
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}?session=${encoded}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Share this link with someone to show your creation." });
  };

  const finishOnboarding = () => {
    setOnboardingStep(null);
    localStorage.setItem('biotune_onboarded', 'true');
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
        <div className="fixed top-6 right-6 flex gap-2 z-50">
          <button onClick={handleShare} className="p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 active:scale-95 transition-all">
            <Share2 className="w-6 h-6 text-primary" />
          </button>
          <button onClick={handleGoHome} className="p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 active:scale-95 transition-all">
            <Home className="w-6 h-6 text-primary" />
          </button>
        </div>
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
                <AccordionItem value="biometrics" className={cn("border-none transition-all", onboardingStep === 0 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-primary" /><span className="font-headline text-black">BIOMETRIC SYNC</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <BiometricMonitor onBreathingUpdate={setBreathingIntensity} />
                    {onboardingStep === 0 && (
                      <div className="mt-4 p-4 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-xs font-headline flex flex-col gap-3">
                        Connect your mic and movement to influence the loop's pulse!
                        <button onClick={() => setOnboardingStep(1)} className="bg-primary text-white py-2 rounded-lg">NEXT: MELODY</button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="melody" className={cn("border-none transition-all", onboardingStep === 1 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Music className="w-5 h-5 text-primary" /><span className="font-headline text-black">MELODY STUDIO</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2 space-y-4">
                    <div className="flex items-center justify-between px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/40">
                      <div className="flex items-center gap-3">
                        <Zap className={cn("w-4 h-4 transition-colors", chordMode ? "text-primary" : "text-black/40")} />
                        <Label htmlFor="chord-mode" className="text-[10px] font-headline cursor-pointer">CHORD MODE</Label>
                      </div>
                      <Switch 
                        id="chord-mode" 
                        checked={chordMode} 
                        onCheckedChange={handleToggleChordMode}
                      />
                    </div>
                    <PianoRoll sessionVersion={sessionVersion} />
                    {onboardingStep === 1 && (
                      <div className="mt-4 p-4 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-xs font-headline flex flex-col gap-3">
                        Tap cells to compose your magical theme. Enable Chord Mode for lush sounds!
                        <button onClick={() => setOnboardingStep(2)} className="bg-primary text-white py-2 rounded-lg">NEXT: RHYTHM</button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rhythm" className={cn("border-none transition-all", onboardingStep === 2 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /><span className="font-headline text-black">RHYTHM STUDIO</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <DrumPads sessionVersion={sessionVersion} />
                    {onboardingStep === 2 && (
                      <div className="mt-4 p-4 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-xs font-headline flex flex-col gap-3">
                        Layer beats into your session. Mute rows or clear them with a long-press.
                        <button onClick={finishOnboarding} className="bg-primary text-white py-2 rounded-lg">LET'S GO!</button>
                      </div>
                    )}
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

                <AccordionItem value="engine" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Settings2 className="w-5 h-5 text-primary" /><span className="font-headline text-black">LOOP ENGINE</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    <div className="p-8 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl flex flex-col gap-8 shadow-md">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex gap-4">
                          <button onClick={togglePlay} className="p-6 bg-primary text-white rounded-full shadow-xl active:scale-95 transition-all">
                            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                          </button>
                          <button 
                            onClick={handleToggleRecording} 
                            className={cn(
                              "p-6 rounded-full shadow-xl active:scale-95 transition-all",
                              isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white/40 text-black/60"
                            )}
                          >
                            {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                          </button>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div className="text-4xl font-headline text-primary">{bpm.toFixed(0)}</div>
                          <button onClick={handleTapTempo} className="flex items-center gap-2 px-3 py-1 bg-white/40 rounded-lg text-[10px] font-headline">
                            <Timer className="w-3 h-3" /> TAP TEMPO
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-6">
                          <Volume2 className="w-5 h-5 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="text-[10px] font-headline opacity-40 text-left">VOLUME</div>
                            <Slider defaultValue={[1]} max={1} step={0.01} onValueChange={([val]) => audioEngine?.setMasterVolume(val)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <Sparkles className="w-5 h-5 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="text-[10px] font-headline opacity-40 text-left">MAGIC REVERB</div>
                            <Slider defaultValue={[0.2]} max={1} step={0.01} onValueChange={([val]) => audioEngine?.setReverb(val)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <Activity className="w-5 h-5 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="text-[10px] font-headline opacity-40 text-left">HUMAN SWING</div>
                            <Slider defaultValue={[0]} max={0.5} step={0.01} onValueChange={([val]) => audioEngine?.setSwing(val)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="memory" className="border-none">
                  <AccordionTrigger className="flex gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-md hover:no-underline">
                    <div className="flex items-center gap-3"><Save className="w-5 h-5 text-primary" /><span className="font-headline text-black">MAGIC MEMORY</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2 space-y-4">
                    <div className="flex justify-center gap-3 p-2 bg-white/20 rounded-2xl">
                      {['A', 'B', 'C'].map(slot => (
                        <button 
                          key={slot}
                          onClick={() => handleSwitchSlot(slot)}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-headline text-xs transition-all",
                            activeSlot === slot ? "bg-primary text-white scale-105 shadow-md" : "bg-white/40"
                          )}
                        >
                          SLOT {slot}
                        </button>
                      ))}
                    </div>
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
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
