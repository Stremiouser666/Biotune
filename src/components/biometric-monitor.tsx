"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { audioEngine } from "@/lib/audio-engine";

export const BiometricMonitor = React.memo(function BiometricMonitor({ onBreathingUpdate }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [breathingUI, setBreathingUI] = useState(0);
  const [movementUI, setMovementUI] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Refs (real-time, no re-renders)
  const analyserRef = useRef<AnalyserNode | null>(null);
  const breathingRef = useRef(0);
  const movementRef = useRef(0);
  const isMonitoringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastUIUpdateRef = useRef(0);
  const lastParentUpdateRef = useRef(0);

  // 🎯 START MONITORING (lazy + non-blocking)
  const startMonitoring = useCallback(async () => {
    try {
      setError(null);

      // 🔥 Do NOT block UI
      setTimeout(async () => {
        analyserRef.current = await audioEngine?.getMic() || null;

        if (!analyserRef.current) {
          setError("Mic access failed");
          return;
        }

        window.addEventListener("devicemotion", handleMotion);

        isMonitoringRef.current = true;
        setIsMonitoring(true);

        startLoop();
        startPolling();

      }, 100); // small delay avoids startup spike

    } catch (err: any) {
      setError(err.message || "Permissions denied");
    }
  }, []);

  // 🛑 STOP
  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false;
    setIsMonitoring(false);
    window.removeEventListener("devicemotion", handleMotion);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // 📱 MOTION (no React spam)
  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const total = Math.sqrt(
      (acc.x || 0) ** 2 +
      (acc.y || 0) ** 2 +
      (acc.z || 0) ** 2
    );

    const normalized = Math.min(1, total / 15);
    movementRef.current = movementRef.current * 0.7 + normalized * 0.3;
  };

  // 🔁 MAIN LOOP (runs outside React)
  const startLoop = () => {
    const loop = () => {
      if (!analyserRef.current || !isMonitoringRef.current) return;

      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);

      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const normalized = Math.min(1, avg / 120);

      breathingRef.current = normalized;

      // 🎯 Throttled UI update (~10fps)
      const now = Date.now();
      if (now - lastUIUpdateRef.current > 100) {
        setBreathingUI(normalized);
        setMovementUI(movementRef.current);
        lastUIUpdateRef.current = now;
      }

      // 🎯 Throttled parent update
      if (now - lastParentUpdateRef.current > 120) {
        onBreathingUpdate?.(normalized);
        lastParentUpdateRef.current = now;
      }

      // 🎵 Direct audio update (no React)
      audioEngine?.setAmbience(normalized);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  // ⏱ LIGHT polling (unchanged but safe)
  const startPolling = () => {
    setInterval(() => {
      if (!isMonitoringRef.current || !audioEngine) return;

      const avg = (breathingRef.current + movementRef.current) / 2;
      let bpm = audioEngine.getBPM();

      if (avg < 0.3) bpm -= 0.5;
      else if (avg > 0.7) bpm += 0.5;

      audioEngine.setBPM(bpm, true);
    }, 1000);
  };

  // 🧼 CLEANUP
  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  // 🎨 UI (lightweight)
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && <div className="text-red-500 text-xs">{error}</div>}

      {!isMonitoring ? (
        <button
          onClick={startMonitoring}
          className="px-6 py-3 rounded-full bg-white/20"
        >
          CONNECT BIOMETRICS
        </button>
      ) : (
        <div className="w-full text-center">
          <div>Breathing: {(breathingUI * 100).toFixed(0)}%</div>
          <div>Movement: {(movementUI * 100).toFixed(0)}%</div>

          <button onClick={stopMonitoring} className="mt-2 text-xs">
            Stop
          </button>
        </div>
      )}
    </div>
  );
});