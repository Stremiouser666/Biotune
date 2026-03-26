"use client";

import { useEffect, useState } from "react";
import TutorialScreen from "@/components/TutorialScreen";

// 👇 import your existing components
import PianoRoll from "@/components/piano-roll";
import DrumPads from "@/components/drum-pads";
import Visualizer from "@/components/fullscreen-visualizer";

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem("hideTutorial") === "true";
    setShowTutorial(!hidden);
  }, []);

  return (
    <main className="relative">
      
      {/* 🎯 Tutorial Overlay */}
      {showTutorial && (
        <TutorialScreen onClose={() => setShowTutorial(false)} />
      )}

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

        {/* 🤖 AI Toggle (example placeholder) */}
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