export class SoundEffects {
    private audioContext: AudioContext;
    private sfxGain: GainNode;

    constructor(audioContext: AudioContext, sfxGain: GainNode) {
        this.audioContext = audioContext;
        this.sfxGain = sfxGain;
    }

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

    public playLevelCompleteSound(): void {
        // Victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const duration = 0.15;
        
        notes.forEach((freq, i) => {
            const time = this.audioContext.currentTime + i * duration;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Add harmonics for richness
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.value = freq * 2;
            
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            filter.Q.value = 1;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
            gain.gain.setValueAtTime(0.3, time + duration - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(time);
            osc.stop(time + duration);
            osc2.start(time);
            osc2.stop(time + duration);
        });
        
        // Add a final chord
        const chordTime = this.audioContext.currentTime + notes.length * duration;
        const chordNotes = [523.25, 659.25, 783.99]; // C major triad
        
        chordNotes.forEach(freq => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, chordTime);
            gain.gain.linearRampToValueAtTime(0.2, chordTime + 0.05);
            gain.gain.setValueAtTime(0.2, chordTime + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(chordTime);
            osc.stop(chordTime + 1);
        });
    }
}