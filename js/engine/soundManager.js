/**
 * Sound Manager
 * Handles all game audio with volume controls and sound pooling
 */

class SoundManagerClass {
    constructor() {
        this.sounds = new Map();
        this.music = new Map();
        this.soundPool = new Map();
        this.currentMusic = null;
        this.musicFadeInterval = null;
        
        // Volume settings (0-1)
        this.masterVolume = 0.7;
        this.sfxVolume = 0.6;
        this.musicVolume = 0.4;
        this.uiVolume = 0.5;
        
        // Loaded state
        this.loaded = false;
        this.loadPromise = null;
        
        // Sound categories for easy volume control
        this.categories = {
            sfx: [],
            ui: [],
            music: []
        };
    }
    
    /**
     * Load all game sounds
     */
    async loadAll() {
        if (this.loadPromise) return this.loadPromise;
        
        this.loadPromise = new Promise(async (resolve) => {
            console.log('🔊 Loading sounds...');
            
            // Define sound sources (using publicly available assets)
            // We'll use jsfxr for procedural sound generation as fallback
            const soundDefs = {
                // UI Sounds
                uiClick: { category: 'ui', src: this.generateUIClick() },
                uiHover: { category: 'ui', src: this.generateUIHover() },
                uiSelect: { category: 'ui', src: this.generateUISelect() },
                levelUp: { category: 'ui', src: this.generateLevelUp() },
                
                // Combat Sounds
                playerHit: { category: 'sfx', src: this.generatePlayerHit(), pool: 3 },
                enemyHit: { category: 'sfx', src: this.generateEnemyHit(), pool: 5 },
                enemyDeath: { category: 'sfx', src: this.generateEnemyDeath(), pool: 5 },
                
                // Weapon Sounds
                shoot: { category: 'sfx', src: this.generateShoot(), pool: 5 },
                slash: { category: 'sfx', src: this.generateSlash(), pool: 3 },
                explosion: { category: 'sfx', src: this.generateExplosion(), pool: 3 },
                lightning: { category: 'sfx', src: this.generateLightning(), pool: 2 },
                
                // Pickup Sounds
                pickupXP: { category: 'sfx', src: this.generatePickupXP(), pool: 5 },
                pickupCoin: { category: 'sfx', src: this.generatePickupCoin(), pool: 3 },
                pickupHeal: { category: 'sfx', src: this.generatePickupHeal() },
                pickupChest: { category: 'sfx', src: this.generatePickupChest() },
                
                // Boss Sounds
                bossSpawn: { category: 'sfx', src: this.generateBossSpawn() },
                bossHit: { category: 'sfx', src: this.generateBossHit() },
                bossDefeat: { category: 'sfx', src: this.generateBossDefeat() },
                
                // Ambient/Special
                portalOpen: { category: 'sfx', src: this.generatePortalOpen() },
                victory: { category: 'sfx', src: this.generateVictory() },
                gameOver: { category: 'sfx', src: this.generateGameOver() },
            };
            
            // Load all sounds
            for (const [id, def] of Object.entries(soundDefs)) {
                try {
                    const audio = new Audio(def.src);
                    audio.volume = this.getCategoryVolume(def.category);
                    this.sounds.set(id, audio);
                    this.categories[def.category].push(id);
                    
                    // Create sound pool if specified
                    if (def.pool && def.pool > 1) {
                        const pool = [];
                        for (let i = 0; i < def.pool; i++) {
                            const poolAudio = new Audio(def.src);
                            poolAudio.volume = this.getCategoryVolume(def.category);
                            pool.push(poolAudio);
                        }
                        this.soundPool.set(id, { pool, index: 0 });
                    }
                } catch (e) {
                    console.warn(`Failed to load sound: ${id}`, e);
                }
            }
            
            // Generate background music
            this.generateBackgroundMusic();
            
            this.loaded = true;
            console.log('✅ Sounds loaded!');
            resolve();
        });
        
        return this.loadPromise;
    }
    
