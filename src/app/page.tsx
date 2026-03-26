"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { FullscreenVisualizer } from '@/components/fullscreen-visualizer';
import { audioEngine, type AudioMode, type OscillatorType, type NoteLength } from '@/lib/audio-engine';
import { Sparkles, Music, Save, RotateCcw, Trash2, Home, Layers, Upload, Wand2, Activity, Settings2, Play, Pause, Volume2, Share2, Timer, Mic, Square, Zap, Undo, Dice5, Repeat, Sliders, Maximize2, Link, Moon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FlowStep = 'intro' | 'activation' | 'magic' | 'dashboard';

export default function BiotuneApp() {
  const [step, setStep] = useState<FlowStep>('intro');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAmbient, setIsAmbient] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('sampled');
  const [isPulsing, setIsPulsing] = useState(false);
  const [breathingIntensity, setBreathingIntensity] = useState(0);
  const [rootNote, setRootNote] = useState("C");
  const [sessionVersion, setSessionVersion] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [chordMode, setChordMode] = useState(false);
  const [isChaining, setIsChaining] = useState(false);
  const [activeSlot, setActiveSlot] = useState('A');
  const [activeScene, setActiveScene] = useState(0);
  const [accordionValue, setAccordionValue] = useState<string>("biometrics");
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [masterVolume, setMasterVolume] = useState(1);
  const [swing, setSwing] = useState(0);
  const [reverbWet, setReverbWet] = useState(0.25);
  const [delayWet, setDelayWet] = useState(0.3);
  const [filterFreq, setFilterFreq] = useState(20000);

  const tapTimes = useRef<number[]>([]);
  const sceneLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isSceneLongPress = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('session');
    if (sharedData && audioEngine) {
      try {
        const data = JSON.parse(atob(sharedData));
        audioEngine.loadSession(data);
        syncStateFromEngine();
        toast({ title: "Shared Session Loaded", description: "Enjoy this magical creation!" });
      } catch (e) {
        console.error("Failed to parse shared session", e);
      }
    }
  }, []);

  const syncStateFromEngine = () => {
    if (!audioEngine) return;
    const sessionData = audioEngine.getSessionData();
    setBpm(sessionData.bpm || 80);
    setRootNote(sessionData.rootNote || "C");
    setChordMode(!!sessionData.chordMode);
    setIsChaining(!!sessionData.isChaining);
    setActiveScene(audioEngine.getActiveSceneIndex());
    setMasterVolume(audioEngine.getMasterVolume());
    setSwing(audioEngine.getSwing());
    setReverbWet(audioEngine.getReverb());
    const d = audioEngine.getDelay();
    setDelayWet(d.wet);
    setFilterFreq(audioEngine.getFilter());
    setAudioMode(audioEngine.getMode());
    setSessionVersion(v => v + 1);
  };

  useEffect(() => {
    if (audioEngine) {
      setIsLoaded(audioEngine.getIsLoaded());
      const handleHit = () => {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 150);
      };
      audioEngine.addOnDrumHit(handleHit);
      audioEngine.addOnLoad(setIsLoaded);
      audioEngine.addOnSceneChange((idx) => {
        setActiveScene(idx);
        setSessionVersion(v => v + 1);
      });
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && step === 'dashboard' && !isFullscreen) {
          e.preventDefault();
          handleTapTempo();
        }
        if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code) && step === 'dashboard') {
          const idx = parseInt(e.code.replace('Digit', '')) - 1;
          audioEngine?.setScene(idx);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        if (audioEngine) {
          audioEngine.removeOnDrumHit(handleHit);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [step, isFullscreen]);

  useEffect(() => {
    if (step !== 'dashboard') return;
    const interval = setInterval(() => {
      if (audioEngine) {
        setBpm(audioEngine.getBPM());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    const isFirstTime = !localStorage.getItem('biotune_onboarded');
    if (step === 'dashboard' && isFirstTime) {
      setOnboardingStep(0);
      localStorage.setItem('biotune_onboarded', 'true');
    }
  }, [step]);

  useEffect(() => {
    if (onboardingStep === 0) setAccordionValue("biometrics");
    else if (onboardingStep === 1) setAccordionValue("melody");
    else if (onboardingStep === 2) setAccordionValue("rhythm");
  }, [onboardingStep]);

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
    setIsFullscreen(false);
  };

  const handleSaveSession = () => {
    audioEngine?.saveSession();
    toast({ title: "Session Saved", description: `Slot ${activeSlot} is safe.` });
  };

  const handleLoadSession = () => {
    const data = audioEngine?.loadSession();
    if (data) {
      syncStateFromEngine();
      toast({ title: "Session Loaded", description: `Restored slot ${activeSlot}.` });
    } else {
      toast({ variant: "destructive", title: "Load Failed" });
    }
  };

  const handleUndo = () => {
    const lastState = audioEngine?.undo();
    if (lastState) {
      syncStateFromEngine();
      toast({ title: "Action Undone" });
    }
  };

  const handleResetSession = () => {
    audioEngine?.resetSession();
    syncStateFromEngine();
    toast({ title: "Session Reset" });
  };

  const handleSwitchSlot = (slot: string) => {
    setActiveSlot(slot);
    audioEngine?.setSlot(slot);
    const data = audioEngine?.loadSession();
    if (data) {
      syncStateFromEngine();
    }
  };

  const handleToggleChordMode = (val: boolean) => {
    setChordMode(val);
    audioEngine?.setChordMode(val);
  };

  const handleToggleChaining = (val: boolean) => {
    setIsChaining(val);
    audioEngine?.setChaining(val);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    tapTimes.current = [...tapTimes.current, now].slice(-4);
    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const nextBpm = 60000 / avgInterval;
      audioEngine?.setBPM(nextBpm);
      setBpm(nextBpm);
    }
  };

  const handleShare = () => {
    const data = audioEngine?.getSessionData(true);
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?session=${encoded}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Share your active creation!" });
  };

  const handleMidiExport = () => {
    audioEngine?.exportMidi();
    toast({ title: "Pattern Exported", description: "Loop data prepared for DAW." });
  };

  const handleCopyScene = (to: number) => {
    audioEngine?.copyScene(activeScene, to);
    toast({ title: "Scene Copied", description: `Scene ${activeScene+1} -> ${to+1}` });
  };

  const handleSceneClick = (idx: number) => {
    if (!isSceneLongPress.current) {
      audioEngine?.setScene(idx);
    }
    isSceneLongPress.current = false;
  };

  const startSceneLongPress = (idx: number) => {
    isSceneLongPress.current = false;
    sceneLongPressTimer.current = setTimeout(() => {
      isSceneLongPress.current = true;
      handleCopyScene(idx);
    }, 600);
  };

  const stopSceneLongPress = () => {
    if (sceneLongPressTimer.current) clearTimeout(sceneLongPressTimer.current);
  };

  const handleFileUpload = (type: 'piano' | 'kick' | 'snare' | 'hat', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'piano') audioEngine?.setCustomPiano(url);
      else audioEngine?.setCustomDrums(type, url);
      toast({ title: "Sample Loaded", description: `${type.toUpperCase()} customized.` });
    }
  };

  return (
    <main className={cn("relative min-h-svh w-full overflow-hidden transition-all", isAmbient && "brightness-[0.2]")}>
      <div 
        className={cn(
          "fixed inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover bg-no-repeat transition-all [transition-duration:1500ms]",
          step === 'intro' ? "opacity-40 blur-[8px]" : "opacity-100 blur-0 scale-[1.05] [filter:brightness(0.6)_saturate(0.7)]",
          isPulsing && "animate-bg-pulse scale-110 saturate-150 brightness-90"
        )} 
      />
      <div className="fixed inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.3)_1px,_transparent_1px)] bg-[length:40px_40px] animate-sparkle-move pointer-events-none" />

      {isFullscreen && (
        <FullscreenVisualizer 
          onClose={() => setIsFullscreen(false)} 
          breathingIntensity={breathingIntensity} 
        />
      )}

      {step === 'dashboard' && !isFullscreen && (
        <div className="fixed top-4 right-4 flex gap-2 z-50">
          <button onClick={() => setIsAmbient(!isAmbient)} className={cn("p-3 backdrop-blur-md rounded-full border shadow-lg transition-all", isAmbient ? "bg-primary text-white" : "bg-white/40 text-primary")}>
            <Moon className="w-5 h-5" />
          </button>
          <button onClick={() => setIsFullscreen(true)} className="p-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 transition-all">
            <Maximize2 className="w-5 h-5 text-primary" />
          </button>
          <button onClick={handleShare} className="p-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 transition-all">
            <Share2 className="w-5 h-5 text-primary" />
          </button>
          <button onClick={handleGoHome} className="p-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 transition-all">
            <Home className="w-5 h-5 text-primary" />
          </button>
        </div>
      )}

      <div className="relative z-10 w-full h-svh flex flex-col items-center pt-10 px-4 text-center overflow-y-auto scrollbar-hide">
        <div className="mb-6 shrink-0">
          <Mascot state={['magic', 'activation'].includes(step) ? 'reacting' : step === 'dashboard' ? 'active' : 'idle'} intensity={breathingIntensity} isDancing={isPlaying && bpm > 110} />
        </div>

        <div className="w-full max-w-lg flex flex-col items-center gap-6 pb-12">
          {step === 'intro' && (
            <div className="flex flex-col items-center gap-8">
              <AnimatedText text="Hi… let’s create magical music from you together 🎶" className="text-xl md:text-3xl font-headline" />
              <button onClick={handleCreateSound} className="px-6 py-4 text-lg bg-primary text-white rounded-2xl shadow-[0_0_25px_rgba(255,77,255,0.7)] hover:scale-105 active:scale-95 font-headline">✨ CREATE MY SOUND</button>
            </div>
          )}

          {step === 'activation' && (
            <div className="flex flex-col items-center gap-4">
              <AnimatedText text="Listening to your presence..." className="text-lg md:text-2xl font-headline" />
              <div className="flex gap-2 items-center text-primary/60"><Activity className="w-5 h-5 animate-pulse" /><span className="text-[10px] font-headline">CALIBRATING BIOMETRICS</span></div>
            </div>
          )}

          {step === 'magic' && (
            <div className="flex flex-col items-center gap-4">
              <AnimatedText text="A unique musical theme is coming alive ✨" className="text-lg md:text-2xl font-headline" />
              <AnimatedText text="Connecting rhythm to your movement..." delayPerWord={300} className="text-[10px] opacity-60" />
            </div>
          )}

          {step === 'dashboard' && (
            <div className="w-full animate-scroll-open space-y-4">
              <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue} className="w-full space-y-3">
                <AccordionItem value="biometrics" className={cn("border-none transition-all", onboardingStep === 0 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">BIOMETRIC SYNC</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1 space-y-4">
                    <BiometricMonitor onBreathingUpdate={setBreathingIntensity} />
                    {onboardingStep === 0 && (
                      <div className="mt-2 p-3 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-[10px] font-headline flex flex-col gap-2">
                        Sync your breath and motion to influence the loop's pulse!
                        <button onClick={() => setOnboardingStep(1)} className="bg-primary text-white py-1.5 rounded-lg">NEXT: MELODY</button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scenes" className="border-none">
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">PATTERN SCENES</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1 space-y-3">
                    <div className="p-4 bg-white/30 rounded-2xl border border-white/40 shadow-sm space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-headline opacity-60">AUTO-CHAIN</span>
                        <Switch className="scale-75" checked={isChaining} onCheckedChange={handleToggleChaining} />
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map(idx => (
                          <div key={idx} className="flex-1 flex flex-col gap-1">
                            <button 
                              onPointerDown={() => startSceneLongPress(idx)}
                              onPointerUp={stopSceneLongPress}
                              onPointerLeave={stopSceneLongPress}
                              onClick={() => handleSceneClick(idx)}
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

                <AccordionItem value="melody" className={cn("border-none transition-all", onboardingStep === 1 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Music className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">MELODY STUDIO</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1 space-y-3">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/20 rounded-xl border border-white/40">
                      <div className="flex items-center gap-2">
                        <Zap className={cn("w-3.5 h-3.5", chordMode ? "text-primary" : "text-black/40")} />
                        <Label className="text-[9px] font-headline">CHORDS</Label>
                      </div>
                      <Switch className="scale-75" checked={chordMode} onCheckedChange={handleToggleChordMode} />
                    </div>
                    <PianoRoll sessionVersion={sessionVersion} />
                    {onboardingStep === 1 && (
                      <div className="mt-2 p-3 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-[10px] font-headline flex flex-col gap-2">
                        Tap cells to compose. Enable Chord Mode for lush sounds!
                        <button onClick={() => setOnboardingStep(2)} className="bg-primary text-white py-1.5 rounded-lg">NEXT: RHYTHM</button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rhythm" className={cn("border-none transition-all", onboardingStep === 2 && "ring-4 ring-primary ring-offset-4 rounded-2xl")}>
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">RHYTHM STUDIO</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1">
                    <DrumPads sessionVersion={sessionVersion} />
                    {onboardingStep === 2 && (
                      <div className="mt-2 p-3 bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30 text-[10px] font-headline flex flex-col gap-2">
                        Layer beats. Mute rows or clear them with a long-press.
                        <button onClick={() => setOnboardingStep(null)} className="bg-primary text-white py-1.5 rounded-lg">LET'S GO!</button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="palette" className="border-none">
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">SOUND PALETTE</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1 space-y-4">
                    <div className="p-4 bg-white/30 rounded-2xl border border-white/40 shadow-sm space-y-4">
                      <div className="space-y-3">
                        <div className="text-[9px] font-headline opacity-60 text-center">PRESETS</div>
                        <div className="flex gap-1.5 justify-center">
                          {["LO-FI", "AMBIENT", "UPTEMPO"].map(p => (
                            <button key={p} onClick={() => { audioEngine?.loadPreset(p); syncStateFromEngine(); }} className="px-3 py-1.5 bg-white/40 rounded-lg text-[8px] font-headline hover:bg-primary/20">{p}</button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[9px] font-headline opacity-60 text-center">ROOT KEY</div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {["C", "D", "E", "F", "G"].map(note => (
                            <button key={note} onClick={() => { setRootNote(note); audioEngine?.updateScale(note); setSessionVersion(v => v + 1); }} className={cn("w-10 h-10 flex items-center justify-center rounded-xl font-headline text-xs", rootNote === note ? "bg-primary text-white scale-110 shadow-md" : "bg-white/40")}>{note}</button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3 p-3 bg-black/5 rounded-xl">
                        <div className="text-[9px] font-headline opacity-60 text-center flex items-center justify-center gap-2">
                          <Upload className="w-3 h-3" /> CUSTOM SAMPLES
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['piano', 'kick', 'snare', 'hat'].map(type => (
                            <div key={type} className="relative">
                              <label className="flex flex-col items-center gap-1 p-2 bg-white/40 rounded-lg cursor-pointer hover:bg-white/60 transition-all">
                                <span className="text-[8px] font-headline">{type.toUpperCase()}</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(type as any, e)} />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="text-[8px] font-headline opacity-60 text-center">WAVE</div>
                          <div className="grid grid-cols-2 gap-1">
                            {['sine', 'triangle', 'square', 'sawtooth'].map(type => (
                              <button key={type} onClick={() => { audioEngine?.setOscillator(type as OscillatorType); setSessionVersion(v => v + 1); }} className={cn("py-1 text-[7px] rounded-md font-headline", audioEngine?.getOscillator() === type ? "bg-primary text-white" : "bg-white/40")}>{type.toUpperCase()}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[8px] font-headline opacity-60 text-center">LENGTH</div>
                          <div className="grid grid-1 gap-1">
                            {[{ id: '16n', label: 'SHORT' }, { id: '8n', label: 'MEDIUM' }, { id: '4n', label: 'LONG' }].map(({id, label}) => (
                              <button key={id} onClick={() => { audioEngine?.setNoteLength(id as NoteLength); setSessionVersion(v => v + 1); }} className={cn("py-0.5 text-[7px] rounded-md font-headline", audioEngine?.getNoteLength() === id ? "bg-primary text-white" : "bg-white/40")}>{label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                        <span className="text-[10px] font-headline opacity-60">SAMPLES</span>
                        <div className="flex items-center gap-2">
                          {!isLoaded && audioMode === 'sampled' && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
                          <button onClick={() => { const modes: AudioMode[] = ['synth', 'sampled', 'custom']; const next = modes[(modes.indexOf(audioMode) + 1) % 3]; setAudioMode(next); audioEngine?.setMode(next); }} className="px-4 py-1.5 bg-primary text-white rounded-lg font-headline text-[9px] min-w-[70px]">{audioMode.toUpperCase()}</button>
                        </div>
                      </div>
                      <button onClick={handleMidiExport} className="w-full py-2.5 bg-white/40 border border-primary/40 rounded-xl font-headline text-[10px] flex items-center justify-center gap-2"><Link className="w-3 h-3" /> EXPORT PATTERN DATA</button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="engine" className="border-none">
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">LOOP ENGINE</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1">
                    <div className="p-5 bg-white/40 backdrop-blur-sm border rounded-2xl flex flex-col gap-6 shadow-sm">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex gap-2">
                          <button onClick={togglePlay} className="p-4 bg-primary text-white rounded-full shadow-lg active:scale-95 transition-all">{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</button>
                          <button onClick={handleToggleRecording} className={cn("p-4 rounded-full shadow-lg transition-all", isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white/40 text-black/60")}>{isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-2xl font-headline text-primary leading-none">{bpm.toFixed(0)}</div>
                          <button onClick={handleTapTempo} className="flex items-center gap-1.5 px-2 py-0.5 bg-white/40 rounded-lg text-[8px] font-headline active:scale-90 transition-all"><Timer className="w-2.5 h-2.5" /> TAP</button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[8px] font-headline opacity-40 text-left">BPM CONTROL</div>
                        <Slider value={[bpm]} max={180} min={40} step={1} onValueChange={([val]) => { setBpm(val); audioEngine?.setBPM(val); }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-4 h-4 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="text-[8px] font-headline opacity-40 text-left">MASTER</div>
                            <Slider value={[masterVolume]} max={1} step={0.01} onValueChange={([val]) => { setMasterVolume(val); audioEngine?.setMasterVolume(val); }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="text-[8px] font-headline opacity-40 text-left">SWING</div>
                            <Slider value={[swing]} max={0.5} step={0.01} onValueChange={([v]) => { setSwing(v); audioEngine?.setSwing(v); }} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="text-[8px] font-headline opacity-40 text-left">REVERB</div>
                            <Slider value={[reverbWet]} max={1} step={0.01} onValueChange={([v]) => { setReverbWet(v); audioEngine?.setReverb(v); }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Sliders className="w-4 h-4 opacity-40 shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="text-[8px] font-headline opacity-40 text-left">DELAY</div>
                            <Slider value={[delayWet]} max={1} step={0.01} onValueChange={([v]) => { setDelayWet(v, 0.5); }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Activity className="w-4 h-4 opacity-40 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="text-[8px] font-headline opacity-40 text-left">FILTER</div>
                          <Slider value={[filterFreq]} max={20000} min={100} step={1} onValueChange={([v]) => { setFilterFreq(v); audioEngine?.setFilter(v); }} />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="memory" className="border-none">
                  <AccordionTrigger className="flex gap-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:no-underline">
                    <div className="flex items-center gap-2"><Save className="w-4 h-4 text-primary" /><span className="font-headline text-[13px] text-black">MAGIC MEMORY</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 px-1 space-y-3">
                    <div className="flex justify-center gap-1.5 p-1.5 bg-white/20 rounded-2xl">
                      {['A', 'B', 'C'].map(slot => (
                        <button key={slot} onClick={() => handleSwitchSlot(slot)} className={cn("flex-1 py-2 rounded-xl font-headline text-[9px] transition-all", activeSlot === slot ? "bg-primary text-white shadow-sm scale-105" : "bg-white/40")}>SLOT {slot}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 p-3 bg-white/30 rounded-2xl border border-white/40 shadow-sm">
                      <button onClick={handleUndo} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-primary/20"><Undo className="w-4 h-4 text-primary" /><span className="text-[7px] font-headline">UNDO</span></button>
                      <button onClick={handleSaveSession} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-primary/20"><Save className="w-4 h-4 text-primary" /><span className="text-[7px] font-headline">SAVE</span></button>
                      <button onClick={handleLoadSession} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-primary/20"><RotateCcw className="w-4 h-4 text-primary" /><span className="text-[7px] font-headline">LOAD</span></button>
                      <button onClick={handleResetSession} className="flex flex-col items-center gap-1 p-2 bg-white/50 rounded-xl hover:bg-destructive/20"><Trash2 className="w-4 h-4 text-destructive" /><span className="text-[7px] font-headline text-destructive">CLR</span></button>
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