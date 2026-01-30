/**
 * Axe Weapon
 * Thrown in arc trajectory, high damage, passes through enemies
 */

import { Weapon } from './weapon.js';

export class Axe extends Weapon {
    constructor(player) {
        super(player, 'axe');
    }
    
    fire() {
        for (let i = 0; i < this.projectiles; i++) {
            // Random upward angle
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            const spreadX = (Math.random() - 0.5) * 0.8;
            
            setTimeout(() => {
                this.game.projectileManager?.spawn({
                    x: this.player.x,
                    y: this.player.y,
                    dx: Math.cos(angle) + spreadX,
                    dy: Math.sin(angle),
                    speed: this.speed,
                    damage: this.damage,
                    pierce: this.pierce,
                    duration: this.duration,
                    size: 14 * this.area,
                    color: '#78716c',
                    type: 'projectile',
                    shape: 'axe',
                    pattern: 'arc',
                    gravity: 200, // Pixels per second^2
                    rotation: 0,
                    rotationSpeed: 8, // Radians per second
                });
            }, i * 150);
        }
    }
}
