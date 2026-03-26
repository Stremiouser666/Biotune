"use client";

import { useEffect, useState } from "react";
import TutorialScreen from "@/components/TutorialScreen";

// 👇 your existing components
import PianoRoll from "@/components/piano-roll";
import DrumPads from "@/components/drum-pads";
import Visualizer from "@/components/fullscreen-visualizer";

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // 👈 prevents flicker

  useEffect(() => {
    const hidden = localStorage.getItem("hideTutorial") === "true";
    setShowTutorial(!hidden);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null; // 👈 avoids hydration mismatch

  return (
    <main className="relative">

      {/* 🎯 Tutorial Overlay */}
      {showTutorial && (
        <TutorialScreen onClose={() => setShowTutorial(false)} />
      )}

      {/* 🔁 Optional: Restart Tutorial Button */}
      <button
        onClick={() => {
          localStorage.removeItem("hideTutorial");
          setShowTutorial(true);
        }}
        className="fixed top-4 right-4 z-40 px-3 py-2 text-xs bg-black text-white rounded"
      >
        Help ❓
      </button>

      {/* 👇 YOUR APP UI */}
      <div className="p-4 space-y-6">

        {/* 🎹 Piano */}
        <div id="piano-roll">
          <PianoRoll />
        </div>

        {/* 🥁 Drums */}
        <div id="drum-pads">
          <DrumPads />
        </div>

        {/* 🤖 AI Toggle */}
        <div id="ai-toggle">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Toggle AI
          </button>
        </div>

        {/* 🎨 Visualizer */}
        <div id="visualizer">
          <Visualizer />
        </div>

      </div>
    </main>
  );
}