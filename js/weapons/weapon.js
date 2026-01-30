/**
 * Base Weapon Class
 * All weapons extend this class
 */

import { WEAPONS } from '../data/config.js';

export class Weapon {
    constructor(player, weaponId) {
        this.player = player;
        this.game = player.game;
        this.id = weaponId;
        
        const data = WEAPONS[weaponId];
        this.name = data.name;
        this.icon = data.icon;
        this.description = data.description;
        this.type = data.type;
        this.maxLevel = data.maxLevel;
        
        // Base stats
        this.baseDamage = data.baseDamage;
        this.baseCooldown = data.baseCooldown;
        this.baseProjectiles = data.baseProjectiles;
        this.baseArea = data.baseArea;
        this.baseDuration = data.baseDuration;
        this.baseSpeed = data.baseSpeed;
        this.basePierce = data.pierce || 1;
        this.baseRange = data.baseRange || 0;
        this.baseKnockback = data.knockback || 5;
        
        // Upgrade data
        this.upgrades = data.upgrades || [];
        
        // Current level
        this.level = 1;
        
        // Timing
        this.cooldownTimer = 0;
        
        // Calculate current stats
        this.recalculateStats();
    }
    
    /**
     * Recalculate stats based on level and player bonuses
     */
    recalculateStats() {
        // Start with base values
        let damage = this.baseDamage;
        let cooldown = this.baseCooldown;
        let projectiles = this.baseProjectiles;
        let area = this.baseArea;
        let duration = this.baseDuration;
        let speed = this.baseSpeed;
        let pierce = this.basePierce;
        let range = this.baseRange;
        let knockback = this.baseKnockback;
        
        // Apply level upgrades
        for (let i = 0; i < this.level - 1 && i < this.upgrades.length; i++) {
            const upgrade = this.upgrades[i];
            if (upgrade.damage) damage += upgrade.damage;
            if (upgrade.cooldown) cooldown *= (1 + upgrade.cooldown);
            if (upgrade.projectiles) projectiles += upgrade.projectiles;
            if (upgrade.area) area += upgrade.area;
            if (upgrade.duration) duration += upgrade.duration;
            if (upgrade.speed) speed += upgrade.speed;
            if (upgrade.pierce) pierce += upgrade.pierce;
            if (upgrade.range) range += upgrade.range;
            if (upgrade.knockback) knockback += upgrade.knockback;
        }
        
        // Apply player bonuses
        this.damage = damage * this.player.damage;
        this.cooldown = Math.max(50, cooldown * this.player.cooldown);
        this.projectiles = projectiles + this.player.projectiles;
        this.area = area * this.player.area;
        this.duration = duration;
        this.speed = speed * this.player.projectileSpeed;
        this.pierce = pierce;
        this.range = range;
        this.knockback = knockback;
    }
    
    /**
     * Level up the weapon
     */
    levelUp() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.recalculateStats();
        }
    }
    
    /**
     * Update weapon
     */
    update(dt) {
        this.cooldownTimer -= dt;
        
        if (this.cooldownTimer <= 0) {
            this.fire();
            this.cooldownTimer = this.cooldown;
        }
    }
    
    /**
     * Fire the weapon - override in subclasses
     */
    fire() {
        // Override in subclass
    }
    
    /**
     * Get nearest enemy to player
     */
    getNearestEnemy() {
        if (!this.game.enemyManager) return null;
        return this.game.enemyManager.getNearestEnemy(this.player.x, this.player.y);
    }
    
    /**
     * Get random enemy in range
     */
    getRandomEnemyInRange(range) {
        if (!this.game.enemyManager) return null;
        return this.game.enemyManager.getRandomEnemyInRange(this.player.x, this.player.y, range);
    }
    
    /**
     * Get all enemies in range
     */
    getEnemiesInRange(range) {
        if (!this.game.enemyManager) return [];
        return this.game.enemyManager.getEnemiesNear(this.player.x, this.player.y, range);
    }
}
