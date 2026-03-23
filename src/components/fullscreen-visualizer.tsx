
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mascot } from '@/components/mascot';
import { audioEngine } from '@/lib/audio-engine';
import { Minimize2, Mic, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenVisualizerProps {
  onClose: () => void;
  breathingIntensity: number;
}

export function FullscreenVisualizer({ onClose, breathingIntensity }: FullscreenVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleStep = (step: number) => {
      setCurrentStep(step % 16);
    };
    audioEngine?.addOnStep(handleStep);
    
    // Attempt to auto-start mic if not already handled
    startMic();

    return () => {
      audioEngine?.removeOnStep(handleStep);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startMic = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      setIsMicActive(true);
      draw();
    } catch (err) {
      console.error("Visualizer mic error:", err);
    }
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Frequency Bars
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      
      const r = 255;
      const g = 77;
      const b = 255;
      const opacity = (dataArray[i] / 255) * 0.6 + 0.1;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    // Draw Playhead Line
    const playheadX = (currentStep / 16) * canvas.width;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Visualizer Canvas */}
      <canvas 
        ref={canvasRef} 
        width={typeof window !== 'undefined' ? window.innerWidth : 1920} 
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        className="absolute inset-0 w-full h-full opacity-50"
      />

      {/* UI Elements */}
      <div className="relative z-10 flex flex-col items-center gap-12 text-center">
        <Mascot state="reacting" intensity={breathingIntensity} />
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-headline text-white drop-shadow-[0_0_20px_rgba(255,77,255,0.8)]">
            BIOTUNE LIVE
          </h1>
          <div className="flex items-center justify-center gap-4 text-primary/60 font-headline text-sm">
            <Activity className="w-5 h-5 animate-pulse" />
            <span>SYNCED TO PRESENCE</span>
          </div>
        </div>

        {!isMicActive && (
          <button 
            onClick={startMic}
            className="px-6 py-3 bg-primary text-white rounded-xl font-headline flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Mic className="w-5 h-5" /> ENABLE VISUALIZER MIC
          </button>
        )}
      </div>

      {/* Playhead Indicators (Bottom) */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex gap-2 justify-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "flex-1 h-2 rounded-full transition-all duration-100",
              currentStep === i ? "bg-primary shadow-[0_0_15px_#ff4dff] scale-y-150" : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Exit Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all"
      >
        <Minimize2 className="w-6 h-6" />
      </button>
    </div>
  );
}
