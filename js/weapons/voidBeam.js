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
        
        // Screen shake on beam fire
        this.game.camera?.shake(10, 300);
        
        // Initial burst particles
        for (let i = 0; i < 15; i++) {
            const angle = this.beamAngle + (Math.random() - 0.5) * 0.5;
            const dist = Math.random() * 100;
            this.game.particles?.spawn(
                this.player.x + Math.cos(angle) * dist,
                this.player.y + Math.sin(angle) * dist,
                '#a855f7',
                3
            );
        }
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
        
        // Continuous particle effects along beam
        if (Math.random() < 0.3) {
            const dist = Math.random() * beamLength;
            const perpOffset = (Math.random() - 0.5) * beamWidth * 2;
            const px = this.player.x + Math.cos(this.beamAngle) * dist + Math.cos(this.beamAngle + Math.PI/2) * perpOffset;
            const py = this.player.y + Math.sin(this.beamAngle) * dist + Math.sin(this.beamAngle + Math.PI/2) * perpOffset;
            this.game.particles?.spawn(px, py, '#c084fc', 2);
        }
    }
    
    render(ctx) {
        if (!this.beamActive) return;
        
        const beamLength = 600;
        const baseBeamWidth = 30 * this.area;
        const alpha = this.beamTimer / this.duration;
        
        // Pulsing beam width
        const pulseAmount = 1 + Math.sin(Date.now() * 0.02) * 0.15;
        const beamWidth = baseBeamWidth * pulseAmount;
        
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.beamAngle);
        
        // Outer distortion glow
        ctx.shadowColor = '#7c3aed';
        ctx.shadowBlur = 30;
        
        // Edge distortion effect (electric edges)
        ctx.strokeStyle = `rgba(196, 181, 253, ${alpha * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < beamLength; x += 15) {
            const edgeOffset = Math.sin(x * 0.05 + Date.now() * 0.01) * 8;
            if (x === 0) {
                ctx.moveTo(x, -beamWidth - edgeOffset);
            } else {
                ctx.lineTo(x, -beamWidth - edgeOffset);
            }
        }
        ctx.stroke();
        
        ctx.beginPath();
        for (let x = 0; x < beamLength; x += 15) {
            const edgeOffset = Math.sin(x * 0.05 + Date.now() * 0.01 + Math.PI) * 8;
            if (x === 0) {
                ctx.moveTo(x, beamWidth + edgeOffset);
            } else {
                ctx.lineTo(x, beamWidth + edgeOffset);
            }
        }
        ctx.stroke();
        
        // Main beam gradient
        const gradient = ctx.createLinearGradient(0, 0, beamLength, 0);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${alpha * 0.9})`);
        gradient.addColorStop(0.3, `rgba(168, 85, 247, ${alpha * 0.7})`);
        gradient.addColorStop(0.7, `rgba(124, 58, 237, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, -beamWidth, beamLength, beamWidth * 2);
        
        // Bright core beam
        const coreGradient = ctx.createLinearGradient(0, 0, beamLength * 0.9, 0);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
        coreGradient.addColorStop(0.5, `rgba(233, 213, 255, ${alpha * 0.6})`);
        coreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.fillRect(0, -beamWidth * 0.3, beamLength * 0.9, beamWidth * 0.6);
        
        // Electric arcs inside beam
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const startX = Math.random() * beamLength * 0.8;
            ctx.moveTo(startX, (Math.random() - 0.5) * beamWidth * 0.6);
            ctx.lineTo(startX + 30, (Math.random() - 0.5) * beamWidth * 0.6);
            ctx.lineTo(startX + 50, (Math.random() - 0.5) * beamWidth * 0.6);
            ctx.stroke();
        }
        
        // Origin burst
        const burstSize = 20 * pulseAmount * alpha;
        const burstGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, burstSize);
        burstGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        burstGradient.addColorStop(0.5, `rgba(196, 181, 253, ${alpha * 0.8})`);
        burstGradient.addColorStop(1, `rgba(139, 92, 246, 0)`);
        
        ctx.fillStyle = burstGradient;
        ctx.beginPath();
        ctx.arc(0, 0, burstSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
