/**
 * Camera System
 * Follows the player with smooth interpolation
 */

export class Camera {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.target = null;
        this.smoothing = 0.1;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
    }
    
    /**
     * Set the entity to follow
     */
    follow(entity) {
        this.target = entity;
        if (entity) {
            this.x = entity.x;
            this.y = entity.y;
        }
    }
    
    /**
     * Update camera position
     */
    update(dt) {
        if (!this.target) return;
        
        this.targetX = this.target.x;
        this.targetY = this.target.y;
        
        // Smooth interpolation
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
        
        // Clamp to map bounds
        const halfWidth = this.game.width / 2;
        const halfHeight = this.game.height / 2;
        
        this.x = Math.max(halfWidth, Math.min(this.game.mapWidth - halfWidth, this.x));
        this.y = Math.max(halfHeight, Math.min(this.game.mapHeight - halfHeight, this.y));
        
        // Apply screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.x += shakeX;
            this.y += shakeY;
        }
    }
    
    /**
     * Trigger screen shake
     */
    shake(intensity = 5, duration = 100) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + this.game.width / 2,
            y: worldY - this.y + this.game.height / 2
        };
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x - this.game.width / 2,
            y: screenY + this.y - this.game.height / 2
        };
    }
    
    /**
     * Check if a point is visible on screen
     */
    isVisible(x, y, margin = 100) {
        const halfWidth = this.game.width / 2 + margin;
        const halfHeight = this.game.height / 2 + margin;
        
        return x > this.x - halfWidth && 
               x < this.x + halfWidth &&
               y > this.y - halfHeight && 
               y < this.y + halfHeight;
    }
    
    /**
     * Get visible bounds
     */
    getVisibleBounds(margin = 0) {
        return {
            left: this.x - this.game.width / 2 - margin,
            right: this.x + this.game.width / 2 + margin,
            top: this.y - this.game.height / 2 - margin,
            bottom: this.y + this.game.height / 2 + margin
        };
    }
}
