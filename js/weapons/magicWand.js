/**
 * Magic Wand Weapon
 * Fires projectiles at nearest enemy
 */

import { Weapon } from './weapon.js';

export class MagicWand extends Weapon {
    constructor(player) {
        super(player, 'magicWand');
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
                // Fire in facing direction
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
            
            // Add slight spread for multiple projectiles
            if (this.projectiles > 1) {
                const spreadAngle = (i - (this.projectiles - 1) / 2) * 0.15;
                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                const newDx = dx * cos - dy * sin;
                const newDy = dx * sin + dy * cos;
                dx = newDx;
                dy = newDy;
            }
            
            // Spawn projectile with delay for multiple
            setTimeout(() => {
                this.game.projectileManager?.spawn({
                    x: this.player.x,
                    y: this.player.y,
                    dx: dx,
                    dy: dy,
                    speed: this.speed,
                    damage: this.damage,
                    pierce: this.pierce,
                    duration: 2000,
                    size: 8 * this.area,
                    color: '#a78bfa',
                    type: 'projectile',
                    shape: 'magic',
                    pulseSpeed: 8,
                    trailLength: 6,
                });
            }, i * 80);
        }
    }
}
