
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

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const breathingRef = useRef(0);
  const movementRef = useRef(0);

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
      setIsMonitoring(true);
      analyze();
      startLocalPolling();
    } catch (err: any) {
      setError(err.message || 'Permissions denied.');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    window.removeEventListener('devicemotion', handleMotion);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
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

    // Visualizer
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 300, 60);
      ctx.fillStyle = '#ff4dff33';
      dataArray.forEach((val, i) => {
        const h = (val / 255) * 60;
        ctx.fillRect(i * 10, 60 - h, 8, h);
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(analyze);
  };

  const startLocalPolling = () => {
    setInterval(() => {
      if (!isMonitoring) return;
      const breathing = breathingRef.current;
      const movement = movementRef.current;
      
      // Local logic replacement for AI flow
      const avg = (breathing + movement) / 2;
      const tempoInfl = avg < 0.3 ? -2 : avg > 0.7 ? 2 : 0;
      if (tempoInfl !== 0) audioEngine?.setBPM((audioEngine?.getBPM() || 80) + tempoInfl);
      
      if (movement > 0.8) audioEngine?.triggerDrum('hard');
    }, 2000);
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
            <canvas ref={canvasRef} width="300" height="60" className="w-full h-12 opacity-60" />
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
