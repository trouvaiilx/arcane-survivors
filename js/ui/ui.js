/**
 * UI System
 * Manages all game UI including menus, HUD, and overlays
 */

import { GameState } from '../engine/game.js';
import { SaveManager } from '../meta/saveManager.js';
import { CHARACTERS, WEAPONS, PASSIVES, POWERUPS } from '../data/config.js';

class UIClass {
    constructor() {
        this.game = null;
        this.selectedCharacter = 'antonio';
        
        // Cache DOM elements
        this.elements = {};
    }
    
    /**
     * Initialize UI
     */
    init(game) {
        this.game = game;
        game.ui = this; // Link UI back to game
        this.cacheElements();
        this.setupEventListeners();
        this.updateCoinDisplays();
        
        // Set game callbacks
        game.onStateChange = (state, prev) => this.handleStateChange(state, prev);
        game.onLevelUp = (level) => this.showLevelUp(level);
        game.onPlayerDeath = (stats) => this.showGameOver(stats);
        game.onVictory = (stats) => this.showVictory(stats);
        game.onChestOpen = (contents) => this.showChest(contents);
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        const ids = [
            'hud', 'health-fill', 'health-text', 'xp-fill', 'level-text',
            'timer', 'kill-count', 'coin-count', 'weapon-slots', 'passive-slots',
            'main-menu', 'total-coins', 'character-select', 'character-list',
            'shop-screen', 'shop-list', 'shop-coins', 'stats-screen', 'stats-list',
            'level-up-screen', 'current-level', 'upgrade-choices',
            'pause-screen', 'gameover-screen', 'gameover-title', 'gameover-stats',
            'victory-screen', 'victory-stats', 'chest-screen', 'chest-contents',
            'codex-screen', 'codex-list',
            'item-tooltip', 'tooltip-icon', 'tooltip-name', 'tooltip-level',
            'tooltip-rarity', 'tooltip-description', 'tooltip-stats',
        ];
        
        for (const id of ids) {
            this.elements[id] = document.getElementById(id);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.game.soundManager?.play('uiSelect');
            this.startGame();
        });
        
        document.getElementById('btn-characters')?.addEventListener('click', () => {
            this.showCharacterSelect();
        });
        
        document.getElementById('btn-shop')?.addEventListener('click', () => {
            this.showShop();
        });
        
        document.getElementById('btn-stats')?.addEventListener('click', () => {
            this.showStats();
        });
        
        // Back buttons
        document.getElementById('btn-back-char')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('btn-back-shop')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('btn-back-stats')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Codex
        document.getElementById('btn-codex')?.addEventListener('click', () => {
            this.showCodex();
        });
        
