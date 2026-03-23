"use client";

import * as Tone from "tone";

export type AudioMode = 'synth' | 'sampled' | 'custom';
export type OscillatorType = 'sine' | 'triangle' | 'square' | 'sawtooth';
export type NoteLength = '16n' | '8n' | '4n';

interface SceneData {
  melodyGrid: boolean[][];
  drumGrid: boolean[][];
  melodyLength: number;
  drumLength: number;
  pitchOffsets: number[];
}

interface SessionState {
  scenes: SceneData[];
  activeSceneIndex: number;
  drumMutes: boolean[];
  rootNote: string;
  reverbWet: number;
  delayWet: number;
  delayFeedback: number;
  filterFrequency: number;
  swingAmount: number;
  chordMode: boolean;
  bpm: number;
  masterVolume: number;
  oscillatorType: OscillatorType;
  noteLength: NoteLength;
  micSensitivity: number;
  motionSensitivity: number;
  restingBpm: number;
  isChaining: boolean;
}

const PRESETS: Record<string, Partial<SessionState>> = {
  "LO-FI": { bpm: 72, reverbWet: 0.6, delayWet: 0.4, filterFrequency: 1200, oscillatorType: 'triangle', swingAmount: 0.2 },
  "AMBIENT": { bpm: 60, reverbWet: 0.8, delayWet: 0.6, filterFrequency: 800, oscillatorType: 'sine', noteLength: '4n' },
  "UPTEMPO": { bpm: 124, reverbWet: 0.2, delayWet: 0.2, filterFrequency: 15000, oscillatorType: 'sawtooth', noteLength: '16n' }
};

class AudioEngine {
  private synth: Tone.PolySynth;
  private drumSynth: Tone.MembraneSynth;
  private pianoSampler: Tone.Sampler | null = null;
  private drumPlayers: Tone.Players | null = null;
  private customPianoSampler: Tone.Sampler | null = null;
  private customDrumPlayers: Tone.Players | null = null;
  
  private filter: Tone.Filter;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private masterGain: Tone.Gain;
  private recorder: Tone.Recorder;
  
  private isStarted = false;
  private isLoaded = false;
  private mode: AudioMode = 'sampled';
  private chordMode: boolean = false;
  private currentSlot: string = 'A';
  
  private scenes: SceneData[] = Array(4).fill(null).map(() => ({
    melodyGrid: Array(8).fill(null).map(() => Array(16).fill(false)),
    drumGrid: Array(4).fill(null).map(() => Array(16).fill(false)),
    melodyLength: 8,
    drumLength: 16,
    pitchOffsets: Array(8).fill(0),
  }));
  
  private activeSceneIndex = 0;
  private drumMutes: boolean[] = [false, false, false, false];
  private oscillatorType: OscillatorType = 'triangle';
  private noteLength: NoteLength = '4n';
  private currentStep = 0;
  private repeatEvent: number | null = null;
  private swingAmount = 0;
  private notes: string[] = ["C5", "A4", "G4", "F4", "E4", "D4", "C4", "G3"]; 
  private rootNote: string = "C";
  private micSensitivity: number = 1.0;
  private motionSensitivity: number = 1.0;
  private currentAmbience: number = 0.5;
  private restingBpm: number = 80;
  private isChaining: boolean = false;
  private undoStack: string[] = [];
  
  private midiAccess: MIDIAccess | null = null;
  private midiOutput: MIDIOutput | null = null;
  
  private micStream: MediaStream | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micPromise: Promise<AnalyserNode> | null = null;

