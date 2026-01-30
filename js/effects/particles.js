/**
 * Particle System
 * Visual effects for combat and events
 */

export class Particles {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }
    
    /**
     * Spawn a single particle
     */
    spawn(x, y, color, count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 3 + Math.random() * 3,
                age: 0,
                duration: 300 + Math.random() * 300,
                type: 'circle',
            });
        }
    }
    
    /**
     * Spawn a burst of particles
     */
    burst(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2 + Math.random() * 4,
                age: 0,
                duration: 400 + Math.random() * 400,
                type: 'circle',
                gravity: 200,
            });
        }
    }
    
    /**
     * Create a ring effect
     */
    ring(x, y, radius, color, alpha = 0.5) {
        this.particles.push({
            x: x,
            y: y,
            radius: radius,
            maxRadius: radius,
            color: color,
            alpha: alpha,
            age: 0,
            duration: 200,
            type: 'ring',
        });
    }
    
    /**
     * Create a lightning effect
     */
    lightning(x1, y1, x2, y2) {
        this.particles.push({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            color: '#38bdf8',
            age: 0,
            duration: 150,
            type: 'lightning',
            segments: this.generateLightningPath(x1, y1, x2, y2),
        });
    }
    
    /**
     * Generate lightning path with segments
     */
    generateLightningPath(x1, y1, x2, y2) {
        const segments = [];
        const numPoints = 8;
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            let x = x1 + (x2 - x1) * t;
            let y = y1 + (y2 - y1) * t;
            
            // Add randomness (except start and end)
            if (i > 0 && i < numPoints) {
                x += (Math.random() - 0.5) * 30;
                y += (Math.random() - 0.5) * 30;
            }
            
            segments.push({ x, y });
        }
        
        return segments;
    }
    
    /**
     * Update all particles
     */
    update(dt) {
        const dtSeconds = dt / 1000;
        const toRemove = [];
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.age += dt;
            
            if (p.age >= p.duration) {
                toRemove.push(i);
                continue;
            }
            
            // Update based on type
            if (p.type === 'circle') {
                p.x += p.vx * dtSeconds;
                p.y += p.vy * dtSeconds;
                
                // Apply gravity if present
                if (p.gravity) {
                    p.vy += p.gravity * dtSeconds;
                }
                
                // Friction
                p.vx *= 0.98;
                p.vy *= 0.98;
            }
        }
        
        // Remove expired
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.particles.splice(toRemove[i], 1);
        }
    }
    
    /**
     * Render all particles
     */
    render(ctx) {
        for (const p of this.particles) {
            const progress = p.age / p.duration;
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha * (p.alpha || 1);
            
            switch (p.type) {
                case 'circle':
                    const size = p.size * (1 - progress * 0.5);
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'ring':
                    const ringRadius = p.maxRadius * (1 + progress * 0.3);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'lightning':
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3 - progress * 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 10;
                    
                    ctx.beginPath();
                    ctx.moveTo(p.segments[0].x, p.segments[0].y);
                    for (let i = 1; i < p.segments.length; i++) {
                        ctx.lineTo(p.segments[i].x, p.segments[i].y);
                    }
                    ctx.stroke();
                    
                    // Secondary thinner line
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }
}
