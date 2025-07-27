import { Midi } from '@tonejs/midi';

export class MidiPlayer {
    private audioContext: AudioContext;
    private musicGain: GainNode;
    private midiData: Midi | null = null;
    private currentTime: number = 0;
    private startTime: number = 0;
    private isPlaying: boolean = false;
    private scheduledNotes: Array<{osc: OscillatorNode, endTime: number}> = [];
    private currentTrackIndex: number = 0;
    private loopTimeout: number | null = null;
    private scheduleAheadTime: number = 0.5; // Schedule notes 0.5 seconds ahead
    private scheduleInterval: number = 100; // Check every 100ms
    private scheduleTimer: number | null = null;
    private currentNoteIndex: number = 0;
    private currentTrack: any = null;
    
    constructor(audioContext: AudioContext, musicGain: GainNode) {
        this.audioContext = audioContext;
        this.musicGain = musicGain;
    }
    
    public async loadMidiFile(url: string): Promise<void> {
        try {
            console.log('MidiPlayer: Loading MIDI file from:', url);
            const response = await fetch(url);
            console.log('MidiPlayer: Fetch response:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('MidiPlayer: Loaded', arrayBuffer.byteLength, 'bytes');
            
            this.midiData = new Midi(arrayBuffer);
            console.log('MidiPlayer: MIDI parsed successfully, tracks:', this.midiData.tracks.length);
            
            // Log track info
            this.midiData.tracks.forEach((track, i) => {
                console.log(`  Track ${i}: ${track.name || 'Unnamed'}, ${track.notes.length} notes`);
            });
        } catch (error) {
            console.error('Failed to load MIDI:', error);
        }
    }
    
    public play(trackIndex: number = 0): void {
        if (!this.midiData) return;
        
        // Stop any currently playing music first
        if (this.isPlaying) {
            console.log('MidiPlayer: Already playing, stopping first');
            this.stop();
        }
        
        console.log('MidiPlayer.play() called, midiData available:', !!this.midiData);
        
        // Find a track with notes
        let tracksChecked = 0;
        let currentTrack = null;
        
        while (tracksChecked < this.midiData.tracks.length) {
            this.currentTrackIndex = (trackIndex + tracksChecked) % this.midiData.tracks.length;
            const track = this.midiData.tracks[this.currentTrackIndex];
            
            if (track && track.notes.length > 0) {
                currentTrack = track;
                console.log(`MidiPlayer: Found track ${this.currentTrackIndex} with ${track.notes.length} notes`);
                break;
            }
            tracksChecked++;
        }
        
        if (!currentTrack) {
            // No tracks with notes found
            return;
        }
        
        this.isPlaying = true;
        this.startTime = this.audioContext.currentTime;
        this.currentTime = 0;
        
        console.log(`MidiPlayer: Scheduling ${currentTrack.notes.length} notes, starting at time:`, this.startTime);
        
        // Audio test removed - we know it works
        
        // Store track for progressive scheduling
        this.currentTrack = currentTrack;
        this.currentNoteIndex = 0;
        
        // Schedule initial batch of notes
        this.scheduleNextBatch();
        
        // Start the scheduling timer
        if (this.scheduleTimer !== null) {
            clearInterval(this.scheduleTimer);
        }
        this.scheduleTimer = setInterval(() => this.scheduleNextBatch(), this.scheduleInterval) as any;
        
        // Schedule loop after track duration
        const trackDuration = currentTrack.duration || 10;
        console.log(`MidiPlayer: Track duration is ${trackDuration}s, will loop after that`);
        
        // Clear any existing loop timeout
        if (this.loopTimeout !== null) {
            clearTimeout(this.loopTimeout);
        }
        
        this.loopTimeout = setTimeout(() => {
            if (this.isPlaying) {  // Only loop if we're still playing
                this.stop();
                if (this.midiData) {
                    // Loop the same track for consistent music per level
                    this.play(this.currentTrackIndex);
                }
            }
        }, trackDuration * 1000) as any;
    }
    
    private scheduleNextBatch(): void {
        if (!this.currentTrack || !this.isPlaying) return;
        
        const currentTime = this.audioContext.currentTime;
        const scheduleUntilTime = currentTime + this.scheduleAheadTime;
        
        // Clean up notes that have finished playing
        this.scheduledNotes = this.scheduledNotes.filter(note => note.endTime > currentTime);
        
        // Schedule new notes
        while (this.currentNoteIndex < this.currentTrack.notes.length) {
            const note = this.currentTrack.notes[this.currentNoteIndex];
            const adjustedTime = Math.max(0, note.time - 2.7);
            const noteTime = this.startTime + adjustedTime;
            
            // If this note is too far in the future, stop scheduling for now
            if (noteTime > scheduleUntilTime) {
                break;
            }
            
            // If this note is in the past, skip it
            if (noteTime < currentTime) {
                this.currentNoteIndex++;
                continue;
            }
            
            this.scheduleNote(note);
            this.currentNoteIndex++;
        }
    }
    
    private scheduleNote(note: any): void {
        // Start playing immediately, don't wait for the MIDI timing
        const adjustedTime = Math.max(0, note.time - 2.7); // Subtract the silence at the beginning
        const noteTime = this.startTime + adjustedTime;
        const frequency = this.midiToFrequency(note.midi);
        
        
        // Create multiple oscillators for richer piano sound
        const oscillators: OscillatorNode[] = [];
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Main fundamental frequency
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = frequency;
        oscillators.push(osc1);
        
        // Add harmonic overtones for piano richness
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = frequency * 2; // Octave
        const harmonic2Gain = this.audioContext.createGain();
        harmonic2Gain.gain.value = 0.3;
        osc2.connect(harmonic2Gain);
        harmonic2Gain.connect(gain);
        oscillators.push(osc2);
        
        // Third harmonic (very subtle)
        const osc3 = this.audioContext.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = frequency * 3;
        const harmonic3Gain = this.audioContext.createGain();
        harmonic3Gain.gain.value = 0.15;
        osc3.connect(harmonic3Gain);
        harmonic3Gain.connect(gain);
        oscillators.push(osc3);
        
        // Connect main oscillator
        osc1.connect(gain);
        
        // Configure filter for piano-like brightness
        filter.type = 'lowpass';
        // Higher notes are brighter
        const brightness = Math.min(frequency * 4 + 2000, 8000);
        filter.frequency.value = brightness;
        filter.Q.value = 0.5;
        
        // Configure envelope
        const velocity = note.velocity || 0.5;
        const maxGain = velocity * 0.12; // Adjusted for multiple oscillators
        
        // Ensure the note duration is valid
        const duration = Math.max(0.1, note.duration || 0.5);
        
        // Piano-like ADSR envelope
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(maxGain, noteTime + 0.01); // Fast attack
        gain.gain.exponentialRampToValueAtTime(maxGain * 0.7, noteTime + 0.1); // Quick decay
        gain.gain.exponentialRampToValueAtTime(maxGain * 0.5, noteTime + duration * 0.5); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration); // Release
        
        // Connect nodes
        gain.connect(filter);
        filter.connect(this.musicGain);
        
        // Schedule playback for all oscillators
        oscillators.forEach(osc => {
            osc.start(noteTime);
            osc.stop(noteTime + duration);
        });
        
        // Store the main oscillator for cleanup
        this.scheduledNotes.push({osc: osc1, endTime: noteTime + duration});
    }
    
