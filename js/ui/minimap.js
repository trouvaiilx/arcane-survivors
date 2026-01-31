/**
 * Minimap
 * Displays a scaled-down view of the map with player, portal, and enemies
 */

export class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Set canvas resolution
        if (this.canvas) {
            this.canvas.width = 150;
            this.canvas.height = 150;
        }
        
        this.scale = 150 / (this.game.mapWidth || 4000);
    }
    
    update() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const scale = this.scale;
        
        // Clear
        ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
        ctx.fillRect(0, 0, 150, 150);
        
        // Draw map border
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.strokeRect(0, 0, 150, 150);
        
        // Draw enemies as small red dots
        const enemies = this.game.enemyManager?.enemies || [];
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        for (const enemy of enemies) {
            if (enemy.dead) continue; // Skip dead enemies
            const x = enemy.x * scale;
            const y = enemy.y * scale;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw mini-bosses as larger purple dots
        for (const enemy of enemies) {
            if (enemy.dead) continue; // Skip dead enemies
            if (enemy.isMiniBoss) {
                const x = enemy.x * scale;
                const y = enemy.y * scale;
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw boss as large red marker (using actual enemy reference)
        const boss = this.game.currentBoss;
        if (boss && !boss.dead) {
            const x = boss.x * scale;
            const y = boss.y * scale;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Pulsing ring
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 2;
            const pulseSize = 6 + Math.sin(Date.now() / 200) * 2;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw portal as cyan diamond
        if (this.game.portal) {
            const portal = this.game.portal;
            const x = portal.x * scale;
            const y = portal.y * scale;
            
            ctx.fillStyle = '#06b6d4';
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4 + Date.now() / 500);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
            
            // Glow effect
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.lineWidth = 2;
            const glowSize = 8 + Math.sin(Date.now() / 300) * 2;
            ctx.beginPath();
            ctx.arc(x, y, glowSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw player as green dot
        if (this.game.player) {
            const player = this.game.player;
            const x = player.x * scale;
            const y = player.y * scale;
            
            // Player indicator
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Direction indicator
            const facingX = player.facingX || 0;
            const facingY = player.facingY || 0;
            if (facingX !== 0 || facingY !== 0) {
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + facingX * 8, y + facingY * 8);
                ctx.stroke();
            }
        }
    }
}