        document.getElementById('btn-back-codex')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Pause menu
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.game?.resume();
        });
        
        document.getElementById('btn-quit')?.addEventListener('click', () => {
            this.game?.quitToMenu();
            this.showMainMenu();
        });
        
        // Game over
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('btn-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Victory
        document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Chest
        document.getElementById('btn-chest-close')?.addEventListener('click', () => {
            this.game?.closeChest();
        });

        // Add hover sounds to all menu buttons
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.game.soundManager?.play('uiHover');
            });
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscape();
            }
        });
    }
    
    /**
     * Handle escape key
     */
    handleEscape() {
        if (!this.game) return;
        
        if (this.game.state === GameState.PLAYING) {
            this.game.pause();
        } else if (this.game.state === GameState.PAUSED) {
            this.game.resume();
        }
    }
    
    /**
     * Handle game state changes
     */
    handleStateChange(state, prevState) {
        // Hide all overlays
        this.hideAllOverlays();
        
        switch (state) {
            case GameState.MENU:
                this.elements['hud']?.classList.add('hidden');
                break;
                
            case GameState.PLAYING:
                this.elements['hud']?.classList.remove('hidden');
                this.startHudUpdate();
                break;
                
            case GameState.PAUSED:
                // this.elements['pause-screen']?.classList.remove('hidden'); 
                this.toggleScreen(this.elements['pause-screen'], true);
                this.showPauseMenu();
                break;
                
            case GameState.LEVEL_UP:
                // Handled by showLevelUp
                break;
                
            case GameState.GAME_OVER:
                // Handled by showGameOver
                break;
                
            case GameState.VICTORY:
                // Handled by showVictory
                break;
        }
    }
    
    /**
     * Hide all overlay screens
     */
    /**
     * Hide all overlay screens
     */
    hideAllOverlays() {
        const screens = document.querySelectorAll('.menu-screen, .overlay-screen');
        screens.forEach(s => {
            if (!s.classList.contains('hidden')) {
                this.toggleScreen(s, false);
            }
        });
    }
    
    /**
     * Show main menu
     */
    showMainMenu() {
        this.hideAllOverlays();
        this.toggleScreen(this.elements['main-menu'], true);
        this.elements['hud']?.classList.add('hidden');
        this.updateCoinDisplays();
    }
    
    /**
     * Show character select
     */
    showCharacterSelect() {
        this.hideAllOverlays();
        this.toggleScreen(this.elements['character-select'], true);
        this.renderCharacterList();
    }
    
    /**
     * Render character list
     */
    renderCharacterList() {
        const container = this.elements['character-list'];
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [id, char] of Object.entries(CHARACTERS)) {
            const isUnlocked = SaveManager.isCharacterUnlocked(id);
            const isSelected = this.selectedCharacter === id;
            
            const card = document.createElement('div');
            card.className = `character-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
            
            card.innerHTML = `
                <div class="character-sprite">${char.sprite}</div>
                <div class="character-name">${char.name}</div>
                <div class="character-weapon">🗡️ ${WEAPONS[char.startingWeapon]?.name || 'Unknown'}</div>
                <div class="character-bonus">${char.bonusText}</div>
                ${!isUnlocked ? `<div class="character-unlock">🔒 ${char.unlockText}</div>` : ''}
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.selectedCharacter = id;
                    this.renderCharacterList();
                });
            }
            
            container.appendChild(card);
        }
    }
    
    /**
     * Show shop
     */
    showShop() {
        this.hideAllOverlays();
        this.toggleScreen(this.elements['shop-screen'], true);
        this.renderShopList();
        this.updateCoinDisplays();
    }
    
    /**
     * Render shop items
     */
    renderShopList() {
        const container = this.elements['shop-list'];
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [id, powerup] of Object.entries(POWERUPS)) {
            const level = SaveManager.getPowerupLevel(id);
            const isMaxed = level >= powerup.maxLevel;
            const cost = SaveManager.getPowerupCost(id);
            const canAfford = SaveManager.getCoins() >= cost;
            
            const item = document.createElement('div');
            item.className = `shop-item ${isMaxed ? 'maxed' : ''} ${!canAfford && !isMaxed ? 'expensive' : ''}`;
            
            item.innerHTML = `
                <div class="icon">${powerup.icon}</div>
                <div class="name">${powerup.name}</div>
                <div class="level">Level ${level}/${powerup.maxLevel}</div>
                <div class="desc">${powerup.description}</div>
                <div class="cost">${isMaxed ? 'MAX' : `💰 ${cost}`}</div>
            `;
            
            if (!isMaxed) {
                item.addEventListener('click', () => {
                    if (SaveManager.buyPowerup(id)) {
                        this.renderShopList();
                        this.updateCoinDisplays();
                    }
                });
            }
            
            container.appendChild(item);
        }
    }
    
    /**
     * Show stats
     */
    showStats() {
        this.hideAllOverlays();
        this.toggleScreen(this.elements['stats-screen'], true);
        this.renderStats();
    }
    
    /**
     * Render statistics
     */
    renderStats() {
        const container = this.elements['stats-list'];
        if (!container) return;
        
        const stats = SaveManager.getStats();
        
        container.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Games Played</span>
                <span class="stat-value">${stats.gamesPlayed}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Victories</span>
                <span class="stat-value">${stats.victories}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Kills</span>
                <span class="stat-value">${stats.totalKills.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Damage Dealt</span>
                <span class="stat-value">${Math.round(stats.totalDamageDealt).toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Damage Taken</span>
                <span class="stat-value">${Math.round(stats.totalDamageTaken).toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Highest Level</span>
                <span class="stat-value">${stats.highestLevel}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Longest Survival</span>
                <span class="stat-value">${this.formatTime(stats.longestSurvival)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Play Time</span>
                <span class="stat-value">${this.formatTime(stats.totalPlayTime)}</span>
            </div>
        `;
    }
    
    /**
     * Show codex
     */
    showCodex() {
        this.hideAllOverlays();
        this.toggleScreen(this.elements['codex-screen'], true);
        this.renderCodex();
    }
    
    /**
     * Render weapon and passive codex
     */
    renderCodex() {
        const container = this.elements['codex-list'];
        if (!container) return;
        
        const discoveredWeapons = SaveManager.getDiscoveredWeapons();
        const discoveredPassives = SaveManager.getDiscoveredPassives();
        
        // Rarity colors and order
        const RARITY_COLORS = {
            COMMON: '#9ca3af',
            UNCOMMON: '#22c55e',
            RARE: '#3b82f6',
            EPIC: '#a855f7',
            LEGENDARY: '#f59e0b',
        };
        
        const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
        
        container.innerHTML = '';
        
        // Weapons section header
        const weaponHeader = document.createElement('div');
        weaponHeader.className = 'codex-section-header';
        weaponHeader.innerHTML = '<span>⚔️ Weapons</span>';
        container.appendChild(weaponHeader);
        
        // Sort weapons by rarity
        const sortedWeapons = Object.entries(WEAPONS).sort((a, b) => {
            const rarityA = a[1].rarity || 'COMMON';
            const rarityB = b[1].rarity || 'COMMON';
            return RARITY_ORDER.indexOf(rarityA) - RARITY_ORDER.indexOf(rarityB);
        });
        
        for (const [id, weapon] of sortedWeapons) {
            const isDiscovered = discoveredWeapons.includes(id);
            const rarity = weapon.rarity || 'COMMON';
            const rarityClass = `rarity-${rarity.toLowerCase()}`;
            const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;
            const rarityName = rarity.charAt(0) + rarity.slice(1).toLowerCase();
            
            const item = document.createElement('div');
            item.className = `codex-item ${rarityClass} ${isDiscovered ? '' : 'locked'}`;
            
            if (isDiscovered) {
                item.innerHTML = `
                    <div class="codex-icon">${weapon.icon}</div>
                    <div class="codex-name">${weapon.name}</div>
                    <div class="codex-rarity" style="color: ${rarityColor}">${rarityName}</div>
                    <div class="codex-desc">${weapon.description}</div>
                `;
            } else {
                item.innerHTML = `
                    <div class="codex-icon">❓</div>
                    <div class="codex-name">???</div>
                    <div class="codex-rarity" style="color: ${rarityColor}">${rarityName}</div>
                    <div class="codex-locked-text">Find in-game to unlock</div>
                `;
            }
            
            container.appendChild(item);
        }
        
        // Passives section header
        const passiveHeader = document.createElement('div');
        passiveHeader.className = 'codex-section-header';
        passiveHeader.innerHTML = '<span>🛡️ Passives</span>';
        container.appendChild(passiveHeader);
        
        for (const [id, passive] of Object.entries(PASSIVES)) {
            const isDiscovered = discoveredPassives.includes(id);
            
            const item = document.createElement('div');
            item.className = `codex-item ${isDiscovered ? '' : 'locked'}`;
            
            if (isDiscovered) {
                item.innerHTML = `
                    <div class="codex-icon">${passive.icon}</div>
                    <div class="codex-name">${passive.name}</div>
                    <div class="codex-desc">${passive.description}</div>
                `;
            } else {
                item.innerHTML = `
                    <div class="codex-icon">❓</div>
                    <div class="codex-name">???</div>
                    <div class="codex-locked-text">Find in-game to unlock</div>
                `;
            }
            
            container.appendChild(item);
        }
    }
    
    /**
     * Start the game
     */
    startGame() {
        this.hideAllOverlays();
        this.game?.startGame(this.selectedCharacter);
    }
    
    /**
     * Show level up screen
     */
    showLevelUp(level) {
        // Play level up sound
        this.game.soundManager?.play('levelUp');

        const screen = this.elements['level-up-screen'];
        const levelText = this.elements['current-level'];
        const choices = this.elements['upgrade-choices'];
        
        if (!screen || !choices) return;
        
        // Get upgrade options
        const options = this.game.player?.getUpgradeOptions(4) || [];
        
        // If no upgrades available (all maxed), skip level-up and give bonus coins
        if (options.length === 0) {
            // Give bonus coins instead
            this.game?.addCoins(25);
            this.game?.resume();
            
            // Show a brief message (optional - you can add a toast notification here)
            console.log('All upgrades maxed! Bonus coins awarded.');
            return;
        }
        
        levelText.textContent = `Level ${level}`;
        
        // Rarity colors
        const RARITY_COLORS = {
            COMMON: '#9ca3af',
            UNCOMMON: '#22c55e',
            RARE: '#3b82f6',
            EPIC: '#a855f7',
            LEGENDARY: '#f59e0b',
        };
        
        choices.innerHTML = '';
        
        for (const option of options) {
            const card = document.createElement('div');
            card.className = `upgrade-card ${option.type}`;
            
            const rarity = option.rarity || 'COMMON';
            const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;
            const rarityName = rarity.charAt(0) + rarity.slice(1).toLowerCase();
            
            // Add border glow for higher rarities
            if (rarity !== 'COMMON') {
                card.style.borderColor = rarityColor;
                card.style.boxShadow = `0 0 10px ${rarityColor}50`;
            }
            
            card.innerHTML = `
                <div class="icon">${option.icon}</div>
                <div class="name">${option.name}</div>
                ${option.type === 'weapon' ? `<div class="rarity" style="color: ${rarityColor}; font-size: 0.75rem; font-weight: bold;">${rarityName}</div>` : ''}
                <div class="type">${option.isNew ? 'NEW!' : `Level ${option.level}`}</div>
                <div class="description">${option.description}</div>
            `;
            
            card.addEventListener('click', () => {
                this.game.soundManager?.play('uiSelect');
                this.game?.selectUpgrade(option);
                // element.classList.add('hidden') is too abrupt
                this.toggleScreen(screen, false);
            });
            
            choices.appendChild(card);
        }
        
        this.toggleScreen(screen, true);
    }

    /**
     * Helper to fade screens in/out
     */
    toggleScreen(element, show) {
        if (!element) return;
        
        // Clear any pending fade timeout to prevent race conditions
        if (element._fadeTimeout) {
            clearTimeout(element._fadeTimeout);
            element._fadeTimeout = null;
        }
        
        if (show) {
            element.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
        } else {
            element.style.opacity = '0';
            // Wait for transition to finish before hiding
            element._fadeTimeout = setTimeout(() => {
                element.classList.add('hidden');
                element._fadeTimeout = null;
            }, 300); // Match CSS transition time
        }
    }
    
    /**
     * Show gold wheel spin animation for mini-boss kill (interactive)
     */
    showLuckWheel(finalGold, callback) {
        console.log('showGoldWheel called with amount:', finalGold);
        
        try {
            // Get or create wheel overlay
            let overlay = document.getElementById('luck-wheel-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            overlay = document.createElement('div');
            overlay.id = 'luck-wheel-overlay';
            overlay.style.zIndex = '2000';
            document.body.appendChild(overlay);
            
            // Set up the initial wheel UI with SPIN button
            overlay.innerHTML = `
                <div class="luck-wheel-content">
                    <div class="luck-wheel-title">🎰 MINI-BOSS DEFEATED! 🎰</div>
                    <div class="luck-wheel-subtitle">You've earned a BIG reward!</div>
                    <div class="luck-wheel-display">
                        <div class="luck-wheel-slots">💰 ? 💰</div>
                    </div>
                    <div class="luck-wheel-instructions">Spin for GOLD REWARD!</div>
                    <button class="luck-wheel-spin-btn" id="luck-spin-btn">🎲 SPIN! 🎲</button>
                    <div class="luck-wheel-result"></div>
                </div>
            `;
            
            overlay.style.display = 'flex';
            overlay.classList.remove('hidden');
            
            const slotsDiv = overlay.querySelector('.luck-wheel-slots');
            const resultDiv = overlay.querySelector('.luck-wheel-result');
            const spinBtn = overlay.querySelector('#luck-spin-btn');
            const instructionsDiv = overlay.querySelector('.luck-wheel-instructions');
            
            if (!slotsDiv || !resultDiv || !spinBtn) {
                console.error('Wheel elements missing!');
                callback();
                return;
            }
            
            spinBtn.addEventListener('click', () => {
                spinBtn.disabled = true;
                spinBtn.textContent = 'SPINNING...';
                spinBtn.style.opacity = '0.5';
                instructionsDiv.textContent = 'Spinning...';
                
                // Using gold values for visual spin
                const goldValues = [250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750];
                let spinCount = 0;
                const totalSpins = 25 + Math.floor(Math.random() * 15);
                
                const spinInterval = setInterval(() => {
                    const currentValue = goldValues[spinCount % goldValues.length];
                    slotsDiv.innerHTML = `<span class="luck-value" style="color: #fbbf24;">💰 ${currentValue}</span>`;
                    spinCount++;
                    
                    if (spinCount >= totalSpins) {
                        clearInterval(spinInterval);
                        
                        // Show final value
                        slotsDiv.innerHTML = `<span class="luck-value final" style="color: #fbbf24; text-shadow: 0 0 20px #fbbf24;">💰 ${finalGold}</span>`;
                        spinBtn.style.display = 'none';
                        
                        instructionsDiv.innerHTML = `<span style="color: #fbbf24;">💰 JACKPOT! +${finalGold} COINS! 💰</span>`;
                        resultDiv.innerHTML = `<div class="luck-desc">Coins added to your stash!</div>`;
                        
                        const continueBtn = document.createElement('button');
                        continueBtn.className = 'luck-wheel-spin-btn';
                        continueBtn.textContent = '✨ CONTINUE ✨';
                        continueBtn.style.marginTop = '16px';
                        resultDiv.appendChild(continueBtn);
                        
                        continueBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // overlay.style.display = 'none';
                            // overlay.classList.add('hidden');
                            
                            // Fade out
                            overlay.style.transition = 'opacity 0.3s';
                            overlay.style.opacity = '0';
                            
                            setTimeout(() => {
                                if (overlay.parentNode) {
                                    overlay.parentNode.removeChild(overlay);
                                }
                                callback(); // Call callback AFTER removal to prevent input blocking
                            }, 300);
                        });
                    }
                }, 70);
            });
        } catch (err) {
            console.error('Error in showGoldWheel:', err);
            callback();
        }
    }
    
    /**
     * Show game over screen
     */
    showGameOver(stats) {
        const screen = this.elements['gameover-screen'];
        const statsDiv = this.elements['gameover-stats'];
        
        if (!screen || !statsDiv) return;
        
        statsDiv.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Time Survived</span>
                <span class="stat-value">${this.formatTime(stats.time)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Level Reached</span>
                <span class="stat-value">${stats.level}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Enemies Killed</span>
                <span class="stat-value">${stats.kills}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Coins Earned</span>
                <span class="stat-value" style="color: #fbbf24">💰 ${stats.coins}</span>
            </div>
        `;
        
        // screen.classList.remove('hidden');
        this.toggleScreen(screen, true);
    }
    
    /**
     * Show victory screen
     */
    showVictory(stats) {
        const screen = this.elements['victory-screen'];
        const statsDiv = this.elements['victory-stats'];
        
        if (!screen || !statsDiv) return;
        
        statsDiv.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Time Survived</span>
                <span class="stat-value">${this.formatTime(stats.time)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Final Level</span>
                <span class="stat-value">${stats.level}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Kills</span>
                <span class="stat-value">${stats.kills}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Coins Earned</span>
                <span class="stat-value" style="color: #fbbf24">💰 ${stats.coins} (+500 bonus!)</span>
            </div>
        `;
        
        // screen.classList.remove('hidden');
        this.toggleScreen(screen, true);
    }
    
    /**
     * Show chest contents
     */
    showChest(contents) {
        const screen = this.elements['chest-screen'];
        const contentsDiv = this.elements['chest-contents'];
        
        if (!screen || !contentsDiv) return;
        
        contentsDiv.innerHTML = `
            <div class="chest-item">${contents.icon}</div>
            <div class="chest-item-name">${contents.name}</div>
            <div class="chest-item-desc">${contents.isNew ? (contents.type === 'passive' ? 'NEW PASSIVE!' : 'NEW WEAPON!') : `Level ${contents.level}`}</div>
            
            <div class="menu-buttons" style="margin-top: 24px; flex-direction: row; gap: 16px;">
                <button id="btn-chest-discard" class="menu-btn danger">TRASH 🗑️</button>
                <button id="btn-chest-keep" class="menu-btn primary">TAKE ✨</button>
            </div>
        `;
        
        screen.classList.remove('hidden'); // legacy
        this.toggleScreen(screen, true);
        
        // Add event listeners for the new buttons
        const btnTrash = document.getElementById('btn-chest-discard');
        const btnTake = document.getElementById('btn-chest-keep');
        
        if (btnTrash) {
            btnTrash.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.game?.closeChest(false); // false = discard
            };
        }
        
        if (btnTake) {
            btnTake.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.game?.closeChest(true); // true = keep
            };
        }
    }
    
    /**
     * Start HUD update loop
     */
    startHudUpdate() {
        const updateHud = () => {
            if (this.game?.state === GameState.PLAYING || 
                this.game?.state === GameState.PAUSED ||
                this.game?.state === GameState.LEVEL_UP) {
                this.updateHud();
                requestAnimationFrame(updateHud);
            }
        };
        updateHud();
    }
    
    /**
     * Show pause menu with stats
     */
    showPauseMenu() {
        const screen = this.elements['pause-screen'];
        if (!screen) return;
        
        // Add stats container if it doesn't exist
        let statsContainer = screen.querySelector('.pause-stats-container');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.className = 'pause-stats-container';
            
            // Insert before buttons
            const buttons = screen.querySelector('.menu-buttons');
            if (buttons) {
                screen.insertBefore(statsContainer, buttons);
            } else {
                screen.appendChild(statsContainer);
            }
        }
        
        if (this.game?.player) {
            const p = this.game.player;
            
            // Collect stats
            const stats = [
                { name: 'Max HP', value: Math.ceil(p.maxHp), icon: '❤️' },
                { name: 'Recovery', value: p.regen.toFixed(1), icon: '💖' },
                { name: 'Armor', value: Math.floor(p.armor), icon: '🛡️' },
                { name: 'Move Speed', value: Math.round(p.speed * 10), icon: '👟' },
                { name: 'Might', value: Math.round(p.damage * 100) + '%', icon: '⚔️' },
                { name: 'Area', value: Math.round(p.area * 100) + '%', icon: '📏' },
                { name: 'Proj. Speed', value: Math.round(p.projectileSpeed * 100) + '%', icon: '💨' },
                { name: 'Cooldown', value: Math.round((1 - p.cooldown/p.baseCooldown) * 100) + '%', icon: '⚡' },
                { name: 'Luck', value: Math.round(p.luck * 100) + '%', icon: '🍀' },
                { name: 'Growth', value: Math.round(p.growth * 100) + '%', icon: '🌱' },
                { name: 'Greed', value: Math.round(p.greed * 100) + '%', icon: '💰' },
                { name: 'Curse', value: Math.round(p.curse * 100) + '%', icon: '💀' },
                { name: 'Revival', value: p.revivals, icon: '⚰️' }
            ];
            
            // Format stats HTML
            let leftStats = '';
            let rightStats = '';
            
            stats.forEach((stat, index) => {
                const html = `
                    <div class="stat-item">
                        <span class="stat-name">${stat.icon} ${stat.name}</span>
                        <span class="stat-val">${stat.value}</span>
                    </div>
                `;
                if (index < Math.ceil(stats.length / 2)) leftStats += html;
                else rightStats += html;
            });
            
            // Equipment grids
            let weaponsHtml = '';
            p.weapons.forEach(w => {
                weaponsHtml += `
                    <div class="equipment-slot">
                        <div class="equipment-icon">${w.icon || '⚔️'}</div>
                        <div class="equipment-level">Lv ${w.level}</div>
                    </div>
                `;
            });
            
            let passivesHtml = '';
            p.passives.forEach(pas => {
                passivesHtml += `
                    <div class="equipment-slot">
                        <div class="equipment-icon">${pas.icon || '📘'}</div>
                        <div class="equipment-level">Lv ${pas.level}</div>
                    </div>
                `;
            });

            statsContainer.innerHTML = `
                <div class="stats-panel-left">
                    <div class="stats-group">
                        <div class="stats-group-title">Player Stats</div>
                        ${leftStats}
                    </div>
                    <div class="stats-group">
                        <div class="stats-group-title">Weapons</div>
                        <div class="equipment-grid">${weaponsHtml}</div>
                    </div>
                </div>
                <div class="stats-panel-right">
                    <div class="stats-group">
                        <div class="stats-group-title">Attributes</div>
                        ${rightStats}
                    </div>
                    <div class="stats-group">
                        <div class="stats-group-title">Passives</div>
                        <div class="equipment-grid">${passivesHtml}</div>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Update HUD elements
     */
    updateHud() {
        const player = this.game?.player;
        if (!player) return;
        
        // Health
        const hpPercent = player.getHpPercent();
        if (this.elements['health-fill']) {
            this.elements['health-fill'].style.width = `${hpPercent}%`;
        }
        if (this.elements['health-text']) {
            this.elements['health-text'].textContent = `${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}`;
        }
        
        // XP
        const xpPercent = player.getXpPercent();
        if (this.elements['xp-fill']) {
            this.elements['xp-fill'].style.width = `${xpPercent}%`;
        }
        if (this.elements['level-text']) {
            this.elements['level-text'].textContent = `Lv ${player.level}`;
        }
        
        // Timer
        if (this.elements['timer']) {
            this.elements['timer'].textContent = this.game.getFormattedTime();
        }
        
        // Kill count
        if (this.elements['kill-count']) {
            this.elements['kill-count'].textContent = `☠ ${this.game.killCount}`;
        }
        
        // Coins
        if (this.elements['coin-count']) {
            this.elements['coin-count'].textContent = `💰 ${this.game.coinsCollected}`;
        }
        
        // Update weapon slots
        this.updateWeaponSlots(player);
        
        // Update passive slots
        this.updatePassiveSlots(player);
    }
    
    /**
     * Update weapon slot display
     */
    updateWeaponSlots(player) {
        const container = this.elements['weapon-slots'];
        if (!container) return;
        
        // Only update if changed
        const weaponKey = player.weapons.map(w => `${w.id}:${w.level}`).join(',');
        if (this.lastWeaponKey === weaponKey) return;
        this.lastWeaponKey = weaponKey;
        
        container.innerHTML = '';
        
        // Rarity colors
        const RARITY_COLORS = {
            COMMON: '#9ca3af',
            UNCOMMON: '#22c55e',
            RARE: '#3b82f6',
            EPIC: '#a855f7',
            LEGENDARY: '#f59e0b',
        };
        
        for (const weapon of player.weapons) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.innerHTML = `
                <span>${weapon.icon}</span>
                <span class="level-badge">${weapon.level}</span>
            `;
            
            // Hover handlers for tooltip
            slot.addEventListener('mouseenter', () => {
                this.showItemTooltip(weapon, 'weapon');
            });
            
            slot.addEventListener('mouseleave', () => {
                this.hideItemTooltip();
            });
            
            container.appendChild(slot);
        }
    }
    
    /**
     * Show item tooltip (weapons or passives)
     */
    showItemTooltip(item, type = 'weapon') {
        const tooltip = this.elements['item-tooltip'];
        if (!tooltip) return;
        
        const RARITY_COLORS = {
            COMMON: '#9ca3af',
            UNCOMMON: '#22c55e',
            RARE: '#3b82f6',
            EPIC: '#a855f7',
            LEGENDARY: '#f59e0b',
        };
        
        let itemData, rarity, description;
        if (type === 'weapon') {
            itemData = WEAPONS[item.id];
            rarity = itemData?.rarity || 'COMMON';
            description = itemData?.description || '';
        } else {
            itemData = PASSIVES[item.id];
            rarity = 'COMMON'; // Passives don't have rarity
            description = itemData?.description || '';
        }
        
        const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;
        const rarityName = rarity.charAt(0) + rarity.slice(1).toLowerCase();
        
        // Fill tooltip content
        if (this.elements['tooltip-icon']) {
            this.elements['tooltip-icon'].textContent = item.icon;
        }
        if (this.elements['tooltip-name']) {
            this.elements['tooltip-name'].textContent = item.name;
        }
        if (this.elements['tooltip-level']) {
            this.elements['tooltip-level'].textContent = `Lv ${item.level}`;
        }
        if (this.elements['tooltip-rarity']) {
            if (type === 'weapon') {
                this.elements['tooltip-rarity'].textContent = rarityName;
                this.elements['tooltip-rarity'].style.color = rarityColor;
                this.elements['tooltip-rarity'].style.display = 'block';
            } else {
                this.elements['tooltip-rarity'].style.display = 'none';
            }
        }
        if (this.elements['tooltip-description']) {
            this.elements['tooltip-description'].textContent = description;
        }
        if (this.elements['tooltip-stats']) {
            if (type === 'weapon') {
                this.elements['tooltip-stats'].innerHTML = `
                    <div class="stat-line"><span>Damage</span><span class="stat-value">${Math.round(item.damage)}</span></div>
                    <div class="stat-line"><span>Cooldown</span><span class="stat-value">${(item.cooldown / 1000).toFixed(1)}s</span></div>
                    <div class="stat-line"><span>Projectiles</span><span class="stat-value">${item.projectiles}</span></div>
                    <div class="stat-line"><span>Pierce</span><span class="stat-value">${item.pierce}</span></div>
                `;
            } else {
                // Show passive bonuses
                const bonuses = [];
                if (itemData?.effect) {
                    for (const [stat, value] of Object.entries(itemData.effect)) {
                        const displayValue = value > 0 ? `+${Math.round(value * item.level * 100) / 100}` : value * item.level;
                        bonuses.push(`<div class="stat-line"><span>${this.formatStatName(stat)}</span><span class="stat-value">${displayValue}</span></div>`);
                    }
                }
                this.elements['tooltip-stats'].innerHTML = bonuses.join('');
            }
        }
        
        tooltip.classList.remove('hidden');
    }
    
    /**
     * Format stat name for display
     */
    formatStatName(stat) {
        const names = {
            maxHp: 'Max HP',
            regen: 'HP Regen',
            armor: 'Armor',
            speed: 'Move Speed',
            damage: 'Damage',
            cooldown: 'Cooldown',
            area: 'Area',
            projectiles: 'Projectiles',
            duration: 'Duration',
            magnet: 'Pickup Range',
            luck: 'Luck',
            growth: 'XP Bonus',
            greed: 'Coin Bonus',
        };
        return names[stat] || stat;
    }
    
    /**
     * Hide item tooltip
     */
    hideItemTooltip() {
        const tooltip = this.elements['item-tooltip'];
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
    }
    
    /**
     * Update passive slot display
     */
    updatePassiveSlots(player) {
        const container = this.elements['passive-slots'];
        if (!container) return;
        
        // Only update if changed
        const passiveKey = player.passives.map(p => `${p.id}:${p.level}`).join(',');
        if (this.lastPassiveKey === passiveKey) return;
        this.lastPassiveKey = passiveKey;
        
        container.innerHTML = '';
        
        for (const passive of player.passives) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.innerHTML = `
                <span>${passive.icon}</span>
                <span class="level-badge">${passive.level}</span>
            `;
            
            // Hover handlers for tooltip
            slot.addEventListener('mouseenter', () => {
                this.showItemTooltip(passive, 'passive');
            });
            
            slot.addEventListener('mouseleave', () => {
                this.hideItemTooltip();
            });
            
            container.appendChild(slot);
        }
    }
    
    /**
     * Update coin displays
     */
    updateCoinDisplays() {
        const coins = SaveManager.getCoins();
        
        if (this.elements['total-coins']) {
            this.elements['total-coins'].textContent = `💰 ${coins.toLocaleString()}`;
        }
        if (this.elements['shop-coins']) {
            this.elements['shop-coins'].textContent = `💰 ${coins.toLocaleString()}`;
        }
    }
    
    /**
     * Format time in ms to MM:SS
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

export const UI = new UIClass();
