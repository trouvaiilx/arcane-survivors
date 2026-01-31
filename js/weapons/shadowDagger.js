/**
 * Shadow Dagger Weapon
 * Teleports to random enemy and strikes
 */

import { Weapon } from './weapon.js';

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
                pierce: 999,
                duration: this.duration,
                size: 25 * this.area,
                color: '#4b0082',
                type: 'melee', // Use melee type for instant hit
                shape: 'dagger',
                pattern: 'linear',
            });
        }
    }
}
