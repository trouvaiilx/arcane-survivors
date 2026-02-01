/**
 * Player Entity
 * Main player character with stats, weapons, and upgrades
 */

import { AssetLoader } from '../engine/assets.js';
import { GAME_CONFIG, CHARACTERS, WEAPONS, PASSIVES } from '../data/config.js';
import { SaveManager } from '../meta/saveManager.js';
import { WeaponFactory } from '../weapons/weaponFactory.js';

export class Player {
    constructor(game, characterId = 'antonio') {
        this.game = game;
        this.character = CHARACTERS[characterId] || CHARACTERS.antonio;
        
        // Position
        this.x = 0;
        this.y = 0;
        this.radius = 14;
        
        // Movement
        this.facingX = 1;
        this.facingY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Base stats (before bonuses)
        const config = GAME_CONFIG.player;
        const powerups = SaveManager.getPowerupBonuses();
        
        this.baseMaxHp = config.baseMaxHp + powerups.maxHp;
        this.baseSpeed = config.baseSpeed * (1 + powerups.speed);
        this.baseDamage = config.baseDamage * (1 + powerups.damage);
        this.baseArmor = config.baseArmor + powerups.armor;
        this.baseRegen = config.baseRegen + powerups.regen;
        this.baseMagnetRadius = config.baseMagnetRadius * (1 + powerups.magnet);
        this.baseLuck = 1 + powerups.luck;
        this.baseGrowth = 1 + powerups.growth;
        this.baseGreed = 1 + powerups.greed;
        this.baseCooldown = 1 + powerups.cooldown;
        this.baseArea = 1 + powerups.area;
        this.baseProjectileSpeed = 1;
        this.baseProjectiles = 0;
        this.revivals = powerups.revival || 0;
        
        // Weapons and passives (max 6 each) - initialize BEFORE recalculateStats
        this.weapons = [];
        this.passives = [];
        this.maxWeapons = 6;
        this.maxPassives = 6;
        
        // Apply character bonus
        this.applyCharacterBonus();
        
        // Current stats (with passive modifiers)
        this.recalculateStats();
        
        // Health
        this.hp = this.maxHp;
        
        // Level & XP
        this.level = 1;
        this.revivalsUsed = 0; // Track used revivals
        this.xp = 0;
        this.xpToLevel = GAME_CONFIG.xp.baseToLevel;
        
        // Invincibility
        this.invincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = config.invincibilityTime;
        
        // Give starting weapon
        this.addWeapon(this.character.startingWeapon);
        
        // Animation
        this.animTime = 0;
        this.sprite = AssetLoader.getImage('player');
    }
    
    /**
     * Apply character-specific bonuses
     */
    applyCharacterBonus() {
        const bonus = this.character.bonus;
        if (!bonus) return;
        
        if (bonus.damage) this.baseDamage *= bonus.damage;
        if (bonus.speed) this.baseSpeed *= bonus.speed;
        if (bonus.maxHp) this.baseMaxHp *= bonus.maxHp;
        if (bonus.regen) this.baseRegen += bonus.regen;
        if (bonus.armor) this.baseArmor += bonus.armor;
        if (bonus.growth) this.baseGrowth *= bonus.growth;
        if (bonus.luck) this.baseLuck *= bonus.luck;
        if (bonus.projectiles) this.baseProjectiles += bonus.projectiles;
        if (bonus.cooldown) this.baseCooldown *= bonus.cooldown;
        if (bonus.area) this.baseArea *= bonus.area;
    }
    
