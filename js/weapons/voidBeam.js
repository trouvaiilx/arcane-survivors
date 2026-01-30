/**
 * Void Beam Weapon
 * A devastating beam that annihilates all in its path
 */

import { Weapon } from './weapon.js';

export class VoidBeam extends Weapon {
    constructor(player) {
        super(player, 'voidBeam');
        this.beamActive = false;
        this.beamTimer = 0;
        this.beamAngle = 0;
    }
    
    update(dt) {
        this.cooldownTimer -= dt;
        
        if (this.beamActive) {
            this.beamTimer -= dt;
            this.damageEnemiesInBeam();
            
            if (this.beamTimer <= 0) {
                this.beamActive = false;
            }
        }
        
        if (this.cooldownTimer <= 0 && !this.beamActive) {
            this.fire();
            this.cooldownTimer = this.cooldown;
        }
    }
    
    fire() {
        // Find nearest enemy for beam direction
        const target = this.getNearestEnemy();
        
        if (target) {
            const dx = target.x - this.player.x;
            const dy = target.y - this.player.y;
            this.beamAngle = Math.atan2(dy, dx);
        } else {
            // Use facing direction
            this.beamAngle = Math.atan2(this.player.facingY, this.player.facingX);
        }
        
        this.beamActive = true;
        this.beamTimer = this.duration;
        this.hitEnemies = new Set(); // Track enemies hit this beam
    }
    
    damageEnemiesInBeam() {
        const beamLength = 600;
        const beamWidth = 30 * this.area;
        
        const enemies = this.game.enemyManager?.enemies || [];
        
        for (const enemy of enemies) {
            // Check if enemy is in beam path
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            
            // Project enemy position onto beam direction
            const beamDirX = Math.cos(this.beamAngle);
            const beamDirY = Math.sin(this.beamAngle);
            const dot = dx * beamDirX + dy * beamDirY;
            
            if (dot > 0 && dot < beamLength) {
                // Check perpendicular distance
                const perpDist = Math.abs(dx * beamDirY - dy * beamDirX);
                
                if (perpDist < beamWidth + enemy.radius) {
                    // Only damage once per beam activation
                    if (!this.hitEnemies.has(enemy.id)) {
                        enemy.takeDamage(this.damage);
                        this.game.addDamageDealt(this.damage);
                        this.hitEnemies.add(enemy.id);
                        this.game.particles?.spawn(enemy.x, enemy.y, '#8b5cf6', 5);
                    }
                }
            }
        }
    }
    
    render(ctx) {
        if (!this.beamActive) return;
        
        const beamLength = 600;
        const beamWidth = 30 * this.area;
        const alpha = this.beamTimer / this.duration;
        
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.beamAngle);
        
        // Beam glow
        const gradient = ctx.createLinearGradient(0, 0, beamLength, 0);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, -beamWidth, beamLength, beamWidth * 2);
        
        // Core beam
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.fillRect(0, -beamWidth * 0.3, beamLength * 0.9, beamWidth * 0.6);
        
        ctx.restore();
    }
}
