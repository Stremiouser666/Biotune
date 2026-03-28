"use client";

import { Moon, Maximize2, Share2, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isAmbient: boolean;
  onToggleAmbient: () => void;
  onFullscreen: () => void;
  onShare: () => void;
  onGoHome: () => void;
}

export function DashboardHeader({ isAmbient, onToggleAmbient, onFullscreen, onShare, onGoHome }: Props) {
  return (
    <div className="fixed top-4 right-4 flex gap-2 z-50">
      <button
        onClick={onToggleAmbient}
        className={cn("p-3 backdrop-blur-md rounded-full border shadow-lg transition-all", isAmbient ? "bg-primary text-white" : "bg-white/40 text-primary")}
      >
        <Moon className="w-5 h-5" />
      </button>
      <button
        onClick={onFullscreen}
        className="p-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 transition-all"
      >
        <Maximize2 className="w-5 h-5 text-primary" />
      </button>
      <button
        onClick={onShare}
        className="p-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 transition-all"
      >
        <Share2 className="w-5 h-5 text-primary" />
      </button>
      <button
        onClick={onGoHome}
        className="p-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-lg hover:scale-110 transition-all"
      >
        <Home className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
}
