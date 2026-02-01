/**
 * Lightning Weapon
 * Strikes random enemies in range
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class Lightning extends Weapon {
    constructor(player) {
        super(player, 'lightning');
        this.baseRange = WEAPONS.lightning.baseRange;
    }
    
    recalculateStats() {
        super.recalculateStats();
        // Apply range upgrades
        let range = this.baseRange;
        for (let i = 0; i < this.level - 1 && i < this.upgrades.length; i++) {
            if (this.upgrades[i].range) {
                range += this.upgrades[i].range;
            }
        }
        this.range = range * this.area;
    }
    
    fire() {
        this.game.soundManager?.play('lightning', 0.7);
        const enemies = this.getEnemiesInRange(this.range);
        if (enemies.length === 0) return;
        
        // Strike random enemies
        const targets = [];
        const shuffled = [...enemies].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < this.projectiles && i < shuffled.length; i++) {
            targets.push(shuffled[i]);
        }
        
        for (let i = 0; i < targets.length; i++) {
            const enemy = targets[i];
            
            setTimeout(() => {
                if (!enemy.dead) {
                    // Deal damage
                    enemy.takeDamage(this.damage);
                    this.game.addDamageDealt(this.damage);
                    
                    // Lightning visual effect
                    this.game.particles.lightning(
                        this.player.x,
                        this.player.y - 20,
                        enemy.x,
                        enemy.y
                    );
                    
                    // Impact effect
                    this.game.particles.burst(
                        enemy.x,
                        enemy.y,
                        '#38bdf8',
                        8
                    );
                }
            }, i * 50);
        }
    }
}
