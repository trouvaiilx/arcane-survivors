/**
 * Holy Water Weapon
 * Creates damaging pools on the ground
 */

import { Weapon } from './weapon.js';

export class HolyWater extends Weapon {
    constructor(player) {
        super(player, 'holyWater');
    }
    
    fire() {
        for (let i = 0; i < this.projectiles; i++) {
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            
            const targetX = this.player.x + Math.cos(angle) * distance;
            const targetY = this.player.y + Math.sin(angle) * distance;
            
            // Direction to target
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
            setTimeout(() => {
                this.game.projectileManager?.spawn({
                    x: this.player.x,
                    y: this.player.y,
                    dx: dx,
                    dy: dy,
                    targetX: targetX,
                    targetY: targetY,
                    speed: this.speed,
                    damage: this.damage,
                    pierce: this.pierce,
                    duration: this.duration,
                    size: 30 * this.area,
                    color: '#60a5fa',
                    type: 'ground',
                    shape: 'pool',
                    tickRate: 200, // Damage every 200ms
                });
            }, i * 200);
        }
    }
}
