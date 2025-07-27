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
        // More complex, evolving soundtrack
        const now = this.audioContext.currentTime;
        const section = Math.floor(Math.random() * 4); // Vary sections
        
        // Always have ambient atmosphere
        this.playAmbientDrone(now);
        
        // Layer different elements based on section
        switch (section) {
            case 0: // Mysterious intro
                this.playArpeggiatedPattern(now);
                this.playStringSection(now);
                break;
            case 1: // Building tension
                this.playBassPattern(now);
                this.playMelodyPattern(now);
                this.playPercussiveElements(now);
                break;
            case 2: // Ethereal section
                this.playHarmonicPad(now);
                this.playCountermelody(now);
                break;
            case 3: // Dramatic section
                this.playOrchestralHits(now);
                this.playRapidArpeggios(now);
                this.playBassPattern(now);
                break;
        }
        
        // Schedule next section with overlap
        const sectionLength = 12000 + Math.random() * 4000; // 12-16 seconds
        setTimeout(() => {
            if (this.isPlaying) {
                this.playProceduralMusic();
            }
        }, sectionLength * 0.9); // 10% overlap
    }

    private playBassPattern(startTime: number): void {
        // More complex bass progression - minor key for drama
        const progression = [
            { note: 110, duration: 2 },     // A2
            { note: 103.83, duration: 1 },  // G#2
            { note: 98, duration: 1 },      // G2
            { note: 87.31, duration: 2 },   // F2
            { note: 82.41, duration: 1 },   // E2
            { note: 87.31, duration: 1 },   // F2
        ];
        
        let currentTime = startTime;
        progression.forEach(({ note, duration }) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Layer two oscillators for richer sound
            const osc2 = this.audioContext.createOscillator();
            osc.type = 'sawtooth';
            osc2.type = 'square';
            osc.frequency.value = note;
            osc2.frequency.value = note * 0.5; // Sub bass
            
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            filter.Q.value = 15;
            
            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, currentTime + duration - 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            
            osc.start(currentTime);
            osc2.start(currentTime);
            osc.stop(currentTime + duration);
            osc2.stop(currentTime + duration);
            
            currentTime += duration * 0.9;
        });
    }

    private playMelodyPattern(startTime: number): void {
        // More sophisticated melodic lines - minor scale with chromatic touches
        const phrases = [
            [440, 493.88, 523.25, 493.88, 440, 415.30, 440], // A4-B4-C5 descending
            [523.25, 554.37, 587.33, 554.37, 523.25, 493.88], // C5-C#5-D5 pattern
            [659.25, 622.25, 587.33, 554.37, 523.25, 493.88, 440], // Descending run
        ];
        
        const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        let currentTime = startTime;
        
        selectedPhrase.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Dynamic filter for expression
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, currentTime);
            filter.frequency.linearRampToValueAtTime(800, currentTime + 0.5);
            filter.Q.value = 3;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            const duration = 0.4 + Math.random() * 0.3;
            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(0.06, currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            
            osc.start(currentTime);
            osc.stop(currentTime + duration);
            
            currentTime += duration * 0.7;
        });
    }

    // New atmospheric methods for varied soundtrack
    private playAmbientDrone(startTime: number): void {
        // Deep, evolving drone
        const droneFreq = 55; // Low A
        
        for (let harmonic = 1; harmonic <= 4; harmonic++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = droneFreq * harmonic;
            
            filter.type = 'lowpass';
            filter.frequency.value = 400 / harmonic;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            const vol = 0.03 / harmonic;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 3);
            gain.gain.setValueAtTime(vol, startTime + 12);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 15);
            
            osc.start(startTime);
            osc.stop(startTime + 15);
        }
    }
    
    private playArpeggiatedPattern(startTime: number): void {
        // Matrix-style arpeggios
        const notes = [220, 261.63, 329.63, 392, 440, 523.25]; // A minor arpeggio
        const speed = 0.15;
        
        notes.forEach((note, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = note;
            
            const noteTime = startTime + i * speed;
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(0.04, noteTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(noteTime);
            osc.stop(noteTime + 0.3);
        });
        
        // Repeat pattern
        setTimeout(() => {
            if (this.isPlaying) this.playArpeggiatedPattern(startTime + 1);
        }, 1000);
    }
    
    private playStringSection(startTime: number): void {
        // Lush string chords
        const chords = [
            [220, 261.63, 329.63], // Am
            [196, 246.94, 293.66], // Gm
            [174.61, 220, 261.63], // F
        ];
        
        const chord = chords[Math.floor(Math.random() * chords.length)];
        chord.forEach(note => {
            for (let voice = 0; voice < 3; voice++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.value = note * (1 + voice * 0.01); // Slight detune
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.02, startTime + 1);
                gain.gain.setValueAtTime(0.02, startTime + 3);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 4);
                
                osc.start(startTime);
                osc.stop(startTime + 4);
            }
        });
    }
    
    private playPercussiveElements(startTime: number): void {
        // Subtle rhythmic elements
        const pattern = [1, 0, 0.5, 0, 1, 0, 0.3, 0.3];
        const interval = 0.25;
        
        pattern.forEach((velocity, i) => {
            if (velocity > 0) {
                const noise = this.audioContext.createBufferSource();
                const buffer = this.audioContext.createBuffer(1, 1000, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let j = 0; j < 1000; j++) {
                    data[j] = (Math.random() - 0.5) * velocity;
                }
                
                noise.buffer = buffer;
                
                const filter = this.audioContext.createBiquadFilter();
                const gain = this.audioContext.createGain();
                
                filter.type = 'highpass';
                filter.frequency.value = 2000;
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);
                
                const noteTime = startTime + i * interval;
                gain.gain.setValueAtTime(0.05 * velocity, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.05);
                
                noise.start(noteTime);
            }
        });
    }
    
    private playHarmonicPad(startTime: number): void {
        // Rich harmonic texture
        const root = 130.81; // C3
        const harmonics = [1, 2, 3, 4, 5, 6, 7, 8];
        
        harmonics.forEach(h => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = root * h;
            
            const vol = 0.03 / (h * h); // Decrease volume for higher harmonics
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 2);
            gain.gain.setValueAtTime(vol, startTime + 4);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 6);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(startTime);
            osc.stop(startTime + 6);
        });
    }
    
    private playCountermelody(startTime: number): void {
        // Floating counter melody
        const notes = [392, 440, 493.88, 523.25, 493.88, 440];
        let time = startTime;
        
        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = note;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.03, time + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(time);
            osc.stop(time + 0.8);
            
            time += 0.5 + Math.random() * 0.3;
        });
    }
    
    private playOrchestralHits(startTime: number): void {
        // Dramatic stabs
        const hitTimes = [0, 2, 2.5, 4];
        
        hitTimes.forEach(offset => {
            const time = startTime + offset;
            const frequencies = [130.81, 164.81, 196, 261.63, 329.63]; // C minor chord
            
            frequencies.forEach(freq => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.1, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(time);
                osc.stop(time + 0.3);
            });
        });
    }
    
    private playRapidArpeggios(startTime: number): void {
        // Fast, tension-building arpeggios
        const scale = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392];
        const pattern = [0, 2, 4, 7, 4, 2, 0, -1];
        const speed = 0.08;
        
        pattern.forEach((step, i) => {
            const noteIndex = step >= 0 ? step : scale.length + step;
            const freq = scale[noteIndex] || scale[0];
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const time = startTime + i * speed;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.02, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(time);
            osc.stop(time + 0.1);
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
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.03);
        
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        filter.Q.value = 1;
        
        gain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.03);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.03);
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