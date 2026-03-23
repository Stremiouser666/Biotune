
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { Activity, Wind, AlertCircle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BiometricMonitorProps {
  onBreathingUpdate?: (val: number) => void;
}

export function BiometricMonitor({ onBreathingUpdate }: BiometricMonitorProps) {
  const [breathing, setBreathing] = useState(0);
  const [movement, setMovement] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const breathingRef = useRef(0);
  const movementRef = useRef(0);
  const isMonitoringRef = useRef(false);
  const stepRef = useRef(0);

  useEffect(() => {
    const handleStep = (step: number) => {
      stepRef.current = step;
      setCurrentStep(step);
    };
    audioEngine?.addOnStep(handleStep);
    return () => audioEngine?.removeOnStep(handleStep);
  }, []);

  const startMonitoring = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Mic not supported.');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') throw new Error('Motion permission denied.');
      }

      window.addEventListener('devicemotion', handleMotion);
      isMonitoringRef.current = true;
      setIsMonitoring(true);
      analyze();
      startLocalPolling();
    } catch (err: any) {
      setError(err.message || 'Permissions denied.');
      isMonitoringRef.current = false;
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    isMonitoringRef.current = false;
    setIsMonitoring(false);
    window.removeEventListener('devicemotion', handleMotion);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.acceleration || event.accelerationIncludingGravity;
    if (!acc) return;
    const total = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + ((acc.z || 0) - (event.acceleration ? 0 : 9.8))**2);
    const normalized = Math.min(1, total / 15);
    movementRef.current = movementRef.current * 0.7 + normalized * 0.3;
    setMovement(movementRef.current);
  };

  const analyze = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = Math.min(1, avg / 120);
    breathingRef.current = normalized;
    setBreathing(normalized);
    onBreathingUpdate?.(normalized);
    audioEngine?.setAmbience(normalized);

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 300, 60);
      
      // Draw analyzer bars
      ctx.fillStyle = '#ff4dff33';
      dataArray.forEach((val, i) => {
        const h = (val / 255) * 60;
        ctx.fillRect(i * 10, 60 - h, 8, h);
      });

      // Draw vertical playhead
      const playheadX = (stepRef.current / 16) * 300;
      ctx.fillStyle = '#ff4dff88';
      ctx.fillRect(playheadX, 0, 4, 60);
    }
    
    animationFrameRef.current = requestAnimationFrame(analyze);
  };

  const startLocalPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(() => {
      if (!isMonitoringRef.current || !audioEngine) return;
      
      const b = breathingRef.current;
      const m = movementRef.current;
      const avg = (b + m) / 2;
      
      const currentBpm = audioEngine.getBPM();
      const baseBpm = 80;
      let nextBpm = currentBpm;

      if (avg < 0.3) {
        nextBpm -= 1; 
      } else if (avg > 0.7) {
        nextBpm += 1;
      } else {
        if (Math.abs(currentBpm - baseBpm) > 0.5) {
          nextBpm += (baseBpm - currentBpm) * 0.05; 
        } else {
          nextBpm = baseBpm;
        }
      }
      
      audioEngine.setBPM(nextBpm);
      if (m > 0.85) audioEngine.triggerDrum('hard');
    }, 1000);
  };

  useEffect(() => { return () => stopMonitoring(); }, []);

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {error && (
        <Alert variant="destructive" className="bg-white/80 backdrop-blur-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span className="text-xs">{error}</span>
            <button onClick={startMonitoring} className="flex items-center gap-2 text-xs font-headline text-primary bg-white px-3 py-2 rounded-lg shadow-sm w-fit">
              <RefreshCcw className="w-3 h-3" /> RETRY SYNC
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 items-center w-full">
        {!isMonitoring ? (
          <button onClick={startMonitoring} className="px-10 py-5 rounded-full bg-white/20 border-2 border-white/40 font-headline hover:bg-white/40 transition-all shadow-xl">
            CONNECT BIOMETRICS
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-4 bg-white/30 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-lg">
            <div className="flex items-center gap-2 font-headline text-primary animate-pulse">
              <Activity className="w-4 h-4" /> BIOMETRICS ACTIVE
            </div>
            <canvas ref={canvasRef} width="300" height="60" className="w-full h-12 rounded-lg bg-black/5" />
            <div className="flex gap-8">
              <div className="text-center">
                <Wind className="w-4 h-4 mx-auto text-primary mb-1" />
                <div className="text-[10px] font-headline opacity-50">BREATH</div>
                <div className="text-sm font-headline">{(breathing * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center">
                <Activity className="w-4 h-4 mx-auto text-primary mb-1" />
                <div className="text-[10px] font-headline opacity-50">MOTION</div>
                <div className="text-sm font-headline">{(movement * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
