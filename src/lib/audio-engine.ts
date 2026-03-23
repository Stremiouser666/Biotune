
"use client";

import * as Tone from "tone";

export type AudioMode = 'synth' | 'sampled' | 'custom';

class AudioEngine {
  private synth: Tone.PolySynth;
  private drumSynth: Tone.MembraneSynth;
  
  private pianoSampler: Tone.Sampler | null = null;
  private drumPlayers: Tone.Players | null = null;
  
  private customPianoSampler: Tone.Sampler | null = null;
  private customDrumPlayers: Tone.Players | null = null;
  
  private isStarted = false;
  private isLoaded = false;
  private mode: AudioMode = 'sampled';
  
  private sequence: Tone.Sequence | null = null;
  private notes: string[] = ["C4", "E4", "G4", "B4", "C5", "D5", "E5", "G5"];
  private loopNotesCount: number = 8;
  private loopBarsCount: number = 4;

  constructor() {
    // 1. Synthetic setup
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.drumSynth = new Tone.MembraneSynth().toDestination();
    
    this.synth.set({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, release: 1, decay: 0.2, sustain: 0.5 }
    });

    // 2. Sampled setup (Piano)
    this.pianoSampler = new Tone.Sampler({
      urls: {
        "A1": "A1.mp3",
        "A2": "A2.mp3",
        "A3": "A3.mp3",
        "A4": "A4.mp3",
        "A5": "A5.mp3",
        "C1": "C1.mp3",
        "C2": "C2.mp3",
        "C3": "C3.mp3",
        "C4": "C4.mp3",
        "C5": "C5.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/casio/",
      onload: () => {
        this.isLoaded = true;
      }
    }).toDestination();

    // 3. Sampled setup (Drums)
    this.drumPlayers = new Tone.Players({
      urls: {
        kick: "kick.mp3",
        snare: "snare.mp3",
        hat: "hihat.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/",
    }).toDestination();
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
    
    this.sequence = new Tone.Sequence((time, note) => {
      this.triggerNoteAtTime(note, time);
    }, this.notes.slice(0, this.loopNotesCount), "4n").start(0);
  }

  stop() {
    if (this.isStarted) {
      Tone.getTransport().stop();
      this.synth.releaseAll();
      if (this.pianoSampler) this.pianoSampler.releaseAll();
      if (this.customPianoSampler) this.customPianoSampler.releaseAll();
    }
  }

  setMode(mode: AudioMode) {
    this.mode = mode;
    this.synth.releaseAll();
    if (this.pianoSampler) this.pianoSampler.releaseAll();
    if (this.customPianoSampler) this.customPianoSampler.releaseAll();
  }

  getMode(): AudioMode {
    return this.mode;
  }

  setBPM(bpm: number) {
    const clampedBpm = Math.max(40, Math.min(220, bpm));
    Tone.getTransport().bpm.rampTo(clampedBpm, 1);
  }

  getBPM() {
    return Tone.getTransport().bpm.value;
  }

  setCustomPiano(url: string) {
    if (this.customPianoSampler) this.customPianoSampler.dispose();
    this.customPianoSampler = new Tone.Sampler({
      urls: { "C4": url },
      onload: () => console.log("Custom Piano Loaded")
    }).toDestination();
  }

  setCustomDrums(type: 'kick' | 'snare' | 'hat', url: string) {
    if (!this.customDrumPlayers) {
      this.customDrumPlayers = new Tone.Players().toDestination();
    }
    this.customDrumPlayers.add(type, url);
  }

  triggerDrum(type: 'soft' | 'hard' | 'roll') {
    if (!this.isStarted) return;

    if (this.mode === 'custom' && this.customDrumPlayers) {
      const p = this.customDrumPlayers;
      if (type === 'hard' && p.has("kick")) p.player("kick").start();
      if (type === 'soft' && p.has("snare")) p.player("snare").start();
      if (type === 'roll' && p.has("hat")) p.player("hat").start();
    } else if (this.mode === 'sampled' && this.drumPlayers) {
      const p = this.drumPlayers;
      if (type === 'hard') p.player("kick").start();
      if (type === 'soft') p.player("snare").start();
      if (type === 'roll') {
        p.player("hat").start();
        p.player("hat").start("+0.1");
        p.player("hat").start("+0.2");
      }
    } else {
      const velocity = type === 'soft' ? 0.3 : type === 'hard' ? 0.9 : 0.6;
      this.drumSynth.triggerAttackRelease("C1", "8n", Tone.now(), velocity);
      
      if (type === 'roll') {
        this.drumSynth.triggerAttackRelease("C1", "16n", Tone.now() + 0.1, 0.4);
        this.drumSynth.triggerAttackRelease("C1", "32n", Tone.now() + 0.2, 0.2);
      }
    }
  }

  triggerNote(note: string) {
    if (!this.isStarted) return;
    this.triggerNoteAtTime(note, Tone.now());
  }

  private triggerNoteAtTime(note: string, time: any) {
    if (this.mode === 'custom' && this.customPianoSampler) {
       this.customPianoSampler.triggerAttackRelease(note, "4n", time);
    } else if (this.mode === 'sampled' && this.pianoSampler && this.isLoaded) {
      this.pianoSampler.triggerAttackRelease(note, "4n", time);
    } else {
      this.synth.triggerAttackRelease(note, "4n", time);
    }
  }

  setAmbience(intensity: number) {
    const db = Tone.gainToDb(intensity * 0.7 + 0.1); 
    const targetDb = Math.max(-30, db - 10);
    this.synth.volume.rampTo(targetDb, 0.5);
    if (this.pianoSampler) this.pianoSampler.volume.rampTo(targetDb, 0.5);
    if (this.customPianoSampler) this.customPianoSampler.volume.rampTo(targetDb, 0.5);
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
