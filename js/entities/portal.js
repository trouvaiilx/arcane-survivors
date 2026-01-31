/**
 * Portal Entity
 * Two states: spark (initial, triggers boss) and constructed (after boss, wins game)
 */

export class Portal {
    constructor(game, x, y, state = 'spark') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = state === 'spark' ? 25 : 40;
        this.state = state; // 'spark' or 'constructed'
        this.active = true;
        this.pulsePhase = 0;
        this.sparkParticles = [];
        
        // Initialize spark particles
        if (state === 'spark') {
            for (let i = 0; i < 8; i++) {
                this.sparkParticles.push({
                    angle: (Math.PI * 2 / 8) * i,
                    dist: 15 + Math.random() * 10,
                    speed: 0.5 + Math.random() * 0.5,
                });
            }
        }
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.pulsePhase += dt / 200;
        
        // Update spark particles
        for (const p of this.sparkParticles) {
            p.angle += p.speed * dt / 500;
        }
        
        const player = this.game.player;
        if (!player) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (this.state === 'spark') {
            // Player touches spark -> spawn boss
            if (dist < this.radius + 20) {
                this.active = false;
                this.game.onSparkTouched(this.x, this.y);
            }
        } else if (this.state === 'constructed') {
            // Player enters constructed portal -> victory
            if (dist < this.radius + 20) {
                this.game.triggerVictory();
            }
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Render at world coordinates (camera transform already applied)
        if (this.state === 'spark') {
            this.renderSpark(ctx, this.x, this.y);
        } else {
            this.renderConstructed(ctx, this.x, this.y);
        }
    }
    
    renderSpark(ctx, x, y) {
        const pulseSize = Math.sin(this.pulsePhase) * 5;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, 50 + pulseSize
        );
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 50 + pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Spark particles orbiting
        for (const p of this.sparkParticles) {
            const px = x + Math.cos(p.angle) * p.dist;
            const py = y + Math.sin(p.angle) * p.dist;
            
            ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central spark
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(x, y, 12 + pulseSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // No label for portal spark - just the visual effect
    }
    
    renderConstructed(ctx, x, y) {
        const pulseSize = Math.sin(this.pulsePhase) * 5;
        const radius = this.radius + pulseSize;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, radius * 2
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal ring
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner portal swirl
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.pulsePhase / 2);
        
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.8);
        innerGradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
        innerGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
        innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Swirl lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + this.pulsePhase;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.4, angle, angle + Math.PI / 3);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Text indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER TO WIN', x, y + radius + 30);
    }
}