  private onStepListeners: Set<(step: number) => void> = new Set();
  private onDrumHitListeners: Set<() => void> = new Set();
  private onLoadListeners: Set<(loaded: boolean) => void> = new Set();
  private onSceneChangeListeners: Set<(index: number) => void> = new Set();

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).toDestination();
    this.delay = new Tone.FeedbackDelay("8n", 0.3).connect(this.reverb);
    this.filter = new Tone.Filter(20000, "lowpass").connect(this.delay);
    this.masterGain = new Tone.Gain(1).connect(this.filter);
    this.recorder = new Tone.Recorder();
    this.reverb.connect(this.recorder);

    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterGain);
    this.drumSynth = new Tone.MembraneSynth().connect(this.masterGain);
    
    this.synth.set({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, release: 1.2, decay: 0.3, sustain: 0.4 }
    });

    this.initSampler();

    this.drumPlayers = new Tone.Players({
      urls: { kick: "kick.mp3", snare: "snare.mp3", hat: "hihat.mp3" },
      baseUrl: "/samples/drums/",
    }).connect(this.masterGain);

    if (typeof navigator !== 'undefined' && (navigator as any).requestMIDIAccess) {
      (navigator as any).requestMIDIAccess().then((access: any) => {
        this.midiAccess = access;
        this.midiOutput = Array.from(access.outputs.values())[0] as any || null;
      });
    }

    this.loadSession();
  }

  private initSampler(useCDN = false) {
    const baseUrl = useCDN ? "https://tonejs.github.io/audio/casio/" : "/samples/casio/";
    if (this.pianoSampler) this.pianoSampler.dispose();
    
    this.pianoSampler = new Tone.Sampler({
      urls: { "A1": "A1.mp3", "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3", "A5": "A5.mp3", "C1": "C1.mp3", "C2": "C2.mp3", "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3" },
      baseUrl,
      onload: () => { this.isLoaded = true; this.onLoadListeners.forEach(l => l(true)); },
      onerror: () => { 
        console.warn("Local samples failed, falling back to CDN...");
        this.initSampler(true); 
      }
    }).connect(this.masterGain);
  }

  public async getMic(): Promise<AnalyserNode> {
    if (this.micAnalyser) return this.micAnalyser;
    if (this.micPromise) return this.micPromise;

    this.micPromise = (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Mic not supported.');
        
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }

        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const context = Tone.getContext().rawContext as AudioContext;
        const source = context.createMediaStreamSource(this.micStream);
        this.micAnalyser = context.createAnalyser();
        this.micAnalyser.fftSize = 256;
        source.connect(this.micAnalyser);
        return this.micAnalyser;
      } catch (e) {
        this.micPromise = null;
        throw e;
      }
    })();

    return this.micPromise;
  }

  public getIsLoaded() { return this.isLoaded; }
  public addOnLoad(l: (v: boolean) => void) { this.onLoadListeners.add(l); }

  private pushUndo() {
    const state = JSON.stringify(this.getSessionData());
    this.undoStack.push(state);
    if (this.undoStack.length > 10) this.undoStack.shift();
  }

  public undo() {
    if (this.undoStack.length === 0) return null;
    const lastState = JSON.parse(this.undoStack.pop()!);
    this.loadSession(lastState);
    return lastState;
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
      anchor.download = `biotune-${Date.now()}.webm`;
      anchor.href = url;
      anchor.click();
    }
  }

  public setSlot(slot: string) { this.currentSlot = slot; }
  public getSlot() { return this.currentSlot; }
  public setChordMode(active: boolean) { this.chordMode = active; this.saveSession(); }
  public getChordMode() { return this.chordMode; }
  
  public setScene(index: number) {
    if (index < 0 || index >= this.scenes.length) return;
    this.activeSceneIndex = index;
    this.onSceneChangeListeners.forEach(l => l(index));
    this.saveSession();
  }

  public getActiveSceneIndex() { return this.activeSceneIndex; }
  public addOnSceneChange(callback: (idx: number) => void) { this.onSceneChangeListeners.add(callback); }

  public copyScene(from: number, to: number) {
    this.pushUndo();
    this.scenes[to] = JSON.parse(JSON.stringify(this.scenes[from]));
    this.saveSession();
  }

  public loadPreset(name: string) {
    const preset = PRESETS[name];
    if (preset) {
      this.pushUndo();
      if (preset.bpm) this.setBPM(preset.bpm);
      if (preset.reverbWet !== undefined) this.setReverb(preset.reverbWet);
      if (preset.delayWet !== undefined) this.setDelay(preset.delayWet, 0.5);
      if (preset.filterFrequency !== undefined) this.setFilter(preset.filterFrequency);
      if (preset.oscillatorType) this.setOscillator(preset.oscillatorType);
      if (preset.swingAmount !== undefined) this.setSwing(preset.swingAmount);
      this.saveSession();
    }
  }

  public loadSession(dataToLoad?: any) {
    if (typeof window === 'undefined') return null;
    const key = `biotune_session_${this.currentSlot}`;
    const saved = dataToLoad || JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) {
      try {
        if (saved.scenes) {
          this.scenes = saved.scenes.map((s: any) => ({
            ...s,
            pitchOffsets: s.pitchOffsets || Array(8).fill(0)
          }));
          this.activeSceneIndex = saved.activeSceneIndex || 0;
        }
        this.drumMutes = saved.drumMutes || [false, false, false, false];
        this.rootNote = saved.rootNote || "C";
        this.swingAmount = saved.swingAmount || 0;
        this.chordMode = !!saved.chordMode;
        this.oscillatorType = saved.oscillatorType || 'triangle';
        this.noteLength = saved.noteLength || '4n';
        this.micSensitivity = saved.micSensitivity || 1.0;
        this.motionSensitivity = saved.motionSensitivity || 1.0;
        this.restingBpm = saved.restingBpm || 80;
        this.isChaining = !!saved.isChaining;
        if (saved.bpm) Tone.getTransport().bpm.value = saved.bpm;
        this.setSwing(this.swingAmount);
        this.updateScale(this.rootNote);
        this.setOscillator(this.oscillatorType);
        if (saved.reverbWet !== undefined) this.setReverb(saved.reverbWet);
        if (saved.delayWet !== undefined) this.setDelay(saved.delayWet, saved.delayFeedback || 0.5);
        if (saved.filterFrequency !== undefined) this.setFilter(saved.filterFrequency);
        if (saved.masterVolume !== undefined) this.setMasterVolume(saved.masterVolume);
        return saved;
      } catch (e) { return null; }
    }
    return null;
  }

  public getSessionData(activeOnly = false): any {
    const data: any = {
      activeSceneIndex: this.activeSceneIndex,
      drumMutes: this.drumMutes,
      rootNote: this.rootNote,
      reverbWet: this.reverb.wet.value,
      delayWet: this.delay.wet.value,
      delayFeedback: this.delay.feedback.value,
      filterFrequency: this.filter.frequency.value as number,
      swingAmount: this.swingAmount,
      chordMode: this.chordMode,
      bpm: Tone.getTransport().bpm.value,
      masterVolume: this.masterGain.gain.value,
      oscillatorType: this.oscillatorType,
      noteLength: this.noteLength,
      micSensitivity: this.micSensitivity,
      motionSensitivity: this.motionSensitivity,
      restingBpm: this.restingBpm,
      isChaining: this.isChaining,
    };
    if (activeOnly) {
      data.scenes = [this.scenes[this.activeSceneIndex]];
      data.activeSceneIndex = 0;
    } else {
      data.scenes = this.scenes;
    }
    return data;
  }

  public saveSession() {
    if (typeof window === 'undefined') return;
    const key = `biotune_session_${this.currentSlot}`;
    localStorage.setItem(key, JSON.stringify(this.getSessionData()));
  }

  public resetSession() {
    this.pushUndo();
    this.scenes = Array(4).fill(null).map(() => ({
      melodyGrid: Array(8).fill(null).map(() => Array(16).fill(false)),
      drumGrid: Array(4).fill(null).map(() => Array(16).fill(false)),
      melodyLength: 8,
      drumLength: 16,
      pitchOffsets: Array(8).fill(0),
    }));
    this.activeSceneIndex = 0;
    this.drumMutes = [false, false, false, false];
    this.saveSession();
  }

  public hasContent(index: number) {
    const scene = this.scenes[index];
    if (!scene) return false;
    const hasMelody = scene.melodyGrid.some(row => row.some(step => step));
    const hasDrums = scene.drumGrid.some(row => row.some(step => step));
    return hasMelody || hasDrums;
  }

  public setRestingBpm(bpm: number) {
    this.restingBpm = bpm;
    this.saveSession();
  }
  public getRestingBpm() { return this.restingBpm; }

  public setChaining(active: boolean) {
    this.isChaining = active;
    this.saveSession();
  }
  public getChaining() { return this.isChaining; }

  public setPitchOffset(row: number, offset: number) {
    this.pushUndo();
    this.scenes[this.activeSceneIndex].pitchOffsets[row] = offset;
    this.saveSession();
  }
  public getPitchOffsets() { return this.scenes[this.activeSceneIndex].pitchOffsets; }

  addOnStep(callback: (step: number) => void) { this.onStepListeners.add(callback); }
  removeOnStep(callback: (step: number) => void) { this.onStepListeners.delete(callback); }
  addOnDrumHit(callback: () => void) { this.onDrumHitListeners.add(callback); }
  removeOnDrumHit(callback: () => void) { this.onDrumHitListeners.delete(callback); }

  async start() {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
      await Tone.getContext().resume();
    }
    if (this.isStarted) {
      Tone.getTransport().start();
      return;
    }
    Tone.getTransport().bpm.value = this.restingBpm;
    this.isStarted = true;
    this.setupSequencer();
    Tone.getTransport().start();
  }

  togglePlay() {
    if (Tone.getTransport().state === 'started') Tone.getTransport().pause();
    else {
      if (Tone.getContext().state !== 'running') Tone.getContext().resume();
      Tone.getTransport().start();
    }
  }

  private setupSequencer() {
    if (this.repeatEvent !== null) Tone.getTransport().clear(this.repeatEvent);
    this.repeatEvent = Tone.getTransport().scheduleRepeat((time) => {
      const scene = this.scenes[this.activeSceneIndex];
      const maxLen = Math.max(scene.melodyLength, scene.drumLength);
      
      const melodyStep = this.currentStep % scene.melodyLength;
      scene.melodyGrid.forEach((row, rowIndex) => {
        if (row[melodyStep]) this.triggerNoteAtTime(rowIndex, time);
      });

      const drumStep = this.currentStep % scene.drumLength;
      if (scene.drumGrid[0][drumStep] && !this.drumMutes[0]) this.triggerDrum('hard', time); 
      if (scene.drumGrid[1][drumStep] && !this.drumMutes[1]) this.triggerDrum('soft', time); 
      if (scene.drumGrid[2][drumStep] && !this.drumMutes[2]) this.triggerDrum('roll', time); 
      if (scene.drumGrid[3][drumStep] && !this.drumMutes[3]) this.triggerDrum('soft', time); 

      Tone.Draw.schedule(() => {
        this.onStepListeners.forEach(listener => listener(this.currentStep));
      }, time);

      const nextStep = (this.currentStep + 1) % maxLen;
      if (nextStep === 0 && this.isChaining) {
        Tone.Draw.schedule(() => {
          this.setScene((this.activeSceneIndex + 1) % 4);
        }, time);
      }
      this.currentStep = nextStep;
    }, "16n");
  }

  stop() { Tone.getTransport().stop(); this.synth.releaseAll(); this.currentStep = 0; }
  setMode(mode: AudioMode) { this.mode = mode; }
  getMode(): AudioMode { return this.mode; }

  setBPM(bpm: number, skipSave = false) {
    const clampedBpm = Math.max(40, Math.min(180, bpm));
    Tone.getTransport().bpm.rampTo(clampedBpm, 0.5);
    if (!skipSave) this.saveSession();
  }
  getBPM() { return Tone.getTransport().bpm.value; }

  setSwing(amount: number) {
    this.swingAmount = amount;
    Tone.getTransport().swing = amount;
    Tone.getTransport().swingSubdivision = "16n";
    this.saveSession();
  }
  getSwing() { return this.swingAmount; }

  setReverb(wet: number) { this.reverb.wet.rampTo(wet, 0.1); this.saveSession(); }
  getReverb() { return this.reverb.wet.value; }
  setDelay(wet: number, feedback: number) { this.delay.wet.rampTo(wet, 0.1); this.delay.feedback.rampTo(feedback, 0.1); this.saveSession(); }
  getDelay() { return { wet: this.delay.wet.value, feedback: this.delay.feedback.value }; }
  setFilter(freq: number) { this.filter.frequency.rampTo(freq, 0.1); this.saveSession(); }
  getFilter() { return this.filter.frequency.value as number; }
  setMasterVolume(val: number) { this.masterGain.gain.rampTo(val, 0.1); this.saveSession(); }
  getMasterVolume() { return this.masterGain.gain.value; }

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
    this.saveSession();
  }

  getNotes() { return this.notes; }
  getMelodyGrid() { return this.scenes[this.activeSceneIndex].melodyGrid; }
  toggleMelody(row: number, col: number) { 
    this.pushUndo();
    this.scenes[this.activeSceneIndex].melodyGrid[row][col] = !this.scenes[this.activeSceneIndex].melodyGrid[row][col]; 
    this.saveSession();
  }
  
  randomizeMelody() {
    this.pushUndo();
    const pentatonicSteps = [0, 2, 4, 7, 9];
    this.scenes[this.activeSceneIndex].melodyGrid = this.scenes[this.activeSceneIndex].melodyGrid.map((_, r) => 
      Array(16).fill(null).map(() => Math.random() > 0.9 && pentatonicSteps.includes(r % 12))
    );
    this.saveSession();
  }

  clearMelodyRow(row: number) { this.pushUndo(); this.scenes[this.activeSceneIndex].melodyGrid[row] = Array(16).fill(false); this.saveSession(); }
  setMelodyLength(len: number) { this.scenes[this.activeSceneIndex].melodyLength = len; this.saveSession(); }
  getMelodyLength() { return this.scenes[this.activeSceneIndex].melodyLength; }

  getDrumGrid() { return this.scenes[this.activeSceneIndex].drumGrid; }
  toggleDrumStep(padIndex: number, stepIndex: number) { 
    this.pushUndo();
    this.scenes[this.activeSceneIndex].drumGrid[padIndex][stepIndex] = !this.scenes[this.activeSceneIndex].drumGrid[padIndex][stepIndex]; 
    this.saveSession();
  }

  randomizeDrums(row?: number) {
    this.pushUndo();
    const scene = this.scenes[this.activeSceneIndex];
    if (row !== undefined) {
      scene.drumGrid[row] = Array(16).fill(null).map(() => Math.random() > 0.8);
    } else {
      scene.drumGrid = scene.drumGrid.map(() => Array(16).fill(null).map(() => Math.random() > 0.8));
    }
    this.saveSession();
  }

  clearDrumRow(row: number) { this.pushUndo(); this.scenes[this.activeSceneIndex].drumGrid[row] = Array(16).fill(false); this.saveSession(); }
  setDrumLength(len: number) { this.scenes[this.activeSceneIndex].drumLength = len; this.saveSession(); }
  getDrumLength() { return this.scenes[this.activeSceneIndex].drumLength; }
  toggleDrumMute(index: number) { this.drumMutes[index] = !this.drumMutes[index]; this.saveSession(); }
  getDrumMutes() { return this.drumMutes; }

  triggerDrum(type: 'soft' | 'hard' | 'roll', time?: any) {
    const triggerTime = time || Tone.now();
    if (!time) {
      this.onDrumHitListeners.forEach(l => l());
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    }

    const midiNotes: Record<string, number> = { 'hard': 36, 'soft': 38, 'roll': 42 };
    this.sendMidi(0x90, midiNotes[type], 100);

    if (this.mode === 'custom' && this.customDrumPlayers) {
      const p = this.customDrumPlayers;
      if (type === 'hard' && p.has("kick")) p.player("kick").start(triggerTime);
      if (type === 'soft' && p.has("snare")) p.player("snare").start(triggerTime);
      if (type === 'roll' && p.has("hat")) p.player("hat").start(triggerTime);
    } else if (this.mode === 'sampled' && this.drumPlayers) {
      const p = this.drumPlayers;
      if (type === 'hard' && p.has("kick")) p.player("kick").start(triggerTime);
      if (type === 'soft' && p.has("snare")) p.player("snare").start(triggerTime);
      if (type === 'roll' && p.has("hat")) p.player("hat").start(triggerTime);
    } else {
      this.drumSynth.triggerAttackRelease("C1", "8n", triggerTime, type === 'hard' ? 1 : 0.5);
    }
  }

  triggerNote(index: number) { if (Tone.getContext().state !== 'running') Tone.getContext().resume(); this.triggerNoteAtTime(index, Tone.now()); }

  private triggerNoteAtTime(rowIndex: number, time: any) {
    if (rowIndex < 0 || rowIndex >= this.notes.length) return;
    const scene = this.scenes[this.activeSceneIndex];
    const offset = scene.pitchOffsets[rowIndex];
    const baseNote = this.notes[rowIndex];
    const noteWithOffset = Tone.Frequency(baseNote).transpose(offset).toNote();
    
    const notesToPlay = [noteWithOffset];
    if (this.chordMode) {
      notesToPlay.push(Tone.Frequency(noteWithOffset).transpose(4).toNote());
      notesToPlay.push(Tone.Frequency(noteWithOffset).transpose(7).toNote());
    }

    const targetGain = Math.max(0.1, (this.currentAmbience * 0.7 + 0.3) * this.micSensitivity);
    const targetDb = Tone.gainToDb(targetGain);

    notesToPlay.forEach(note => {
      this.sendMidi(0x90, Tone.Frequency(note).toMidi(), 100);

      const isSampledReady = this.mode === 'sampled' && this.pianoSampler && this.isLoaded;
      const isCustomReady = this.mode === 'custom' && this.customPianoSampler;

      if (isCustomReady) {
        this.customPianoSampler!.volume.value = targetDb;
        this.customPianoSampler!.triggerAttackRelease(note, this.noteLength, time);
      } else if (isSampledReady) {
        this.pianoSampler!.volume.value = targetDb;
        this.pianoSampler!.triggerAttackRelease(note, this.noteLength, time);
      } else {
        this.synth.volume.value = targetDb;
        this.synth.triggerAttackRelease(note, this.noteLength, time);
      }
    });
  }

  private sendMidi(status: number, data1: number, data2: number) {
    if (this.midiOutput) (this.midiOutput as any).send([status, data1, data2]);
  }

  setAmbience(intensity: number) {
    this.currentAmbience = intensity;
    const targetDb = Tone.gainToDb(Math.max(0.1, intensity * 0.9 + 0.1));
    this.synth.volume.rampTo(targetDb, 0.5);
    if (this.pianoSampler) this.pianoSampler.volume.rampTo(targetDb, 0.5);
    if (this.customPianoSampler) this.customPianoSampler.volume.rampTo(targetDb, 0.5);
  }

  setOscillator(type: OscillatorType) { this.oscillatorType = type; this.synth.set({ oscillator: { type } }); this.saveSession(); }
  getOscillator() { return this.oscillatorType; }
  setNoteLength(len: NoteLength) { this.noteLength = len; this.saveSession(); }
  getNoteLength() { return this.noteLength; }
  setMicSensitivity(val: number) { this.micSensitivity = val; this.saveSession(); }
  getMicSensitivity() { return this.micSensitivity; }
  setMotionSensitivity(val: number) { this.motionSensitivity = val; this.saveSession(); }
  getMotionSensitivity() { return this.motionSensitivity; }

  setCustomPiano(url: string) {
    if (this.customPianoSampler) this.customPianoSampler.dispose();
    this.customPianoSampler = new Tone.Sampler({ urls: { "C4": url } }).connect(this.masterGain);
  }

  setCustomDrums(type: 'kick' | 'snare' | 'hat', url: string) {
    if (!this.customDrumPlayers) this.customDrumPlayers = new Tone.Players().connect(this.masterGain);
    this.customDrumPlayers.add(type, url);
  }

  public exportMidi() {
    const data = this.getSessionData(true);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biotune-pattern-${Date.now()}.json`;
    a.click();
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
