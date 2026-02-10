// C64 SID-chip style sound effects for Boulder Dash
// Uses square wave, triangle wave, and noise to match the iconic C64 audio

/**
 * Sound manager emulating the C64 SID chip characteristics
 */
export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.muted = false;
        
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            // Web Audio not supported
        }
        
        if (this.audioContext) {
            this.generateSounds();
        }
    }
    
    generateSounds() {
        this.sounds.collect = this.generateCollectSound();
        this.sounds.fall = this.generateFallSound();
        this.sounds.crush = this.generateCrushSound();
        this.sounds.complete = this.generateLevelCompleteSound();
        this.sounds.gameOver = this.generateGameOverSound();
        this.sounds.move = this.generateMoveSound();
        this.sounds.exit = this.generateExitOpenSound();
    }
    
    play(soundName) {
        if (this.muted || !this.audioContext || !this.sounds[soundName]) return;
        
        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[soundName];
        source.connect(this.audioContext.destination);
        source.start();
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    /**
     * Generate a square wave sample (C64 SID pulse wave)
     * @param {number} phase - Current phase (0-1)
     * @param {number} duty - Pulse width duty cycle (0-1), 0.5 = standard square
     * @returns {number} Sample value (-1 to 1)
     */
    squareWave(phase, duty = 0.5) {
        return (phase % 1) < duty ? 1 : -1;
    }
    
    /**
     * Generate a triangle wave sample (C64 SID triangle)
     * @param {number} phase - Current phase (0-1)
     * @returns {number} Sample value (-1 to 1)
     */
    triangleWave(phase) {
        const p = phase % 1;
        return p < 0.5 ? (4 * p - 1) : (3 - 4 * p);
    }
    
    /**
     * C64-style noise (LFSR-based pseudo-random)
     * @returns {number} Sample value (-1 to 1)
     */
    noise() {
        return Math.random() * 2 - 1;
    }
    
    /**
     * Diamond collect - iconic C64 BD ascending arpeggio.
     * Quick three-note rising chirp using square wave.
     */
    generateCollectSound() {
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Three rapid ascending notes (C64 SID square wave arpeggio)
        const notes = [1047, 1319, 1568]; // C6, E6, G6 - fast arpeggio
        const noteLen = duration / 3;
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noteIdx = Math.min(2, Math.floor(t / noteLen));
            const freq = notes[noteIdx];
            const phase = freq * t;
            
            // Square wave with slight duty cycle variation
            data[i] = 0.25 * this.squareWave(phase, 0.4);
            
            // Quick decay envelope per note
            const noteT = (t - noteIdx * noteLen) / noteLen;
            const env = Math.max(0, 1 - noteT * 0.5);
            data[i] *= env;
        }
        
        return buffer;
    }
    
    /**
     * Boulder/diamond landing - short low thud using triangle wave.
     * The C64 original had a brief bass thump.
     */
    generateFallSound() {
        const duration = 0.12;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Descending pitch from ~200Hz to ~60Hz
            const freq = 200 - 140 * (t / duration);
            const phase = freq * t;
            
            // Triangle wave for bassy thud (C64 SID triangle)
            data[i] = 0.35 * this.triangleWave(phase);
            
            // Sharp attack, quick decay
            const env = Math.pow(1 - t / duration, 2);
            data[i] *= env;
        }
        
        return buffer;
    }
    
    /**
     * Explosion/crush - noise burst with descending pitch.
     * C64 SID noise channel mixed with low square wave.
     */
    generateCrushSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const progress = t / duration;
            
            // Noise component (C64 SID noise channel)
            const noiseVal = this.noise();
            
            // Low descending square wave (rumble)
            const freq = 150 * Math.pow(0.3, progress * 2);
            const phase = freq * t;
            const squareVal = this.squareWave(phase, 0.3);
            
            // Mix noise and square
            data[i] = 0.3 * noiseVal + 0.15 * squareVal;
            
            // Sharp attack, gradual decay
            const env = Math.pow(1 - progress, 1.5);
            data[i] *= env;
        }
        
        return buffer;
    }
    
    /**
     * Level complete - triumphant ascending melody.
     * C64 BD played a characteristic jingle using square waves.
     */
    generateLevelCompleteSound() {
        const sampleRate = this.audioContext.sampleRate;
        // C5, E5, G5, C6 played as a victory arpeggio
        const notes = [
            { freq: 523, start: 0.0,  dur: 0.15 },
            { freq: 659, start: 0.12, dur: 0.15 },
            { freq: 784, start: 0.24, dur: 0.15 },
            { freq: 1047, start: 0.36, dur: 0.3 },
        ];
        const totalDur = 0.7;
        const buffer = this.audioContext.createBuffer(1, sampleRate * totalDur, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            data[i] = 0;
            
            for (const note of notes) {
                if (t >= note.start && t < note.start + note.dur) {
                    const noteT = t - note.start;
                    const phase = note.freq * t;
                    const env = Math.sin(Math.PI * noteT / note.dur);
                    
                    // Square wave melody + triangle wave harmony
                    data[i] += 0.2 * this.squareWave(phase, 0.5) * env;
                    data[i] += 0.1 * this.triangleWave(phase * 2) * env;
                }
            }
        }
        
        return buffer;
    }
    
    /**
     * Game over - descending sad tones.
     * C64 BD death used a quick descending square wave.
     */
    generateGameOverSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Three descending notes
        const notes = [392, 330, 262]; // G4, E4, C4
        const noteLen = duration / 3;
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noteIdx = Math.min(2, Math.floor(t / noteLen));
            const freq = notes[noteIdx];
            const phase = freq * t;
            
            // Square wave with narrowing pulse width for more "sad" timbre
            const duty = 0.5 - (t / duration) * 0.2;
            data[i] = 0.2 * this.squareWave(phase, duty);
            
            // Add slight noise on last note
            if (noteIdx === 2) {
                data[i] += 0.05 * this.noise();
            }
            
            // Decay envelope
            const noteT = (t - noteIdx * noteLen) / noteLen;
            const env = Math.max(0, 1 - noteT * 0.6);
            data[i] *= env * (1 - t / duration * 0.3); // Overall fade
        }
        
        return buffer;
    }
    
    /**
     * Movement/digging - very short tick/scrape.
     * C64 BD had a brief noise burst when Rockford moved through dirt.
     */
    generateMoveSound() {
        const duration = 0.04;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            
            // Short noise burst (C64 SID noise) with high-frequency square
            const noiseVal = this.noise();
            const sqVal = this.squareWave(800 * t, 0.3);
            
            data[i] = 0.08 * noiseVal + 0.04 * sqVal;
            
            // Very sharp envelope
            const env = 1 - (t / duration);
            data[i] *= env * env;
        }
        
        return buffer;
    }
    
    /**
     * Exit opening - distinctive ascending sweep.
     * C64 BD signaled the exit opening with a rising tone.
     */
    generateExitOpenSound() {
        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const progress = t / duration;
            
            // Rising square wave sweep from ~200Hz to ~1200Hz
            const freq = 200 + 1000 * progress * progress;
            const phase = freq * t;
            
            // Square wave with varying duty cycle
            const duty = 0.5 - 0.2 * progress;
            data[i] = 0.2 * this.squareWave(phase, duty);
            
            // Add a high triangle wave ping at the end
            if (progress > 0.6) {
                const pingPhase = 1568 * t; // G6
                const pingEnv = (progress - 0.6) / 0.4;
                data[i] += 0.15 * this.triangleWave(pingPhase) * pingEnv;
            }
            
            // Envelope: fade in slightly, sustain, quick fade at end 
            let env = 1;
            if (progress < 0.05) env = progress / 0.05;
            if (progress > 0.8) env = (1 - progress) / 0.2;
            data[i] *= env;
        }
        
        return buffer;
    }
}