    private midiToFrequency(midiNote: number): number {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    public stop(): void {
        console.log('MidiPlayer.stop() called, stopping', this.scheduledNotes.length, 'notes');
        this.isPlaying = false;
        
        // Clear the loop timeout
        if (this.loopTimeout !== null) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
        
        // Clear the schedule timer
        if (this.scheduleTimer !== null) {
            clearInterval(this.scheduleTimer);
            this.scheduleTimer = null;
        }
        
        // Stop all scheduled notes
        this.scheduledNotes.forEach(({osc}) => {
            try {
                osc.stop(this.audioContext.currentTime);
            } catch (e) {
                // Already stopped
            }
        });
        this.scheduledNotes = [];
        this.currentTrack = null;
        this.currentNoteIndex = 0;
    }
    
    public setTrack(trackIndex: number): void {
        if (!this.midiData) return;
        this.stop();
        this.play(trackIndex);
    }
    
    public getTrackCount(): number {
        return this.midiData ? this.midiData.tracks.length : 0;
    }
    
    public getTrackInfo(trackIndex: number): string {
        if (!this.midiData || trackIndex >= this.midiData.tracks.length) return '';
        const track = this.midiData.tracks[trackIndex];
        return `Track ${trackIndex}: ${track.name || 'Unnamed'} (${track.notes.length} notes)`;
    }
    
}