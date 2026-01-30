/**
 * Garlic Weapon
 * AOE damage aura around player
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class Garlic extends Weapon {
    constructor(player) {
        super(player, 'garlic');
        // Set baseRadius AFTER super() but need to recalculate since super calls recalculateStats
        this.baseRadius = WEAPONS.garlic.baseRadius || 50;
        this.hitEnemies = new Set(); // Track recently hit enemies
        this.hitCooldown = 500; // Time before can hit same enemy again
        // Recalculate stats now that baseRadius is set
        this.recalculateStats();
    }
    
    recalculateStats() {
        super.recalculateStats();
        // Only set radius if baseRadius is defined (not during initial super() call)
        if (this.baseRadius !== undefined) {
            this.radius = this.baseRadius * this.area;
        } else {
            this.radius = 50; // Fallback default
        }
    }
    
    update(dt) {
        this.cooldownTimer -= dt;
        
        if (this.cooldownTimer <= 0) {
            this.fire();
            this.cooldownTimer = this.cooldown;
            // Clear hit tracking periodically
            this.hitEnemies.clear();
        }
    }
    
    fire() {
        const enemies = this.getEnemiesInRange(this.radius);
        
        for (const enemy of enemies) {
            // Check distance
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= this.radius) {
                // Damage enemy
                enemy.takeDamage(this.damage);
                this.game.addDamageDealt(this.damage);
                
                // Knockback
                if (dist > 0) {
                    const knockbackForce = this.knockback * (1 - enemy.knockbackResist);
                    enemy.applyKnockback(dx / dist * knockbackForce, dy / dist * knockbackForce);
                }
                
                // Visual effect
                this.game.particles.spawn(
                    enemy.x, 
                    enemy.y, 
                    '#22c55e', 
                    3
                );
            }
        }
        
        // Show aura effect
        this.game.particles.ring(
            this.player.x, 
            this.player.y, 
            this.radius, 
            '#22c55e',
            0.3
        );
    }
    
    /**
     * Render aura (called from player render if needed)
     */
    renderAura(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
