// Sound effects for Boulderdash
// Uses procedural audio generation since all assets should be generated from code

/**
 * Sound manager for the game
 */
export class SoundManager {
    constructor() {
        // Initialize audio context
        this.audioContext = null;
        this.sounds = {};
        this.muted = false;
        
        // Try to initialize audio context
        try {
            // Modern audio context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser');
        }
        
        // Generate all sound effects
        if (this.audioContext) {
            this.generateSounds();
        }
    }
    
    /**
     * Generate all required sound effects
     */
    generateSounds() {
        this.sounds.collect = this.generateCollectSound();
        this.sounds.fall = this.generateFallSound();
        this.sounds.crush = this.generateCrushSound();
        this.sounds.complete = this.generateLevelCompleteSound();
        this.sounds.gameOver = this.generateGameOverSound();
        this.sounds.move = this.generateMoveSound();
        this.sounds.exit = this.generateExitOpenSound();
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - The name of the sound to play
     */
    play(soundName) {
        if (this.muted || !this.audioContext || !this.sounds[soundName]) return;
        
        // Clone the buffer for playback
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[soundName];
        source.connect(this.audioContext.destination);
        source.start();
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    /**
     * Generate sound for collecting a diamond
     * @returns {AudioBuffer} - The generated sound
     */
    generateCollectSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Bright ascending tone
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 600 + 1200 * t;
            data[i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
            // Apply envelope (fade in/out)
            const envelope = Math.sin(Math.PI * t / duration);
            data[i] *= envelope;
        }
        
        return buffer;
    }
    
    /**
     * Generate sound for objects falling
     * @returns {AudioBuffer} - The generated sound
     */
    generateFallSound() {
        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Descending tone with impact
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 300 - 200 * t;
            data[i] = 0.3 * Math.sin(2 * Math.PI * freq * t);
            
            // Add impact at the end
            if (t > 0.3) {
                const impact = (t - 0.3) / 0.1;
                data[i] += 0.6 * Math.sin(2 * Math.PI * 100 * impact) * (1 - impact);
            }
            
            // Apply envelope
            const envelope = t < 0.3 ? 1 : 1 - ((t - 0.3) / 0.1);
            data[i] *= envelope;
        }
        
        return buffer;
    }
    
    /**
     * Generate sound for player being crushed
     * @returns {AudioBuffer} - The generated sound
     */
    generateCrushSound() {
        const duration = 0.6;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Harsh noise with downward pitch
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noise = Math.random() * 2 - 1;
            const freq = 400 * Math.pow(0.5, t * 3);
            const tone = Math.sin(2 * Math.PI * freq * t);
            
            // Mix noise and tone
            data[i] = 0.3 * tone + 0.4 * noise;
            
            // Apply envelope
            const envelope = Math.pow(1 - t / duration, 0.5);
            data[i] *= envelope;
        }
        
        return buffer;
    }
    
    /**
     * Generate sound for completing a level
     * @returns {AudioBuffer} - The generated sound
     */
    generateLevelCompleteSound() {
        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Triumphant ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            data[i] = 0;
            
            // Play each note in sequence
            for (let j = 0; j < notes.length; j++) {
                const noteStart = j * 0.2;
                const noteEnd = noteStart + 0.4;
                
                if (t >= noteStart && t <= noteEnd) {
                    const noteT = t - noteStart;
                    const freq = notes[j];
                    const amp = 0.3 * Math.sin(Math.PI * noteT / (noteEnd - noteStart));
                    data[i] += amp * Math.sin(2 * Math.PI * freq * t);
                }
            }
            
            // Add some harmonics for richness
            if (t > 0.8) {
                const chord = [523.25, 659.25, 783.99];
                for (let note of chord) {
                    data[i] += 0.1 * Math.sin(2 * Math.PI * note * t);
                }
                
                // Apply envelope to the chord
                const chordEnvelope = Math.sin(Math.PI * (t - 0.8) / 0.7);
                data[i] *= (t < 1.5) ? chordEnvelope : 0;
            }
        }
        
        return buffer;
    }
    
    /**
     * Generate sound for game over
     * @returns {AudioBuffer} - The generated sound
     */
    generateGameOverSound() {
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Descending tones with dissonance
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const baseFreq = 300 * Math.pow(0.5, t);
            
            // Multiple descending frequencies with slight dissonance
            data[i] = 0.3 * Math.sin(2 * Math.PI * baseFreq * t);
            data[i] += 0.2 * Math.sin(2 * Math.PI * (baseFreq * 0.995) * t);
            data[i] += 0.15 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t);
            
            // Add noise component that increases over time
            const noise = Math.random() * 2 - 1;
            const noiseAmount = Math.min(0.4, t * 0.6);
            data[i] += noise * noiseAmount;
            
            // Apply envelope
            const envelope = Math.pow(1 - t / duration, 0.8);
            data[i] *= envelope;
        }
        
        return buffer;
    }
    
    /**
     * Generate sound for movement
     * @returns {AudioBuffer} - The generated sound
     */
    generateMoveSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Short subtle sound for movement
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 200;
            data[i] = 0.1 * Math.sin(2 * Math.PI * freq * t);
            
            // Add a slight noise component
            const noise = Math.random() * 2 - 1;
            data[i] += 0.05 * noise;
            
            // Apply envelope
            const envelope = Math.sin(Math.PI * t / duration);
            data[i] *= envelope;
        }
        
        return buffer;
    }
    
    /**
     * Generate sound for exit opening
     * @returns {AudioBuffer} - The generated sound
     */
    generateExitOpenSound() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Magical portal opening sound
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            
            // Rising frequency sweep
            const sweep = 300 + 1200 * Math.pow(t / duration, 2);
            data[i] = 0.2 * Math.sin(2 * Math.PI * sweep * t);
            
            // Add some sparkle effects
            if (t > 0.1) {
                for (let j = 1; j <= 5; j++) {
                    const sparkleFreq = 1000 + 500 * j;
                    const sparklePhase = (j * 0.2) % 1.0;
                    const sparkleMod = Math.sin(2 * Math.PI * (t - sparklePhase) * 8);
                    
                    if (sparkleMod > 0.7) {
                        data[i] += 0.1 * Math.sin(2 * Math.PI * sparkleFreq * t) * (sparkleMod - 0.7) / 0.3;
                    }
                }
            }
            
            // Apply envelope
            const envelope = Math.sin(Math.PI * t / duration);
            data[i] *= envelope;
        }
        
        return buffer;
    }
}
