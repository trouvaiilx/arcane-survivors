/**
 * Ice Spear Weapon
 * Piercing ice projectiles that slow enemies
 */

import { Weapon } from './weapon.js';

export class IceSpear extends Weapon {
    constructor(player) {
        super(player, 'iceSpear');
    }
    
    fire() {
        this.game.soundManager?.play('shoot', 0.4);
        const target = this.getNearestEnemy();
        
        for (let i = 0; i < this.projectiles; i++) {
            let dx, dy;
            
            if (target) {
                dx = target.x - this.player.x;
                dy = target.y - this.player.y;
            } else {
                dx = this.player.facingX;
                dy = this.player.facingY;
            }
            
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                dx /= len;
                dy /= len;
            } else {
                dx = 1;
                dy = 0;
            }
            
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
            
            setTimeout(() => {
                this.game.projectileManager?.spawn({
                    x: this.player.x,
                    y: this.player.y,
                    dx: dx,
                    dy: dy,
                    speed: this.speed,
                    damage: this.damage,
                    pierce: this.pierce,
                    duration: this.duration,
                    size: 10 * this.area,
                    color: '#06b6d4',
                    type: 'projectile',
                    shape: 'ice',
                    trailLength: 10,
                    slow: 0.5, // Slow enemies by 50%
                });
            }, i * 50);
        }
    }
}
