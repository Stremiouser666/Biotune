
"use client";

import React, { useEffect, useState } from 'react';
import { dynamicBiometricMusicGeneration } from '@/ai/flows/dynamic-biometric-music-generation-flow';
import { audioEngine } from '@/lib/audio-engine';
import { Activity, Mic, Wind } from 'lucide-react';

export function BiometricMonitor() {
  const [breathing, setBreathing] = useState(0);
  const [movement, setMovement] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    let micInterval: any;
    let motionInterval: any;

    // Simulate Microphone influence (Breathing)
    micInterval = setInterval(() => {
      const val = Math.random();
      setBreathing(val);
      audioEngine?.setAmbience(val);
    }, 2000);

    // Accelerometer simulation for drum triggers
    motionInterval = setInterval(async () => {
      const move = Math.random();
      setMovement(move);
      
      if (move > 0.8) {
        audioEngine?.triggerDrum('hard');
      }

      // Occasionally call AI flow to update overall mood/tempo
      if (Math.random() > 0.9) {
        const influence = await dynamicBiometricMusicGeneration({
          breathingIntensity: breathing,
          movementIntensity: move
        });
        
        if (influence.tempoInfluence !== 0) {
          const current = audioEngine?.getBPM() || 80;
          audioEngine?.setBPM(current + influence.tempoInfluence * 20);
        }
      }
    }, 1000);

    return () => {
      clearInterval(micInterval);
      clearInterval(motionInterval);
    };
  }, [isMonitoring, breathing]);

  return (
    <div className="flex gap-4 justify-center py-4">
      <button 
        onClick={() => setIsMonitoring(!isMonitoring)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isMonitoring ? 'bg-primary border-primary text-white' : 'bg-transparent border-white/20 text-muted-foreground'}`}
      >
        <Activity className="w-4 h-4" />
        {isMonitoring ? 'BIOMETRICS ACTIVE' : 'SYNC BIOMETRICS'}
      </button>
      
      {isMonitoring && (
        <div className="flex gap-4 items-center animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1 text-xs text-accent">
            <Wind className="w-3 h-3" />
            {(breathing * 100).toFixed(0)}%
          </div>
          <div className="flex items-center gap-1 text-xs text-primary">
            <Activity className="w-3 h-3" />
            {(movement * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}
