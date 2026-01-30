/**
 * Orbital Shield Weapon
 * Rotating shields that orbit around the player
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class OrbitalShield extends Weapon {
    constructor(player) {
        super(player, 'orbitalShield');
        this.baseRadius = WEAPONS.orbitalShield.baseRadius || 60;
        this.orbitAngle = 0;
        this.orbitSpeed = 3; // Radians per second
        this.hitCooldowns = new Map(); // Track enemy hit cooldowns
        this.recalculateStats();
    }
    
    recalculateStats() {
        super.recalculateStats();
        if (this.baseRadius !== undefined) {
            this.radius = this.baseRadius * this.area;
        } else {
            this.radius = 60;
        }
    }
    
    update(dt) {
        // Update orbit angle
        this.orbitAngle += this.orbitSpeed * (dt / 1000);
        if (this.orbitAngle > Math.PI * 2) {
            this.orbitAngle -= Math.PI * 2;
        }
        
        // Damage enemies that touch shields
        this.damageEnemies();
        
        // Clean up old cooldowns
        const now = Date.now();
        for (const [id, time] of this.hitCooldowns) {
            if (now - time > 500) {
                this.hitCooldowns.delete(id);
            }
        }
    }
    
    damageEnemies() {
        const enemies = this.getEnemiesInRange(this.radius + 20);
        const shieldSize = 15 * this.area;
        
        for (let i = 0; i < this.projectiles; i++) {
            const angle = this.orbitAngle + (i * Math.PI * 2 / this.projectiles);
            const shieldX = this.player.x + Math.cos(angle) * this.radius;
            const shieldY = this.player.y + Math.sin(angle) * this.radius;
            
            for (const enemy of enemies) {
                // Check if already hit recently
                if (this.hitCooldowns.has(enemy.id)) continue;
                
                const dx = enemy.x - shieldX;
                const dy = enemy.y - shieldY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < shieldSize + enemy.radius) {
                    enemy.takeDamage(this.damage);
                    this.game.addDamageDealt(this.damage);
                    this.hitCooldowns.set(enemy.id, Date.now());
                    
                    // Knockback
                    if (dist > 0) {
                        const force = this.knockback * (1 - enemy.knockbackResist);
                        enemy.applyKnockback(dx / dist * force, dy / dist * force);
                    }
                    
                    // Visual effect
                    this.game.particles?.spawn(enemy.x, enemy.y, '#3b82f6', 3);
                }
            }
        }
    }
    
    fire() {
        // Orbital doesn't fire in the traditional sense
    }
    
    render(ctx) {
        const shieldSize = 15 * this.area;
        
        for (let i = 0; i < this.projectiles; i++) {
            const angle = this.orbitAngle + (i * Math.PI * 2 / this.projectiles);
            const x = this.player.x + Math.cos(angle) * this.radius;
            const y = this.player.y + Math.sin(angle) * this.radius;
            
            ctx.save();
            ctx.fillStyle = '#3b82f6';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, shieldSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}
