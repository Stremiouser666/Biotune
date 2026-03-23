
"use client";

import * as Tone from "tone";

class AudioEngine {
  private synth: Tone.PolySynth;
  private drumSynth: Tone.MembraneSynth;
  private sampler: Tone.Sampler | null = null;
  private isStarted = false;
  private loop: Tone.Loop | null = null;
  private notes: string[] = ["C4", "E4", "G4", "B4"];
  private currentStep = 0;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.drumSynth = new Tone.MembraneSynth().toDestination();
    
    // Default settings
    this.synth.set({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, release: 1 }
    });
  }

  async start() {
    if (this.isStarted) {
      Tone.getTransport().start();
      return;
    }
    await Tone.start();
    Tone.getTransport().bpm.value = 80;
    this.isStarted = true;
    Tone.getTransport().start();
  }

  stop() {
    if (this.isStarted) {
      Tone.getTransport().stop();
      this.synth.releaseAll();
    }
  }

  setBPM(bpm: number) {
    Tone.getTransport().bpm.rampTo(bpm, 1);
  }

  triggerDrum(type: 'soft' | 'hard' | 'roll') {
    if (!this.isStarted) return;
    const velocity = type === 'soft' ? 0.3 : 0.8;
    this.drumSynth.triggerAttackRelease("C1", "8n", Tone.now(), velocity);
    if (type === 'roll') {
      this.drumSynth.triggerAttackRelease("C1", "16n", Tone.now() + 0.1, 0.5);
    }
  }

  triggerNote(note: string) {
    if (!this.isStarted) return;
    this.synth.triggerAttackRelease(note, "4n");
  }

  setAmbience(intensity: number) {
    // Basic mapping of breathing intensity to synth volume/filter
    const db = Tone.gainToDb(intensity);
    this.synth.volume.value = Math.max(-40, db - 10);
  }

  getBPM() {
    return Tone.getTransport().bpm.value;
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
