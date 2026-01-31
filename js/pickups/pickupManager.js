/**
 * Pickup Manager
 * Handles XP gems, coins, health items, and chests
 */

import { AssetLoader } from '../engine/assets.js';
import { GAME_CONFIG } from '../data/config.js';

let pickupIdCounter = 0;

export class PickupManager {
    constructor(game) {
        this.game = game;
        this.pickups = [];
        this.magnetSpeed = GAME_CONFIG.pickups.xpMagnetSpeed;
    }
    
    /**
     * Spawn a new pickup
     */
    spawn(options) {
        const pickup = {
            id: ++pickupIdCounter,
            type: options.type,
            subType: options.subType || null,
            value: options.value || 1,
            x: options.x,
            y: options.y,
            collected: false,
            magnetized: false,
            
            // Size based on type
            radius: this.getPickupRadius(options.type, options.subType),
            
            // Animation
            animTime: Math.random() * 1000,
            bobOffset: Math.random() * Math.PI * 2,
        };
        
        this.pickups.push(pickup);
        return pickup;
    }
    
    /**
     * Get pickup radius based on type
     */
    getPickupRadius(type, subType) {
        switch (type) {
            case 'xp':
                switch (subType) {
                    case 'huge': return 12;
                    case 'large': return 10;
                    case 'medium': return 8;
                    default: return 6;
                }
            case 'coin': return 8;
            case 'chicken': return 10;
            case 'chest': return 14;
            case 'magnet': return 10;
            case 'rosary': return 10;
            default: return 8;
        }
    }
    
    /**
     * Update all pickups
     */
    update(dt) {
        const toRemove = [];
        
        for (let i = 0; i < this.pickups.length; i++) {
            const pickup = this.pickups[i];
            
            if (pickup.collected) {
                toRemove.push(i);
                continue;
            }
            
            pickup.animTime += dt;
            
            // Magnetized pickups move toward player
            if (pickup.magnetized && this.game.player) {
                const dx = this.game.player.x - pickup.x;
                const dy = this.game.player.y - pickup.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const speed = this.magnetSpeed * (dt / 1000);
                    pickup.x += (dx / dist) * speed;
                    pickup.y += (dy / dist) * speed;
                }
            }
        }
        
