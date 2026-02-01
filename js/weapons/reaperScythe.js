/**
 * Reaper Scythe Weapon - REDESIGNED
 * Epic sweeping death slash with spectral blade and void rifts
 * Features: Crescent moon blade trail, void energy, spectral afterimages, death particles
 */

import { Weapon } from './weapon.js';

export class ReaperScythe extends Weapon {
    constructor(player) {
        super(player, 'reaperScythe');
        this.sweepAngle = 0;
        this.slashEffects = [];
    }
    
    fire() {
        this.game.soundManager?.play('slash', 0.7);
        
        const arcStart = this.sweepAngle;
        const arcEnd = arcStart + Math.PI * 1.1; // 200 degree deadly sweep
        const arcSegments = 12;
        
        // Create epic slash visual effect
        this.slashEffects.push({
            startAngle: arcStart,
            endAngle: arcEnd,
            radius: Math.max(0.1, 65 * this.area),
            age: 0,
            duration: 500,
            voidRifts: this.generateVoidRifts(arcStart, arcEnd),
            deathParticles: this.generateDeathParticles(arcStart, arcEnd),
            spectralBlades: this.generateSpectralBlades(arcStart, arcEnd),
        });
        
        // Spawn hitboxes with staggered timing for sweep effect
        for (let i = 0; i <= arcSegments; i++) {
            setTimeout(() => {
                const angle = arcStart + (arcEnd - arcStart) * (i / arcSegments);
                const distance = 65 * this.area;
                const x = this.player.x + Math.cos(angle) * distance;
                const y = this.player.y + Math.sin(angle) * distance;
                
                this.game.projectileManager?.spawn({
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    speed: 0,
                    damage: this.damage,
                    pierce: 999,
                    duration: this.duration / 2,
                    size: 45 * this.area,
                    color: 'rgba(0,0,0,0)',
                    type: 'melee',
                    shape: 'invisible', // Hide the actual projectile
                    pattern: 'linear',
                });
            }, i * 12);
        }
        
        this.sweepAngle += Math.PI;
    }
    
    /**
     * Generate void rifts along the slash path
     */
    generateVoidRifts(startAngle, endAngle) {
        const rifts = [];
        const riftCount = 8;
        
        for (let i = 0; i < riftCount; i++) {
            const progress = i / riftCount;
            const angle = startAngle + (endAngle - startAngle) * progress;
            
            rifts.push({
                angle: angle,
                radius: Math.max(0.1, 65 * this.area + (Math.random() - 0.5) * 15),
                width: 30 + Math.random() * 20,
                height: 8 + Math.random() * 6,
                rotation: angle + Math.PI / 2,
                opacity: 0.9,
                expansion: 0,
            });
        }
        
        return rifts;
    }
    
    /**
     * Generate death particles (skulls, souls, dark energy)
     */
    generateDeathParticles(startAngle, endAngle) {
        const particles = [];
        const particleCount = 40;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = startAngle + (endAngle - startAngle) * Math.random();
            const radius = Math.max(0.1, 65 * this.area + (Math.random() - 0.5) * 30);
            
            particles.push({
                angle: angle,
                radius: radius,
                size: 2 + Math.random() * 5,
                speed: 1 + Math.random() * 2,
                drift: (Math.random() - 0.5) * 0.02,
                opacity: 0.8 + Math.random() * 0.2,
                type: Math.random() > 0.7 ? 'soul' : 'energy',
                pulsePhase: Math.random() * Math.PI * 2,
            });
        }
        
