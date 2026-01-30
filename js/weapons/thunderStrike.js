/**
 * Thunder Strike Weapon
 * Calls down thunder on random enemies
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class ThunderStrike extends Weapon {
    constructor(player) {
        super(player, 'thunderStrike');
    }
    
    fire() {
        const enemies = this.game.enemyManager?.enemies || [];
        if (enemies.length === 0) return;
        
        // Get random enemies to strike
        const shuffled = [...enemies].sort(() => Math.random() - 0.5);
        const targets = shuffled.slice(0, this.projectiles);
        
        for (const target of targets) {
            // Create lightning strike at enemy position
            this.game.projectileManager.spawn({
                x: target.x,
                y: target.y - 50, // Start above
                dx: 0,
                dy: 1,
                speed: 800,
                damage: this.damage,
                pierce: this.pierce,
                duration: this.duration,
                size: 25 * this.area,
                color: '#00ffff',
                type: 'lightning',
            });
        }
    }
}
