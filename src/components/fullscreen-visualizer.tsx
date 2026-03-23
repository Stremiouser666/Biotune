"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mascot } from '@/components/mascot';
import { audioEngine } from '@/lib/audio-engine';
import { Minimize2, Mic, Activity, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenVisualizerProps {
  onClose: () => void;
  breathingIntensity: number;
}

export function FullscreenVisualizer({ onClose, breathingIntensity }: FullscreenVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isStrobing, setIsStrobing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleStep = (step: number) => {
      setCurrentStep(step % 16);
    };
    
    const handleDrumHit = () => {
      setIsStrobing(true);
      setTimeout(() => setIsStrobing(false), 150);
    };

    audioEngine?.addOnStep(handleStep);
    audioEngine?.addOnDrumHit(handleDrumHit);
    
    // Attempt to auto-start mic
    startMic();

    return () => {
      audioEngine?.removeOnStep(handleStep);
      audioEngine?.removeOnDrumHit(handleDrumHit);
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
      analyserRef.current.fftSize = 512;
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

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 180 + (breathingIntensity * 40);

    // Draw Radial Frequency Aura
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * 150;
      const angle = (i / bufferLength) * Math.PI * 2;
      
      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

      const opacity = (dataArray[i] / 255) * 0.8;
      ctx.strokeStyle = `rgba(255, 77, 255, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw Secondary Faint Outer Aura
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius + 100, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-150",
      isStrobing && "animate-visualizer-strobe"
    )}>
      {/* Immersive Starfield Background */}
      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover opacity-20 scale-110" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_1px,_transparent_1px)] bg-[length:40px_40px] animate-sparkle-move opacity-40" />
      
      {/* Frequency Aura Canvas */}
      <canvas 
        ref={canvasRef} 
        width={typeof window !== 'undefined' ? window.innerWidth : 1920} 
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        className="absolute inset-0 w-full h-full"
      />

      {/* Center Character Performance */}
      <div className="relative z-10 flex flex-col items-center gap-12 text-center">
        <div className="relative">
          {/* Reactive Outer Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full animate-pulse" />
          <Mascot 
            state="reacting" 
            intensity={breathingIntensity} 
            isDancing={audioEngine?.getBPM()! > 100 || isStrobing}
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline text-white drop-shadow-[0_0_30px_rgba(255,77,255,1)] tracking-widest">
            BIOTUNE
          </h1>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-primary font-headline text-xs animate-pulse">
              <Activity className="w-4 h-4" />
              <span>SYNCED TO PRESENCE</span>
            </div>
            {isStrobing && <span className="text-[10px] font-headline text-white/40 tracking-widest mt-2 animate-bounce">BEAT DETECTED</span>}
          </div>
        </div>

        {!isMicActive && (
          <button 
            onClick={startMic}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-headline flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,77,255,0.5)]"
          >
            <Mic className="w-5 h-5" /> ACTIVATE VISUALS
          </button>
        )}
      </div>

      {/* Floating UI Elements */}
      <div className="absolute bottom-16 left-0 right-0 px-12 flex flex-col items-center gap-8">
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-100",
                currentStep === i ? "bg-primary shadow-[0_0_20px_#ff4dff] scale-[2]" : "bg-white/20"
              )}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-6 text-white/60 font-headline text-[10px]">
          <div className="flex items-center gap-2">
            <Music className="w-3 h-3" />
            <span>{audioEngine?.getBPM().toFixed(0)} BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>{(breathingIntensity * 100).toFixed(0)}% VITALITY</span>
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all z-[110]"
      >
        <Minimize2 className="w-6 h-6" />
      </button>
    </div>
  );
}