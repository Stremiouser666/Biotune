
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mascot } from '@/components/mascot';
import { audioEngine } from '@/lib/audio-engine';
import { Minimize2, Music, Activity, Sparkles, Moon } from 'lucide-react';
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
  const [isStrobing, setIsStrobing] = useState(false);
  const [isAmbient, setIsAmbient] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const handleStep = (step: number) => { setCurrentStep(step % 16); };
    const handleDrumHit = () => {
      setIsStrobing(true);
      spawnBurst();
      setTimeout(() => setIsStrobing(false), 150);
    };
    audioEngine?.addOnStep(handleStep);
    audioEngine?.addOnDrumHit(handleDrumHit);
    
    // Connect to central mic analyser
    const connectMic = async () => {
      analyserRef.current = await audioEngine?.getMic() || null;
      if (analyserRef.current) draw();
    };
    connectMic();

    return () => {
      audioEngine?.removeOnStep(handleStep);
      audioEngine?.removeOnDrumHit(handleDrumHit);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const spawnBurst = () => {
    if (!canvasRef.current) return;
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        x: centerX, y: centerY,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
        size: Math.random() * 5 + 2,
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
    const baseRadius = (isAmbient ? 120 : 180) + (breathingIntensity * 80);

    // Particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.97; p.vy *= 0.97;
      p.life -= 0.015;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Grid Matrices (Background)
    if (!isAmbient) {
      const melodyGrid = audioEngine?.getMelodyGrid() || [];
      const cellSize = 12;
      const gap = 6;
      
      ctx.globalAlpha = 0.15;
      melodyGrid.forEach((row, r) => {
        row.forEach((active, c) => {
          ctx.fillStyle = active ? '#ff4dff' : '#ffffff';
          const x = 50 + c * (cellSize + gap);
          const y = 100 + r * (cellSize + gap);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.globalAlpha = 1.0;
    }

    // Radial Aura
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * 220;
      const angle = (i / bufferLength) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
      const opacity = (dataArray[i] / 255) * 0.9;
      ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 77, 255, ${opacity})` : `rgba(255, 255, 255, ${opacity * 0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // Energy Rings
    const time = Date.now() / 1000;
    ctx.strokeStyle = `rgba(255, 255, 255, ${isAmbient ? 0.05 : 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(centerX, centerY, baseRadius + 120, baseRadius + 140, time * 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(centerX, centerY, baseRadius + 160, baseRadius + 150, -time * 0.2, 0, Math.PI * 2); ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-300",
      isStrobing && "animate-visualizer-strobe",
      isAmbient && "brightness-50"
    )}>
      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/nhW8Thn8/Background.png')] bg-center bg-cover opacity-20 scale-110" />
      <canvas ref={canvasRef} width={typeof window !== 'undefined' ? window.innerWidth : 1920} height={typeof window !== 'undefined' ? window.innerHeight : 1080} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 flex flex-col items-center gap-12 text-center transition-all duration-500" style={{ opacity: isAmbient ? 0.3 : 1, transform: `scale(${isAmbient ? 0.7 : 1})` }}>
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/30 blur-[120px] rounded-full animate-pulse" />
          <Mascot state="reacting" intensity={breathingIntensity} isDancing={audioEngine?.getBPM()! > 100 || isStrobing} />
        </div>
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-headline text-white drop-shadow-[0_0_40px_#ff4dff] tracking-widest uppercase">Biotune</h1>
          {!isAmbient && (
            <div className="flex items-center justify-center gap-3 px-8 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/30 text-primary font-headline text-[10px] animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>PERFORMING FROM YOUR PRESENCE</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 px-12 flex flex-col items-center gap-10" style={{ opacity: isAmbient ? 0.2 : 1 }}>
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={cn("w-3 h-3 rounded-full transition-all duration-150", currentStep === i ? "bg-white shadow-[0_0_25px_#ffffff] scale-[2.2]" : "bg-white/10")} />
          ))}
        </div>
        <div className="flex items-center gap-10 text-white/50 font-headline text-[12px] tracking-[4px]">
          <div className="flex items-center gap-3"><Music className="w-4 h-4" /><span>{audioEngine?.getBPM().toFixed(0)} BPM</span></div>
          <div className="flex items-center gap-3"><Activity className="w-4 h-4" /><span>{(breathingIntensity * 100).toFixed(0)}% SOUL</span></div>
        </div>
      </div>

      <div className="absolute top-10 right-10 flex gap-4 z-[110]">
        <button onClick={() => setIsAmbient(!isAmbient)} className="p-5 bg-white/10 backdrop-blur-xl rounded-full border border-white/30 text-white hover:scale-110 transition-all shadow-2xl">
          <Moon className="w-8 h-8" />
        </button>
        <button onClick={onClose} className="p-5 bg-white/10 backdrop-blur-xl rounded-full border border-white/30 text-white hover:scale-110 transition-all shadow-2xl">
          <Minimize2 className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
