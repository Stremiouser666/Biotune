
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mascot } from '@/components/mascot';
import { audioEngine } from '@/lib/audio-engine';
import { Minimize2, Mic, Activity, Music, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenVisualizerProps {
  onClose: () => void;
  breathingIntensity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export function FullscreenVisualizer({ onClose, breathingIntensity }: FullscreenVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isStrobing, setIsStrobing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const handleStep = (step: number) => {
      setCurrentStep(step % 16);
    };
    
    const handleDrumHit = () => {
      setIsStrobing(true);
      spawnBurst();
      setTimeout(() => setIsStrobing(false), 150);
    };

    audioEngine?.addOnStep(handleStep);
    audioEngine?.addOnDrumHit(handleDrumHit);
    
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

  const spawnBurst = () => {
    if (!canvasRef.current) return;
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        size: Math.random() * 4 + 2,
        color: i % 2 === 0 ? '#ff4dff' : '#ffffff',
        life: 1.0
      });
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
    const baseRadius = 180 + (breathingIntensity * 60);

    // Update Particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= 0.02;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Radial Frequency Aura
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * 180;
      const angle = (i / bufferLength) * Math.PI * 2;
      
      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

      const opacity = (dataArray[i] / 255) * 0.9;
      ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 77, 255, ${opacity})` : `rgba(255, 255, 255, ${opacity * 0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw Dynamic Magical Rings
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    
    // Rotating Ring 1
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, baseRadius + 100, baseRadius + 120, time * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Ring 2
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, baseRadius + 150, baseRadius + 130, -time * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-150",
      isStrobing && "animate-visualizer-strobe"
    )}>
      {/* Immersive Background */}
      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover opacity-20 scale-110" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:30px_30px] animate-sparkle-move opacity-50" />
      
      {/* Canvas for Particles & Aura */}
      <canvas 
        ref={canvasRef} 
        width={typeof window !== 'undefined' ? window.innerWidth : 1920} 
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        className="absolute inset-0 w-full h-full"
      />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center gap-12 text-center scale-90 md:scale-100">
        <div className="relative">
          {/* Reactive Outer Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/30 blur-[120px] rounded-full animate-pulse" />
          <Mascot 
            state="reacting" 
            intensity={breathingIntensity} 
            isDancing={audioEngine?.getBPM()! > 100 || isStrobing}
          />
        </div>
        
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-headline text-white drop-shadow-[0_0_40px_rgba(255,77,255,1)] tracking-widest uppercase">
            Biotune
          </h1>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-3 px-8 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/30 text-primary font-headline text-[10px] animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>PERFORMING FROM YOUR PRESENCE</span>
            </div>
          </div>
        </div>

        {!isMicActive && (
          <button 
            onClick={startMic}
            className="px-10 py-5 bg-primary text-white rounded-3xl font-headline flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,77,255,0.6)]"
          >
            <Mic className="w-6 h-6" /> UNLEASH THE MAGIC
          </button>
        )}
      </div>

      {/* Immersive Footer UI */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex flex-col items-center gap-10">
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-150",
                currentStep === i ? "bg-white shadow-[0_0_25px_#ffffff] scale-[2.2]" : "bg-white/10"
              )}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-10 text-white/50 font-headline text-[12px] tracking-[4px]">
          <div className="flex items-center gap-3">
            <Music className="w-4 h-4" />
            <span>{audioEngine?.getBPM().toFixed(0)} BPM</span>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4" />
            <span>{(breathingIntensity * 100).toFixed(0)}% SOUL</span>
          </div>
        </div>
      </div>

      {/* Performance Exit */}
      <button 
        onClick={onClose}
        className="absolute top-10 right-10 p-5 bg-white/10 backdrop-blur-xl rounded-full border border-white/30 text-white hover:bg-white/30 hover:scale-110 active:scale-95 transition-all z-[110] shadow-2xl"
      >
        <Minimize2 className="w-8 h-8" />
      </button>
    </div>
  );
}
