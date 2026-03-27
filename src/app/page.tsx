"use client";

import React, { useState, useEffect, useRef } from 'react';
import TutorialScreen from "@/components/TutorialScreen"; // ✅ ADDED
import { AnimatedText } from '@/components/animated-text';
import { Mascot } from '@/components/mascot';
import { PianoRoll } from '@/components/piano-roll';
import { DrumPads } from '@/components/drum-pads';
import { BiometricMonitor } from '@/components/biometric-monitor';
import { FullscreenVisualizer } from '@/components/fullscreen-visualizer';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

export default function BiotuneApp() {
  const [step, setStep] = useState<'intro' | 'activation' | 'magic' | 'dashboard'>('intro');
  const [showTutorial, setShowTutorial] = useState(false); // ✅ ADDED
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [breathingIntensity, setBreathingIntensity] = useState(0);
  const { toast } = useToast();

  // ✅ Show tutorial only in dashboard
  useEffect(() => {
    if (step !== "dashboard") return;
    const hidden = localStorage.getItem("hideTutorial") === "true";
    setShowTutorial(!hidden);
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

  return (
    <main className="relative min-h-svh w-full">

      {/* ✅ Tutorial */}
      {step === "dashboard" && showTutorial && (
        <TutorialScreen onClose={() => setShowTutorial(false)} />
      )}

      {/* Mascot */}
      <div className="mt-10">
        <Mascot
          state={step === 'dashboard' ? 'active' : 'idle'}
          intensity={breathingIntensity}
          isDancing={isPlaying}
        />
      </div>

      {/* Intro */}
      {step === "intro" && (
        <div className="text-center mt-10">
          <AnimatedText text="Create music from YOU 🎶" />
          <button onClick={handleCreateSound}>
            Start
          </button>
        </div>
      )}

      {/* Dashboard */}
      {step === "dashboard" && (
        <div className="space-y-6 p-4">

          <BiometricMonitor onBreathingUpdate={setBreathingIntensity} />

          <div id="piano-roll">
            <PianoRoll />
          </div>

          <div id="drum-pads">
            <DrumPads />
          </div>

          <div id="ai-toggle">
            <button>Change Sound</button>
          </div>

          <div id="visualizer">
            <FullscreenVisualizer />
          </div>

        </div>
      )}
    </main>
  );
}