/**
 * Knife Weapon
 * Rapid-fire projectiles in facing direction
 */

import { Weapon } from './weapon.js';

export class Knife extends Weapon {
    constructor(player) {
        super(player, 'knife');
    }
    
    fire() {
        this.game.soundManager?.play('shoot', 0.4);
        for (let i = 0; i < this.projectiles; i++) {
            // Try to find a random enemy to target
            const target = this.game.enemyManager?.getRandomEnemyInRange(
                this.player.x, 
                this.player.y, 
                500 // Range to search for enemies
            );
            
            let dx, dy;
            
            if (target) {
                // Aim at random enemy
                dx = target.x - this.player.x;
                dy = target.y - this.player.y;
            } else {
                // Fallback to facing direction
                dx = this.player.facingX || 1;
                dy = this.player.facingY || 0;
            }
            
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy);
            const ndx = len > 0 ? dx / len : 1;
            const ndy = len > 0 ? dy / len : 0;
            
            // Add slight spread for multiple projectiles
            const spreadAngle = (i - (this.projectiles - 1) / 2) * 0.08;
            const cos = Math.cos(spreadAngle);
            const sin = Math.sin(spreadAngle);
            const fdx = ndx * cos - ndy * sin;
            const fdy = ndx * sin + ndy * cos;
            
            this.game.projectileManager?.spawn({
                x: this.player.x + fdx * 10,
                y: this.player.y + fdy * 10,
                dx: fdx,
                dy: fdy,
                speed: this.speed,
                damage: this.damage,
                pierce: this.pierce,
                duration: 1500,
                size: 6 * this.area,
                color: '#94a3b8',
                type: 'projectile',
                shape: 'knife',
                trailLength: 6,
            });
        }
    }
}
