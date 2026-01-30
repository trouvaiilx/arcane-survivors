/**
 * Asset Loader
 * Loads and manages game assets (sprites, sounds)
 */

class AssetLoaderClass {
    constructor() {
        this.images = new Map();
        this.sounds = new Map();
        this.loaded = false;
    }
    
    /**
     * Load all game assets
     */
    async loadAll() {
        // For this game, we'll use emoji/canvas-drawn sprites
        // to avoid external asset dependencies
        
        // Generate procedural sprites
        this.generateSprites();
        
        this.loaded = true;
        return true;
    }
    
    /**
     * Generate procedural sprites using canvas
     */
    generateSprites() {
        // Player sprites
        this.images.set('player', this.createPlayerSprite());
        
        // Enemy sprites
        this.images.set('zombie', this.createEnemySprite('#4a5568', '#2d3748'));
        this.images.set('bat', this.createEnemySprite('#7c3aed', '#5b21b6'));
        this.images.set('skeleton', this.createEnemySprite('#d1d5db', '#9ca3af'));
        this.images.set('ghost', this.createEnemySprite('#60a5fa', '#3b82f6', 0.6));
        this.images.set('golem', this.createEnemySprite('#78716c', '#57534e', 1, 1.5));
        this.images.set('boss', this.createEnemySprite('#dc2626', '#991b1b', 1, 2));
        
        // Pickup sprites
        this.images.set('xp_small', this.createGemSprite('#22c55e', 8));
        this.images.set('xp_medium', this.createGemSprite('#16a34a', 12));
        this.images.set('xp_large', this.createGemSprite('#15803d', 16));
        this.images.set('xp_huge', this.createGemSprite('#14532d', 24));
        this.images.set('coin', this.createCoinSprite());
        this.images.set('chicken', this.createChickenSprite());
        this.images.set('chest', this.createChestSprite());
        this.images.set('magnet', this.createMagnetSprite());
    }
    
    /**
     * Create player sprite
     */
    createPlayerSprite() {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Body
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = '#a78bfa';
        ctx.beginPath();
        ctx.arc(size/2, size/2 - 2, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(size/2 - 4, size/2 - 2, 3, 0, Math.PI * 2);
        ctx.arc(size/2 + 4, size/2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    /**
     * Create enemy sprite
     */
    createEnemySprite(color1, color2, alpha = 1, scale = 1) {
        const size = Math.floor(24 * scale);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.globalAlpha = alpha;
        
        // Body
        ctx.fillStyle = color1;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker center
        ctx.fillStyle = color2;
        ctx.beginPath();
        ctx.arc(size/2, size/2 + 2, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (red)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(size/2 - size/5, size/2 - 2, scale * 2, 0, Math.PI * 2);
        ctx.arc(size/2 + size/5, size/2 - 2, scale * 2, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    /**
     * Create XP gem sprite
     */
    createGemSprite(color, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Diamond shape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(size, size/2);
        ctx.lineTo(size/2, size);
        ctx.lineTo(0, size/2);
        ctx.closePath();
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(size/2, 2);
        ctx.lineTo(size/2 + size/4, size/2);
        ctx.lineTo(size/2, size/2);
        ctx.closePath();
        ctx.fill();
        
        return canvas;
    }
    
    /**
     * Create coin sprite
     */
    createCoinSprite() {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Gold circle
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner ring
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
        ctx.stroke();
        
        // $ symbol
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', size/2, size/2 + 1);
        
        return canvas;
    }
    
    /**
     * Create chicken (heal) sprite
     */
    createChickenSprite() {
        const size = 20;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Drumstick shape
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(size/2 + 2, size/2, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bone
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.roundRect(2, size/2 - 2, 8, 4, 2);
        ctx.fill();
        
        // Bone end
        ctx.beginPath();
        ctx.arc(4, size/2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    /**
     * Create chest sprite
     */
    createChestSprite() {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Chest base
        ctx.fillStyle = '#92400e';
        ctx.fillRect(2, size/2, size - 4, size/2 - 2);
        
        // Chest lid
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(2, size/2);
        ctx.lineTo(size/2, 4);
        ctx.lineTo(size - 2, size/2);
        ctx.closePath();
        ctx.fill();
        
        // Lock
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(size/2, size/2 + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    /**
     * Create magnet sprite
     */
    createMagnetSprite() {
        const size = 20;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // U shape
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.lineTo(4, size/2);
        ctx.arc(size/2, size/2, size/2 - 4, Math.PI, 0, true);
        ctx.lineTo(size - 4, 4);
        ctx.stroke();
        
        // Blue tips
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.lineTo(4, 8);
        ctx.moveTo(size - 4, 4);
        ctx.lineTo(size - 4, 8);
        ctx.stroke();
        
        return canvas;
    }
    
    /**
     * Get an image asset
     */
    getImage(name) {
        return this.images.get(name);
    }
    
    /**
     * Get a sound asset
     */
    getSound(name) {
        return this.sounds.get(name);
    }
}

export const AssetLoader = new AssetLoaderClass();
