"use client";

import React, { useEffect, useState, useRef } from 'react';
import { dynamicBiometricMusicGeneration } from '@/ai/flows/dynamic-biometric-music-generation-flow';
import { audioEngine } from '@/lib/audio-engine';
import { Activity, Mic, Wind, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BiometricMonitor() {
  const [breathing, setBreathing] = useState(0);
  const [movement, setMovement] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use Refs to ensure the AI polling interval always has the freshest data
  const breathingRef = useRef(0);
  const movementRef = useRef(0);

  const startMonitoring = async () => {
    try {
      setError(null);
      
      // 1. Microphone setup for breathing intensity
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // 2. Accelerometer setup (with iOS permission check)
      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          throw new Error('Motion sensor permission denied. Please enable it in Settings.');
        }
      }

      window.addEventListener('devicemotion', handleMotion);
      setIsMonitoring(true);
      
      // Start real-time analysis
      analyzeMic();
      
      // Start polling for musical influence
      startAiPolling();

    } catch (err: any) {
      setError(err.message || 'Permissions denied or hardware not found.');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    window.removeEventListener('devicemotion', handleMotion);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    let x = 0, y = 0, z = 0;

    // Prefer raw acceleration if available (gravity removed)
    if (event.acceleration && event.acceleration.x !== null) {
      x = event.acceleration.x;
      y = event.acceleration.y;
      z = event.acceleration.z || 0;
    } else if (event.accelerationIncludingGravity && event.accelerationIncludingGravity.x !== null) {
      // Fallback to including gravity, relative to rest (9.8m/s^2)
      x = event.accelerationIncludingGravity.x;
      y = event.accelerationIncludingGravity.y;
      z = (event.accelerationIncludingGravity.z || 0) - 9.8;
    } else {
      return;
    }
    
    // Calculate total movement intensity
    const total = Math.sqrt(x*x + y*y + z*z);
    const normalized = Math.min(1, total / 12); // Normalize based on 12m/s^2 as "high intensity"
    
    // Smooth the movement data slightly
    const smoothed = movementRef.current * 0.6 + normalized * 0.4;
    setMovement(smoothed);
    movementRef.current = smoothed;
  };

  const analyzeMic = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = Math.min(1, average / 110);
    
    setBreathing(normalized);
    breathingRef.current = normalized;
    
    // Live update for ambience volume (immediate feedback)
    audioEngine?.setAmbience(normalized);
    
    animationFrameRef.current = requestAnimationFrame(analyzeMic);
  };

  const startAiPolling = () => {
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    
    // Polling every 2 seconds to interpret biometrics into music
    aiIntervalRef.current = setInterval(async () => {
      // Use Refs to avoid stale closure issues in setInterval
      const currentBreathing = breathingRef.current;
      const currentMovement = movementRef.current;

      try {
        const influence = await dynamicBiometricMusicGeneration({
          breathingIntensity: currentBreathing,
          movementIntensity: currentMovement
        });
        
        // Apply influence to audio engine
        if (influence.tempoInfluence !== 0) {
          const currentBpm = audioEngine?.getBPM() || 80;
          audioEngine?.setBPM(currentBpm + influence.tempoInfluence * 15);
        }

        if (influence.drumTriggerType !== 'none') {
           audioEngine?.triggerDrum(influence.drumTriggerType === 'soft_tap' ? 'soft' : influence.drumTriggerType === 'hard_hit' ? 'hard' : 'roll');
        }
        
      } catch (e) {
        console.warn("Music Influence Error:", e);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {error && (
        <Alert variant="destructive" className="mb-4 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Failed</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 items-center justify-center py-4 w-full">
        <button 
          onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          className={`group relative flex items-center gap-3 px-8 py-4 rounded-full border-2 font-headline transition-all shadow-xl active:scale-95 ${isMonitoring ? 'bg-primary border-primary text-white scale-105' : 'bg-white/20 border-white/40 text-black hover:bg-white/40'}`}
        >
          <Activity className={`w-5 h-5 ${isMonitoring ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
          {isMonitoring ? 'BIOMETRICS ACTIVE' : 'CONNECT BIOMETRICS'}
        </button>
        
        {isMonitoring && (
          <div className="flex gap-6 items-center animate-in fade-in zoom-in-95 bg-white/40 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/60 shadow-inner mt-2">
            <div className="flex flex-col items-center">
              <Wind className="w-4 h-4 text-[#ff4dff] mb-1" />
              <span className="text-[10px] font-headline opacity-60">BREATH</span>
              <span className="text-sm font-headline">{(breathing * 100).toFixed(0)}%</span>
            </div>
            <div className="w-px h-8 bg-black/10" />
            <div className="flex flex-col items-center">
              <Activity className="w-4 h-4 text-[#ff4dff] mb-1" />
              <span className="text-[10px] font-headline opacity-60">MOTION</span>
              <span className="text-sm font-headline">{(movement * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
