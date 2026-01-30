/**
 * Rune Tracer Weapon
 * Bouncing projectiles that ricochet off screen edges
 */

import { Weapon } from './weapon.js';

export class RuneTracer extends Weapon {
    constructor(player) {
        super(player, 'runeTracer');
    }
    
    fire() {
        for (let i = 0; i < this.projectiles; i++) {
            // Random direction for each projectile
            const angle = Math.random() * Math.PI * 2;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
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
                    color: '#22d3ee',
                    type: 'bounce',
                    bounces: 999, // Bounces until duration expires
                });
            }, i * 200);
        }
    }
}
