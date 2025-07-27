import { MidiPlayer } from './audio/MidiPlayer';
import { SoundEffects } from './audio/SoundEffects';

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private soundEffects: SoundEffects | null = null;
    private midiPlayer: MidiPlayer | null = null;
    private midiFiles: Map<number, string> = new Map();
    private currentLevel: number = 1;
    private isInitialized: boolean = false;

    constructor() {
        // Don't create AudioContext until user interaction
    }

    public async init(): Promise<void> {
        if (this.isInitialized) return;
        
        console.log('AudioManager.init() called - creating AudioContext');
        // Create AudioContext on user interaction
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext created, state:', this.audioContext.state);
        console.log('AudioContext sample rate:', this.audioContext.sampleRate);
        console.log('AudioContext destination channels:', this.audioContext.destination.channelCount);
        
        // Create a compressor to prevent clipping
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.knee.value = 10;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        // Create gain nodes for volume control
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(compressor);
        compressor.connect(this.audioContext.destination);
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0.8;
        this.musicGain.connect(this.masterGain);
        
        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.gain.value = 0.4;
        this.sfxGain.connect(this.masterGain);
        
        // Initialize sound effects
        this.soundEffects = new SoundEffects(this.audioContext, this.sfxGain);
        
        // Create single MIDI player
        this.midiPlayer = new MidiPlayer(this.audioContext, this.musicGain);
        
        // Resume if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        this.isInitialized = true;
        
        // Set up MIDI file mappings
        this.setupMidiFiles();
    }
    
    private setupMidiFiles(): void {
        // Define MIDI files for each level - Mozart Piano Sonatas
        this.midiFiles.set(1, 'mozart_sonata.mid');      // K.310
        this.midiFiles.set(2, 'mozart_sonata_330.mid');  // K.330
        this.midiFiles.set(3, 'mozart_sonata_331.mid');  // K.331
        this.midiFiles.set(4, 'mozart_sonata_332.mid');  // K.332
        this.midiFiles.set(5, 'mozart_sonata_333.mid');  // K.333
        this.midiFiles.set(6, 'mozart_sonata_457.mid');  // K.457
        this.midiFiles.set(7, 'mozart_sonata_545.mid');  // K.545
        this.midiFiles.set(8, 'mozart_sonata_570.mid');  // K.570
        // Levels 9+ will loop back to the beginning for now
    }

    public startMusic(): void {
        this.playLevelMusic(this.currentLevel);
    }
    
    public async playLevelMusic(level: number): Promise<void> {
        if (!this.isInitialized || !this.midiPlayer) {
            console.log('AudioManager not initialized yet, cannot play music');
            return;
        }
        
        console.log('Playing music for level:', level);
        this.currentLevel = level;
        
        // Stop current music
        this.midiPlayer.stop();
        
        // Load and play MIDI file for this level
        const midiFile = this.midiFiles.get(level);
        if (midiFile) {
            console.log(`Loading MIDI file for level ${level}: ${midiFile}`);
            await this.midiPlayer.loadMidiFile(midiFile);
            // Remove the test tone and let it play the actual MIDI
            this.midiPlayer.play(0);
        } else {
            console.log('No MIDI file configured for level', level);
        }
    }

    public stopMusic(): void {
        if (this.midiPlayer) {
            this.midiPlayer.stop();
        }
    }

    // Sound effect methods
    public playShootSound(): void {
        if (!this.soundEffects) {
            console.log('Sound effects not initialized');
            return;
        }
        this.soundEffects.playShootSound();
    }

    public playCollectSound(isByte: boolean): void {
        if (!this.soundEffects) return;
        this.soundEffects.playCollectSound(isByte);
    }

    public playHitSound(): void {
        if (!this.soundEffects) return;
        this.soundEffects.playHitSound();
    }

    public playBugDestroySound(): void {
        if (!this.soundEffects) return;
        this.soundEffects.playBugDestroySound();
    }

    public playShieldSound(): void {
        if (!this.soundEffects) return;
        this.soundEffects.playShieldSound();
    }

    public playLevelCompleteSound(): void {
        if (!this.soundEffects) return;
        this.soundEffects.playLevelCompleteSound();
    }

    // Volume control
    public setMusicVolume(volume: number): void {
        if (this.musicGain) {
            console.log('Setting music volume to:', volume);
            this.musicGain.gain.value = volume;
        }
    }

    public setSfxVolume(volume: number): void {
        if (this.sfxGain) {
            console.log('Setting SFX volume to:', volume);
            this.sfxGain.gain.value = volume;
        }
    }
    
    private testAudioConnection(): void {
        if (!this.audioContext) return;
        
        console.log('Testing audio connection...');
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 440; // A4
        gain.gain.value = 0.1;
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination); // Direct connection to test
        
        const now = this.audioContext.currentTime;
        osc.start(now);
        osc.stop(now + 0.2); // 200ms beep
        
        console.log('Test beep sent to audio output');
    }
    
    private playTestBeep(): void {
        if (!this.audioContext || !this.masterGain) return;
        
        console.log('Playing test beep through master gain...');
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 880; // A5
        gain.gain.value = 0.3;
        
        osc.connect(gain);
        gain.connect(this.masterGain); // Connect through master gain
        
        const now = this.audioContext.currentTime;
        osc.start(now);
        osc.stop(now + 0.3); // 300ms beep
        
        console.log('Test beep scheduled');
    }
}