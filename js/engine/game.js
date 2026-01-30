/**
 * Core Game Engine
 * Handles game loop, state management, and entity coordination
 */

import { Input } from './input.js';
import { Camera } from './camera.js';
import { Player } from '../player/player.js';
import { EnemyManager } from '../enemies/enemyManager.js';
import { ProjectileManager } from '../weapons/projectileManager.js';
import { PickupManager } from '../pickups/pickupManager.js';
import { DamageNumbers } from '../effects/damageNumbers.js';
import { Particles } from '../effects/particles.js';
import { SaveManager } from '../meta/saveManager.js';
import { GAME_CONFIG } from '../data/config.js';

export const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_UP: 'levelUp',
    CHEST: 'chest',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.state = GameState.MENU;
        this.previousState = null;
        
        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 1000 / 60; // 60 FPS physics
        this.gameTime = 0; // In-game time in ms
        this.realTime = 0;
        
        // Stats
        this.killCount = 0;
        this.coinsCollected = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        
        // Systems
        this.input = new Input();
        this.camera = new Camera(this);
        this.damageNumbers = new DamageNumbers();
        this.particles = new Particles();
        
        // Entity managers
        this.enemyManager = null;
        this.projectileManager = null;
        this.pickupManager = null;
        
        // Player
        this.player = null;
        this.selectedCharacter = 'antonio';
        
        // Map size
        this.mapWidth = GAME_CONFIG.mapWidth;
        this.mapHeight = GAME_CONFIG.mapHeight;
        
        // Victory condition
        this.victoryTime = GAME_CONFIG.victoryTime; // 30 minutes
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        
        // Event callbacks
        this.onStateChange = null;
        this.onLevelUp = null;
        this.onPlayerDeath = null;
        this.onVictory = null;
        this.onChestOpen = null;
    }
    
    /**
     * Start a new game
     */
    startGame(characterId = 'antonio') {
        this.selectedCharacter = characterId;
        
        // Reset stats
        this.gameTime = 0;
        this.realTime = 0;
        this.killCount = 0;
        this.coinsCollected = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        
        // Create player
        this.player = new Player(this, characterId);
        this.player.x = this.mapWidth / 2;
        this.player.y = this.mapHeight / 2;
        
        // Create managers
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.pickupManager = new PickupManager(this);
        
        // Reset systems
        this.damageNumbers.clear();
        this.particles.clear();
        
        // Setup camera
        this.camera.follow(this.player);
        
        // Change state
        this.setState(GameState.PLAYING);
        
        // Start game loop
        this.lastTime = performance.now();
        this.accumulator = 0;
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Main game loop with fixed timestep
     */
    gameLoop(currentTime) {
        if (this.state === GameState.MENU) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Prevent spiral of death
        const clampedDelta = Math.min(deltaTime, 250);
        
        if (this.state === GameState.PLAYING) {
            this.accumulator += clampedDelta;
            
            // Fixed timestep updates
            while (this.accumulator >= this.fixedDeltaTime) {
                this.update(this.fixedDeltaTime);
                this.accumulator -= this.fixedDeltaTime;
            }
        }
        
        // Always update visual effects
        this.damageNumbers.update(deltaTime);
        this.particles.update(deltaTime);
        
        // Render
        this.render();
        
        // Continue loop if not in menu
        if (this.state !== GameState.MENU) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    /**
     * Fixed timestep update
     */
    update(dt) {
        this.gameTime += dt;
        this.realTime += dt;
        
        // Check victory condition
        if (this.gameTime >= this.victoryTime) {
            this.victory();
            return;
        }
        
        // Update player
        this.player.update(dt, this.input);
        
        // Update camera
        this.camera.update(dt);
        
        // Update managers
        this.enemyManager.update(dt);
        this.projectileManager.update(dt);
        this.pickupManager.update(dt);
        
        // Check collisions
        this.checkCollisions();
    }
    
    /**
     * Render the game
     */
    render() {
        const ctx = this.ctx;
        const cam = this.camera;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.save();
        
        // Apply camera transform
        ctx.translate(-cam.x + this.width / 2, -cam.y + this.height / 2);
        
        // Draw ground grid
        this.renderGround(ctx);
        
        // Draw pickups
        this.pickupManager?.render(ctx);
        
        // Draw enemies
        this.enemyManager?.render(ctx);
        
        // Draw player
        this.player?.render(ctx);
        
        // Draw projectiles
        this.projectileManager?.render(ctx);
        
        // Draw effects
        this.particles.render(ctx);
        this.damageNumbers.render(ctx);
        
        ctx.restore();
        
        // Draw map boundary warning
        this.renderBoundaryWarning(ctx);
    }
    
    /**
     * Render ground tiles/grid
     */
    renderGround(ctx) {
        const tileSize = 64;
        const cam = this.camera;
        
        const startX = Math.floor((cam.x - this.width / 2) / tileSize) * tileSize;
        const startY = Math.floor((cam.y - this.height / 2) / tileSize) * tileSize;
        const endX = startX + this.width + tileSize * 2;
        const endY = startY + this.height + tileSize * 2;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                // Only draw within map bounds
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    ctx.strokeRect(x, y, tileSize, tileSize);
                }
            }
        }
        
        // Draw map boundary
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, this.mapWidth, this.mapHeight);
    }
    
    /**
     * Render boundary warning when player is near edge
     */
    renderBoundaryWarning(ctx) {
        if (!this.player) return;
        
        const margin = 200;
        const warningAlpha = 0.3;
        
        ctx.save();
        
        if (this.player.x < margin) {
            const grad = ctx.createLinearGradient(0, 0, 100, 0);
            grad.addColorStop(0, `rgba(255, 0, 0, ${warningAlpha})`);
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 100, this.height);
        }
        
        if (this.player.x > this.mapWidth - margin) {
            const grad = ctx.createLinearGradient(this.width, 0, this.width - 100, 0);
            grad.addColorStop(0, `rgba(255, 0, 0, ${warningAlpha})`);
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(this.width - 100, 0, 100, this.height);
        }
        
        if (this.player.y < margin) {
            const grad = ctx.createLinearGradient(0, 0, 0, 100);
            grad.addColorStop(0, `rgba(255, 0, 0, ${warningAlpha})`);
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, 100);
        }
        
        if (this.player.y > this.mapHeight - margin) {
            const grad = ctx.createLinearGradient(0, this.height, 0, this.height - 100);
            grad.addColorStop(0, `rgba(255, 0, 0, ${warningAlpha})`);
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, this.height - 100, this.width, 100);
        }
        
        ctx.restore();
    }
    
    /**
     * Check all collisions
     */
    checkCollisions() {
        // Player vs Enemies
        const enemies = this.enemyManager.getEnemiesNear(this.player.x, this.player.y, this.player.radius + 50);
        for (const enemy of enemies) {
            if (this.circleCollision(this.player, enemy)) {
                this.player.takeDamage(enemy.damage);
            }
        }
        
        // Projectiles vs Enemies
        this.projectileManager.checkEnemyCollisions(this.enemyManager);
        
        // Player vs Pickups
        this.pickupManager.checkPlayerCollision(this.player);
    }
    
    /**
     * Circle collision detection
     */
    circleCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < a.radius + b.radius;
    }
    
    /**
     * Set game state
     */
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
        
        if (this.onStateChange) {
            this.onStateChange(newState, this.previousState);
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (this.state === GameState.PLAYING) {
            this.setState(GameState.PAUSED);
        }
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.state === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
            this.lastTime = performance.now();
        }
    }
    
    /**
     * Trigger level up
     */
    triggerLevelUp() {
        this.setState(GameState.LEVEL_UP);
        if (this.onLevelUp) {
            this.onLevelUp(this.player.level);
        }
    }
    
    /**
     * Handle upgrade selection
     */
    selectUpgrade(upgrade) {
        this.player.applyUpgrade(upgrade);
        this.setState(GameState.PLAYING);
        this.lastTime = performance.now();
    }
    
    /**
     * Open chest
     */
    openChest(contents) {
        this.setState(GameState.CHEST);
        if (this.onChestOpen) {
            this.onChestOpen(contents);
        }
    }
    
    /**
     * Close chest and continue
     */
    closeChest() {
        this.setState(GameState.PLAYING);
        this.lastTime = performance.now();
    }
    
    /**
     * Handle player death
     */
    gameOver() {
        this.setState(GameState.GAME_OVER);
        
        // Save stats
        SaveManager.addCoins(this.coinsCollected);
        SaveManager.updateStats({
            totalKills: this.killCount,
            totalDamageDealt: this.damageDealt,
            totalDamageTaken: this.damageTaken,
            gamesPlayed: 1,
            totalPlayTime: this.gameTime,
            highestLevel: this.player.level,
            longestSurvival: this.gameTime
        });
        
        // Check character unlocks
        SaveManager.checkUnlocks(this.gameTime, this.killCount);
        
        if (this.onPlayerDeath) {
            this.onPlayerDeath(this.getEndGameStats());
        }
    }
    
    /**
     * Handle victory
     */
    victory() {
        this.setState(GameState.VICTORY);
        
        // Bonus coins for victory
        const victoryCoinBonus = 500;
        this.coinsCollected += victoryCoinBonus;
        
        // Save stats
        SaveManager.addCoins(this.coinsCollected);
        SaveManager.updateStats({
            totalKills: this.killCount,
            totalDamageDealt: this.damageDealt,
            totalDamageTaken: this.damageTaken,
            gamesPlayed: 1,
            victories: 1,
            totalPlayTime: this.gameTime,
            highestLevel: this.player.level,
            longestSurvival: this.gameTime
        });
        
        // Check character unlocks
        SaveManager.checkUnlocks(this.gameTime, this.killCount);
        
        if (this.onVictory) {
            this.onVictory(this.getEndGameStats());
        }
    }
    
    /**
     * Get end game statistics
     */
    getEndGameStats() {
        return {
            time: this.gameTime,
            level: this.player.level,
            kills: this.killCount,
            coins: this.coinsCollected,
            damageDealt: this.damageDealt,
            damageTaken: this.damageTaken,
            weapons: this.player.weapons.map(w => ({ name: w.name, level: w.level })),
            passives: this.player.passives.map(p => ({ name: p.name, level: p.level }))
        };
    }
    
    /**
     * Quit to menu
     */
    quitToMenu() {
        // Save any progress
        if (this.state !== GameState.MENU) {
            SaveManager.addCoins(this.coinsCollected);
        }
        
        this.setState(GameState.MENU);
        this.player = null;
        this.enemyManager = null;
        this.projectileManager = null;
        this.pickupManager = null;
    }
    
    /**
     * Resize handler
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * Add kill
     */
    addKill() {
        this.killCount++;
    }
    
    /**
     * Add coins
     */
    addCoins(amount) {
        this.coinsCollected += amount;
    }
    
    /**
     * Add damage stat
     */
    addDamageDealt(amount) {
        this.damageDealt += amount;
    }
    
    /**
     * Add damage taken stat
     */
    addDamageTaken(amount) {
        this.damageTaken += amount;
    }
    
    /**
     * Get formatted game time
     */
    getFormattedTime() {
        const totalSeconds = Math.floor(this.gameTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Get difficulty multiplier based on time
     */
    getDifficultyMultiplier() {
        const minutes = this.gameTime / 60000;
        return 1 + (minutes * GAME_CONFIG.difficultyScaling);
    }
}
