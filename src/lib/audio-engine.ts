
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
  
  private reverb: Tone.Reverb;
  private masterGain: Tone.Gain;
  private recorder: Tone.Recorder;
  
  private isStarted = false;
  private isLoaded = false;
  private mode: AudioMode = 'sampled';
  private chordMode: boolean = false;
  private currentSlot: string = 'A';
  
  // Sequencer State
  private melodyGrid: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
  private drumGrid: boolean[][] = Array(4).fill(null).map(() => Array(16).fill(false));
  private drumMutes: boolean[] = [false, false, false, false];
  private currentStep = 0;
  private repeatEvent: number | null = null;
  private swingAmount = 0;

  private notes: string[] = ["C5", "A4", "G4", "F4", "E4", "D4", "C4", "G3"]; 
  private rootNote: string = "C";

  private onStepListeners: Set<(step: number) => void> = new Set();
  private onDrumHitListeners: Set<() => void> = new Set();

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2, wet: 0.2 }).toDestination();
    this.masterGain = new Tone.Gain(1).connect(this.reverb);
    this.recorder = new Tone.Recorder();
    
    // Connect everything to the recorder
    this.reverb.connect(this.recorder);

    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterGain);
    this.drumSynth = new Tone.MembraneSynth().connect(this.masterGain);
    
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
    }).connect(this.masterGain);

    this.drumPlayers = new Tone.Players({
      urls: { kick: "kick.mp3", snare: "snare.mp3", hat: "hihat.mp3" },
      baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/",
    }).connect(this.masterGain);

    this.loadSession();
  }

  public async startRecording() {
    if (this.recorder.state !== "started") {
      this.recorder.start();
    }
  }

  public async stopRecording() {
    if (this.recorder.state === "started") {
      const recording = await this.recorder.stop();
      const url = URL.createObjectURL(recording);
      const anchor = document.createElement("a");
      anchor.download = `biotune-creation-${this.currentSlot}-${Date.now()}.webm`;
      anchor.href = url;
      anchor.click();
    }
  }

  public setSlot(slot: string) {
    this.currentSlot = slot;
  }

  public getSlot() {
    return this.currentSlot;
  }

  public setChordMode(active: boolean) {
    this.chordMode = active;
  }

  public getChordMode() {
    return this.chordMode;
  }

  public loadSession(dataToLoad?: any) {
    if (typeof window === 'undefined') return null;
    const key = `biotune_session_${this.currentSlot}`;
    const saved = dataToLoad || JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) {
      try {
        this.melodyGrid = saved.melodyGrid || Array(8).fill(null).map(() => Array(8).fill(false));
        this.drumGrid = saved.drumGrid || Array(4).fill(null).map(() => Array(16).fill(false));
        this.drumMutes = saved.drumMutes || [false, false, false, false];
        this.rootNote = saved.rootNote || "C";
        this.swingAmount = saved.swingAmount || 0;
        this.chordMode = !!saved.chordMode;
        this.setSwing(this.swingAmount);
        this.updateScale(this.rootNote);
        if (saved.reverbWet !== undefined) this.setReverb(saved.reverbWet);
        return saved;
      } catch (e) { 
        return null;
      }
    }
    return null;
  }

  public getSessionData() {
    return {
      melodyGrid: this.melodyGrid,
      drumGrid: this.drumGrid,
      drumMutes: this.drumMutes,
      rootNote: this.rootNote,
      reverbWet: this.reverb.wet.value,
      swingAmount: this.swingAmount,
      chordMode: this.chordMode
    };
  }

  public saveSession() {
    if (typeof window === 'undefined') return;
    const key = `biotune_session_${this.currentSlot}`;
    localStorage.setItem(key, JSON.stringify(this.getSessionData()));
  }

  public resetSession() {
    this.melodyGrid = Array(8).fill(null).map(() => Array(8).fill(false));
    this.drumGrid = Array(4).fill(null).map(() => Array(16).fill(false));
    this.drumMutes = [false, false, false, false];
    this.saveSession();
  }

  addOnStep(callback: (step: number) => void) { this.onStepListeners.add(callback); }
  removeOnStep(callback: (step: number) => void) { this.onStepListeners.delete(callback); }
  
  addOnDrumHit(callback: () => void) { this.onDrumHitListeners.add(callback); }
  removeOnDrumHit(callback: () => void) { this.onDrumHitListeners.delete(callback); }

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
          this.triggerNoteAtTime(rowIndex, time);
        }
      });

      const drumStep = this.currentStep % 16;
      if (this.drumGrid[0][drumStep] && !this.drumMutes[0]) this.triggerDrum('hard', time); 
      if (this.drumGrid[1][drumStep] && !this.drumMutes[1]) this.triggerDrum('soft', time); 
      if (this.drumGrid[2][drumStep] && !this.drumMutes[2]) this.triggerDrum('roll', time); 
      if (this.drumGrid[3][drumStep] && !this.drumMutes[3]) this.triggerDrum('soft', time); 

      Tone.Draw.schedule(() => {
        this.onStepListeners.forEach(listener => listener(this.currentStep));
      }, time);

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

  setSwing(amount: number) {
    this.swingAmount = amount;
    Tone.getTransport().swing = amount;
    Tone.getTransport().swingSubdivision = "16n";
  }
  getSwing() { return this.swingAmount; }

  setReverb(wet: number) {
    this.reverb.wet.rampTo(wet, 0.5);
  }
  getReverb() { return this.reverb.wet.value; }

  setMasterVolume(val: number) {
    this.masterGain.gain.rampTo(val, 0.1);
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

  getNotes() { return this.notes; }

  getMelodyGrid() { return this.melodyGrid; }
  toggleMelody(row: number, col: number) { 
    this.melodyGrid[row][col] = !this.melodyGrid[row][col]; 
    this.saveSession();
  }
  
  randomizeMelody() {
    this.melodyGrid = this.melodyGrid.map(() => 
      Array(8).fill(null).map(() => Math.random() > 0.85)
    );
    this.saveSession();
  }

  clearMelodyRow(row: number) {
    this.melodyGrid[row] = Array(8).fill(false);
    this.saveSession();
  }

  getDrumGrid() { return this.drumGrid; }
  toggleDrumStep(padIndex: number, stepIndex: number) { 
    this.drumGrid[padIndex][stepIndex] = !this.drumGrid[padIndex][stepIndex]; 
    this.saveSession();
  }

  clearDrumRow(row: number) {
    this.drumGrid[row] = Array(16).fill(false);
    this.saveSession();
  }

  toggleDrumMute(index: number) {
    this.drumMutes[index] = !this.drumMutes[index];
    this.saveSession();
  }
  getDrumMutes() { return this.drumMutes; }

  triggerDrum(type: 'soft' | 'hard' | 'roll', time?: any) {
    const triggerTime = time || Tone.now();
    if (!time) {
      this.onDrumHitListeners.forEach(l => l());
    }

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
    // Simple wrapper for live UI taps
    this.triggerNoteAtTime(this.notes.indexOf(note), Tone.now());
  }

  private triggerNoteAtTime(rowIndex: number, time: any) {
    const notesToPlay = [this.notes[rowIndex]];
    
    if (this.chordMode) {
      // Add the "3rd" and "5th" from the scale array if within bounds
      if (rowIndex + 2 < this.notes.length) notesToPlay.push(this.notes[rowIndex + 2]);
      if (rowIndex + 4 < this.notes.length) notesToPlay.push(this.notes[rowIndex + 4]);
    }

    notesToPlay.forEach(note => {
      if (this.mode === 'custom' && this.customPianoSampler) {
        this.customPianoSampler.triggerAttackRelease(note, "4n", time);
      } else if (this.mode === 'sampled' && this.pianoSampler && this.isLoaded) {
        this.pianoSampler.triggerAttackRelease(note, "4n", time);
      } else {
        this.synth.triggerAttackRelease(note, "4n", time);
      }
    });
  }

  setAmbience(intensity: number) {
    const targetDb = Math.max(-40, Tone.gainToDb(intensity) - 10);
    this.synth.volume.rampTo(targetDb, 0.5);
    if (this.pianoSampler) this.pianoSampler.volume.rampTo(targetDb, 0.5);
    if (this.customPianoSampler) this.customPianoSampler.volume.rampTo(targetDb, 0.5);
  }

  setCustomPiano(url: string) {
    if (this.customPianoSampler) this.customPianoSampler.dispose();
    this.customPianoSampler = new Tone.Sampler({
      urls: { "C4": url },
    }).connect(this.masterGain);
  }

  setCustomDrums(type: 'kick' | 'snare' | 'hat', url: string) {
    if (!this.customDrumPlayers) this.customDrumPlayers = new Tone.Players().connect(this.masterGain);
    this.customDrumPlayers.add(type, url);
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
