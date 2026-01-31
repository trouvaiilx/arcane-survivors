/**
 * Fire Chain Weapon
 * Chain attack that bounces between enemies
 */

import { Weapon } from './weapon.js';

export class FireChain extends Weapon {
    constructor(player) {
        super(player, 'fireChain');
    }
    
    fire() {
        const target = this.getNearestEnemy();
        if (!target) return;
        
        for (let i = 0; i < this.projectiles; i++) {
            let dx = target.x - this.player.x;
            let dy = target.y - this.player.y;
            
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len || 1;
            dy /= len || 1;
            
            // Add spread for multiple projectiles
            if (this.projectiles > 1) {
                const spreadAngle = (i - (this.projectiles - 1) / 2) * 0.2;
                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                const newDx = dx * cos - dy * sin;
                const newDy = dx * sin + dy * cos;
                dx = newDx;
                dy = newDy;
            }
            
            this.game.projectileManager.spawn({
                x: this.player.x,
                y: this.player.y,
                dx: dx,
                dy: dy,
                speed: this.speed,
                damage: this.damage,
                pierce: this.pierce,
                duration: 1500,
                size: 10 * this.area,
                color: '#ff6600',
                type: 'projectile',
                shape: 'fire',
                pattern: 'linear',
                trailLength: 8,
            });
        }
    }
}
