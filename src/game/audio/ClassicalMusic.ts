export interface ClassicalPiece {
    composer: string;
    title: string;
    level: number;
    playFunction: (audioContext: AudioContext, musicGain: GainNode, startTime: number) => void;
}

export class ClassicalMusic {
    private audioContext: AudioContext;
    private musicGain: GainNode;
    private currentPiece: ClassicalPiece | null = null;
    
    constructor(audioContext: AudioContext, musicGain: GainNode) {
        this.audioContext = audioContext;
        this.musicGain = musicGain;
    }
    
    public playLevelMusic(level: number): void {
        const piece = this.getPieceForLevel(level);
        if (piece) {
            this.currentPiece = piece;
            piece.playFunction(this.audioContext, this.musicGain, this.audioContext.currentTime);
        }
    }
    
    private getPieceForLevel(level: number): ClassicalPiece | null {
        const pieces: ClassicalPiece[] = [
            {
                level: 1,
                composer: "Bach",
                title: "Prelude in C Major",
                playFunction: this.playBachPrelude
            },
            {
                level: 2,
                composer: "Mozart",
                title: "Eine kleine Nachtmusik",
                playFunction: this.playMozartNachtmusik
            },
            {
                level: 3,
                composer: "Beethoven",
                title: "Ode to Joy",
                playFunction: this.playBeethovenOdeToJoy
            },
            {
                level: 4,
                composer: "Pachelbel",
                title: "Canon in D",
                playFunction: this.playPachelbelCanon
            },
            {
                level: 5,
                composer: "Vivaldi",
                title: "Spring from Four Seasons",
                playFunction: this.playVivaldiSpring
            },
            // Add more pieces up to 100...
        ];
        
        return pieces.find(p => p.level === level) || pieces[0];
    }
    
