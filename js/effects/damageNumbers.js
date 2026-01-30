/**
 * Damage Numbers System
 * Shows floating damage numbers for combat feedback
 */

export class DamageNumbers {
    constructor() {
        this.numbers = [];
        this.maxNumbers = 200;
    }
    
    /**
     * Add a new damage number
     */
    add(x, y, value, color = '#ffffff') {
        if (this.numbers.length >= this.maxNumbers) {
            this.numbers.shift();
        }
        
        this.numbers.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y,
            value: typeof value === 'number' ? Math.floor(value) : value,
            color: color,
            age: 0,
            duration: 800,
            velocityY: -80,
            scale: 1,
        });
    }
    
    /**
     * Update all damage numbers
     */
    update(dt) {
        const dtSeconds = dt / 1000;
        const toRemove = [];
        
        for (let i = 0; i < this.numbers.length; i++) {
            const num = this.numbers[i];
            num.age += dt;
            
            if (num.age >= num.duration) {
                toRemove.push(i);
                continue;
            }
            
            // Move upward, slowing down
            num.y += num.velocityY * dtSeconds;
            num.velocityY *= 0.98;
            
            // Scale animation
            const progress = num.age / num.duration;
            if (progress < 0.1) {
                num.scale = 1 + (1 - progress / 0.1) * 0.3;
            } else if (progress > 0.7) {
                num.scale = 1 - ((progress - 0.7) / 0.3) * 0.5;
            }
        }
        
        // Remove expired
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.numbers.splice(toRemove[i], 1);
        }
    }
    
    /**
     * Render all damage numbers
     */
    render(ctx) {
        ctx.save();
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const num of this.numbers) {
            const progress = num.age / num.duration;
            const alpha = progress > 0.5 ? 1 - (progress - 0.5) * 2 : 1;
            
            ctx.save();
            ctx.translate(num.x, num.y);
            ctx.scale(num.scale, num.scale);
            
            // Shadow
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = '#000000';
            ctx.fillText(String(num.value), 2, 2);
            
            // Text
            ctx.globalAlpha = alpha;
            ctx.fillStyle = num.color;
            ctx.fillText(String(num.value), 0, 0);
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    /**
     * Clear all numbers
     */
    clear() {
        this.numbers = [];
    }
}
