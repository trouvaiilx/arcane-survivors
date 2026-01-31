/**
 * Soul Eater Weapon
 * Projectiles that drain life from enemies
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class SoulEater extends Weapon {
    constructor(player) {
        super(player, 'soulEater');
        this.lifesteal = WEAPONS.soulEater.lifesteal || 0.1;
    }
    
    fire() {
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
                const spreadAngle = (i - (this.projectiles - 1) / 2) * 0.25;
                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                const newDx = dx * cos - dy * sin;
                const newDy = dx * sin + dy * cos;
                dx = newDx;
                dy = newDy;
            }
            
            const self = this;
            
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
                    size: 12 * this.area,
                    color: '#a855f7',
                    type: 'projectile',
                    shape: 'soul',
                    trailLength: 10,
                    pulseSpeed: 5,
                    onHit: (proj, enemy) => {
                        // Heal player on hit
                        const healAmount = proj.damage * self.lifesteal;
                        self.player.heal(healAmount);
                        self.game.particles?.spawn(self.player.x, self.player.y, '#22c55e', 3);
                    }
                });
            }, i * 80);
        }
    }
}
