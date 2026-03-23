"use client";

import React, { useEffect, useState, useRef } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { Activity, Wind, AlertCircle, RefreshCcw, Timer, Sliders } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { cn } from '@/lib/utils';

interface BiometricMonitorProps {
  onBreathingUpdate?: (val: number) => void;
}

export function BiometricMonitor({ onBreathingUpdate }: BiometricMonitorProps) {
  const [breathing, setBreathing] = useState(0);
  const [movement, setMovement] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restingBpm, setRestingBpm] = useState(80);
  const [micSensitivity, setMicSensitivity] = useState(1);
  const [motionSensitivity, setMotionSensitivity] = useState(1);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyCanvasRef = useRef<HTMLCanvasElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const breathingRef = useRef(0);
  const movementRef = useRef(0);
  const historyRef = useRef<{ b: number, m: number }[]>([]);
  const isMonitoringRef = useRef(false);
  const stepRef = useRef(0);

  useEffect(() => {
    const handleStep = (step: number) => { stepRef.current = step; };
    audioEngine?.addOnStep(handleStep);
    setRestingBpm(audioEngine?.getRestingBpm() || 80);
    setMicSensitivity(audioEngine?.getMicSensitivity() || 1);
    setMotionSensitivity(audioEngine?.getMotionSensitivity() || 1);
    return () => {
      audioEngine?.removeOnStep(handleStep);
      stopMonitoring();
    };
  }, []);

  const startMonitoring = async () => {
    try {
      setError(null);
      analyserRef.current = await audioEngine?.getMic() || null;
      if (!analyserRef.current) throw new Error('Could not access microphone.');

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
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    isMonitoringRef.current = false;
    setIsMonitoring(false);
    window.removeEventListener('devicemotion', handleMotion);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.acceleration || event.accelerationIncludingGravity;
    if (!acc) return;
    const total = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + ((acc.z || 0) - (event.acceleration ? 0 : 9.8))**2);
    const sens = audioEngine?.getMotionSensitivity() || 1.0;
    const normalized = Math.min(1, (total / 15) * sens);
    movementRef.current = movementRef.current * 0.7 + normalized * 0.3;
    setMovement(movementRef.current);
  };

  const analyze = () => {
    if (!analyserRef.current || !isMonitoringRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const sens = audioEngine?.getMicSensitivity() || 1.0;
    const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = Math.min(1, (avg / 120) * sens);
    
    breathingRef.current = normalized;
    setBreathing(normalized);
    onBreathingUpdate?.(normalized);
    audioEngine?.setAmbience(normalized);

    historyRef.current.push({ b: normalized, m: movementRef.current });
    if (historyRef.current.length > 200) historyRef.current.shift();

    drawRealtime(dataArray);
    drawHistory();
    animationFrameRef.current = requestAnimationFrame(analyze);
  };

  const drawRealtime = (dataArray: Uint8Array) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 300, 60);
    ctx.fillStyle = '#ff4dff33';
    dataArray.forEach((val, i) => {
      const h = (val / 255) * 60;
      ctx.fillRect(i * 10, 60 - h, 8, h);
    });
    const playheadX = (stepRef.current / 16) * 300;
    ctx.fillStyle = '#ff4dff88';
    ctx.fillRect(playheadX, 0, 4, 60);
  };

  const drawHistory = () => {
    if (!historyCanvasRef.current) return;
    const ctx = historyCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 300, 60);
    ctx.lineWidth = 2;
    
    ctx.strokeStyle = '#ff4dff66';
    ctx.beginPath();
    historyRef.current.forEach((h, i) => {
      const x = (i / 200) * 300;
      const y = 60 - h.b * 50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#ffffff66';
    ctx.beginPath();
    historyRef.current.forEach((h, i) => {
      const x = (i / 200) * 300;
      const y = 60 - h.m * 50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const startLocalPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(() => {
      if (!isMonitoringRef.current || !audioEngine) return;
      const avg = (breathingRef.current + movementRef.current) / 2;
      const currentBpm = audioEngine.getBPM();
      const base = audioEngine.getRestingBpm();
      let nextBpm = currentBpm;

      if (avg < 0.3) nextBpm -= 0.5; 
      else if (avg > 0.7) nextBpm += 0.5;
      else if (Math.abs(currentBpm - base) > 0.2) nextBpm += (base - currentBpm) * 0.05; 
      else nextBpm = base;

      audioEngine.setBPM(nextBpm, true);
      if (movementRef.current > 0.85) audioEngine.triggerDrum('hard');
    }, 1000);
  };

  const captureRestingBpm = () => {
    const current = audioEngine?.getBPM() || 80;
    setRestingBpm(current);
    audioEngine?.setRestingBpm(current);
  };

  const updateMicSensitivity = (val: number) => {
    setMicSensitivity(val);
    audioEngine?.setMicSensitivity(val);
  };

  const updateMotionSensitivity = (val: number) => {
    setMotionSensitivity(val);
    audioEngine?.setMotionSensitivity(val);
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {error && (
        <Alert variant="destructive" className="bg-white/80 backdrop-blur-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span className="text-xs">{error}</span>
            <button onClick={startMonitoring} className="flex items-center gap-2 text-xs font-headline text-primary bg-white px-3 py-2 rounded-lg w-fit"><RefreshCcw className="w-3 h-3" /> RETRY SYNC</button>
          </AlertDescription>
        </Alert>
      )}

      {!isMonitoring ? (
        <button onClick={startMonitoring} className="px-10 py-5 rounded-full bg-white/20 border-2 border-white/40 font-headline hover:bg-white/40 transition-all shadow-xl">CONNECT BIOMETRICS</button>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 bg-white/30 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-lg">
          <div className="flex items-center gap-2 font-headline text-primary animate-pulse"><Activity className="w-4 h-4" /> BIOMETRICS ACTIVE</div>
          <div className="relative w-full h-12 rounded-lg bg-black/5 overflow-hidden">
            <canvas ref={canvasRef} width="300" height="60" className="absolute inset-0 w-full h-full" />
            <canvas ref={historyCanvasRef} width="300" height="60" className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
          <div className="flex justify-between w-full items-center px-2">
            <div className="flex gap-4">
              <div className="text-center">
                <Wind className="w-3 h-3 mx-auto text-primary mb-1" />
                <div className="text-[8px] font-headline opacity-50">BREATH</div>
                <div className="text-[10px] font-headline">{(breathing * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center">
                <Activity className="w-3 h-3 mx-auto text-primary mb-1" />
                <div className="text-[8px] font-headline opacity-50">MOTION</div>
                <div className="text-[10px] font-headline">{(movement * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <button onClick={captureRestingBpm} className="flex items-center gap-1 text-[8px] font-headline bg-primary text-white px-2 py-1 rounded-md mb-1"><Timer className="w-2.5 h-2.5" /> SET BASELINE</button>
              <div className="text-[8px] font-headline opacity-40">TARGET: {restingBpm.toFixed(0)} BPM</div>
            </div>
          </div>
          <div className="w-full space-y-4 pt-4 border-t border-black/5">
            <div className="flex items-center gap-2 text-[9px] font-headline opacity-60"><Sliders className="w-3 h-3" /> CALIBRATION</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[7px] font-headline opacity-40"><span>MIC SENS</span><span>{micSensitivity.toFixed(1)}x</span></div>
                <Slider value={[micSensitivity]} max={3} min={0.2} step={0.1} onValueChange={([v]) => updateMicSensitivity(v)} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[7px] font-headline opacity-40"><span>MOTION SENS</span><span>{motionSensitivity.toFixed(1)}x</span></div>
                <Slider value={[motionSensitivity]} max={3} min={0.2} step={0.1} onValueChange={([v]) => updateMotionSensitivity(v)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
