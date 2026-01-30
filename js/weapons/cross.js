/**
 * Cross Weapon
 * Boomerang projectile that returns to player
 */

import { Weapon } from './weapon.js';

export class Cross extends Weapon {
    constructor(player) {
        super(player, 'cross');
    }
    
    fire() {
        for (let i = 0; i < this.projectiles; i++) {
            // Calculate direction - spread in circle
            const baseAngle = (i / this.projectiles) * Math.PI * 2;
            const dx = Math.cos(baseAngle);
            const dy = Math.sin(baseAngle);
            
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
                    color: '#fbbf24',
                    type: 'projectile',
                    shape: 'cross',
                    pattern: 'boomerang',
                    owner: this.player,
                    returnTime: this.duration / 2,
                    rotation: 0,
                    rotationSpeed: 10,
                });
            }, i * 100);
        }
    }
}