    /**
     * Play a sound effect
     */
    play(soundId, volume = 1.0) {
        if (!this.loaded) return;
        
        try {
            // Check if sound has a pool
            if (this.soundPool.has(soundId)) {
                const poolData = this.soundPool.get(soundId);
                const audio = poolData.pool[poolData.index];
                poolData.index = (poolData.index + 1) % poolData.pool.length;
                
                audio.currentTime = 0;
                audio.volume = this.getCategoryVolumeForSound(soundId) * volume;
                audio.play().catch(() => {}); // Ignore play errors
            } else if (this.sounds.has(soundId)) {
                const audio = this.sounds.get(soundId);
                audio.currentTime = 0;
                audio.volume = this.getCategoryVolumeForSound(soundId) * volume;
                audio.play().catch(() => {});
            }
        } catch (e) {
            // Silently fail - audio errors shouldn't break the game
        }
    }
    
    /**
     * Play background music
     */
    playMusic(musicId, fadeIn = true) {
        if (!this.loaded) return;
        
        // Stop current music if playing
        if (this.currentMusic) {
            this.stopMusic(fadeIn);
        }
        
        const music = this.music.get(musicId);
        if (!music) return;
        
        this.currentMusic = music;
        music.loop = true;
        
        if (fadeIn) {
            music.volume = 0;
            music.play().catch(() => {});
            this.fadeMusicVolume(music, this.musicVolume * this.masterVolume, 2000);
        } else {
            music.volume = this.musicVolume * this.masterVolume;
            music.play().catch(() => {});
        }
    }
    
