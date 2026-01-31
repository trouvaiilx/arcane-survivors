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
        const time = Date.now() / 1000;
        
        // Protective aura ring around player
        ctx.save();
        const auraGradient = ctx.createRadialGradient(
            this.player.x, this.player.y, this.radius - 20,
            this.player.x, this.player.y, this.radius + 30
        );
        auraGradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
        auraGradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.15)');
        auraGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.radius + 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating outer ring
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 20]);
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.radius + 15, time * 0.5, time * 0.5 + Math.PI * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        // Draw each shield orb
        for (let i = 0; i < this.projectiles; i++) {
            const angle = this.orbitAngle + (i * Math.PI * 2 / this.projectiles);
            const x = this.player.x + Math.cos(angle) * this.radius;
            const y = this.player.y + Math.sin(angle) * this.radius;
            
            ctx.save();
            
            // Energy trail behind each shield
            ctx.globalAlpha = 0.6;
            for (let t = 5; t > 0; t--) {
                const trailAngle = angle - (t * 0.15);
                const trailX = this.player.x + Math.cos(trailAngle) * this.radius;
                const trailY = this.player.y + Math.sin(trailAngle) * this.radius;
                const trailSize = shieldSize * (1 - t * 0.12);
                
                ctx.globalAlpha = 0.15 * (1 - t * 0.15);
                ctx.fillStyle = '#60a5fa';
                ctx.beginPath();
                ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            // Main shield glow
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 20;
            
            // Pulsing shield size
            const pulse = 1 + Math.sin(time * 5 + i * Math.PI) * 0.1;
            const pulseSize = shieldSize * pulse;
            
            // Shield gradient
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize * 1.5);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#93c5fd');
            gradient.addColorStop(0.6, '#3b82f6');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Core bright orb
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(x, y, pulseSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Shield border ring
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Rotating rune symbol inside each shield
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(time * 2 + i);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            
            // Draw a simple arcane symbol
            const runeSize = pulseSize * 0.5;
            ctx.beginPath();
            // Triangle
            ctx.moveTo(0, -runeSize);
            ctx.lineTo(runeSize * 0.866, runeSize * 0.5);
            ctx.lineTo(-runeSize * 0.866, runeSize * 0.5);
            ctx.closePath();
            ctx.stroke();
            
            // Inner circle
            ctx.beginPath();
            ctx.arc(0, 0, runeSize * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
            
            // Energy sparks around shield
            if (Math.random() < 0.1) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const sparkDist = pulseSize * (1 + Math.random() * 0.5);
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(
                    x + Math.cos(sparkAngle) * sparkDist,
                    y + Math.sin(sparkAngle) * sparkDist,
                    1 + Math.random() * 2,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Connection lines between shields (energy web)
        if (this.projectiles > 1) {
            ctx.save();
            ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < this.projectiles; i++) {
                const angle1 = this.orbitAngle + (i * Math.PI * 2 / this.projectiles);
                const angle2 = this.orbitAngle + ((i + 1) % this.projectiles * Math.PI * 2 / this.projectiles);
                
                const x1 = this.player.x + Math.cos(angle1) * this.radius;
                const y1 = this.player.y + Math.sin(angle1) * this.radius;
                const x2 = this.player.x + Math.cos(angle2) * this.radius;
                const y2 = this.player.y + Math.sin(angle2) * this.radius;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}
