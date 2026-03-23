
"use client";

import * as Tone from "tone";

class AudioEngine {
  private synth: Tone.PolySynth;
  private drumSynth: Tone.MembraneSynth;
  private isStarted = false;
  private sequence: Tone.Sequence | null = null;
  private notes: string[] = ["C4", "E4", "G4", "B4", "C5", "D5", "E5", "G5"];
  private loopNotesCount: number = 8;
  private loopBarsCount: number = 4;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.drumSynth = new Tone.MembraneSynth().toDestination();
    
    this.synth.set({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, release: 1, decay: 0.2, sustain: 0.5 }
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
    this.setupSequence();
    Tone.getTransport().start();
  }

  private setupSequence() {
    if (this.sequence) {
      this.sequence.dispose();
    }
    
    // Create a sequence using the current set of notes
    this.sequence = new Tone.Sequence((time, note) => {
      this.synth.triggerAttackRelease(note, "8n", time);
    }, this.notes.slice(0, this.loopNotesCount), "4n").start(0);
  }

  stop() {
    if (this.isStarted) {
      Tone.getTransport().stop();
      this.synth.releaseAll();
    }
  }

  setBPM(bpm: number) {
    const clampedBpm = Math.max(40, Math.min(220, bpm));
    Tone.getTransport().bpm.rampTo(clampedBpm, 1);
  }

  getBPM() {
    return Tone.getTransport().bpm.value;
  }

  triggerDrum(type: 'soft' | 'hard' | 'roll') {
    if (!this.isStarted) return;
    const velocity = type === 'soft' ? 0.3 : type === 'hard' ? 0.9 : 0.6;
    this.drumSynth.triggerAttackRelease("C1", "8n", Tone.now(), velocity);
    
    if (type === 'roll') {
      this.drumSynth.triggerAttackRelease("C1", "16n", Tone.now() + 0.1, 0.4);
      this.drumSynth.triggerAttackRelease("C1", "32n", Tone.now() + 0.2, 0.2);
    }
  }

  triggerNote(note: string) {
    if (!this.isStarted) return;
    this.synth.triggerAttackRelease(note, "4n");
  }

  setAmbience(intensity: number) {
    // Map breathingIntensity (0-1) to volume (-40 to 0 dB)
    const db = Tone.gainToDb(intensity * 0.7 + 0.1); 
    this.synth.volume.rampTo(Math.max(-30, db - 10), 0.5);
  }

  updateLoop(notesCount: number, barsCount: number) {
    this.loopNotesCount = notesCount;
    this.loopBarsCount = barsCount;
    if (this.isStarted) {
      this.setupSequence();
    }
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
