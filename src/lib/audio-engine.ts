
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
  
  // Sequencer State
  private melodyGrid: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
  private drumGrid: boolean[][] = Array(4).fill(null).map(() => Array(16).fill(false));
  private currentStep = 0;
  private repeatEvent: number | null = null;

  private notes: string[] = ["C5", "A4", "G4", "F4", "E4", "D4", "C4", "G3"]; 
  private rootNote: string = "C";

  private onStepCallback: ((step: number) => void) | null = null;
  private onDrumHitCallback: (() => void) | null = null;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.drumSynth = new Tone.MembraneSynth().toDestination();
    
    this.synth.set({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, release: 1, decay: 0.2, sustain: 0.5 }
    });

    this.pianoSampler = new Tone.Sampler({
      urls: {
        "A1": "A1.mp3", "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3", "A5": "A5.mp3",
        "C1": "C1.mp3", "C2": "C2.mp3", "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/casio/",
      onload: () => { this.isLoaded = true; }
    }).toDestination();

    this.drumPlayers = new Tone.Players({
      urls: { kick: "kick.mp3", snare: "snare.mp3", hat: "hihat.mp3" },
      baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/",
    }).toDestination();

    this.loadSession();
  }

  public loadSession() {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('biotune_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.melodyGrid = data.melodyGrid || Array(8).fill(null).map(() => Array(8).fill(false));
        this.drumGrid = data.drumGrid || Array(4).fill(null).map(() => Array(16).fill(false));
        this.rootNote = data.rootNote || "C";
        this.updateScale(this.rootNote);
        return data;
      } catch (e) { 
        console.error("Session load error", e); 
        return null;
      }
    }
    return null;
  }

  public saveSession() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('biotune_session', JSON.stringify({
      melodyGrid: this.melodyGrid,
      drumGrid: this.drumGrid,
      rootNote: this.rootNote
    }));
  }

  public resetSession() {
    this.melodyGrid = Array(8).fill(null).map(() => Array(8).fill(false));
    this.drumGrid = Array(4).fill(null).map(() => Array(16).fill(false));
    this.saveSession();
  }

  setOnStep(callback: (step: number) => void) { this.onStepCallback = callback; }
  setOnDrumHit(callback: () => void) { this.onDrumHitCallback = callback; }

  async start() {
    if (this.isStarted) {
      Tone.getTransport().start();
      return;
    }
    await Tone.start();
    Tone.getTransport().bpm.value = 80;
    this.isStarted = true;
    this.setupSequencer();
    Tone.getTransport().start();
  }

  togglePlay() {
    if (Tone.getTransport().state === 'started') Tone.getTransport().pause();
    else Tone.getTransport().start();
  }

  private setupSequencer() {
    if (this.repeatEvent !== null) Tone.getTransport().clear(this.repeatEvent);
    
    this.repeatEvent = Tone.getTransport().scheduleRepeat((time) => {
      const melodyStep = this.currentStep % 8;
      this.melodyGrid.forEach((row, rowIndex) => {
        if (row[melodyStep]) {
          this.triggerNoteAtTime(this.notes[rowIndex], time);
        }
      });

      const drumStep = this.currentStep % 16;
      if (this.drumGrid[0][drumStep]) this.triggerDrum('hard', time); 
      if (this.drumGrid[1][drumStep]) this.triggerDrum('soft', time); 
      if (this.drumGrid[2][drumStep]) this.triggerDrum('roll', time); 
      if (this.drumGrid[3][drumStep]) this.triggerDrum('soft', time); 

      if (this.onStepCallback) {
        Tone.Draw.schedule(() => this.onStepCallback!(this.currentStep), time);
      }

      this.currentStep = (this.currentStep + 1) % 16;
    }, "16n");
  }

  stop() {
    Tone.getTransport().stop();
    this.synth.releaseAll();
    this.currentStep = 0;
  }

  setMode(mode: AudioMode) { this.mode = mode; }
  getMode(): AudioMode { return this.mode; }

  setBPM(bpm: number) {
    const clampedBpm = Math.max(40, Math.min(180, bpm));
    Tone.getTransport().bpm.rampTo(clampedBpm, 1);
  }
  getBPM() { return Tone.getTransport().bpm.value; }

  setMasterVolume(val: number) {
    Tone.getDestination().volume.rampTo(Tone.gainToDb(val), 0.1);
  }

  updateScale(root: string) {
    this.rootNote = root;
    const scaleMap: Record<string, string[]> = {
      "C": ["C5", "A4", "G4", "F4", "E4", "D4", "C4", "G3"],
      "D": ["D5", "B4", "A4", "G4", "F#4", "E4", "D4", "A3"],
      "E": ["E5", "C#5", "B4", "A4", "G#4", "F#4", "E4", "B3"],
      "F": ["F5", "D5", "C5", "Bb4", "A4", "G4", "F4", "C4"],
      "G": ["G5", "E5", "D5", "C5", "B4", "A4", "G4", "D4"]
    };
    this.notes = scaleMap[root] || scaleMap["C"];
  }

  getMelodyGrid() { return this.melodyGrid; }
  toggleMelody(row: number, col: number) { 
    this.melodyGrid[row][col] = !this.melodyGrid[row][col]; 
  }

  getDrumGrid() { return this.drumGrid; }
  toggleDrumStep(padIndex: number, stepIndex: number) { 
    this.drumGrid[padIndex][stepIndex] = !this.drumGrid[padIndex][stepIndex]; 
  }

  triggerDrum(type: 'soft' | 'hard' | 'roll', time?: any) {
    const triggerTime = time || Tone.now();
    if (this.onDrumHitCallback && !time) this.onDrumHitCallback();

    if (this.mode === 'custom' && this.customDrumPlayers) {
      const p = this.customDrumPlayers;
      if (type === 'hard' && p.has("kick")) p.player("kick").start(triggerTime);
      if (type === 'soft' && p.has("snare")) p.player("snare").start(triggerTime);
      if (type === 'roll' && p.has("hat")) p.player("hat").start(triggerTime);
    } else if (this.mode === 'sampled' && this.drumPlayers) {
      const p = this.drumPlayers;
      if (type === 'hard') p.player("kick").start(triggerTime);
      if (type === 'soft') p.player("snare").start(triggerTime);
      if (type === 'roll') p.player("hat").start(triggerTime);
    } else {
      this.drumSynth.triggerAttackRelease("C1", "8n", triggerTime, type === 'hard' ? 1 : 0.5);
    }
  }

  triggerNote(note: string) {
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
    const targetDb = Math.max(-40, Tone.gainToDb(intensity) - 10);
    this.synth.volume.rampTo(targetDb, 0.5);
  }

  setCustomPiano(url: string) {
    if (this.customPianoSampler) this.customPianoSampler.dispose();
    this.customPianoSampler = new Tone.Sampler({
      urls: { "C4": url },
    }).toDestination();
  }

  setCustomDrums(type: 'kick' | 'snare' | 'hat', url: string) {
    if (!this.customDrumPlayers) this.customDrumPlayers = new Tone.Players().toDestination();
    this.customDrumPlayers.add(type, url);
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
