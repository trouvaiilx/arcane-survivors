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
                this.elements['pause-screen']?.classList.remove('hidden');
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
    hideAllOverlays() {
        const overlays = [
            'main-menu', 'character-select', 'shop-screen', 'stats-screen',
            'codex-screen', 'level-up-screen', 'pause-screen', 'gameover-screen',
            'victory-screen', 'chest-screen'
        ];
        
        for (const id of overlays) {
            this.elements[id]?.classList.add('hidden');
        }
    }
    
    /**
     * Show main menu
     */
    showMainMenu() {
        this.hideAllOverlays();
        this.elements['main-menu']?.classList.remove('hidden');
        this.elements['hud']?.classList.add('hidden');
        this.updateCoinDisplays();
    }
    
    /**
     * Show character select
     */
    showCharacterSelect() {
        this.hideAllOverlays();
        this.elements['character-select']?.classList.remove('hidden');
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
        this.elements['shop-screen']?.classList.remove('hidden');
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
        this.elements['stats-screen']?.classList.remove('hidden');
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
                <span class="stat-value">${stats.totalDamageDealt.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Damage Taken</span>
                <span class="stat-value">${stats.totalDamageTaken.toLocaleString()}</span>
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
        this.elements['codex-screen']?.classList.remove('hidden');
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
        
        // Rarity colors
        const RARITY_COLORS = {
            COMMON: '#9ca3af',
            UNCOMMON: '#22c55e',
            RARE: '#3b82f6',
            EPIC: '#a855f7',
            LEGENDARY: '#f59e0b',
        };
        
        container.innerHTML = '';
        
        // Weapons section header
        const weaponHeader = document.createElement('div');
        weaponHeader.className = 'codex-section-header';
        weaponHeader.innerHTML = '<span>⚔️ Weapons</span>';
        container.appendChild(weaponHeader);
        
        for (const [id, weapon] of Object.entries(WEAPONS)) {
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
        const screen = this.elements['level-up-screen'];
        const levelText = this.elements['current-level'];
        const choices = this.elements['upgrade-choices'];
        
        if (!screen || !choices) return;
        
        levelText.textContent = `Level ${level}`;
        
        // Rarity colors
        const RARITY_COLORS = {
            COMMON: '#9ca3af',
            UNCOMMON: '#22c55e',
            RARE: '#3b82f6',
            EPIC: '#a855f7',
            LEGENDARY: '#f59e0b',
        };
        
        // Get upgrade options
        const options = this.game.player?.getUpgradeOptions(4) || [];
        
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
                this.game?.selectUpgrade(option);
                screen.classList.add('hidden');
            });
            
            choices.appendChild(card);
        }
        
        screen.classList.remove('hidden');
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
        
        screen.classList.remove('hidden');
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
        
        screen.classList.remove('hidden');
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
            <div class="chest-item-desc">${contents.isNew ? 'NEW WEAPON!' : `Level ${contents.level}`}</div>
        `;
        
        screen.classList.remove('hidden');
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
