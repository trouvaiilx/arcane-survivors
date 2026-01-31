/**
 * Reaper Scythe Weapon
 * Massive sweeping attack that executes low-HP enemies
 */

import { Weapon } from './weapon.js';

export class ReaperScythe extends Weapon {
    constructor(player) {
        super(player, 'reaperScythe');
        this.sweepAngle = 0;
        this.slashEffects = [];
    }
    
    fire() {
        // Create a sweeping arc around the player
        const arcStart = this.sweepAngle;
        const arcEnd = arcStart + Math.PI; // 180 degree sweep
        const arcSegments = 8;
        
        // Add visual slash effect
        this.slashEffects.push({
            startAngle: arcStart,
            endAngle: arcEnd,
            radius: 60 * this.area,
            age: 0,
            duration: 300,
        });
        
        for (let i = 0; i <= arcSegments; i++) {
            const angle = arcStart + (arcEnd - arcStart) * (i / arcSegments);
            const distance = 60 * this.area;
            const x = this.player.x + Math.cos(angle) * distance;
            const y = this.player.y + Math.sin(angle) * distance;
            
            // Stagger the spawns for sweeping visual effect
            setTimeout(() => {
                this.game.projectileManager?.spawn({
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    speed: 0,
                    damage: this.damage,
                    pierce: 999,
                    duration: this.duration / 2,
                    size: 40 * this.area,
                    color: 'rgba(0,0,0,0)', // Invisible hitbox, visual is handled by render()
                    glowColor: 'rgba(0,0,0,0)',
                    type: 'melee', // Melee type generally doesn't move
                    pattern: 'linear',
                });
            }, i * 20); // Faster sweep
        }
        
        // Alternate sweep direction
        this.sweepAngle += Math.PI;
    }
    
    update(dt) {
        super.update(dt);
        
        // Update slash effects
        for (let i = this.slashEffects.length - 1; i >= 0; i--) {
            this.slashEffects[i].age += dt;
            if (this.slashEffects[i].age >= this.slashEffects[i].duration) {
                this.slashEffects.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        // Render mystic slash effects
        for (const slash of this.slashEffects) {
            const progress = slash.age / slash.duration;
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            const alpha = 1 - easeOut; // Fade out
            const expandRadius = slash.radius + (easeOut * 80); // Fast expansion
            
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            
            // Rotate to match the sweep
            // logic implies sweepAngle covers 180 deg. slash.startAngle is correct for arc.
            
            // Create Gradient
            const gradient = ctx.createRadialGradient(0, 0, expandRadius - 20, 0, 0, expandRadius + 20);
            gradient.addColorStop(0, `rgba(76, 29, 149, 0)`); // Inner transparent
            gradient.addColorStop(0.5, `rgba(139, 92, 246, ${alpha})`); // Middle Purple
            gradient.addColorStop(0.8, `rgba(255, 255, 255, ${alpha})`); // Sharp Edge White
            gradient.addColorStop(1, `rgba(76, 29, 149, 0)`); // Outer transparent

            // Dynamic Width
            const width = 40 * (1 - easeOut) * this.area;
            
            // Draw Slash
            ctx.beginPath();
            ctx.arc(0, 0, expandRadius, slash.startAngle, slash.endAngle);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#8b5cf6'; // Purple Glow
            ctx.stroke();
            
            // Draw Core "Cut" (Black/Void line)
            ctx.beginPath();
            ctx.arc(0, 0, expandRadius, slash.startAngle, slash.endAngle);
            ctx.strokeStyle = `rgba(15, 23, 42, ${alpha})`; // Dark Void Color
            ctx.lineWidth = width * 0.3; // Thinner core
            ctx.stroke();

            ctx.restore();
        }
    }
}