    /**
     * Stop current music
     */
    stopMusic(fadeOut = true) {
        if (!this.currentMusic) return;
        
        if (fadeOut) {
            this.fadeMusicVolume(this.currentMusic, 0, 1000, () => {
                if (this.currentMusic) {
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                }
            });
        } else {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        
        this.currentMusic = null;
    }
    
    /**
     * Fade music volume
     */
    fadeMusicVolume(audio, targetVolume, duration, onComplete) {
        if (this.musicFadeInterval) {
            clearInterval(this.musicFadeInterval);
        }
        
        const startVolume = audio.volume;
        const volumeDelta = targetVolume - startVolume;
        const steps = 50;
        const stepDuration = duration / steps;
        let currentStep = 0;
        
        this.musicFadeInterval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            audio.volume = startVolume + volumeDelta * progress;
            
            if (currentStep >= steps) {
                clearInterval(this.musicFadeInterval);
                this.musicFadeInterval = null;
                if (onComplete) onComplete();
            }
        }, stepDuration);
    }
    
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    
    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateCategoryVolume('sfx');
    }
    
    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
    }
    
    /**
     * Set UI volume
     */
    setUIVolume(volume) {
        this.uiVolume = Math.max(0, Math.min(1, volume));
        this.updateCategoryVolume('ui');
    }
    
    /**
     * Update all volumes
     */
    updateAllVolumes() {
        this.updateCategoryVolume('sfx');
        this.updateCategoryVolume('ui');
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
    }
    
    /**
     * Update category volume
     */
    updateCategoryVolume(category) {
        const soundIds = this.categories[category] || [];
        for (const id of soundIds) {
            const audio = this.sounds.get(id);
            if (audio) {
                audio.volume = this.getCategoryVolume(category);
            }
            
            // Update pooled sounds
            if (this.soundPool.has(id)) {
                const pool = this.soundPool.get(id).pool;
                for (const poolAudio of pool) {
                    poolAudio.volume = this.getCategoryVolume(category);
                }
            }
        }
    }
    
    /**
     * Get category volume
     */
    getCategoryVolume(category) {
        const categoryVol = category === 'ui' ? this.uiVolume :
                           category === 'music' ? this.musicVolume :
                           this.sfxVolume;
        return categoryVol * this.masterVolume;
    }
    
    /**
     * Get category volume for a specific sound
     */
    getCategoryVolumeForSound(soundId) {
        for (const [category, ids] of Object.entries(this.categories)) {
            if (ids.includes(soundId)) {
                return this.getCategoryVolume(category);
            }
        }
        return this.masterVolume;
    }
    
    // ========================================
    // PROCEDURAL SOUND GENERATION
    // Using jsfxr-style synthesis
    // ========================================
    
    /**
     * Generate sound from parameters
     */
    generateSound(params) {
        const sampleRate = 44100;
        const duration = params.duration || 0.3;
        const samples = Math.floor(sampleRate * duration);
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate waveform based on type
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const progress = i / samples;
            
            // Frequency modulation
            let freq = params.frequency || 440;
            if (params.freqSlide) {
                freq *= Math.pow(2, params.freqSlide * progress);
            }
            
            // Generate base waveform
            let value = 0;
            const phase = t * freq * Math.PI * 2;
            
            switch (params.waveType || 'square') {
                case 'sine':
                    value = Math.sin(phase);
                    break;
                case 'square':
                    value = Math.sin(phase) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    value = 2 * ((t * freq) % 1) - 1;
                    break;
                case 'noise':
                    value = Math.random() * 2 - 1;
                    break;
            }
            
            // Apply envelope
            let envelope = 1;
            const attack = params.attack || 0.01;
            const decay = params.decay || 0.1;
            const sustain = params.sustain || 0.3;
            const release = params.release || 0.2;
            
            if (progress < attack) {
                envelope = progress / attack;
            } else if (progress < attack + decay) {
                const decayProgress = (progress - attack) / decay;
                envelope = 1 - (1 - sustain) * decayProgress;
            } else if (progress > 1 - release) {
                envelope = sustain * (1 - (progress - (1 - release)) / release);
            } else {
                envelope = sustain;
            }
            
            data[i] = value * envelope * (params.volume || 0.3);
        }
        
        // Convert to data URL
        const wav = this.bufferToWav(buffer);
        return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
    }
    
    /**
     * Convert audio buffer to WAV
     */
    bufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        
        const data = buffer.getChannelData(0);
        const dataLength = data.length * bytesPerSample;
        const bufferLength = 44 + dataLength;
        
        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Write samples
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return arrayBuffer;
    }
    
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
    
    // ========================================
    // SOUND GENERATORS
    // ========================================
    
    generateUIClick() {
        return this.generateSound({
            waveType: 'square',
            frequency: 800,
            duration: 0.05,
            attack: 0.01,
            decay: 0.04,
            sustain: 0,
            volume: 0.15
        });
    }
    
    generateUIHover() {
        return this.generateSound({
            waveType: 'sine',
            frequency: 600,
            duration: 0.03,
            attack: 0.005,
            decay: 0.025,
            sustain: 0,
            volume: 0.1
        });
    }
    
    generateUISelect() {
        return this.generateSound({
            waveType: 'square',
            frequency: 1000,
            freqSlide: 0.3,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09,
            sustain: 0,
            volume: 0.2
        });
    }
    
    generateLevelUp() {
        return this.generateSound({
            waveType: 'square',
            frequency: 523, // C5
            freqSlide: 1.0,
            duration: 0.4,
            attack: 0.01,
            decay: 0.1,
            sustain: 0.6,
            release: 0.2,
            volume: 0.3
        });
    }
    
    generatePlayerHit() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 200,
            duration: 0.15,
            attack: 0.01,
            decay: 0.14,
            sustain: 0,
            volume: 0.25
        });
    }
    
    generateEnemyHit() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 150,
            duration: 0.08,
            attack: 0.01,
            decay: 0.07,
            sustain: 0,
            volume: 0.15
        });
    }
    
    generateEnemyDeath() {
        return this.generateSound({
            waveType: 'sawtooth',
            frequency: 200,
            freqSlide: -1.5,
            duration: 0.3,
            attack: 0.01,
            decay: 0.29,
            sustain: 0,
            volume: 0.2
        });
    }
    
    generateShoot() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 800,
            duration: 0.06,
            attack: 0.01,
            decay: 0.05,
            sustain: 0,
            volume: 0.12
        });
    }
    
    generateSlash() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 400,
            freqSlide: -0.5,
            duration: 0.12,
            attack: 0.01,
            decay: 0.11,
            sustain: 0,
            volume: 0.18
        });
    }
    
    generateExplosion() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 100,
            freqSlide: -1.0,
            duration: 0.4,
            attack: 0.01,
            decay: 0.39,
            sustain: 0,
            volume: 0.25
        });
    }
    
    generateLightning() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 1200,
            freqSlide: -0.8,
            duration: 0.2,
            attack: 0.005,
            decay: 0.195,
            sustain: 0,
            volume: 0.22
        });
    }
    
    generatePickupXP() {
        return this.generateSound({
            waveType: 'sine',
            frequency: 800,
            freqSlide: 0.5,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09,
            sustain: 0,
            volume: 0.12
        });
    }
    
    generatePickupCoin() {
        return this.generateSound({
            waveType: 'square',
            frequency: 1000,
            freqSlide: 0.3,
            duration: 0.15,
            attack: 0.01,
            decay: 0.14,
            sustain: 0,
            volume: 0.18
        });
    }
    
    generatePickupHeal() {
        return this.generateSound({
            waveType: 'sine',
            frequency: 600,
            freqSlide: 0.8,
            duration: 0.25,
            attack: 0.01,
            decay: 0.24,
            sustain: 0,
            volume: 0.25
        });
    }
    
    generatePickupChest() {
        return this.generateSound({
            waveType: 'square',
            frequency: 400,
            freqSlide: 0.5,
            duration: 0.3,
            attack: 0.01,
            decay: 0.1,
            sustain: 0.5,
            release: 0.15,
            volume: 0.3
        });
    }
    
    generateBossSpawn() {
        return this.generateSound({
            waveType: 'sawtooth',
            frequency: 100,
            freqSlide: -0.5,
            duration: 1.0,
            attack: 0.1,
            decay: 0.3,
            sustain: 0.4,
            release: 0.2,
            volume: 0.4
        });
    }
    
    generateBossHit() {
        return this.generateSound({
            waveType: 'noise',
            frequency: 150,
            duration: 0.2,
            attack: 0.01,
            decay: 0.19,
            sustain: 0,
            volume: 0.3
        });
    }
    
    generateBossDefeat() {
        return this.generateSound({
            waveType: 'sawtooth',
            frequency: 200,
            freqSlide: -2.0,
            duration: 1.5,
            attack: 0.1,
            decay: 1.4,
            sustain: 0,
            volume: 0.35
        });
    }
    
    generatePortalOpen() {
        return this.generateSound({
            waveType: 'sine',
            frequency: 400,
            freqSlide: 1.2,
            duration: 0.8,
            attack: 0.1,
            decay: 0.7,
            sustain: 0,
            volume: 0.3
        });
    }
    
    generateVictory() {
        return this.generateSound({
            waveType: 'square',
            frequency: 523,
            freqSlide: 0.5,
            duration: 0.6,
            attack: 0.01,
            decay: 0.1,
            sustain: 0.7,
            release: 0.2,
            volume: 0.35
        });
    }
    
    generateGameOver() {
        return this.generateSound({
            waveType: 'sawtooth',
            frequency: 300,
            freqSlide: -1.5,
            duration: 1.0,
            attack: 0.05,
            decay: 0.95,
            sustain: 0,
            volume: 0.3
        });
    }
    
    /**
     * Generate background music (simple procedural loop)
     */
    generateBackgroundMusic() {
        // Generate a simple ambient loop
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = 44100;
        const duration = 16; // 16 second loop
        const samples = sampleRate * duration;
        
        const buffer = audioContext.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Create atmospheric pad sound
        const bpm = 120;
        const beatDuration = 60 / bpm;
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            let value = 0;
            
            // Bass line (low frequency pulse)
            value += Math.sin(t * 110 * Math.PI * 2) * 0.15 * (Math.sin(t * 2) * 0.5 + 0.5);
            
            // Ambient pad (multiple harmonics)
            value += Math.sin(t * 220 * Math.PI * 2) * 0.08;
            value += Math.sin(t * 330 * Math.PI * 2) * 0.05;
            value += Math.sin(t * 440 * Math.PI * 2) * 0.03;
            
            // Subtle pulse
            const pulse = Math.sin(t * (bpm / 60) * Math.PI * 2);
            value *= (1 + pulse * 0.1);
            
            data[i] = value * 0.4;
        }
        
        const wav = this.bufferToWav(buffer);
        const musicAudio = new Audio(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
        musicAudio.loop = true;
        musicAudio.volume = this.musicVolume * this.masterVolume;
        
        this.music.set('gameplay', musicAudio);
    }
}

export const SoundManager = new SoundManagerClass();