"use client";

import React, { useState, useEffect, useRef } from 'react';
import { audioEngine, type AudioMode } from '@/lib/audio-engine';
import { FullscreenVisualizer } from '@/components/fullscreen-visualizer';
import TutorialScreen from '@/components/TutorialScreen';
import { IntroScreen } from '@/components/IntroScreen';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BiometricsSection } from '@/components/BiometricsSection';
import { ScenesSection } from '@/components/ScenesSection';
import { MelodySection } from '@/components/MelodySection';
import { RhythmSection } from '@/components/RhythmSection';
import { SoundSection } from '@/components/SoundSection';
import { EngineSection } from '@/components/EngineSection';
import { MemorySection } from '@/components/MemorySection';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialReady, setTutorialReady] = useState(false);

  const [masterVolume, setMasterVolume] = useState(1);
  const [swing, setSwing] = useState(0);
  const [reverbWet, setReverbWet] = useState(0.25);
  const [delayWet, setDelayWet] = useState(0.3);
  const [filterFreq, setFilterFreq] = useState(20000);

  const tapTimes = useRef<number[]>([]);
  const sceneLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isSceneLongPress = useRef(false);
  const { toast } = useToast();

  // Tutorial — only show on dashboard
  useEffect(() => {
    if (step === 'dashboard') {
      const hidden = localStorage.getItem("hideTutorial") === "true";
      setShowTutorial(!hidden);
      setTutorialReady(true);
    }
  }, [step]);

  // Shared session from URL
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

  // Engine listeners
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
        if (audioEngine) audioEngine.removeOnDrumHit(handleHit);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [step, isFullscreen]);

  // BPM polling
  useEffect(() => {
    if (step !== 'dashboard') return;
    const interval = setInterval(() => {
      if (audioEngine) setBpm(audioEngine.getBPM());
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Onboarding
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

  // Handlers
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
    if (data) syncStateFromEngine();
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
    toast({ title: "Scene Copied", description: `Scene ${activeScene + 1} -> ${to + 1}` });
  };

  const handleSceneClick = (idx: number) => {
    if (!isSceneLongPress.current) audioEngine?.setScene(idx);
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

      {tutorialReady && showTutorial && (
        <TutorialScreen onClose={() => setShowTutorial(false)} />
      )}

      <button
        onClick={() => { localStorage.removeItem("hideTutorial"); setShowTutorial(true); }}
        className="fixed bottom-4 left-4 z-40 px-3 py-2 text-xs bg-black/60 backdrop-blur-md text-white rounded-xl border border-white/20"
      >
        Help ❓
      </button>

      {isFullscreen && (
        <FullscreenVisualizer onClose={() => setIsFullscreen(false)} breathingIntensity={breathingIntensity} />
      )}

      {step === 'dashboard' && !isFullscreen && (
        <DashboardHeader
          isAmbient={isAmbient}
          onToggleAmbient={() => setIsAmbient(!isAmbient)}
          onFullscreen={() => setIsFullscreen(true)}
          onShare={handleShare}
          onGoHome={handleGoHome}
        />
      )}

      <div className="relative z-10 w-full h-svh flex flex-col items-center pt-10 px-4 text-center overflow-y-auto scrollbar-hide">
        <div className="w-full max-w-lg flex flex-col items-center gap-6 pb-12">

          <IntroScreen
            step={step}
            breathingIntensity={breathingIntensity}
            isPlaying={isPlaying}
            bpm={bpm}
            onCreateSound={handleCreateSound}
          />

          {step === 'dashboard' && (
            <div className="w-full animate-scroll-open space-y-4">
              <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue} className="w-full space-y-3">

                <BiometricsSection
                  onBreathingUpdate={setBreathingIntensity}
                  onboardingStep={onboardingStep}
                  onNextOnboarding={() => setOnboardingStep(1)}
                />

                <ScenesSection
                  isChaining={isChaining}
                  onToggleChaining={handleToggleChaining}
                  activeScene={activeScene}
                  onSceneClick={handleSceneClick}
                  onSceneLongPressStart={startSceneLongPress}
                  onSceneLongPressEnd={stopSceneLongPress}
                />

                <MelodySection
                  chordMode={chordMode}
                  onToggleChordMode={handleToggleChordMode}
                  rootNote={rootNote}
                  onRootNoteChange={setRootNote}
                  activeScene={activeScene}
                  sessionVersion={sessionVersion}
                  onboardingStep={onboardingStep}
                  onNextOnboarding={() => setOnboardingStep(2)}
                />

                <RhythmSection
                  activeScene={activeScene}
                  sessionVersion={sessionVersion}
                  onboardingStep={onboardingStep}
                  onNextOnboarding={() => setOnboardingStep(null)}
                />

                <SoundSection
                  audioMode={audioMode}
                  isLoaded={isLoaded}
                  onFileUpload={handleFileUpload}
                  onMidiExport={handleMidiExport}
                  sessionVersion={sessionVersion}
                  onSessionChange={() => setSessionVersion(v => v + 1)}
                />

                <EngineSection
                  isPlaying={isPlaying}
                  isRecording={isRecording}
                  bpm={bpm}
                  masterVolume={masterVolume}
                  swing={swing}
                  reverbWet={reverbWet}
                  delayWet={delayWet}
                  filterFreq={filterFreq}
                  onTogglePlay={togglePlay}
                  onToggleRecording={handleToggleRecording}
                  onTapTempo={handleTapTempo}
                  onBpmChange={(val) => { setBpm(val); audioEngine?.setBPM(val); }}
                  onMasterVolumeChange={(val) => { setMasterVolume(val); audioEngine?.setMasterVolume(val); }}
                  onSwingChange={(val) => { setSwing(val); audioEngine?.setSwing(val); }}
                  onReverbChange={(val) => { setReverbWet(val); audioEngine?.setReverb(val); }}
                  onDelayChange={(val) => { setDelayWet(val); audioEngine?.setDelay(val, 0.5); }}
                  onFilterChange={(val) => { setFilterFreq(val); audioEngine?.setFilter(val); }}
                />

                <MemorySection
                  activeSlot={activeSlot}
                  onSwitchSlot={handleSwitchSlot}
                  onUndo={handleUndo}
                  onSave={handleSaveSession}
                  onLoad={handleLoadSession}
                  onReset={handleResetSession}
                />

              </Accordion>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
