/**
 * Reaper Scythe Weapon
 * Massive sweeping attack that executes low-HP enemies
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class ReaperScythe extends Weapon {
    constructor(player) {
        super(player, 'reaperScythe');
        this.sweepAngle = 0;
    }
    
    fire() {
        // Create a sweeping arc around the player
        const arcStart = this.sweepAngle;
        const arcEnd = arcStart + Math.PI; // 180 degree sweep
        const arcSegments = 8;
        
        for (let i = 0; i <= arcSegments; i++) {
            const angle = arcStart + (arcEnd - arcStart) * (i / arcSegments);
            const distance = 60 * this.area;
            const x = this.player.x + Math.cos(angle) * distance;
            const y = this.player.y + Math.sin(angle) * distance;
            
            this.game.projectileManager.spawn({
                x: x,
                y: y,
                dx: 0,
                dy: 0,
                speed: 0,
                damage: this.damage,
                pierce: this.pierce,
                duration: this.duration,
                size: 30 * this.area,
                color: '#1a1a2e',
                type: 'melee',
                execute: WEAPONS.reaperScythe.execute,
            });
        }
        
        // Alternate sweep direction
        this.sweepAngle += Math.PI;
    }
}
