/**
 * Projectile Manager
 * Handles all projectile entities in the game
 */

export class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
        this.maxProjectiles = 1000;
    }
    
    /**
     * Spawn a new projectile
     */
    spawn(options) {
        if (this.projectiles.length >= this.maxProjectiles) {
            // Remove oldest projectile
            this.projectiles.shift();
        }
        
        const projectile = {
            x: options.x,
            y: options.y,
            dx: options.dx || 0,
            dy: options.dy || 0,
            speed: options.speed || 300,
            damage: options.damage || 10,
            pierce: options.pierce || 1,
            pierceCount: 0,
            duration: options.duration || 2000,
            age: 0,
            size: options.size || 8,
            width: options.width || 0,
            height: options.height || 0,
            color: options.color || '#ffffff',
            type: options.type || 'projectile',
            shape: options.shape || 'circle',
            pattern: options.pattern || 'linear',
            hitEnemies: new Set(),
            
            // Special properties
            gravity: options.gravity || 0,
            rotation: options.rotation || 0,
            rotationSpeed: options.rotationSpeed || 0,
            owner: options.owner || null,
            returnTime: options.returnTime || 0,
            returning: false,
            knockback: options.knockback || 5,
            tickRate: options.tickRate || 0,
            lastTick: 0,
            targetX: options.targetX,
            targetY: options.targetY,
            landed: false,
            
            // Bounce support
            bounces: options.bounces || 0,
            bounceCount: 0,
            
            // Callbacks
            onHit: options.onHit || null,
            onExpire: options.onExpire || null,
        };
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    /**
     * Update all projectiles
     */
    update(dt) {
        const toRemove = [];
        
        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            p.age += dt;
            
            // Check expiration
            if (p.age >= p.duration) {
                if (p.onExpire) {
                    p.onExpire(p);
                }
                toRemove.push(i);
                continue;
            }
            
            // Update based on type
            switch (p.type) {
                case 'projectile':
                    this.updateProjectile(p, dt);
                    break;
                case 'melee':
                    this.updateMelee(p, dt);
                    break;
                case 'ground':
                    this.updateGround(p, dt);
                    break;
            }
            
            // Update rotation
            if (p.rotationSpeed) {
                p.rotation += p.rotationSpeed * (dt / 1000);
            }
        }
        
        // Remove expired projectiles
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.projectiles.splice(toRemove[i], 1);
        }
    }
    
    /**
     * Update standard projectile
     */
    updateProjectile(p, dt) {
        const dtSeconds = dt / 1000;
        
        switch (p.pattern) {
            case 'arc':
                // Apply gravity
                p.dy += p.gravity * dtSeconds;
                p.x += p.dx * p.speed * dtSeconds;
                p.y += p.dy * p.speed * dtSeconds;
                break;
                
            case 'boomerang':
                if (!p.returning && p.age >= p.returnTime) {
                    p.returning = true;
                }
                
                if (p.returning && p.owner) {
                    // Move toward owner
                    const dx = p.owner.x - p.x;
                    const dy = p.owner.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        p.dx = dx / dist;
                        p.dy = dy / dist;
                    }
                    
                    // Expire if reached owner
                    if (dist < 30) {
                        p.age = p.duration;
                    }
                }
                
                p.x += p.dx * p.speed * dtSeconds;
                p.y += p.dy * p.speed * dtSeconds;
                break;
                
            case 'bounce':
                p.x += p.dx * p.speed * dtSeconds;
                p.y += p.dy * p.speed * dtSeconds;
                
                // Bounce off map edges
                const mapWidth = this.game.mapWidth || 4000;
                const mapHeight = this.game.mapHeight || 4000;
                
                if (p.x < 0 || p.x > mapWidth) {
                    p.dx = -p.dx;
                    p.x = Math.max(0, Math.min(mapWidth, p.x));
                    p.bounceCount++;
                }
                if (p.y < 0 || p.y > mapHeight) {
                    p.dy = -p.dy;
                    p.y = Math.max(0, Math.min(mapHeight, p.y));
                    p.bounceCount++;
                }
                break;
                
            default: // linear
                p.x += p.dx * p.speed * dtSeconds;
                p.y += p.dy * p.speed * dtSeconds;
                break;
        }
    }
    
    /**
     * Update melee attack
     */
    updateMelee(p, dt) {
        // Melee attacks follow owner
        if (p.owner) {
            const offsetX = p.dx * (p.width / 2);
            p.x = p.owner.x + offsetX;
            p.y = p.owner.y;
        }
    }
    
    /**
     * Update ground effect
     */
    updateGround(p, dt) {
        if (!p.landed) {
            // Move to target
            if (p.targetX !== undefined && p.targetY !== undefined) {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < p.speed * (dt / 1000)) {
                    p.x = p.targetX;
                    p.y = p.targetY;
                    p.landed = true;
                } else {
                    p.x += (dx / dist) * p.speed * (dt / 1000);
                    p.y += (dy / dist) * p.speed * (dt / 1000);
                }
            } else {
                p.landed = true;
            }
        }
    }
    
    /**
     * Check collisions with enemies
     */
    checkEnemyCollisions(enemyManager) {
        for (const p of this.projectiles) {
            // Ground effects that haven't landed don't hit
            if (p.type === 'ground' && !p.landed) continue;
            
            // Check tick rate for ground effects
            if (p.tickRate > 0) {
                if (p.age - p.lastTick < p.tickRate) continue;
                p.lastTick = p.age;
                p.hitEnemies.clear(); // Reset hits for new tick
            }
            
            // Get nearby enemies
            const enemies = enemyManager.getEnemiesNear(p.x, p.y, Math.max(p.size, p.width, p.height) + 50);
            
            for (const enemy of enemies) {
                // Skip already hit enemies (for piercing projectiles)
                if (p.hitEnemies.has(enemy.id)) continue;
                
                // Check collision based on projectile shape
                let hit = false;
                
                if (p.width > 0 && p.height > 0) {
                    // Rectangle collision (melee)
                    hit = this.rectCircleCollision(
                        p.x - p.width / 2, p.y - p.height / 2,
                        p.width, p.height,
                        enemy.x, enemy.y, enemy.radius
                    );
                } else {
                    // Circle collision
                    const dx = p.x - enemy.x;
                    const dy = p.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    hit = dist < p.size + enemy.radius;
                }
                
                if (hit) {
                    // Deal damage
                    enemy.takeDamage(p.damage);
                    this.game.addDamageDealt(p.damage);
                    
                    // Apply knockback
                    const dx = enemy.x - p.x;
                    const dy = enemy.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const knockbackForce = p.knockback * (1 - enemy.knockbackResist);
                    enemy.applyKnockback(dx / dist * knockbackForce, dy / dist * knockbackForce);
                    
                    // Mark as hit
                    p.hitEnemies.add(enemy.id);
                    p.pierceCount++;
                    
                    // Call onHit callback
                    if (p.onHit) {
                        p.onHit(p, enemy);
                    }
                    
                    // Visual effect
                    this.game.particles.spawn(enemy.x, enemy.y, p.color, 5);
                    
                    // Check pierce limit
                    if (p.pierceCount >= p.pierce) {
                        if (p.onExpire) {
                            p.onExpire(p);
                        }
                        p.age = p.duration; // Expire
                        break;
                    }
                }
            }
        }
    }
    
    /**
     * Rectangle-circle collision
     */
    rectCircleCollision(rx, ry, rw, rh, cx, cy, cr) {
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) < (cr * cr);
    }
    
    /**
     * Render all projectiles
     */
    render(ctx) {
        for (const p of this.projectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (p.rotation) {
                ctx.rotate(p.rotation);
            }
            
            ctx.globalAlpha = p.type === 'ground' ? 0.6 : 1;
            ctx.fillStyle = p.color;
            
            switch (p.shape) {
                case 'knife':
                    this.renderKnife(ctx, p);
                    break;
                case 'whip':
                    this.renderWhip(ctx, p);
                    break;
                case 'axe':
                    this.renderAxe(ctx, p);
                    break;
                case 'cross':
                    this.renderCross(ctx, p);
                    break;
                case 'pool':
                    this.renderPool(ctx, p);
                    break;
                default:
                    // Circle
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Glow
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    renderKnife(ctx, p) {
        ctx.rotate(Math.atan2(p.dy, p.dx));
        ctx.beginPath();
        ctx.moveTo(p.size, 0);
        ctx.lineTo(-p.size / 2, -p.size / 3);
        ctx.lineTo(-p.size / 2, p.size / 3);
        ctx.closePath();
        ctx.fill();
    }
    
    renderWhip(ctx, p) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderAxe(ctx, p) {
        // Blade
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Handle
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-p.size / 4, -p.size * 0.3, p.size / 2, p.size * 0.6);
    }
    
    renderCross(ctx, p) {
        const s = p.size;
        ctx.beginPath();
        // Vertical bar
        ctx.moveTo(-s * 0.2, -s);
        ctx.lineTo(s * 0.2, -s);
        ctx.lineTo(s * 0.2, s);
        ctx.lineTo(-s * 0.2, s);
        ctx.closePath();
        ctx.fill();
        // Horizontal bar
        ctx.beginPath();
        ctx.moveTo(-s, -s * 0.2);
        ctx.lineTo(s, -s * 0.2);
        ctx.lineTo(s, s * 0.2);
        ctx.lineTo(-s, s * 0.2);
        ctx.closePath();
        ctx.fill();
    }
    
    renderPool(ctx, p) {
        if (!p.landed) {
            // Droplet falling
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Ground pool
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner highlight
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#93c5fd';
            ctx.beginPath();
            ctx.ellipse(0, -p.size * 0.1, p.size * 0.6, p.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Clear all projectiles
     */
    clear() {
        this.projectiles = [];
    }
}