        return particles;
    }
    
    /**
     * Generate spectral blade afterimages
     */
    generateSpectralBlades(startAngle, endAngle) {
        const blades = [];
        const bladeCount = 15;
        
        for (let i = 0; i < bladeCount; i++) {
            const progress = i / bladeCount;
            blades.push({
                angle: startAngle + (endAngle - startAngle) * progress,
                opacity: 0.8 - progress * 0.5,
                scale: 1 - progress * 0.2,
            });
        }
        
        return blades;
    }
    
    update(dt) {
        super.update(dt);
        
        for (let i = this.slashEffects.length - 1; i >= 0; i--) {
            const slash = this.slashEffects[i];
            slash.age += dt;
            
            // Update void rifts
            for (const rift of slash.voidRifts) {
                rift.opacity -= dt / 500;
                rift.expansion += dt / 100;
            }
            
            // Update particles
            for (const particle of slash.deathParticles) {
                particle.radius += particle.speed;
                particle.angle += particle.drift;
                particle.opacity -= dt / 500;
                particle.pulsePhase += dt / 100;
            }
            
            if (slash.age >= slash.duration) {
                this.slashEffects.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        for (const slash of this.slashEffects) {
            const progress = slash.age / slash.duration;
            const sweepProgress = Math.min(progress * 1.8, 1);
            const fadeProgress = Math.max(0, (progress - 0.7) / 0.3);
            
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            
            const currentArcEnd = slash.startAngle + (slash.endAngle - slash.startAngle) * sweepProgress;
            
            // ========== LAYER 1: Dark Void Background ==========
            const voidGradient = ctx.createRadialGradient(0, 0, Math.max(0, slash.radius - 40), 0, 0, Math.max(0.1, slash.radius + 40));
            voidGradient.addColorStop(0, `rgba(10, 10, 20, ${(1 - fadeProgress) * 0.9})`);
            voidGradient.addColorStop(0.4, `rgba(30, 10, 50, ${(1 - fadeProgress) * 0.8})`);
            voidGradient.addColorStop(0.7, `rgba(50, 10, 70, ${(1 - fadeProgress) * 0.6})`);
            voidGradient.addColorStop(1, 'rgba(10, 10, 20, 0)');
            
            ctx.strokeStyle = voidGradient;
            ctx.lineWidth = 60 * this.area * (1 - progress * 0.4);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, slash.radius), slash.startAngle, currentArcEnd);
            ctx.stroke();
            
            // ========== LAYER 2: Void Rifts ==========
            for (const rift of slash.voidRifts) {
                if (rift.opacity <= 0 || rift.angle > currentArcEnd) continue;
                
                const riftX = Math.cos(rift.angle) * rift.radius;
                const riftY = Math.sin(rift.angle) * rift.radius;
                
                ctx.save();
                ctx.translate(riftX, riftY);
                ctx.rotate(rift.rotation);
                
                // Outer rift glow
                const riftGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rift.width + rift.expansion * 10);
                riftGradient.addColorStop(0, `rgba(80, 0, 120, ${rift.opacity * 0.8})`);
                riftGradient.addColorStop(0.5, `rgba(120, 40, 180, ${rift.opacity * 0.5})`);
                riftGradient.addColorStop(1, 'rgba(80, 0, 120, 0)');
                
                ctx.fillStyle = riftGradient;
                ctx.fillRect(
                    -(rift.width + rift.expansion * 10) / 2,
                    -(rift.height + rift.expansion * 5) / 2,
                    rift.width + rift.expansion * 10,
                    rift.height + rift.expansion * 5
                );
                
                // Inner void core
                ctx.fillStyle = `rgba(0, 0, 0, ${rift.opacity * 0.9})`;
                ctx.fillRect(-rift.width / 2, -rift.height / 2, rift.width, rift.height);
                
                // Purple edge
                ctx.strokeStyle = `rgba(147, 51, 234, ${rift.opacity})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(-rift.width / 2, -rift.height / 2, rift.width, rift.height);
                
                ctx.restore();
            }
            
            // ========== LAYER 3: Death Particles ==========
            for (const particle of slash.deathParticles) {
                if (particle.opacity <= 0 || particle.angle > currentArcEnd) continue;
                
                const px = Math.cos(particle.angle) * particle.radius;
                const py = Math.sin(particle.angle) * particle.radius;
                const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
                
                if (particle.type === 'soul') {
                    // Soul particle (glowing orb)
                    const soulGradient = ctx.createRadialGradient(px, py, 0, px, py, Math.max(0.1, particle.size * 3));
                    soulGradient.addColorStop(0, `rgba(200, 150, 255, ${particle.opacity * pulse})`);
                    soulGradient.addColorStop(0.5, `rgba(147, 51, 234, ${particle.opacity * 0.6})`);
                    soulGradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
                    
                    ctx.fillStyle = soulGradient;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(0.1, particle.size * 3), 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Dark energy particle
                    ctx.fillStyle = `rgba(80, 0, 120, ${particle.opacity * 0.8})`;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(0.1, particle.size), 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = `rgba(147, 51, 234, ${particle.opacity})`;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(0.1, particle.size * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // ========== LAYER 4: Main Crescent Blade Trail ==========
            ctx.globalCompositeOperation = 'lighter';
            
            // Outer deep purple glow with safe radius
            const bladeGradient = ctx.createRadialGradient(0, 0, Math.max(0, slash.radius - 35), 0, 0, Math.max(0.1, slash.radius + 35));
            bladeGradient.addColorStop(0, `rgba(120, 0, 200, ${(1 - fadeProgress) * 0.8})`);
            bladeGradient.addColorStop(0.4, `rgba(160, 30, 240, ${(1 - fadeProgress) * 0.9})`);
            bladeGradient.addColorStop(0.7, `rgba(200, 80, 255, ${(1 - fadeProgress) * 0.7})`);
            bladeGradient.addColorStop(1, 'rgba(120, 0, 200, 0)');
            
            ctx.strokeStyle = bladeGradient;
            ctx.lineWidth = 50 * this.area * (1 - progress * 0.3);
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#d000ff';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, slash.radius), slash.startAngle, currentArcEnd);
            ctx.stroke();
            
            // Core energetic slash
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#e080ff';
            ctx.strokeStyle = `rgba(255, 180, 255, ${(1 - fadeProgress)})`;
            ctx.lineWidth = 12 * this.area;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, slash.radius), slash.startAngle, currentArcEnd);
            ctx.stroke();
            
            // Inner pure white hot core
            ctx.shadowBlur = 10;
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - fadeProgress)})`;
            ctx.lineWidth = 4 * this.area;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, slash.radius), slash.startAngle, currentArcEnd);
            ctx.stroke();
            
            // ========== LAYER 5: Spectral Blade Afterimages (Denser & Smoother) ==========
            for (const blade of slash.spectralBlades) {
                if (blade.angle > currentArcEnd) continue;
                
                // Smoother falloff
                const bladeAlpha = blade.opacity * (1 - fadeProgress) * (1 - progress * 0.5);
                if (bladeAlpha <= 0.05) continue;
                
                ctx.save();
                ctx.translate(Math.cos(blade.angle) * slash.radius, Math.sin(blade.angle) * slash.radius);
                ctx.rotate(blade.angle + Math.PI / 2); // Rotate to face outward properly
                
                const bladeLength = Math.max(0.1, slash.radius * 0.3 * blade.scale);
                const bladeWidth = Math.max(0.1, 20 * this.area * blade.scale);
                
                // Crescent moon blade shape with sharper gradient
                const gradient = ctx.createLinearGradient(0, -bladeWidth/2, 0, bladeWidth/2);
                gradient.addColorStop(0, `rgba(147, 51, 234, ${bladeAlpha * 0.2})`);
                gradient.addColorStop(0.5, `rgba(180, 80, 255, ${bladeAlpha * 0.4})`);
                gradient.addColorStop(1, `rgba(220, 150, 255, ${bladeAlpha * 0.6})`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                // Safe ellipse call with clamped dimensions
                try {
                    ctx.ellipse(0, 0, bladeWidth, bladeLength, 0, 0, Math.PI * 2);
                    ctx.fill();
                } catch(e) {
                    ctx.arc(0, 0, bladeWidth, 0, Math.PI*2);
                    ctx.fill();
                }
                
                ctx.restore();
            }

            // ========== LAYER 5.5: Particle Swish Trail ==========
            // Add noise/texture to the sweep
            if (slash.deathParticles) {
                 const trailCount = 20;
                 for (let i = 0; i < trailCount; i++) {
                     const t = i / trailCount;
                     if (t > sweepProgress) break;
                     const angle = slash.startAngle + (slash.endAngle - slash.startAngle) * t;
                     // Random jitter
                     const r = Math.max(0.1, slash.radius + (Math.sin(angle * 10 + slash.age * 0.1) * 10));
                     
                     ctx.save();
                     ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r);
                     
                     ctx.fillStyle = `rgba(200, 100, 255, ${(1 - fadeProgress) * 0.3})`;
                     ctx.beginPath();
                     ctx.arc(0, 0, 2 * this.area, 0, Math.PI * 2);
                     ctx.fill();
                     
                     ctx.restore();
                 }
            }
            
            // ========== LAYER 7: Energy Distortion Waves ==========
            const waveCount = 4;
            for (let w = 0; w < waveCount; w++) {
                const waveDelay = w * 0.12;
                const waveProgress = Math.max(0, Math.min(1, (progress - waveDelay) / 0.25));
                if (waveProgress <= 0) continue;
                
                const waveRadius = Math.max(0.1, slash.radius + waveProgress * 50);
                const waveAlpha = (1 - waveProgress) * (1 - fadeProgress) * 0.4;
                
                ctx.strokeStyle = `rgba(147, 51, 234, ${waveAlpha})`;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([8, 12]);
                ctx.beginPath();
                ctx.arc(0, 0, waveRadius, slash.startAngle, currentArcEnd);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            ctx.restore();
        }
    }
}