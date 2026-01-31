/**
 * Save Manager
 * Handles persistent data storage for meta-progression
 */

import { CHARACTERS, POWERUPS } from '../data/config.js';

const SAVE_KEY = 'arcane_survivors_save';

class SaveManagerClass {
    constructor() {
        this.data = null;
    }
    
    /**
     * Initialize save data
     */
    init() {
        this.load();
        if (!this.data) {
            this.data = this.getDefaultSaveData();
            this.save();
        }
    }
    
    /**
     * Get default save data structure
     */
    getDefaultSaveData() {
        return {
            version: 1,
            coins: 0,
            powerups: {},
            unlockedCharacters: ['antonio'],
            discoveredWeapons: ['magicWand'], // Starting weapon is discovered
            discoveredPassives: [], // Empty by default
            stats: {
                totalKills: 0,
                totalDamageDealt: 0,
                totalDamageTaken: 0,
                totalPlayTime: 0,
                gamesPlayed: 0,
                victories: 0,
                highestLevel: 1,
                longestSurvival: 0,
                bossKills: 0,
            },
        };
    }
    
    /**
     * Load save data from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                this.data = JSON.parse(saved);
                // Migrate if needed
                this.migrate();
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
            this.data = null;
        }
    }
    
    /**
     * Save data to localStorage
     */
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }
    
    /**
     * Migrate old save data if needed
     */
    migrate() {
        // Add missing fields from default
        const defaults = this.getDefaultSaveData();
        
        if (!this.data.stats) {
            this.data.stats = defaults.stats;
        } else {
            for (const key of Object.keys(defaults.stats)) {
                if (this.data.stats[key] === undefined) {
                    this.data.stats[key] = defaults.stats[key];
                }
            }
        }
        
        if (!this.data.powerups) this.data.powerups = {};
        if (!this.data.unlockedCharacters) this.data.unlockedCharacters = ['antonio'];
        if (!this.data.discoveredWeapons) this.data.discoveredWeapons = ['magicWand'];
        if (!this.data.discoveredPassives) this.data.discoveredPassives = [];
        
        this.save();
    }
    
    /**
     * Get coin count
     */
    getCoins() {
        return this.data?.coins || 0;
    }
    
    /**
     * Add coins
     */
    addCoins(amount) {
        if (!this.data) return;
        this.data.coins += amount;
        this.save();
    }
    
    /**
     * Spend coins if possible
     * @returns true if successful
     */
    spendCoins(amount) {
        if (!this.data || this.data.coins < amount) return false;
        this.data.coins -= amount;
        this.save();
        return true;
    }
    
    /**
     * Get powerup level
     */
    getPowerupLevel(powerupId) {
        return this.data?.powerups[powerupId] || 0;
    }
    
    /**
     * Buy powerup
     * @returns true if successful
     */
    buyPowerup(powerupId) {
        const data = POWERUPS[powerupId];
        if (!data) return false;
        
        const currentLevel = this.getPowerupLevel(powerupId);
        if (currentLevel >= data.maxLevel) return false;
        
        const cost = this.getPowerupCost(powerupId);
        if (!this.spendCoins(cost)) return false;
        
        this.data.powerups[powerupId] = currentLevel + 1;
        this.save();
        return true;
    }
    
    /**
     * Get cost for next powerup level
     */
    getPowerupCost(powerupId) {
        const data = POWERUPS[powerupId];
        if (!data) return Infinity;
        
        const level = this.getPowerupLevel(powerupId);
        if (level >= data.maxLevel) return Infinity;
        
        return Math.floor(data.baseCost * Math.pow(data.costMultiplier, level));
    }
    
    /**
     * Get all powerup bonuses combined
     */
    getPowerupBonuses() {
        const bonuses = {
            maxHp: 0,
            regen: 0,
            armor: 0,
            damage: 0,
            speed: 0,
            cooldown: 0,
            area: 0,
            magnet: 0,
            luck: 0,
            growth: 0,
            greed: 0,
            revival: 0,
        };
        
        if (!this.data) return bonuses;
        
        for (const [id, level] of Object.entries(this.data.powerups)) {
            const data = POWERUPS[id];
            if (!data) continue;
            
            for (const [stat, value] of Object.entries(data.effect)) {
                if (bonuses[stat] !== undefined) {
                    bonuses[stat] += value * level;
                }
            }
        }
        
        return bonuses;
    }
    
    /**
     * Check if character is unlocked
     */
    isCharacterUnlocked(characterId) {
        return this.data?.unlockedCharacters?.includes(characterId) || false;
    }
    
    /**
     * Unlock a character
     */
    unlockCharacter(characterId) {
        if (!this.data) return;
        if (!this.data.unlockedCharacters.includes(characterId)) {
            this.data.unlockedCharacters.push(characterId);
            this.save();
        }
    }
    
    /**
     * Check and unlock characters based on conditions
     */
    checkUnlocks(survivalTime, kills) {
        for (const [id, char] of Object.entries(CHARACTERS)) {
            if (this.isCharacterUnlocked(id)) continue;
            if (!char.unlockCondition) continue;
            
            const cond = char.unlockCondition;
            let unlocked = false;
            
            if (cond.type === 'surviveTime' && survivalTime >= cond.value) {
                unlocked = true;
            } else if (cond.type === 'kills' && kills >= cond.value) {
                unlocked = true;
            } else if (cond.type === 'bossKill' && this.getBossKills() >= cond.value) {
                unlocked = true;
            }
            
            if (unlocked) {
                this.unlockCharacter(id);
                console.log(`🔓 Unlocked character: ${char.name}`);
            }
        }
    }
    
    /**
     * Get all unlocked characters
     */
    getUnlockedCharacters() {
        return this.data?.unlockedCharacters || ['antonio'];
    }
    
    /**
     * Update statistics
     */
    updateStats(updates) {
        if (!this.data) return;
        
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'highestLevel' || key === 'longestSurvival') {
                // These are max values
                this.data.stats[key] = Math.max(this.data.stats[key] || 0, value);
            } else {
                // These are cumulative
                this.data.stats[key] = (this.data.stats[key] || 0) + value;
            }
        }
        
        this.save();
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return this.data?.stats || this.getDefaultSaveData().stats;
    }
    
    /**
     * Reset all save data
     */
    reset() {
        this.data = this.getDefaultSaveData();
        this.save();
    }
    
    /**
     * Record a boss kill for character unlocks
     */
    recordBossKill() {
        if (!this.data) return;
        if (!this.data.stats.bossKills) {
            this.data.stats.bossKills = 0;
        }
        this.data.stats.bossKills++;
        this.save();
    }
    
    /**
     * Get boss kill count
     */
    getBossKills() {
        return this.data?.stats?.bossKills || 0;
    }
    
    /**
     * Get discovered weapons
     */
    getDiscoveredWeapons() {
        return this.data?.discoveredWeapons || ['magicWand'];
    }
    
    /**
     * Discover a weapon (add to codex)
     */
    discoverWeapon(weaponId) {
        if (!this.data) return;
        if (!this.data.discoveredWeapons.includes(weaponId)) {
            this.data.discoveredWeapons.push(weaponId);
            this.save();
            console.log(`📖 Discovered weapon: ${weaponId}`);
        }
    }
    
    /**
     * Get discovered passives
     */
    getDiscoveredPassives() {
        return this.data?.discoveredPassives || [];
    }
    
    /**
     * Discover a passive (add to codex)
     */
    discoverPassive(passiveId) {
        if (!this.data) return;
        if (!this.data.discoveredPassives.includes(passiveId)) {
            this.data.discoveredPassives.push(passiveId);
            this.save();
            console.log(`📖 Discovered passive: ${passiveId}`);
        }
    }
}

export const SaveManager = new SaveManagerClass();
