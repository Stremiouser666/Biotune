"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/mascot"; // 👈 your existing mascot

const steps = [
  {
    title: "🎵 Welcome",
    text: "Let’s learn how to make your own music!",
    mood: "excited",
  },
  {
    title: "🎹 Make a Melody",
    text: "Click on the piano grid to place notes and press play.",
    target: "#piano-roll",
    mood: "teaching",
  },
  {
    title: "🥁 Add Beats",
    text: "Tap the drum pads to create your rhythm.",
    target: "#drum-pads",
    mood: "grooving",
  },
  {
    title: "🤖 AI Mode",
    text: "Turn on AI to generate music automatically!",
    target: "#ai-toggle",
    mood: "magic",
  },
  {
    title: "🎨 Visuals",
    text: "Watch cool animations that react to your music.",
    target: "#visualizer",
    mood: "amazed",
  },
  {
    title: "🚀 Ready!",
    text: "Now it’s your turn—go make something awesome!",
    mood: "celebrating",
  },
];

export default function TutorialScreen({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🎧 Sound effect
  useEffect(() => {
    audioRef.current = new Audio("/sounds/click.mp3");
  }, []);

  const playClick = () => {
    audioRef.current?.pause();
    audioRef.current!.currentTime = 0;
    audioRef.current?.play();
  };

  const next = () => {
    playClick();
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prev = () => {
    playClick();
    if (step > 0) setStep(step - 1);
  };

  // 💾 Save preference
  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem("hideTutorial", "true");
    }
    onClose?.();
  };

  // 🎯 Highlight UI
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      
      {/* 🧑 Mascot + Speech */}
      <div className="absolute bottom-6 left-6 flex items-end gap-3">
        <div className="bg-white p-3 rounded-2xl shadow-lg max-w-xs">
          <p className="text-sm">{steps[step].text}</p>
        </div>

        <Mascot mood={steps[step].mood} />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4">
              {steps[step].title}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <Button onClick={prev} disabled={step === 0} variant="outline">
            Back
          </Button>

          {step === steps.length - 1 ? (
            <Button onClick={handleClose}>Start</Button>
          ) : (
            <Button onClick={next}>Next</Button>
          )}
        </div>

        {/* 💾 Toggle */}
        <div className="mt-4 text-sm flex items-center justify-center gap-2">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={() => setDontShow(!dontShow)}
          />
          <span>Don’t show this again</span>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-4 gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === step ? "bg-black" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Highlight styling */}
      <style jsx global>{`
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
}