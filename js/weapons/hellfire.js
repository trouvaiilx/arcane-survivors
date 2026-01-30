/**
 * Hellfire Weapon
 * Rains fire from the sky in random locations
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class Hellfire extends Weapon {
    constructor(player) {
        super(player, 'hellfire');
        this.baseRange = WEAPONS.hellfire.baseRange || 300;
        this.recalculateStats();
    }
    
    recalculateStats() {
        super.recalculateStats();
        this.range = this.baseRange * this.area;
    }
    
    fire() {
        for (let i = 0; i < this.projectiles; i++) {
            // Random position around player
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.range;
            const targetX = this.player.x + Math.cos(angle) * distance;
            const targetY = this.player.y + Math.sin(angle) * distance;
            
            setTimeout(() => {
                // Warning indicator
                this.game.particles?.ring(targetX, targetY, 20 * this.area, '#ef4444', 0.3);
                
                // Delayed strike
                setTimeout(() => {
                    // Damage enemies in area
                    const enemies = this.getEnemiesInRange(this.range);
                    for (const enemy of enemies) {
                        const dx = enemy.x - targetX;
                        const dy = enemy.y - targetY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < 40 * this.area) {
                            enemy.takeDamage(this.damage);
                            this.game.addDamageDealt(this.damage);
                            this.game.particles?.spawn(enemy.x, enemy.y, '#ef4444', 5);
                        }
                    }
                    
                    // Visual explosion
                    this.game.particles?.burst(targetX, targetY, '#ef4444', 12);
                    this.game.particles?.burst(targetX, targetY, '#fbbf24', 8);
                }, 300);
            }, i * 100);
        }
    }
}