        // Remove collected pickups
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.pickups.splice(toRemove[i], 1);
        }
    }
    
    /**
     * Check player collision with pickups
     */
    checkPlayerCollision(player) {
        if (!player) return;
        
        const magnetRadius = player.magnetRadius;
        const collectRadius = player.radius + 10;
        
        for (const pickup of this.pickups) {
            if (pickup.collected) continue;
            
            const dx = pickup.x - player.x;
            const dy = pickup.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Check magnet range (XP only)
            if (!pickup.magnetized && pickup.type === 'xp' && dist <= magnetRadius) {
                pickup.magnetized = true;
            }
            
            // Check collection
            if (dist <= collectRadius + pickup.radius) {
                this.collectPickup(pickup, player);
            }
        }
    }
    
    /**
     * Collect a pickup
     */
    collectPickup(pickup, player) {
        pickup.collected = true;
        
        switch (pickup.type) {
            case 'xp':
                player.addXp(pickup.value);
                this.game.particles.spawn(pickup.x, pickup.y, '#22c55e', 5);
                break;
                
            case 'coin':
                const coinValue = Math.ceil(pickup.value * (player.baseGreed || 1));
                this.game.addCoins(coinValue);
                this.game.particles.spawn(pickup.x, pickup.y, '#fbbf24', 5);
                break;
                
            case 'chicken':
                player.heal(pickup.value);
                this.game.particles.spawn(pickup.x, pickup.y, '#f97316', 8);
                break;
                
            case 'chest':
                this.openChest();
                this.game.particles.burst(pickup.x, pickup.y, '#fbbf24', 20);
                break;
                
            case 'magnet':
                this.magnetizeAllXp();
                this.game.particles?.burst(pickup.x, pickup.y, '#ef4444', 30);
                this.game.particles?.burst(player.x, player.y, '#22c55e', 20);
                break;
                
            case 'rosary':
                this.game.enemyManager?.killAllOnScreen();
                this.game.particles.burst(player.x, player.y, '#ffffff', 50);
                break;
        }
    }
    
    /**
     * Open a treasure chest
     */
    openChest() {
        const player = this.game.player;
        if (!player) return;
        
        // Get random upgrade options
        const options = player.getUpgradeOptions(1);
        
        if (options.length > 0) {
            const reward = options[0];
            // Do NOT apply yet - wait for player choice in Chest UI
            // player.applyUpgrade(reward);
            
            // Show chest screen
            this.game.openChest(reward);
        } else {
            // Give coins if no upgrades available
            this.game.addCoins(50);
        }
    }
    
    /**
     * Magnetize all XP on screen
     */
    magnetizeAllXp() {
        for (const pickup of this.pickups) {
            if (pickup.type === 'xp' && !pickup.collected) {
                pickup.magnetized = true;
            }
        }
    }
    
    /**
     * Collect all pickups (vacuum effect)
     */
    collectAll() {
        for (const pickup of this.pickups) {
            pickup.magnetized = true;
        }
    }
    
    /**
     * Render all pickups
     */
    render(ctx) {
        for (const pickup of this.pickups) {
            if (pickup.collected) continue;
            
            // Skip if off-screen
            if (!this.game.camera.isVisible(pickup.x, pickup.y, 20)) continue;
            
            ctx.save();
            
            // Bob animation
            const bob = Math.sin(pickup.animTime / 300 + pickup.bobOffset) * 3;
            ctx.translate(pickup.x, pickup.y + bob);
            
            // Magnetized glow
            if (pickup.magnetized) {
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(0, 0, pickup.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            // Draw based on type
            switch (pickup.type) {
                case 'xp':
                    this.renderXpGem(ctx, pickup);
                    break;
                case 'coin':
                    this.renderCoin(ctx, pickup);
                    break;
                case 'chicken':
                    this.renderChicken(ctx, pickup);
                    break;
                case 'chest':
                    this.renderChest(ctx, pickup);
                    break;
                case 'magnet':
                    this.renderMagnet(ctx, pickup);
                    break;
                default:
                    // Fallback circle
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
                    ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    renderXpGem(ctx, pickup) {
        const sprite = AssetLoader.getImage('xp_' + (pickup.subType || 'small'));
        
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            // Fallback diamond
            const colors = {
                small: '#22c55e',
                medium: '#16a34a',
                large: '#15803d',
                huge: '#14532d',
            };
            
            ctx.fillStyle = colors[pickup.subType] || colors.small;
            ctx.beginPath();
            ctx.moveTo(0, -pickup.radius);
            ctx.lineTo(pickup.radius, 0);
            ctx.lineTo(0, pickup.radius);
            ctx.lineTo(-pickup.radius, 0);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    renderCoin(ctx, pickup) {
        const sprite = AssetLoader.getImage('coin');
        
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(0, 0, pickup.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderChicken(ctx, pickup) {
        const sprite = AssetLoader.getImage('chicken');
        
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            // Drumstick shape
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.ellipse(3, 0, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(-5, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderChest(ctx, pickup) {
        const sprite = AssetLoader.getImage('chest');
        
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            // Chest
            ctx.fillStyle = '#92400e';
            ctx.fillRect(-12, 0, 24, 12);
            
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(0, -10);
            ctx.lineTo(12, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Sparkle
        ctx.fillStyle = '#fbbf24';
        ctx.globalAlpha = 0.6 + Math.sin(pickup.animTime / 200) * 0.4;
        ctx.beginPath();
        ctx.arc(8, -8, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderMagnet(ctx, pickup) {
        const sprite = AssetLoader.getImage('magnet');
        
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, pickup.radius, Math.PI, 0, true);
            ctx.stroke();
        }
    }
    
    /**
     * Clear all pickups
     */
    clear() {
        this.pickups = [];
    }
    
    /**
     * Get pickup count
     */
    getCount() {
        return this.pickups.length;
    }
}
