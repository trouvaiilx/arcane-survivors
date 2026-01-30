/**
 * Throwing Star Weapon
 * Fast spinning stars in all directions
 */

import { Weapon } from './weapon.js';

export class ThrowingStar extends Weapon {
    constructor(player) {
        super(player, 'throwingStar');
    }
    
    fire() {
        const angleStep = (Math.PI * 2) / this.projectiles;
        
        for (let i = 0; i < this.projectiles; i++) {
            const angle = angleStep * i + (performance.now() / 500); // Rotate over time
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
            this.game.projectileManager.spawn({
                x: this.player.x,
                y: this.player.y,
                dx: dx,
                dy: dy,
                speed: this.speed,
                damage: this.damage,
                pierce: this.pierce,
                duration: 1200,
                size: 8 * this.area,
                color: '#ffd700',
                type: 'star',
            });
        }
    }
}
