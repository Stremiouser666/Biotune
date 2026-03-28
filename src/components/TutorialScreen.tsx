"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot";

const steps = [
  {
    title: "🎵 Welcome",
    text: "Let's learn how to make your own music!",
    mascot: { state: "active", intensity: 0.3, isDancing: false },
  },
  {
    title: "🎹 Make a Melody",
    text: "Click on the piano grid to place notes and press play.",
    target: "#piano-roll",
    mascot: { state: "reacting", intensity: 0.5, isDancing: false },
  },
  {
    title: "🥁 Add Beats",
    text: "Tap the drum pads to create your rhythm.",
    target: "#drum-pads",
    mascot: { state: "active", intensity: 0.7, isDancing: true },
  },
  {
    title: "🤖 AI Mode",
    text: "Turn on AI to generate music automatically!",
    target: "#ai-toggle",
    mascot: { state: "reacting", intensity: 0.6, isDancing: false },
  },
  {
    title: "🎨 Visuals",
    text: "Watch cool animations that react to your music.",
    target: "#visualizer",
    mascot: { state: "active", intensity: 0.9, isDancing: true },
  },
  {
    title: "🚀 Ready!",
    text: "Now it's your turn—go make something awesome!",
    mascot: { state: "active", intensity: 1, isDancing: true },
  },
];

// FIX 7: Wrap in React.memo so it doesn't re-render when parent state changes
const TutorialScreen = React.memo(function TutorialScreen({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/click.mp3");
  }, []);

  const playClick = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const next = () => {
    playClick();
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prev = () => {
    playClick();
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    if (dontShow) localStorage.setItem("hideTutorial", "true");
    onClose?.();
  };

  useEffect(() => {
    const selector = steps[step]?.target;
    const el = selector ? document.querySelector(selector) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tutorial-highlight");
    }
    return () => {
      if (el) el.classList.remove("tutorial-highlight");
    };
  }, [step]);

  const mascotProps = steps[step].mascot;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="absolute bottom-6 left-6 flex items-end gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-lg max-w-xs">
          <p className="text-sm font-medium">{steps[step].text}</p>
        </div>
        <Mascot
          state={mascotProps.state as any}
          intensity={mascotProps.intensity}
          isDancing={mascotProps.isDancing}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4">{steps[step].title}</h2>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button onClick={prev} disabled={step === 0} variant="outline">Back</Button>
          {step === steps.length - 1 ? (
            <Button onClick={handleClose}>Start</Button>
          ) : (
            <Button onClick={next}>Next</Button>
          )}
        </div>

        <div className="mt-4 text-sm flex items-center justify-center gap-2">
          <input type="checkbox" checked={dontShow} onChange={() => setDontShow(!dontShow)} />
          <span>Don't show this again</span>
        </div>

        <div className="flex justify-center mt-4 gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 w-2 rounded-full ${i === step ? "bg-black" : "bg-gray-300"}`} />
          ))}
        </div>
      </div>

      <style>{`
        .tutorial-highlight {
          outline: 3px solid #00f0ff;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.8);
          position: relative;
          z-index: 60;
        }
      `}</style>
    </div>
  );
});

export default TutorialScreen;
