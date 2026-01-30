/**
 * Shadow Dagger Weapon
 * Teleports to random enemy and strikes
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class ShadowDagger extends Weapon {
    constructor(player) {
        super(player, 'shadowDagger');
    }
    
    fire() {
        const enemies = this.game.enemyManager?.enemies || [];
        if (enemies.length === 0) return;
        
        // Get random enemies to strike
        const shuffled = [...enemies].sort(() => Math.random() - 0.5);
        const targets = shuffled.slice(0, this.projectiles);
        
        for (const target of targets) {
            // Create a strike effect at the enemy position
            this.game.projectileManager.spawn({
                x: target.x,
                y: target.y,
                dx: 0,
                dy: 0,
                speed: 0,
                damage: this.damage,
                pierce: 1,
                duration: this.duration,
                size: 20 * this.area,
                color: '#4b0082',
                type: 'strike',
            });
            
            // Create shadow trail effect
            this.createShadowTrail(this.player.x, this.player.y, target.x, target.y);
        }
    }
    
    createShadowTrail(x1, y1, x2, y2) {
        // Visual effect for teleport trail
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            setTimeout(() => {
                this.game.projectileManager.spawn({
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    speed: 0,
                    damage: 0,
                    pierce: 0,
                    duration: 200,
                    size: 10,
                    color: '#2d1b4e',
                    type: 'effect',
                });
            }, i * 30);
        }
    }
}