    /**
     * Recalculate current stats based on passives
     */
    recalculateStats() {
        // Start with base values
        let damageMultiplier = 1;
        let speedMultiplier = 1;
        let maxHpMultiplier = 1;
        let armorBonus = 0;
        let regenBonus = 0;
        let cooldownMultiplier = 1;
        let areaMultiplier = 1;
        let projectileSpeedMultiplier = 1;
        let magnetMultiplier = 1;
        let luckMultiplier = 1;
        let growthMultiplier = 1;
        let projectilesBonus = 0;
        let curseMultiplier = 1; // Curse makes enemies take more damage
        let greedMultiplier = 1; // Greed increases coin value
        let revivalBonus = 0;
        
        // Apply passive effects
        for (const passive of this.passives) {
            const effect = passive.effect;
            const level = passive.level;
            
            if (effect.damage) damageMultiplier += effect.damage * level;
            if (effect.speed) speedMultiplier += effect.speed * level;
            if (effect.maxHp) maxHpMultiplier += effect.maxHp * level;
            if (effect.armor) armorBonus += effect.armor * level;
            if (effect.regen) regenBonus += effect.regen * level;
            if (effect.cooldown) cooldownMultiplier += effect.cooldown * level;
            if (effect.area) areaMultiplier += effect.area * level;
            if (effect.projectileSpeed) projectileSpeedMultiplier += effect.projectileSpeed * level;
            if (effect.magnet) magnetMultiplier += effect.magnet * level;
            if (effect.luck) luckMultiplier += effect.luck * level;
            if (effect.growth) growthMultiplier += effect.growth * level;
            if (effect.projectiles) projectilesBonus += Math.floor(effect.projectiles * level);
            if (effect.curse) curseMultiplier += effect.curse * level;
            if (effect.greed) greedMultiplier += effect.greed * level;
            if (effect.revival) revivalBonus += effect.revival * level;
        }
        
        // Calculate final stats
        this.maxHp = Math.floor(this.baseMaxHp * maxHpMultiplier);
        this.speed = this.baseSpeed * speedMultiplier;
        this.damage = this.baseDamage * damageMultiplier;
        this.armor = this.baseArmor + armorBonus;
        this.regen = this.baseRegen + regenBonus;
        this.cooldown = this.baseCooldown * cooldownMultiplier;
        this.area = this.baseArea * areaMultiplier;
        this.projectileSpeed = this.baseProjectileSpeed * projectileSpeedMultiplier;
        this.magnetRadius = this.baseMagnetRadius * magnetMultiplier;
        this.luck = this.baseLuck * luckMultiplier;
        this.growth = this.baseGrowth * growthMultiplier;
        this.projectiles = this.baseProjectiles + projectilesBonus;
        this.curse = curseMultiplier; // How much extra damage enemies take
        this.greed = this.baseGreed * greedMultiplier; // Coin value multiplier
        
        // Calculate revivals: Base + Bonus - Used
        // We use Math.max(0, ...) to prevent negative revivals if logic desyncs
        this.revivals = Math.max(0, (this.baseRevivals || 0) + revivalBonus - (this.revivalsUsed || 0));
    }
    
    /**
     * Update player
     */
    update(dt, input) {
        // Movement
        const dir = input.getMovementDirection();
        
        if (dir.x !== 0 || dir.y !== 0) {
            this.facingX = dir.x;
            this.facingY = dir.y;
        }
        
        this.x += dir.x * this.speed * (dt / 1000);
        this.y += dir.y * this.speed * (dt / 1000);
        
        // Clamp to map bounds
        this.x = Math.max(this.radius, Math.min(this.game.mapWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.game.mapHeight - this.radius, this.y));
        
        // Invincibility timer
        if (this.invincible) {
            this.invincibilityTimer -= dt;
            if (this.invincibilityTimer <= 0) {
                this.invincible = false;
            }
        }
        
        // HP regeneration
        if (this.regen > 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.regen * (dt / 1000));
        }
        
        // Update weapons
        for (const weapon of this.weapons) {
            weapon.update(dt);
        }
        
