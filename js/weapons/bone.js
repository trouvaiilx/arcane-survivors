/**
 * Bone Weapon
 * Boomerangs back after being thrown
 */

import { Weapon } from './weapon.js';

export class Bone extends Weapon {
    constructor(player) {
        super(player, 'bone');
    }
    
    fire() {
        const target = this.getNearestEnemy();
        
        for (let i = 0; i < this.projectiles; i++) {
            let dx, dy;
            
            if (target) {
                dx = target.x - this.player.x;
                dy = target.y - this.player.y;
            } else {
                // Random direction if no target
                const angle = Math.random() * Math.PI * 2;
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }
            
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len || 1;
            dy /= len || 1;
            
            // Add spread for multiple projectiles
            if (this.projectiles > 1) {
                const spreadAngle = (i - (this.projectiles - 1) / 2) * 0.3;
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
                duration: this.duration,
                size: 10 * this.area,
                color: '#f5deb3',
                type: 'boomerang',
                owner: this.player,
            });
        }
    }
}
