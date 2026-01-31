/**
 * Spectral Sword Weapon
 * Orbiting swords that periodically slash outward
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class SpectralSword extends Weapon {
    constructor(player) {
        super(player, 'spectralSword');
        this.swords = [];
        this.orbitRadius = 100;
        this.orbitSpeed = 2; // radians per second
        this.slashTimer = 0;
        this.slashCooldown = 3000; // Periodic slash
        this.slashActive = false;
        this.slashProgress = 0;
    }
    
    attack() {
        // Swords constantly orbit and deal damage on contact
        // The attack method triggers a slash animation
        const swordCount = this.projectiles;
        
        // Create/update swords based on current count
        while (this.swords.length < swordCount) {
            const angle = -Math.PI / 2 + (this.swords.length / swordCount) * Math.PI * 2;
            this.swords.push({
                angle: angle,
                radius: this.orbitRadius,
                slashing: false,
                slashAngle: 0,
            });
        }
        
        // Distribute swords evenly starting from top
        for (let i = 0; i < this.swords.length; i++) {
            this.swords[i].angle = -Math.PI / 2 + (i / swordCount) * Math.PI * 2;
        }
        
        // Trigger slash
        this.slashActive = true;
        this.slashProgress = 0;
    }
    
    update(dt) {
        super.update(dt);
        
        const dtSeconds = dt / 1000;
        const game = this.player.game;
        const damage = this.damage;
        const area = this.area;
        
        // Update sword count
        const targetCount = this.projectiles;
        while (this.swords.length < targetCount) {
            const angle = -Math.PI / 2 + (this.swords.length / targetCount) * Math.PI * 2;
            this.swords.push({
                angle: angle,
                radius: this.orbitRadius,
                slashing: false,
                slashAngle: 0,
            });
        }
        
        // Orbit rotation
        const orbitDelta = this.orbitSpeed * dtSeconds;
        
        for (const sword of this.swords) {
            sword.angle += orbitDelta;
            
            // Handle slashing
            if (this.slashActive) {
                // Extend outward during slash
                sword.radius = this.orbitRadius + (this.slashProgress * 80);
            } else {
                // Return to orbit
                sword.radius = this.orbitRadius;
            }
            
            // Calculate sword position
            const swordX = this.player.x + Math.cos(sword.angle) * sword.radius * area;
            const swordY = this.player.y + Math.sin(sword.angle) * sword.radius * area;
            
            // Check collision with enemies
            const hitRadius = 25 * area;
            const nearby = game.enemyManager?.getEnemiesNear(swordX, swordY, hitRadius) || [];
            
            for (const enemy of nearby) {
                if (!enemy.hitBySword) {
                    enemy.hitBySword = Date.now();
                    enemy.takeDamage(damage);
                    game.addDamageDealt(damage);
                    game.particles.burst(swordX, swordY, '#8b5cf6', 5);
                    
                    // Apply small knockback
                    const kx = (enemy.x - swordX) * 0.1;
                    const ky = (enemy.y - swordY) * 0.1;
                    enemy.applyKnockback?.(kx, ky);
                }
            }
        }
        
        // Reset hit tracking periodically
        if (game.enemyManager) {
            for (const enemy of game.enemyManager.enemies) {
                if (enemy.hitBySword && Date.now() - enemy.hitBySword > 500) {
                    delete enemy.hitBySword;
                }
            }
        }
        
        // Update slash progress
        if (this.slashActive) {
            this.slashProgress += dtSeconds * 3; // Slash takes ~0.33 seconds
            if (this.slashProgress >= 1) {
                this.slashActive = false;
                this.slashProgress = 0;
            }
        }
    }
    
    render(ctx) {
        if (!this.swords.length) return;
        
        const area = this.area;
        
        for (const sword of this.swords) {
            const x = this.player.x + Math.cos(sword.angle) * sword.radius * area;
            const y = this.player.y + Math.sin(sword.angle) * sword.radius * area;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(sword.angle + Math.PI / 4);
            
            // Glow effect
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Sword blade
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(5, 0);
            ctx.lineTo(3, 15);
            ctx.lineTo(0, 18);
            ctx.lineTo(-3, 15);
            ctx.lineTo(-5, 0);
            ctx.closePath();
            ctx.fill();
            
            // Sword highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.lineTo(2, 0);
            ctx.lineTo(0, 12);
            ctx.lineTo(-2, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Slash effect
        if (this.slashActive) {
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            ctx.globalAlpha = 0.5 * (1 - this.slashProgress);
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.orbitRadius + (this.slashProgress * 80 * area), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
}
