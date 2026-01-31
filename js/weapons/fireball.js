/**
 * Fireball Weapon
 * Launches fireballs that explode on impact
 */

import { Weapon } from './weapon.js';

export class Fireball extends Weapon {
    constructor(player) {
        super(player, 'fireball');
    }
    
    fire() {
        const target = this.getNearestEnemy();
        
        for (let i = 0; i < this.projectiles; i++) {
            let dx, dy;
            
            if (target) {
                dx = target.x - this.player.x;
                dy = target.y - this.player.y;
            } else {
                dx = this.player.facingX;
                dy = this.player.facingY;
            }
            
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                dx /= len;
                dy /= len;
            } else {
                dx = 1;
                dy = 0;
            }
            
            // Add spread for multiple projectiles
            if (this.projectiles > 1) {
                const spreadAngle = (i - (this.projectiles - 1) / 2) * 0.3;
                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                const newDx = dx * cos - dy * sin;
                const newDy = dx * sin + dy * cos;
                dx = newDx;
                dy = newDy;
            }
            
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
                    color: '#ef4444',
                    type: 'projectile',
                    shape: 'fireball',
                    trailLength: 12,
                    onHit: (proj, target) => {
                        // AoE Damage
                        const radius = 60 * this.area;
                        const enemies = this.game.enemyManager.getEnemiesNear(proj.x, proj.y, radius);
                        for (const enemy of enemies) {
                            if (enemy !== target) { // Target already took damage from collision
                                enemy.takeDamage(proj.damage);
                                this.game.addDamageDealt(proj.damage);
                            }
                        }
                        // Explosion Effect
                        this.game.particles?.burst(proj.x, proj.y, '#ef4444', 20);
                        this.game.camera.shake(2, 100);
                    },
                    onExpire: (proj) => {
                        // Explosion effect if expired without hitting
                        this.game.particles?.burst(proj.x, proj.y, '#ef4444', 10);
                    }
                });
            }, i * 100);
        }
    }
}
