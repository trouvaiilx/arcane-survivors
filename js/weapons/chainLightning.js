/**
 * Chain Lightning Weapon
 * Lightning that bounces between enemies
 */

import { Weapon } from './weapon.js';
import { WEAPONS } from '../data/config.js';

export class ChainLightning extends Weapon {
    constructor(player) {
        super(player, 'chainLightning');
        this.chainEffects = []; // Visual effects for the chains
    }
    
    fire() {
        const data = WEAPONS.chainLightning;
        const game = this.player.game;
        const damage = this.damage;
        const chainCount = (data.chainCount || 4) + Math.floor(this.level / 2);
        const chainRange = 300;
        
        // Fire multiple projectiles based on level
        const projectileCount = this.projectiles;
        
        for (let p = 0; p < projectileCount; p++) {
            // Find initial target
            const initialTarget = game.enemyManager?.getNearestEnemy(this.player.x, this.player.y);
            if (!initialTarget) continue;
            
            // Perform chain
            const hitEnemies = new Set();
            let currentTarget = initialTarget;
            const chainPath = [{ x: this.player.x, y: this.player.y }];
            
            for (let i = 0; i < chainCount && currentTarget; i++) {
                if (hitEnemies.has(currentTarget.id)) break;
                
                // Deal damage
                const actualDamage = damage * Math.pow(0.85, i); // Slight damage falloff
                currentTarget.takeDamage(actualDamage);
                game.addDamageDealt(actualDamage);
                
                hitEnemies.add(currentTarget.id);
                chainPath.push({ x: currentTarget.x, y: currentTarget.y });
                
                // Spawn particles
                game.particles.burst(currentTarget.x, currentTarget.y, '#06b6d4', 5);
                
                // Find next target
                const nearby = game.enemyManager?.getEnemiesNear(
                    currentTarget.x, 
                    currentTarget.y, 
                    chainRange
                ) || [];
                
                currentTarget = null;
                for (const enemy of nearby) {
                    if (!hitEnemies.has(enemy.id) && !enemy.dead) {
                        currentTarget = enemy;
                        break;
                    }
                }
            }
            
            // Add visual chain effect
            if (chainPath.length > 1) {
                this.chainEffects.push({
                    path: chainPath,
                    age: 0,
                    duration: 200,
                });
            }
        }
    }
    
    update(dt) {
        super.update(dt);
        
        // Update chain effects
        for (let i = this.chainEffects.length - 1; i >= 0; i--) {
            this.chainEffects[i].age += dt;
            if (this.chainEffects[i].age >= this.chainEffects[i].duration) {
                this.chainEffects.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        // Render lightning chains
        for (const chain of this.chainEffects) {
            const alpha = 1 - (chain.age / chain.duration);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            for (let i = 0; i < chain.path.length; i++) {
                const point = chain.path[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    // Add some jitter for lightning effect
                    const prevPoint = chain.path[i - 1];
                    const dx = point.x - prevPoint.x;
                    const dy = point.y - prevPoint.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Create zigzag
                    const segments = Math.max(2, Math.floor(dist / 30));
                    for (let s = 1; s <= segments; s++) {
                        const t = s / segments;
                        const x = prevPoint.x + dx * t + (s < segments ? (Math.random() - 0.5) * 20 : 0);
                        const y = prevPoint.y + dy * t + (s < segments ? (Math.random() - 0.5) * 20 : 0);
                        ctx.lineTo(x, y);
                    }
                }
            }
            ctx.stroke();
            
            // Glow effect
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        }
    }
}
