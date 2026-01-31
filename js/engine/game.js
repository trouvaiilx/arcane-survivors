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
import { Minimap } from '../ui/minimap.js';
import { Portal } from '../entities/portal.js';
import { GAME_CONFIG, BOSSES, MINI_BOSSES } from '../data/config.js';

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
        
        // Boss and portal system
        this.currentBoss = null;
        this.bossDefeated = false;
        this.portal = null; // Portal spark or constructed portal
        this.portalSparkTouched = false;
        this.minimap = null;
        
        // Difficulty scaling (only after boss defeated)
        this.difficultyTier = 0;
        this.lastDifficultyScaleTime = 0;
        this.goldMultiplier = 1;
        this.temporaryLuckBonus = 0; // Temporary luck from mini-boss kill
        
        // Mini-boss tracking
        this.lastMiniBossTime = 0;
        this.miniBossCount = 0;
        
        // Countdown timer (15 minutes)
        this.countdownTime = GAME_CONFIG.bossSpawnTime;
        
        // Game start animation
        this.fadeInProgress = 0;
        this.startupMessageShown = false;
        this.timeWarningShown = false;
        
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
        
        // Reset boss/portal state
        this.currentBoss = null;
        this.bossDefeated = false;
        this.portalSparkTouched = false;
        this.sparkSpawned = false;
        this.difficultyTier = 0;
        this.lastDifficultyScaleTime = 0;
        this.goldMultiplier = 1;
        this.lastMiniBossTime = 0;
        this.miniBossCount = 0;
        this.fadeInProgress = 0;
        this.startupMessageShown = false;
        this.timeWarningShown = false;
        
        // Create player
        this.player = new Player(this, characterId);
        this.player.x = this.mapWidth / 2;
        this.player.y = this.mapHeight / 2;
        
        // Create managers
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.pickupManager = new PickupManager(this);
        
        // Create minimap
        this.minimap = new Minimap(this);
        
        // Reset systems
        this.damageNumbers.clear();
        this.particles.clear();
        
        // Setup camera
        this.camera.follow(this.player);
        
        // Change state
        this.setState(GameState.PLAYING);
        
        // Show startup message after fade
        setTimeout(() => {
            this.showStartupMessage();
        }, 500);
        
        // Start game loop
        this.lastTime = performance.now();
        this.accumulator = 0;
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Spawn portal spark at random location
     */
    spawnPortalSpark() {
        const margin = 500;
        const x = margin + Math.random() * (this.mapWidth - margin * 2);
        const y = margin + Math.random() * (this.mapHeight - margin * 2);
        
        this.portal = new Portal(this, x, y, 'spark');
    }
    
    /**
     * Handle player touching the portal spark
     */
    onSparkTouched(sparkX, sparkY) {
        this.portalSparkTouched = true;
        this.portal = null;
        
        // Spawn boss near the player
        this.spawnBoss();
        
        // Show warning
        this.showBossWarning();
    }
    
    /**
     * Show startup message
     */
    showStartupMessage() {
        if (this.startupMessageShown) return;
        this.startupMessageShown = true;
        
        const overlay = document.getElementById('startup-overlay');
        if (overlay) {
            // overlay.classList.remove('hidden');
            // setTimeout(() => {
            //     overlay.classList.add('hidden');
            // }, 3500);
            
            if (this.ui) {
                this.ui.toggleScreen(overlay, true);
                setTimeout(() => {
                    this.ui.toggleScreen(overlay, false);
                }, 3500);
            }
        }
    }
    
    /**
     * Show boss incoming warning
     */
    showBossWarning() {
        const warning = document.getElementById('boss-warning');
        if (warning) {
            if (this.ui) {
                this.ui.toggleScreen(warning, true);
                setTimeout(() => {
                    this.ui.toggleScreen(warning, false);
                }, 2000);
            }
        }
    }

    /**
     * Show spark spawned notification
     */
    showSparkSpawnedMessage() {
        const overlay = document.getElementById('spark-notification');
        if (overlay) {
            if (this.ui) {
                this.ui.toggleScreen(overlay, true);
                setTimeout(() => {
                    this.ui.toggleScreen(overlay, false);
                }, 4000);
            }
        }
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
        
        // Update fade-in progress
        if (this.fadeInProgress < 1) {
            this.fadeInProgress += dt / 1000; // 1 second fade
        }
        
        // Check for mini-boss spawn at 10:00 and 5:00 countdown (before player touches spark)
        if (!this.portalSparkTouched && !this.currentBoss) {
            const countdownMs = GAME_CONFIG.bossSpawnTime - this.gameTime;
            
            // Spawn mini-boss at 10:00 remaining (600000ms) and 5:00 remaining (300000ms)
            // Use a 1-second window to catch the spawn
            if (this.miniBossCount === 0 && countdownMs <= 600000 && countdownMs > 599000) {
                this.spawnMiniBoss();
            } else if (this.miniBossCount === 1 && countdownMs <= 300000 && countdownMs > 299000) {
                this.spawnMiniBoss();
            }
        }
        
        // Difficulty scaling tracking
        // At countdown 0:00 (game time = 15 min), start showing warnings if boss is defeated
        // or every 3 minutes after that
        const countdownTime = GAME_CONFIG.bossSpawnTime - this.gameTime;
        
        // Check for portal spark spawn at 15 minutes
        if (countdownTime <= 0 && !this.sparkSpawned && !this.portal && !this.portalSparkTouched && !this.currentBoss) {
            this.spawnPortalSpark();
            this.sparkSpawned = true;
            this.showSparkSpawnedMessage();
        }
        
        // Check if countdown just hit zero or went negative - difficulty scaling every 3 minutes
        if (countdownTime <= 0) {
            const timeAfterZero = Math.abs(countdownTime);
            const scaleInterval = GAME_CONFIG.difficultyScaleInterval;
            const newTier = Math.floor(timeAfterZero / scaleInterval) + 1;
            
            if (newTier > this.difficultyTier && newTier <= GAME_CONFIG.difficultyTiers.length) {
                this.difficultyTier = newTier;
                this.showDifficultyWarning(newTier);
            }
        }
        
        // Show time warning when countdown is low (but spark hasn't spawned yet)
        if (!this.portalSparkTouched && !this.timeWarningShown) {
            if (countdownTime <= 60000 && countdownTime > 59000) {
                this.showTimeWarning('1 minute remaining! Prepare for the challenge!');
                this.timeWarningShown = true;
            }
        }
        
        // Update player
        this.player.update(dt, this.input);
        
        // Update camera
        this.camera.update(dt);
        
        // Update managers
        this.enemyManager.update(dt);
        this.projectileManager.update(dt);
        this.pickupManager.update(dt);
        
        // Update portal
        if (this.portal) {
            this.portal.update(dt);
        }
        
        // Update minimap
        if (this.minimap) {
            this.minimap.update();
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    /**
     * Spawn the 15-minute boss
     */
    spawnBoss() {
        const bossData = BOSSES.deathReaper;
        const angle = Math.random() * Math.PI * 2;
        const distance = 400;
        
        const spawnX = this.player.x + Math.cos(angle) * distance;
        const spawnY = this.player.y + Math.sin(angle) * distance;
        
        // Create boss data for enemy manager
        const bossSpawnData = {
            ...bossData,
            x: spawnX,
            y: spawnY,
            isBoss: true,
        };
        
        // Add to enemy manager and get the actual enemy reference
        const actualBoss = this.enemyManager.spawnBoss(bossSpawnData);
        
        // Store reference to actual enemy (not a copy)
        this.currentBoss = actualBoss;
        
        // Show boss health bar
        this.showBossHealthBar(bossData.name);
    }
    
    /**
     * Spawn a mini-boss
     */
    spawnMiniBoss() {
        const miniBossKeys = Object.keys(MINI_BOSSES);
        const miniBossKey = miniBossKeys[this.miniBossCount % miniBossKeys.length];
        const miniBossData = MINI_BOSSES[miniBossKey];
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 400;
        
        const miniBoss = {
            ...miniBossData,
            x: this.player.x + Math.cos(angle) * distance,
            y: this.player.y + Math.sin(angle) * distance,
            maxHp: miniBossData.hp,
            currentHp: miniBossData.hp,
            isMiniBoss: true,
        };
        
        this.enemyManager.spawnMiniBoss(miniBoss);
        this.miniBossCount++;
    }
    
    /**
     * Handle boss death
     */
    onBossDefeated(boss) {
        this.bossDefeated = true;
        this.currentBoss = null;
        
        // Hide boss health bar
        this.hideBossHealthBar();
        
        // Spawn constructed portal at boss death location
        this.portal = new Portal(this, boss.x, boss.y, 'constructed');
        
        // Apply gold bonus
        this.goldMultiplier = GAME_CONFIG.difficultyTiers[0].goldMult;
        
        // Track for character unlock
        SaveManager.recordBossKill();
        SaveManager.checkUnlocks(this.gameTime, this.killCount);
        
        // Show portal constructed message
        this.showPortalConstructedMessage();
    }
    
    /**
     * Handle mini-boss death - grants +1 level with luck wheel spin
     */
    onMiniBossDefeated(miniBoss) {
        // Grant +1 level to player
        if (this.player) {
            // Trigger gold wheel spin then level up
            this.showGoldWheelSpin(() => {
                // Reset state to PLAYING first to ensure clean transition
                this.setState(GameState.PLAYING);
                
                // Allow a small delay for UI to clear before showing level up
                setTimeout(() => {
                    this.player.levelUp();
                    this.triggerLevelUp();
                }, 100);
            });
        }
    }
    
    /**
     * Show gold wheel spin animation and apply gold reward
     */
    showGoldWheelSpin(callback) {
        // Safety check: if UI is missing, skip wheel to prevent freeze
        if (!this.ui) {
            console.warn('UI not linked, skipping gold wheel');
            callback();
            return;
        }

        // Use LEVEL_UP state to freeze gameplay (not pause which shows menu)
        this.setState(GameState.LEVEL_UP);
        
        // Random gold reward from 250 to 750 (in 50 increments)
        // Options: 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750 (Jackpot!)
        const goldOptions = [];
        for (let i = 250; i <= 750; i += 50) {
            goldOptions.push(i);
        }
        
        const finalGold = goldOptions[Math.floor(Math.random() * goldOptions.length)];
        
        // Apply gold reward immediately (but visual animation will play)
        import('../meta/saveManager.js').then(({ SaveManager }) => {
            SaveManager.addCoins(finalGold);
            
            // Show the gold wheel UI
            this.ui?.showLuckWheel(finalGold, () => {
                // Callback after animation
                callback();
            });
        });
    }
    
    /**
     * Show portal constructed message
     */
    showPortalConstructedMessage() {
        const overlay = document.getElementById('portal-constructed-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 3000);
        }
    }
    
    /**
     * Show time warning popup
     */
    showTimeWarning(message) {
        const warning = document.getElementById('time-warning');
        const text = document.getElementById('time-warning-text');
        if (warning && text) {
            text.textContent = message;
            // warning.classList.remove('hidden');
            // setTimeout(() => {
            //     warning.classList.add('hidden');
            // }, 3000);
            
            if (this.ui) {
                this.ui.toggleScreen(warning, true);
                setTimeout(() => {
                    this.ui.toggleScreen(warning, false);
                }, 3000);
            }
        }
    }
    
    /**
     * Get countdown time (15:00 to 00:00 to negative)
     */
    getCountdownTime() {
        const countdownMs = GAME_CONFIG.bossSpawnTime - this.gameTime;
        const absMs = Math.abs(countdownMs);
        const minutes = Math.floor(absMs / 60000);
        const seconds = Math.floor((absMs % 60000) / 1000);
        const prefix = countdownMs < 0 ? '-' : '';
        return `${prefix}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    /**
     * Get formatted time (alias for UI compatibility)
     */
    getFormattedTime() {
        return this.getCountdownTime();
    }
    
    /**
     * Trigger victory when entering portal
     */
    triggerVictory() {
        this.victory();
    }
    
    /**
     * Show boss health bar UI
     */
    showBossHealthBar(name) {
        const container = document.getElementById('boss-health-container');
        const nameEl = document.getElementById('boss-name');
        if (container && nameEl) {
            nameEl.textContent = name;
            container.classList.remove('hidden');
        }
    }
    
    /**
     * Hide boss health bar UI
     */
    hideBossHealthBar() {
        const container = document.getElementById('boss-health-container');
        if (container) {
            container.classList.add('hidden');
        }
    }
    
    /**
     * Update boss health bar UI
     */
    updateBossHealthBar(currentHp, maxHp) {
        const fill = document.getElementById('boss-health-fill');
        if (fill) {
            const percent = Math.max(0, (currentHp / maxHp) * 100);
            fill.style.width = percent + '%';
        }
    }
    
    /**
     * Show difficulty scaling indicator (persistent, subtle)
     */
    showDifficultyWarning(tier) {
        const tierData = GAME_CONFIG.difficultyTiers[tier - 1];
        if (!tierData) return;
        
        this.goldMultiplier = tierData.goldMult;
        
        const indicator = document.getElementById('difficulty-indicator');
        const text = document.getElementById('difficulty-text');
        
        if (indicator && text) {
            // Format: "⚡ HARD MODE x1.5 DMG"
            const dmgMult = tierData.dmgMult.toFixed(1);
            const hpMult = tierData.hpMult.toFixed(1);
            text.textContent = `⚡ ${tierData.name.toUpperCase()} • x${hpMult} HP • x${dmgMult} DMG`;
            indicator.classList.remove('hidden');
        }
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
        
        // Draw portal
        if (this.portal) {
            this.portal.render(ctx);
        }
        
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
        this.pendingChestItem = contents;
        this.setState(GameState.CHEST);
        if (this.onChestOpen) {
            this.onChestOpen(contents);
        }
    }
    
    /**
     * Close chest and continue
     */
    closeChest(shouldKeep = true) {
        if (this.pendingChestItem && shouldKeep) {
            this.player.applyUpgrade(this.pendingChestItem);
        }
        
        this.pendingChestItem = null;
        // this.ui?.elements['chest-screen']?.classList.add('hidden');
        if (this.ui && this.ui.elements['chest-screen']) {
            this.ui.toggleScreen(this.ui.elements['chest-screen'], false);
        }
        
        // Resume game
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
     * Add coins with gold multiplier
     */
    addCoins(amount) {
        const multipliedAmount = Math.floor(amount * this.goldMultiplier);
        this.coinsCollected += multipliedAmount;
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
     * Get difficulty multiplier based on tier (only after boss defeated)
     */
    getDifficultyMultiplier() {
        if (!this.bossDefeated || this.difficultyTier === 0) {
            // Normal difficulty before boss or first tier
            const minutes = this.gameTime / 60000;
            return 1 + (minutes * 0.05); // 5% per minute base scaling
        }
        
        const tierData = GAME_CONFIG.difficultyTiers[Math.min(this.difficultyTier - 1, GAME_CONFIG.difficultyTiers.length - 1)];
        return tierData ? tierData.hpMult : 1;
    }
    
    /**
     * Get damage multiplier for enemies
     */
    getEnemyDamageMultiplier() {
        if (!this.bossDefeated || this.difficultyTier === 0) {
            return 1;
        }
        
        const tierData = GAME_CONFIG.difficultyTiers[Math.min(this.difficultyTier - 1, GAME_CONFIG.difficultyTiers.length - 1)];
        return tierData ? tierData.dmgMult : 1;
    }
}
