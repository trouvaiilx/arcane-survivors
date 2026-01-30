/**
 * Enemy Manager
 * Handles enemy spawning, updating, and spatial queries
 */

import { ENEMIES, GAME_CONFIG } from '../data/config.js';
import { AssetLoader } from '../engine/assets.js';

let enemyIdCounter = 0;

export class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.bossSpawnIndex = 0;
        
        // Spawn settings
        this.baseSpawnInterval = GAME_CONFIG.spawning.baseSpawnInterval;
        this.spawnDistance = GAME_CONFIG.spawning.spawnDistance;
        this.maxEnemies = GAME_CONFIG.spawning.maxEnemies;
        
        // Spatial hash for efficient queries
        this.cellSize = 100;
        this.spatialHash = new Map();
    }
    
    /**
     * Update enemy manager
     */
    update(dt) {
        const difficulty = this.game.getDifficultyMultiplier();
        
        // Spawn enemies
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
            this.spawnWave(difficulty);
            
            // Dynamic spawn rate
            const spawnInterval = Math.max(
                GAME_CONFIG.spawning.minSpawnInterval,
                this.baseSpawnInterval / difficulty
            );
            this.spawnTimer = spawnInterval;
        }
        
        // Check boss spawns
        this.checkBossSpawn();
        
        // Update enemies
        this.spatialHash.clear();
        const toRemove = [];
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            if (enemy.dead) {
                toRemove.push(i);
                continue;
            }
            
            enemy.update(dt, this.game.player);
            this.addToSpatialHash(enemy);
        }
        
        // Remove dead enemies
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.enemies.splice(toRemove[i], 1);
        }
    }
    
    /**
     * Spawn a wave of enemies
     */
    spawnWave(difficulty) {
        const minutes = this.game.gameTime / 60000;
        
        // Determine enemy types based on time
        const availableTypes = this.getAvailableEnemyTypes(minutes);
        
        // Spawn count increases with difficulty
        const baseCount = 3;
        const count = Math.floor(baseCount + difficulty * 2);
        
        for (let i = 0; i < count; i++) {
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            this.spawnEnemy(type, difficulty);
        }
    }
    
    /**
     * Get enemy types available at current time
     */
    getAvailableEnemyTypes(minutes) {
        const types = ['zombie'];
        
        if (minutes >= 1) types.push('bat');
        if (minutes >= 3) types.push('skeleton');
        if (minutes >= 5) types.push('ghost');
        if (minutes >= 8) types.push('golem');
        
        return types;
    }
    
    /**
     * Spawn a single enemy
     */
    spawnEnemy(type, difficulty = 1) {
        const data = ENEMIES[type];
        if (!data) return null;
        
        const player = this.game.player;
        if (!player) return null;
        
        // Spawn at random position around player
        const angle = Math.random() * Math.PI * 2;
        const distance = this.spawnDistance + Math.random() * 100;
        
        let x = player.x + Math.cos(angle) * distance;
        let y = player.y + Math.sin(angle) * distance;
        
        // Clamp to map bounds
        x = Math.max(50, Math.min(this.game.mapWidth - 50, x));
        y = Math.max(50, Math.min(this.game.mapHeight - 50, y));
        
        const enemy = {
            id: ++enemyIdCounter,
            type: type,
            x: x,
            y: y,
            radius: data.radius,
            
            // Stats scaled by difficulty
            maxHp: data.hp * difficulty,
            hp: data.hp * difficulty,
            damage: data.damage * Math.sqrt(difficulty),
            speed: data.speed,
            xp: data.xp,
            
            // Behavior
            knockbackResist: data.knockbackResist || 0,
            erratic: data.erratic || false,
            phase: data.phase || false,
            resurrect: data.resurrect || false,
            resurrected: false,
            isBoss: data.isBoss || false,
            
            // State
            dead: false,
            knockbackX: 0,
            knockbackY: 0,
            
            // Animation
            animTime: Math.random() * 1000,
            sprite: AssetLoader.getImage(data.sprite),
        };
        
        // Add methods
        enemy.update = (dt, player) => this.updateEnemy(enemy, dt, player);
        enemy.takeDamage = (amount) => this.damageEnemy(enemy, amount);
        enemy.applyKnockback = (kx, ky) => {
            enemy.knockbackX += kx;
            enemy.knockbackY += ky;
        };
        
        this.enemies.push(enemy);
        this.addToSpatialHash(enemy);
        
        return enemy;
    }
    
    /**
     * Check and spawn bosses
     */
    checkBossSpawn() {
        const bossSpawnTimes = GAME_CONFIG.spawning.bossSpawnTimes;
        
        while (
            this.bossSpawnIndex < bossSpawnTimes.length &&
            this.game.gameTime >= bossSpawnTimes[this.bossSpawnIndex]
        ) {
            this.spawnBoss();
            this.bossSpawnIndex++;
        }
    }
    
    /**
     * Spawn a boss enemy
     */
    spawnBoss() {
        const difficulty = this.game.getDifficultyMultiplier();
        const boss = this.spawnEnemy('boss', difficulty * 1.5);
        
        if (boss) {
            // Screen shake
            this.game.camera.shake(15, 500);
            
            // Visual effect
            this.game.particles.burst(boss.x, boss.y, '#dc2626', 50);
        }
    }
    
    /**
     * Update a single enemy
     */
    updateEnemy(enemy, dt, player) {
        if (!player || enemy.dead) return;
        
        const dtSeconds = dt / 1000;
        enemy.animTime += dt;
        
        // Calculate direction to player
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }
        
        // Erratic movement (bats)
        if (enemy.erratic) {
            dx += (Math.random() - 0.5) * 0.5;
            dy += (Math.random() - 0.5) * 0.5;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                dx /= len;
                dy /= len;
            }
        }
        
        // Apply movement
        enemy.x += dx * enemy.speed * dtSeconds;
        enemy.y += dy * enemy.speed * dtSeconds;
        
        // Apply knockback
        if (enemy.knockbackX !== 0 || enemy.knockbackY !== 0) {
            enemy.x += enemy.knockbackX;
            enemy.y += enemy.knockbackY;
            
            // Decay knockback
            enemy.knockbackX *= 0.85;
            enemy.knockbackY *= 0.85;
            
            if (Math.abs(enemy.knockbackX) < 0.1) enemy.knockbackX = 0;
            if (Math.abs(enemy.knockbackY) < 0.1) enemy.knockbackY = 0;
        }
        
        // Clamp to map bounds
        enemy.x = Math.max(enemy.radius, Math.min(this.game.mapWidth - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(this.game.mapHeight - enemy.radius, enemy.y));
    }
    
    /**
     * Damage an enemy
     */
    damageEnemy(enemy, amount) {
        if (enemy.dead) return;
        
        enemy.hp -= amount;
        
        // Damage number
        this.game.damageNumbers.add(
            enemy.x + (Math.random() - 0.5) * 20,
            enemy.y - 10,
            Math.floor(amount),
            enemy.isBoss ? '#fbbf24' : '#ffffff'
        );
        
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }
    
    /**
     * Kill an enemy
     */
    killEnemy(enemy) {
        // Check resurrect
        if (enemy.resurrect && !enemy.resurrected) {
            enemy.hp = enemy.maxHp / 2;
            enemy.resurrected = true;
            this.game.particles.burst(enemy.x, enemy.y, '#d1d5db', 10);
            return;
        }
        
        enemy.dead = true;
        this.game.addKill();
        
        // Drop XP
        this.dropXp(enemy);
        
        // Random drops
        this.checkDrops(enemy);
        
        // Death effect
        this.game.particles.burst(
            enemy.x, 
            enemy.y, 
            enemy.isBoss ? '#dc2626' : '#4a5568',
            enemy.isBoss ? 30 : 10
        );
    }
    
    /**
     * Drop XP gems
     */
    dropXp(enemy) {
        let xpValue = enemy.xp;
        
        while (xpValue > 0) {
            let gemType, gemValue;
            
            if (xpValue >= 25) {
                gemType = 'huge';
                gemValue = 25;
            } else if (xpValue >= 10) {
                gemType = 'large';
                gemValue = 10;
            } else if (xpValue >= 5) {
                gemType = 'medium';
                gemValue = 5;
            } else {
                gemType = 'small';
                gemValue = 1;
            }
            
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            this.game.pickupManager?.spawn({
                type: 'xp',
                subType: gemType,
                value: gemValue,
                x: enemy.x + offsetX,
                y: enemy.y + offsetY,
            });
            
            xpValue -= gemValue;
        }
    }
    
    /**
     * Check for random drops
     */
    checkDrops(enemy) {
        const luck = this.game.player?.luck || 1;
        
        // Coin drop
        if (Math.random() < GAME_CONFIG.pickups.coinDropChance * luck) {
            this.game.pickupManager?.spawn({
                type: 'coin',
                value: enemy.isBoss ? 50 : Math.ceil(Math.random() * 5),
                x: enemy.x,
                y: enemy.y,
            });
        }
        
        // Chicken (heal) drop
        if (Math.random() < GAME_CONFIG.pickups.chickenDropChance * luck) {
            this.game.pickupManager?.spawn({
                type: 'chicken',
                value: 30,
                x: enemy.x,
                y: enemy.y,
            });
        }
        
        // Chest drop (bosses always, rare for others)
        if (enemy.isBoss || Math.random() < GAME_CONFIG.pickups.chestDropChance * luck) {
            this.game.pickupManager?.spawn({
                type: 'chest',
                x: enemy.x,
                y: enemy.y,
            });
        }
    }
    
    /**
     * Add enemy to spatial hash
     */
    addToSpatialHash(enemy) {
        const cellX = Math.floor(enemy.x / this.cellSize);
        const cellY = Math.floor(enemy.y / this.cellSize);
        const key = `${cellX},${cellY}`;
        
        if (!this.spatialHash.has(key)) {
            this.spatialHash.set(key, []);
        }
        this.spatialHash.get(key).push(enemy);
    }
    
    /**
     * Get enemies near a point
     */
    getEnemiesNear(x, y, radius) {
        const nearby = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);
        
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCellX + dx},${centerCellY + dy}`;
                const cell = this.spatialHash.get(key);
                
                if (cell) {
                    for (const enemy of cell) {
                        if (enemy.dead) continue;
                        
                        const ex = enemy.x - x;
                        const ey = enemy.y - y;
                        if (ex * ex + ey * ey <= radius * radius) {
                            nearby.push(enemy);
                        }
                    }
                }
            }
        }
        
        return nearby;
    }
    
    /**
     * Get nearest enemy to point
     */
    getNearestEnemy(x, y) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = dx * dx + dy * dy;
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }
    
    /**
     * Get random enemy in range
     */
    getRandomEnemyInRange(x, y, range) {
        const nearby = this.getEnemiesNear(x, y, range);
        if (nearby.length === 0) return null;
        return nearby[Math.floor(Math.random() * nearby.length)];
    }
    
    /**
     * Render all enemies
     */
    render(ctx) {
        for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            
            // Skip if off-screen
            if (!this.game.camera.isVisible(enemy.x, enemy.y, 50)) continue;
            
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            
            // Boss glow
            if (enemy.isBoss) {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(0, 0, enemy.radius * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            // Ghost transparency
            if (enemy.phase) {
                ctx.globalAlpha = 0.7;
            }
            
            // Draw sprite or fallback
            if (enemy.sprite) {
                ctx.drawImage(
                    enemy.sprite,
                    -enemy.sprite.width / 2,
                    -enemy.sprite.height / 2
                );
            } else {
                // Fallback circle
                ctx.fillStyle = enemy.isBoss ? '#dc2626' : '#4a5568';
                ctx.beginPath();
                ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Health bar for damaged enemies and bosses
            if (enemy.hp < enemy.maxHp || enemy.isBoss) {
                const barWidth = enemy.radius * 2;
                const barHeight = 4;
                const barY = enemy.radius + 5;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
                
                // Health
                const healthPercent = enemy.hp / enemy.maxHp;
                ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : 
                               healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
                ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Get enemy count
     */
    getCount() {
        return this.enemies.length;
    }
    
    /**
     * Kill all enemies on screen
     */
    killAllOnScreen() {
        for (const enemy of this.enemies) {
            if (!enemy.dead && this.game.camera.isVisible(enemy.x, enemy.y)) {
                this.killEnemy(enemy);
            }
        }
    }
}
