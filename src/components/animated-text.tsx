
"use client";

import React, { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  onComplete?: () => void;
  delayPerWord?: number;
}

export function AnimatedText({ text, className, onComplete, delayPerWord = 150 }: AnimatedTextProps) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= words.length) {
          clearInterval(interval);
          onComplete?.();
          return prev;
        }
        return prev + 1;
      });
    }, delayPerWord);

    return () => clearInterval(interval);
  }, [text, delayPerWord, words.length, onComplete]);

  return (
    <div className={cn("word-reveal flex flex-wrap justify-center gap-x-2", className)}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            animationDelay: `${i * 0.05}s`,
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? 'translateY(0)' : 'translateY(10px)'
          }}
          className="transition-all duration-300 ease-out"
        >
          {word}
        </span>
      ))}
    </div>
  );
}
