/**
 * Whip Weapon
 * Horizontal melee attack with high knockback
 */

import { Weapon } from './weapon.js';

export class Whip extends Weapon {
    constructor(player) {
        super(player, 'whip');
        this.attackDirection = 1; // Alternates left/right
    }
    
    fire() {
        this.game.soundManager?.play('slash', 0.5);
        // Create whip attack zone
        const width = 120 * this.area;
        const height = 40 * this.area;
        
        for (let i = 0; i < this.projectiles; i++) {
            const direction = this.attackDirection * (i % 2 === 0 ? 1 : -1);
            
            // Spawn whip projectile (melee hitbox)
            this.game.projectileManager?.spawn({
                x: this.player.x + direction * width / 2,
                y: this.player.y,
                dx: direction,
                dy: 0,
                speed: 0, // Stationary
                damage: this.damage,
                pierce: this.pierce,
                duration: this.duration,
                width: width,
                height: height,
                color: '#f97316',
                type: 'melee',
                shape: 'whip',
                knockback: this.knockback * 2,
                owner: this.player,
            });
        }
        
        // Alternate direction
        this.attackDirection *= -1;
    }
}
