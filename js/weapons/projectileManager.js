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
            
            // Trail system for motion blur effects
            trail: [],
            trailLength: options.trailLength || 8,
            
            // Visual enhancement properties
            glowIntensity: options.glowIntensity || 1,
            pulseSpeed: options.pulseSpeed || 0,
            particleEmit: options.particleEmit || false,
            
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
        
        // Update trail for motion effects
        if (p.trail) {
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > p.trailLength) {
                p.trail.pop();
            }
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
                    
                    // Apply slow if present
                    if (p.slow) {
                        enemy.applySlow(p.slow, p.duration || 1000);
                    }
                    
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
            // Render trail first (behind projectile)
            if (p.trail && p.trail.length > 1 && p.type === 'projectile') {
                this.renderTrail(ctx, p);
            }
            
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
                case 'fireball':
                    this.renderFireball(ctx, p);
                    break;
                case 'ice':
                    this.renderIceSpear(ctx, p);
                    break;
                case 'bone':
                    this.renderBone(ctx, p);
                    break;
                case 'star':
                    this.renderStar(ctx, p);
                    break;
                case 'rune':
                    this.renderRune(ctx, p);
                    break;
                case 'lightning':
                    this.renderLightningBolt(ctx, p);
                    break;
                case 'dagger':
                    this.renderDagger(ctx, p);
                    break;
                case 'soul':
                    this.renderSoulOrb(ctx, p);
                    break;
                case 'magic':
                    this.renderMagicOrb(ctx, p);
                    break;
                case 'fire':
                    this.renderFireOrb(ctx, p);
                    break;
                case 'invisible':
                    break;
                default:
                    this.renderDefaultProjectile(ctx, p);
                    break;
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Render motion trail behind projectile
     */
    renderTrail(ctx, p) {
        if (!p.trail || p.trail.length < 2) return;
        
        ctx.save();
        for (let i = 1; i < p.trail.length; i++) {
            const point = p.trail[i];
            const alpha = (1 - i / p.trail.length) * 0.5;
            const size = p.size * (1 - i / p.trail.length) * 0.8;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    /**
     * Default projectile with enhanced glow
     */
    renderDefaultProjectile(ctx, p) {
        // Outer glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15 * p.glowIntensity;
        
        // Pulsing effect
        let sizeMod = 1;
        if (p.pulseSpeed > 0) {
            sizeMod = 1 + Math.sin(p.age * p.pulseSpeed / 100) * 0.2;
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, p.size * sizeMod, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5 * sizeMod, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderKnife(ctx, p) {
        ctx.rotate(Math.atan2(p.dy, p.dx));
        
        // Blade glow
        ctx.shadowColor = '#88ccff';
        ctx.shadowBlur = 8;
        
        // Main blade body - gradient for metallic look
        const bladeGradient = ctx.createLinearGradient(-p.size / 2, -p.size / 3, -p.size / 2, p.size / 3);
        bladeGradient.addColorStop(0, '#c0c0c0');
        bladeGradient.addColorStop(0.5, '#f8f8ff');
        bladeGradient.addColorStop(1, '#a0a0a0');
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(p.size * 1.5, 0); // Sharp tip
        ctx.lineTo(p.size * 0.3, -p.size / 3);
        ctx.lineTo(-p.size * 0.5, -p.size / 4);
        ctx.lineTo(-p.size * 0.5, p.size / 4);
        ctx.lineTo(p.size * 0.3, p.size / 3);
        ctx.closePath();
        ctx.fill();
        
        // Sharp edge highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.size * 1.5, 0);
        ctx.lineTo(-p.size * 0.5, -p.size / 4);
        ctx.stroke();
        
        // Handle
        ctx.shadowBlur = 0;
        const handleGradient = ctx.createLinearGradient(-p.size * 0.5, 0, -p.size * 0.9, 0);
        handleGradient.addColorStop(0, '#5c4d3d');
        handleGradient.addColorStop(0.5, '#3d3325');
        handleGradient.addColorStop(1, '#2d2520');
        
        ctx.fillStyle = handleGradient;
        ctx.fillRect(-p.size * 0.9, -p.size / 5, p.size * 0.4, p.size * 0.4);
        
        // Handle guard
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(-p.size * 0.55, -p.size / 4, 4, p.size / 2);
    }
    
    renderWhip(ctx, p) {
        const progress = Math.min(1, p.age / (p.duration * 0.5)); // Crack animation over first half
        const direction = p.dx > 0 ? 1 : -1;
        const snapProgress = Math.pow(progress, 0.5); // Fast snap
        
        const startX = -direction * p.width * 0.1;
        const endX = direction * p.width / 2;
        const tipY = Math.sin(progress * Math.PI) * p.height * 0.3;
        
        // Motion blur trail (draw multiple faded versions)
        for (let blur = 3; blur >= 0; blur--) {
            const blurOffset = blur * 5 * direction * (1 - progress);
            ctx.globalAlpha = blur === 0 ? 1 : 0.15;
            
            // Whip glow
            ctx.shadowColor = '#ff3300';
            ctx.shadowBlur = 20 - blur * 4;
            
            // Draw multi-segment curved whip
            ctx.strokeStyle = blur === 0 ? '#ff6600' : '#ff8800';
            ctx.lineWidth = (8 - blur * 1.5) + (1 - progress) * 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(startX * (1 - snapProgress) - blurOffset, 0);
            
            // Create S-curve with multiple control points for realistic whip
            const segments = 5;
            for (let s = 1; s <= segments; s++) {
                const t = s / segments;
                const prevT = (s - 1) / segments;
                
                const wave = Math.sin(t * Math.PI * 2 + progress * Math.PI * 4) * p.height * 0.25 * (1 - progress) * (1 - t * 0.5);
                const x = startX * (1 - snapProgress) + (endX * snapProgress - startX * (1 - snapProgress)) * t - blurOffset;
                const y = wave + tipY * t;
                
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        // Fiery glow along whip
        const glowGradient = ctx.createLinearGradient(startX, 0, endX * snapProgress, 0);
        glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
        glowGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0.6)');
        
        ctx.strokeStyle = glowGradient;
        ctx.lineWidth = 12 + (1 - progress) * 6;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(startX * (1 - snapProgress), 0);
        ctx.lineTo(endX * snapProgress, tipY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Whip tip with bright glow
        const tipGradient = ctx.createRadialGradient(
            endX * snapProgress, tipY, 0,
            endX * snapProgress, tipY, 12 + (1 - progress) * 8
        );
        tipGradient.addColorStop(0, '#ffffff');
        tipGradient.addColorStop(0.3, '#ffff00');
        tipGradient.addColorStop(0.7, '#ff6600');
        tipGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = tipGradient;
        ctx.beginPath();
        ctx.arc(endX * snapProgress, tipY, 12 + (1 - progress) * 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Impact ring when whip cracks (at peak)
        if (progress > 0.4 && progress < 0.8) {
            const ringProgress = (progress - 0.4) / 0.4;
            const ringRadius = 20 + ringProgress * 60;
            
            ctx.strokeStyle = `rgba(255, 200, 100, ${1 - ringProgress})`;
            ctx.lineWidth = 3 * (1 - ringProgress);
            ctx.beginPath();
            ctx.arc(endX * snapProgress, tipY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Second inner ring
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - ringProgress) * 0.8})`;
            ctx.lineWidth = 2 * (1 - ringProgress);
            ctx.beginPath();
            ctx.arc(endX * snapProgress, tipY, ringRadius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Dynamic sparks throughout animation
        if (progress > 0.3) {
            const sparkAlpha = progress < 0.8 ? 1 : (1 - progress) * 5;
            ctx.globalAlpha = sparkAlpha;
            
            for (let i = 0; i < 5; i++) {
                const sparkProgress = (progress + i * 0.05) % 1;
                const sparkX = endX * snapProgress + (Math.random() - 0.5) * 30 * progress;
                const sparkY = tipY + (Math.random() - 0.5) * 25;
                const sparkSize = 2 + Math.random() * 3;
                
                // Spark trail
                ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#ffff00';
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Spark streak
                ctx.strokeStyle = '#ff8800';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sparkX, sparkY);
                ctx.lineTo(sparkX - direction * 15 * Math.random(), sparkY + (Math.random() - 0.5) * 10);
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1;
    }
    
    renderAxe(ctx, p) {
        // Metallic blade glow
        ctx.shadowColor = '#888888';
        ctx.shadowBlur = 8;
        
        // Blade with metallic gradient
        const bladeGradient = ctx.createLinearGradient(-p.size / 2, 0, p.size, 0);
        bladeGradient.addColorStop(0, '#a0a0a0');
        bladeGradient.addColorStop(0.3, '#d0d0d0');
        bladeGradient.addColorStop(0.6, '#f0f0f0');
        bladeGradient.addColorStop(1, '#a0a0a0');
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.1);
        ctx.lineTo(p.size * 1.1, 0);
        ctx.lineTo(0, p.size * 1.1);
        ctx.lineTo(-p.size * 0.4, p.size * 0.3);
        ctx.lineTo(-p.size * 0.4, -p.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Blade edge highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.1);
        ctx.lineTo(p.size * 1.1, 0);
        ctx.lineTo(0, p.size * 1.1);
        ctx.stroke();
        
        // Wooden handle with grain
        ctx.shadowBlur = 0;
        const handleGradient = ctx.createLinearGradient(-p.size * 0.4, -p.size * 0.3, -p.size * 0.4, p.size * 0.3);
        handleGradient.addColorStop(0, '#8b4513');
        handleGradient.addColorStop(0.3, '#a0522d');
        handleGradient.addColorStop(0.5, '#8b4513');
        handleGradient.addColorStop(0.7, '#a0522d');
        handleGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = handleGradient;
        ctx.fillRect(-p.size * 0.55, -p.size * 0.25, p.size * 0.5, p.size * 0.5);
        
        // Handle binding
        ctx.fillStyle = '#4a352a';
        ctx.fillRect(-p.size * 0.4, -p.size * 0.2, 0.1 * p.size, p.size * 0.4);
    }
    
    renderCross(ctx, p) {
        const s = p.size;
        
        // Holy golden glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        
        // Golden gradient for cross
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        gradient.addColorStop(0, '#fff8dc');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#daa520');
        
        ctx.fillStyle = gradient;
        
        // Vertical bar with better proportions
        ctx.beginPath();
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
        
        // Center diamond ornament
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.3);
        ctx.lineTo(s * 0.3, 0);
        ctx.lineTo(0, s * 0.3);
        ctx.lineTo(-s * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    renderPool(ctx, p) {
        if (!p.landed) {
            // Droplet falling with trail
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            
            // Teardrop shape
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, -p.size / 2);
            ctx.quadraticCurveTo(p.size / 3, 0, 0, p.size / 2);
            ctx.quadraticCurveTo(-p.size / 3, 0, 0, -p.size / 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(-p.size / 8, -p.size / 6, p.size / 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Water pool glow
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            
            // Outer pool with gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
            gradient.addColorStop(0, 'rgba(147, 197, 253, 0.8)');
            gradient.addColorStop(0.6, 'rgba(96, 165, 250, 0.6)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Animated ripples
            const rippleProgress = (p.age % 500) / 500;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 2; i++) {
                const rp = (rippleProgress + i * 0.5) % 1;
                ctx.globalAlpha = (1 - rp) * 0.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * rp, p.size * 0.5 * rp, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Center highlight
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#dbeafe';
            ctx.beginPath();
            ctx.ellipse(p.size * 0.2, -p.size * 0.1, p.size * 0.4, p.size * 0.2, 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Fireball - flames with heat distortion effect
     */
    renderFireball(ctx, p) {
        ctx.rotate(Math.atan2(p.dy, p.dx));
        
        // Outer flame glow
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 20;
        
        // Main fireball body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#ffff00');
        gradient.addColorStop(0.6, '#ff6600');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Flame tendrils
        ctx.fillStyle = '#ff6600';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + p.age * 0.01;
            const flameSize = p.size * (0.4 + Math.sin(p.age * 0.02 + i) * 0.2);
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * p.size * 0.5, 
                Math.sin(angle) * p.size * 0.5, 
                flameSize, 
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    /**
     * Ice Spear - crystalline shard
     */
    renderIceSpear(ctx, p) {
        ctx.rotate(Math.atan2(p.dy, p.dx));
        
        // Ice glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        
        // Main crystal body
        ctx.fillStyle = '#00bfff';
        ctx.beginPath();
        ctx.moveTo(p.size * 1.5, 0);  // Sharp tip
        ctx.lineTo(p.size * 0.3, -p.size * 0.4);
        ctx.lineTo(-p.size * 0.5, -p.size * 0.3);
        ctx.lineTo(-p.size * 0.7, 0);
        ctx.lineTo(-p.size * 0.5, p.size * 0.3);
        ctx.lineTo(p.size * 0.3, p.size * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(p.size * 1.2, 0);
        ctx.lineTo(p.size * 0.2, -p.size * 0.2);
        ctx.lineTo(-p.size * 0.3, 0);
        ctx.lineTo(p.size * 0.2, p.size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Frost particles
        ctx.fillStyle = 'rgba(200, 240, 255, 0.6)';
        for (let i = 0; i < 3; i++) {
            const offset = (p.age * 0.005 + i * 0.3) % 1;
            ctx.globalAlpha = 1 - offset;
            ctx.beginPath();
            ctx.arc(-p.size * offset, (Math.random() - 0.5) * p.size, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Bone - spinning bone boomerang
     */
    renderBone(ctx, p) {
        // Bone color
        ctx.fillStyle = '#f5f5dc';
        ctx.shadowColor = '#d4c4a8';
        ctx.shadowBlur = 5;
        
        // Draw bone shape (two knobs connected by shaft)
        const s = p.size;
        
        // Left knob
        ctx.beginPath();
        ctx.arc(-s * 0.7, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Right knob
        ctx.beginPath();
        ctx.arc(s * 0.7, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Shaft
        ctx.fillRect(-s * 0.5, -s * 0.2, s, s * 0.4);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(-s * 0.4, -s * 0.1, s * 0.8, s * 0.15);
    }
    
    /**
     * Throwing Star - spinning shuriken
     */
    renderStar(ctx, p) {
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10;
        
        const s = p.size;
        const points = 4;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2;
            const radius = i % 2 === 0 ? s : s * 0.35;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Center circle
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Rune - glowing magical rune
     */
    renderRune(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        
        const s = p.size;
        
        // Outer ring
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner symbol (triangle pattern)
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * s * 0.6;
            const y = Math.sin(angle) * s * 0.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Core glow
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Lightning Bolt - electric strike
     */
    renderLightningBolt(ctx, p) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        
        const s = p.size;
        
        // Main bolt shape
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(-s * 0.2, -s * 0.1);
        ctx.lineTo(s * 0.2, s * 0.4);
        ctx.lineTo(-s * 0.1, s * 0.6);
        ctx.lineTo(0, s);
        ctx.stroke();
        
        // Electric arcs
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const startY = -s + (i + 1) * s * 0.5;
            ctx.beginPath();
            ctx.moveTo(0, startY);
            ctx.lineTo((Math.random() - 0.5) * s * 0.8, startY + s * 0.2);
            ctx.stroke();
        }
        
        // Center glow
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Shadow Dagger - dark, ethereal blade
     */
    renderDagger(ctx, p) {
        // Dark glow
        ctx.shadowColor = '#8b00ff';
        ctx.shadowBlur = 15;
        
        const s = p.size;
        
        // Blade
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, s * 0.2);
        ctx.lineTo(0, s * 0.4);
        ctx.lineTo(-s * 0.3, s * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Purple edge glow
        ctx.strokeStyle = '#8b00ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Handle
        ctx.fillStyle = '#2d0047';
        ctx.fillRect(-s * 0.15, s * 0.3, s * 0.3, s * 0.4);
        
        // Ethereal wisps
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#8b00ff';
        const wispAngle = p.age * 0.01;
        ctx.beginPath();
        ctx.arc(Math.cos(wispAngle) * s * 0.5, Math.sin(wispAngle) * s * 0.3, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Soul Orb - ghostly projectile with trailing essence
     */
    renderSoulOrb(ctx, p) {
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 20;
        
        const s = p.size;
        const pulse = 1 + Math.sin(p.age * 0.01) * 0.15;
        
        // Outer ethereal glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * pulse);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, s * pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#c4b5fd';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Magic Orb - sparkly magical projectile
     */
    renderMagicOrb(ctx, p) {
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 15;
        
        const s = p.size;
        const pulse = 1 + Math.sin(p.age * 0.015) * 0.1;
        
        // Main orb
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * pulse);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, '#c4b5fd');
        gradient.addColorStop(1, '#a78bfa');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, s * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkles
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + p.age * 0.008;
            const dist = s * 0.7;
            const sparkleSize = 2 + Math.sin(p.age * 0.02 + i) * 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Fire Orb - small fire chain projectile
     */
    renderFireOrb(ctx, p) {
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 12;
        
        const s = p.size;
        
        // Outer flame
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff3300');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        
        // Hot core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Flickering flames
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ff6600';
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + p.age * 0.015;
            const flicker = Math.sin(p.age * 0.03 + i * 2) * 0.3;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * s * (0.6 + flicker), Math.sin(angle) * s * (0.6 + flicker), s * 0.3, 0, Math.PI * 2);
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
