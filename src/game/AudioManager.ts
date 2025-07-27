export class AudioManager {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private musicGain: GainNode;
    private sfxGain: GainNode;
    private musicNodes: OscillatorNode[] = [];
    private isPlaying: boolean = false;

    constructor() {
        this.audioContext = new AudioContext();
        
        // Create gain nodes for volume control
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0.4;
        this.musicGain.connect(this.masterGain);
        
        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.gain.value = 0.6;
        this.sfxGain.connect(this.masterGain);
    }

    public async init(): Promise<void> {
        // Resume audio context on user interaction
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    public startMusic(): void {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.playProceduralMusic();
    }

    private playProceduralMusic(): void {
        // Classical-inspired lo-fi chill music using Web Audio API
        const now = this.audioContext.currentTime;
        
        // Bass line - slow, deep notes
        this.playBassPattern(now);
        
        // Melody - gentle, classical-inspired phrases
        this.playMelodyPattern(now);
        
        // Ambient pad for atmosphere
        this.playAmbientPad(now);
        
        // Schedule next musical phrase
        setTimeout(() => {
            if (this.isPlaying) {
                this.playProceduralMusic();
            }
        }, 8000); // 8-second phrases
    }

    private playBassPattern(startTime: number): void {
        const bassNotes = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3
        const pattern = [0, 2, 1, 3, 0, 3, 2, 1]; // Non-repetitive pattern
        
        pattern.forEach((noteIndex, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = bassNotes[noteIndex];
            
            filter.type = 'lowpass';
            filter.frequency.value = 300;
            filter.Q.value = 10;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            const noteTime = startTime + i * 1;
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.9);
            
            osc.start(noteTime);
            osc.stop(noteTime + 1);
        });
    }

    private playMelodyPattern(startTime: number): void {
        // Pentatonic scale for pleasant, non-dissonant melodies
        const melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
        const rhythm = [0.5, 0.5, 1, 0.5, 0.5, 2, 1, 1]; // Varied rhythm
        const pattern = [2, 4, 3, 2, 0, 1, 3, 2]; // Melodic phrase
        
        let currentTime = startTime;
        
        pattern.forEach((noteIndex, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const vibrato = this.audioContext.createOscillator();
            const vibratoGain = this.audioContext.createGain();
            
            // Main oscillator with triangle wave for softer sound
            osc.type = 'triangle';
            osc.frequency.value = melodyNotes[noteIndex];
            
            // Add subtle vibrato
            vibrato.frequency.value = 4;
            vibratoGain.gain.value = 3;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            const duration = rhythm[i % rhythm.length];
            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(0.08, currentTime + 0.05);
            gain.gain.setValueAtTime(0.08, currentTime + duration - 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            
            osc.start(currentTime);
            osc.stop(currentTime + duration);
            vibrato.start(currentTime);
            vibrato.stop(currentTime + duration);
            
            currentTime += duration * 0.8; // Slight overlap for legato
        });
    }

    private playAmbientPad(startTime: number): void {
        // Warm pad sound with multiple detuned oscillators
        const fundamentals = [261.63, 329.63]; // C4, E4
        
        fundamentals.forEach(freq => {
            for (let i = 0; i < 3; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.type = 'sine';
                osc.frequency.value = freq * (1 + (i - 1) * 0.01); // Slight detune
                
                filter.type = 'lowpass';
                filter.frequency.value = 800;
                filter.Q.value = 0.5;
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);
                
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.02, startTime + 2);
                gain.gain.setValueAtTime(0.02, startTime + 6);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 8);
                
                osc.start(startTime);
                osc.stop(startTime + 8);
            }
        });
    }

    // Sound effects
    public playCollectSound(isBytes: boolean = false): void {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        const baseFreq = isBytes ? 800 : 600;
        
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    public playShootSound(): void {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        filter.Q.value = 5;
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    public playHitSound(): void {
        // White noise burst for hit
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 2;
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        source.start();
    }

    public playShieldSound(): void {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        lfo.type = 'sine';
        lfo.frequency.value = 10;
        lfoGain.gain.value = 100;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
        lfo.start();
        lfo.stop(this.audioContext.currentTime + 0.3);
    }

    public playBugDestroySound(): void {
        // Descending glissando
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    public stopMusic(): void {
        this.isPlaying = false;
    }
}