    // Level 1: Bach Prelude in C Major - Simple arpeggios
    private playBachPrelude(audioContext: AudioContext, musicGain: GainNode, startTime: number): void {
        const pattern = [
            261.63, 329.63, 523.25, 329.63, 523.25, // C E G E G
            261.63, 329.63, 523.25, 329.63, 523.25,
            261.63, 349.23, 523.25, 349.23, 523.25, // C F G F G
            261.63, 349.23, 523.25, 349.23, 523.25,
        ];
        
        pattern.forEach((freq, i) => {
            const time = startTime + i * 0.15;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + 0.02);
            gain.gain.setValueAtTime(0.05, time + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            
            osc.connect(gain);
            gain.connect(musicGain);
            
            osc.start(time);
            osc.stop(time + 0.15);
        });
        
        // Continue with more complex patterns
        const variation1 = [
            246.94, 329.63, 493.88, 329.63, 493.88, // B E F# E F#
            246.94, 329.63, 493.88, 329.63, 493.88,
            220, 329.63, 440, 329.63, 440,          // A E A E A
            220, 329.63, 440, 329.63, 440,
        ];
        
        variation1.forEach((freq, i) => {
            const time = startTime + (pattern.length + i) * 0.15;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            filter.Q.value = 1;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.04, time + 0.02);
            gain.gain.setValueAtTime(0.04, time + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(musicGain);
            
            osc.start(time);
            osc.stop(time + 0.15);
        });
        
        // Add bass line
        const bassNotes = [130.81, 146.83, 164.81, 146.83]; // C3 D3 E3 D3
        bassNotes.forEach((freq, i) => {
            const time = startTime + i * 2;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.06, time);
            gain.gain.setValueAtTime(0.06, time + 1.8);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 2);
            
            osc.connect(gain);
            gain.connect(musicGain);
            
            osc.start(time);
            osc.stop(time + 2);
        });
        
        // Final cadence
        const cadence = [
            {note: 392, dur: 0.5},    // G4
            {note: 329.63, dur: 0.5}, // E4
            {note: 261.63, dur: 1.5}, // C4
        ];
        
        let cadenceTime = startTime + (pattern.length + variation1.length) * 0.15;
        cadence.forEach(({note, dur}) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = note;
            
            gain.gain.setValueAtTime(0, cadenceTime);
            gain.gain.linearRampToValueAtTime(0.08, cadenceTime + 0.1);
            gain.gain.setValueAtTime(0.08, cadenceTime + dur - 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, cadenceTime + dur);
            
            osc.connect(gain);
            gain.connect(musicGain);
            
            osc.start(cadenceTime);
            osc.stop(cadenceTime + dur);
            
            cadenceTime += dur;
        });
    }
    
    // Level 2: Mozart Eine kleine Nachtmusik
    private playMozartNachtmusik(audioContext: AudioContext, musicGain: GainNode, startTime: number): void {
        const melody = [
            {note: 392, dur: 0.25}, // G4
            {note: 0, dur: 0.25},   // rest
            {note: 293.66, dur: 0.25}, // D4
            {note: 0, dur: 0.25},
            {note: 392, dur: 0.5},  // G4
            {note: 293.66, dur: 0.25}, // D4
            {note: 392, dur: 0.25}, // G4
            {note: 493.88, dur: 0.5}, // B4
            {note: 587.33, dur: 1}, // D5
        ];
        
        let currentTime = startTime;
        melody.forEach(({note, dur}) => {
            if (note > 0) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.value = note;
                
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(0.08, currentTime + 0.05);
                gain.gain.setValueAtTime(0.08, currentTime + dur - 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + dur);
                
                osc.connect(gain);
                gain.connect(musicGain);
                
                osc.start(currentTime);
                osc.stop(currentTime + dur);
            }
            currentTime += dur;
        });
        
        // Add harmony
        const harmony = [
            [196, 246.94, 293.66], // G3 B3 D4
            [174.61, 220, 261.63], // F3 A3 C4
        ];
        
        harmony.forEach((chord, i) => {
            const time = startTime + i * 2;
            chord.forEach(freq => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.03, time);
                gain.gain.setValueAtTime(0.03, time + 1.8);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 2);
                
                osc.connect(gain);
                gain.connect(musicGain);
                
                osc.start(time);
                osc.stop(time + 2);
            });
        });
        
        // Loop
        setTimeout(() => {
            this.playMozartNachtmusik(audioContext, musicGain, audioContext.currentTime);
        }, 5000);
    }
    
    // Level 3: Beethoven's Ode to Joy
    private playBeethovenOdeToJoy(audioContext: AudioContext, musicGain: GainNode, startTime: number): void {
        const melody = [
            329.63, 329.63, 349.23, 392, // E E F G
            392, 349.23, 329.63, 293.66, // G F E D
            261.63, 261.63, 293.66, 329.63, // C C D E
            329.63, 293.66, 293.66, // E D D
        ];
        
        melody.forEach((freq, i) => {
            const time = startTime + i * 0.4;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.06, time + 0.05);
            gain.gain.setValueAtTime(0.06, time + 0.35);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
            
            osc.connect(gain);
            gain.connect(musicGain);
            
            osc.start(time);
            osc.stop(time + 0.4);
        });
        
        // Loop
        setTimeout(() => {
            this.playBeethovenOdeToJoy(audioContext, musicGain, audioContext.currentTime);
        }, melody.length * 400);
    }
    
    // Level 4: Pachelbel's Canon
    private playPachelbelCanon(audioContext: AudioContext, musicGain: GainNode, startTime: number): void {
        // Bass line (repeating)
        const bassLine = [
            293.66, 220, 246.94, 196, // D A B F#
            196, 146.83, 196, 220      // G D G A
        ];
        
        bassLine.forEach((freq, i) => {
            const time = startTime + i * 0.5;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq / 2; // One octave lower
            
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.setValueAtTime(0.1, time + 0.45);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
            
            osc.connect(gain);
            gain.connect(musicGain);
            
            osc.start(time);
            osc.stop(time + 0.5);
        });
        
        // Melody (simplified)
        const melody = [
            783.99, 698.46, 659.25, 587.33, // F# E D C#
            587.33, 523.25, 587.33, 659.25  // D B D E
        ];
        
        melody.forEach((freq, i) => {
            const time = startTime + i * 0.5 + 2; // Start after bass intro
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + 0.1);
            gain.gain.setValueAtTime(0.05, time + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
            
            osc.connect(gain);
            gain.connect(musicGain);
            
            osc.start(time);
            osc.stop(time + 0.5);
        });
        
        // Loop
        setTimeout(() => {
            this.playPachelbelCanon(audioContext, musicGain, audioContext.currentTime);
        }, 6000);
    }
    
    // Level 5: Vivaldi's Spring
    private playVivaldiSpring(audioContext: AudioContext, musicGain: GainNode, startTime: number): void {
        // Violin-like melody with trills
        const melody = [
            {note: 659.25, dur: 0.5, trill: true}, // E5
            {note: 587.33, dur: 0.25}, // D5
            {note: 523.25, dur: 0.25}, // C5
            {note: 587.33, dur: 0.5},  // D5
            {note: 659.25, dur: 1, trill: true}, // E5
        ];
        
        let currentTime = startTime;
        melody.forEach(({note, dur, trill}) => {
            if (trill) {
                // Create trill effect
                for (let i = 0; i < dur * 10; i++) {
                    const trillTime = currentTime + i * 0.1;
                    const trillNote = i % 2 === 0 ? note : note * 1.0595; // Half step up
                    
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    
                    osc.type = 'sawtooth';
                    osc.frequency.value = trillNote;
                    
                    gain.gain.setValueAtTime(0.04, trillTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, trillTime + 0.09);
                    
                    osc.connect(gain);
                    gain.connect(musicGain);
                    
                    osc.start(trillTime);
                    osc.stop(trillTime + 0.09);
                }
            } else {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.value = note;
                
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(0.06, currentTime + 0.05);
                gain.gain.setValueAtTime(0.06, currentTime + dur - 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + dur);
                
                osc.connect(gain);
                gain.connect(musicGain);
                
                osc.start(currentTime);
                osc.stop(currentTime + dur);
            }
            currentTime += dur;
        });
        
        // Loop
        setTimeout(() => {
            this.playVivaldiSpring(audioContext, musicGain, audioContext.currentTime);
        }, 3000);
    }
}