        // Animation
        this.animTime += dt;
    }
    
    /**
     * Render player
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Flip based on facing direction
        if (this.facingX < 0) {
            ctx.scale(-1, 1);
        }
        
        // Invincibility flash
        if (this.invincible && Math.floor(this.animTime / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw sprite
        if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                -this.sprite.width / 2,
                -this.sprite.height / 2
            );
        } else {
            // Fallback circle
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Render weapons with custom visuals (orbital, beam, etc.)
        for (const weapon of this.weapons) {
            if (weapon.render) {
                weapon.render(ctx);
            }
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.invincible) return;

        // Play hit sound
        this.game.soundManager?.play('playerHit');
        
        // Apply curse multiplier (bidirectional - player also takes more damage)
        const curseMultiplier = this.curse || 1;
        const cursedAmount = amount * curseMultiplier;
        
        // Apply armor
        const finalDamage = Math.max(1, cursedAmount - this.armor);
        this.hp -= finalDamage;
        this.game.addDamageTaken(finalDamage);
        
        // Screen shake
        this.game.camera.shake(8, 150);
        
        // Damage number
        this.game.damageNumbers.add(this.x, this.y - 20, finalDamage, '#ef4444');
        
        // Start invincibility
        this.invincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        
        // Check death
        if (this.hp <= 0) {
            if (this.revivals > 0) {
                // Revive
                this.revivalsUsed = (this.revivalsUsed || 0) + 1;
                this.hp = this.maxHp / 2;
                this.game.particles.burst(this.x, this.y, '#fbbf24', 30);
                
                // Tiragisu Logic: Consume one instance/level
                const tiragisuIndex = this.passives.findIndex(p => p.id === 'tiragisu');
                if (tiragisuIndex !== -1) {
                    const tiragisu = this.passives[tiragisuIndex];
                    if (tiragisu.level > 1) {
                        tiragisu.level--;
                    } else {
                        this.passives.splice(tiragisuIndex, 1);
                    }
                    
                    // Since we consumed the item that gave the revival, we shouldn't count it as "used" 
                    // against the remaining pool (the pool itself shrank).
                    this.revivalsUsed--; 
                    
                    // Recalculate stats to reflect lost item
                    this.recalculateStats();
                } else {
                    // Normal revival (shop/character bonus)
                    // Just recalculate to update UI
                    this.recalculateStats();
                }
            } else {
                this.game.gameOver();
            }
        }
    }
    
    /**
     * Heal HP
     */
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        const healed = this.hp - oldHp;
        
        if (healed > 0) {
            this.game.damageNumbers.add(this.x, this.y - 20, '+' + Math.floor(healed), '#22c55e');
        }
    }
    
    /**
     * Add XP
     */
    addXp(amount) {
        const scaledAmount = Math.floor(amount * this.growth);
        this.xp += scaledAmount;
        
        // Check level up
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.levelUp();
        }
    }
    
    /**
     * Level up
     */
    levelUp() {
        this.level++;

        // Play level up sound
        this.game.soundManager?.play('levelUp');
        
        this.xpToLevel = Math.floor(
            GAME_CONFIG.xp.baseToLevel * 
            Math.pow(GAME_CONFIG.xp.levelMultiplier, this.level - 1)
        );
        
        // Trigger level up screen
        this.game.triggerLevelUp();
    }
    
    /**
     * Apply an upgrade (weapon or passive)
     */
    applyUpgrade(upgrade) {
        if (upgrade.type === 'weapon') {
            const existingWeapon = this.weapons.find(w => w.id === upgrade.id);
            if (existingWeapon) {
                existingWeapon.levelUp();
            } else if (this.weapons.length < this.maxWeapons) {
                this.addWeapon(upgrade.id);
            }
        } else if (upgrade.type === 'passive') {
            const existingPassive = this.passives.find(p => p.id === upgrade.id);
            if (existingPassive) {
                existingPassive.level++;
                this.recalculateStats();
            } else if (this.passives.length < this.maxPassives) {
                this.addPassive(upgrade.id);
            }
        }
    }
    
    /**
     * Add a new weapon
     */
    addWeapon(weaponId) {
        const weaponData = WEAPONS[weaponId];
        if (!weaponData) return;
        
        const weapon = WeaponFactory.create(weaponId, this);
        if (weapon) {
            this.weapons.push(weapon);
            // Track weapon discovery for codex
            SaveManager.discoverWeapon(weaponId);
        }
    }
    
    /**
     * Add a new passive
     */
    addPassive(passiveId) {
        const passiveData = PASSIVES[passiveId];
        if (!passiveData) return;
        
        this.passives.push({
            id: passiveId,
            name: passiveData.name,
            icon: passiveData.icon,
            effect: passiveData.effect,
            level: 1,
            maxLevel: passiveData.maxLevel,
        });
        
        // Track passive discovery for codex
        SaveManager.discoverPassive(passiveId);
        
        this.recalculateStats();
    }
    
    /**
     * Get available upgrades for level-up selection
     */
    getUpgradeOptions(count = 4) {
        const options = [];
        
        // Collect all possible upgrades
        const possibleWeapons = [];
        const possiblePassives = [];
        
        // Import RARITY for weights
        const RARITY = {
            COMMON: { weight: 50 },
            UNCOMMON: { weight: 30 },
            RARE: { weight: 15 },
            EPIC: { weight: 4 },
            LEGENDARY: { weight: 1 },
        };
        
        // Check existing weapons that can be leveled (always high priority)
        for (const weapon of this.weapons) {
            if (weapon.level < weapon.maxLevel) {
                const rarity = WEAPONS[weapon.id]?.rarity || 'COMMON';
                possibleWeapons.push({
                    type: 'weapon',
                    id: weapon.id,
                    name: weapon.name,
                    icon: weapon.icon,
                    level: weapon.level + 1,
                    isNew: false,
                    rarity: rarity,
                    weight: 100, // Existing weapons always have high priority
                    description: this.getWeaponUpgradeDescription(weapon.id, weapon.level),
                });
            }
        }
        
        // Check new weapons (weighted by rarity)
        if (this.weapons.length < this.maxWeapons) {
            for (const [id, data] of Object.entries(WEAPONS)) {
                if (!this.weapons.find(w => w.id === id)) {
                    const rarity = data.rarity || 'COMMON';
                    const weight = (RARITY[rarity]?.weight || 50) * this.luck;
                    possibleWeapons.push({
                        type: 'weapon',
                        id: id,
                        name: data.name,
                        icon: data.icon,
                        level: 1,
                        isNew: true,
                        rarity: rarity,
                        weight: weight,
                        description: data.description,
                    });
                }
            }
        }
        
        // Check existing passives that can be leveled
        for (const passive of this.passives) {
            if (passive.level < passive.maxLevel) {
                possiblePassives.push({
                    type: 'passive',
                    id: passive.id,
                    name: passive.name,
                    icon: passive.icon,
                    level: passive.level + 1,
                    isNew: false,
                    rarity: 'COMMON',
                    weight: 100,
                    description: PASSIVES[passive.id].description,
                });
            }
        }
        
        // Check new passives
        if (this.passives.length < this.maxPassives) {
            for (const [id, data] of Object.entries(PASSIVES)) {
                if (!this.passives.find(p => p.id === id)) {
                    possiblePassives.push({
                        type: 'passive',
                        id: id,
                        name: data.name,
                        icon: data.icon,
                        level: 1,
                        isNew: true,
                        rarity: 'COMMON',
                        weight: 50,
                        description: data.description,
                    });
                }
            }
        }
        
        // Combine all options
        const allOptions = [...possibleWeapons, ...possiblePassives];
        
        // Weighted selection
        const selected = [];
        const remaining = [...allOptions];
        
        while (selected.length < count && remaining.length > 0) {
            const totalWeight = remaining.reduce((sum, opt) => sum + opt.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (let i = 0; i < remaining.length; i++) {
                random -= remaining[i].weight;
                if (random <= 0) {
                    selected.push(remaining[i]);
                    remaining.splice(i, 1);
                    break;
                }
            }
        }
        
        return selected;
    }
    
    /**
     * Get description for weapon upgrade
     */
    getWeaponUpgradeDescription(weaponId, currentLevel) {
        const data = WEAPONS[weaponId];
        // upgradeIndex: when at level 1, upgrading to 2 applies upgrades[0]
        // when at level 2, upgrading to 3 applies upgrades[1], etc.
        const upgradeIndex = currentLevel - 1;
        
        if (!data || !data.upgrades || upgradeIndex < 0 || upgradeIndex >= data.upgrades.length) {
            return data?.description || 'Unknown weapon';
        }
        
        const upgrade = data.upgrades[upgradeIndex];
        const parts = [];
        
        if (upgrade.damage) parts.push(`+${upgrade.damage} Damage`);
        if (upgrade.projectiles) parts.push(`+${upgrade.projectiles} Projectile`);
        if (upgrade.cooldown) parts.push(`${Math.round(upgrade.cooldown * 100)}% Cooldown`);
        if (upgrade.area) parts.push(`+${Math.round(upgrade.area * 100)}% Area`);
        if (upgrade.speed) parts.push(`+${upgrade.speed} Speed`);
        if (upgrade.pierce) parts.push(`+${upgrade.pierce} Pierce`);
        if (upgrade.duration) parts.push(`+${upgrade.duration}ms Duration`);
        if (upgrade.range) parts.push(`+${upgrade.range} Range`);
        if (upgrade.knockback) parts.push(`+Knockback`);
        
        return parts.join(', ') || data.description;
    }
    
    /**
     * Shuffle array in place
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Get XP percentage for display
     */
    getXpPercent() {
        return (this.xp / this.xpToLevel) * 100;
    }
    
    /**
     * Get HP percentage for display
     */
    getHpPercent() {
        return (this.hp / this.maxHp) * 100;
    }
}
