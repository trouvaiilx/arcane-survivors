/**
 * Input Handler
 * Manages keyboard and touch input
 */

export class Input {
    constructor() {
        this.keys = new Map();
        this.touchActive = false;
        this.touchX = 0;
        this.touchY = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        
        // Add listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        window.addEventListener('touchend', this.handleTouchEnd);
    }
    
    handleKeyDown(e) {
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
            e.preventDefault();
        }
        this.keys.set(e.key.toLowerCase(), true);
    }
    
    handleKeyUp(e) {
        this.keys.set(e.key.toLowerCase(), false);
    }
    
    handleTouchStart(e) {
        if (e.target.tagName !== 'BUTTON') {
            e.preventDefault();
        }
        const touch = e.touches[0];
        this.touchActive = true;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchX = 0;
        this.touchY = 0;
    }
    
    handleTouchMove(e) {
        if (!this.touchActive) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touchX = touch.clientX - this.touchStartX;
        this.touchY = touch.clientY - this.touchStartY;
    }
    
    handleTouchEnd(e) {
        this.touchActive = false;
        this.touchX = 0;
        this.touchY = 0;
    }
    
    /**
     * Check if a key is pressed
     */
    isKeyDown(key) {
        return this.keys.get(key.toLowerCase()) === true;
    }
    
    /**
     * Get movement direction vector
     * @returns {{ x: number, y: number }}
     */
    getMovementDirection() {
        let x = 0;
        let y = 0;
        
        // Keyboard input
        if (this.isKeyDown('w') || this.isKeyDown('arrowup')) y -= 1;
        if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) y += 1;
        if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1;
        if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1;
        
        // Touch input (virtual joystick)
        if (this.touchActive) {
            const deadzone = 20;
            const maxDist = 100;
            
            if (Math.abs(this.touchX) > deadzone) {
                x = Math.max(-1, Math.min(1, this.touchX / maxDist));
            }
            if (Math.abs(this.touchY) > deadzone) {
                y = Math.max(-1, Math.min(1, this.touchY / maxDist));
            }
        }
        
        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }
        
        return { x, y };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('touchstart', this.handleTouchStart);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchend', this.handleTouchEnd);
    }
}
