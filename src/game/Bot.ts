import { Entity } from './Entity';
import { COLORS, SIZES, SPEEDS } from './constants';

export class Bot extends Entity {
    private vx: number = 0;
    private vy: number = 0;
    private playerIndex: number;
    public score: number = 0;
    public health: number = 100;
    public maxHealth: number = 100;
    public lives: number = 3;
    private lastShotTime: number = 0;
    private shotCooldown: number = 100; // 100ms between shots for rapid fire
    private lastDirection: { x: number, y: number } = { x: 1, y: 0 };
    private shieldActive: boolean = false;
    private shieldDuration: number = 2000; // 2 seconds
    private shieldTimer: number = 0;
    private invulnerableTimer: number = 0;
    private invulnerableDuration: number = 2000; // 2 seconds after respawn
    private powerUps: Set<string> = new Set();
    private lifeProgress: number = 0; // Progress towards next life

    constructor(x: number, y: number, playerIndex: number) {
        const color = playerIndex === 0 ? COLORS.player1 : COLORS.player2;
        super(x, y, SIZES.bot, color);
        this.playerIndex = playerIndex;
    }

    public setVelocity(vx: number, vy: number): void {
        this.vx = vx;
        this.vy = vy;
    }
    
    public setAimDirection(x: number, y: number): void {
        // Use right stick for aiming if available, otherwise use movement direction
        if (x !== 0 || y !== 0) {
            this.lastDirection = { x, y };
        } else if (this.vx !== 0 || this.vy !== 0) {
            this.lastDirection = { x: this.vx, y: this.vy };
        }
    }

    public update(deltaTime: number): void {
        const speed = SPEEDS.bot * (deltaTime / 1000);
        this.x += this.vx * speed;
        this.y += this.vy * speed;
        
        this.lastShotTime += deltaTime;
        
        // Update shield
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }
        
        // Update invulnerability
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= deltaTime;
        }
    }

    public canShoot(): boolean {
        return this.lastShotTime >= this.shotCooldown;
    }

    public shoot(): void {
        this.lastShotTime = 0;
    }

    public getShootDirection(): { x: number, y: number } {
        return this.lastDirection;
    }

    public activateShield(): void {
        this.shieldActive = true;
        this.shieldTimer = this.shieldDuration;
    }

    public hasShield(): boolean {
        return this.shieldActive;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        // Flicker if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw shield if active
        if (this.shieldActive) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(this.shieldTimer / 100) * 0.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw Matrix-style bot
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Digital glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        
        // Body - hexagonal core
        ctx.fillStyle = this.color + '22';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * this.radius;
            const y = Math.sin(angle) * this.radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner circuit patterns
        ctx.strokeStyle = this.color + '66';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * this.radius * 0.7;
            const y = Math.sin(angle) * this.radius * 0.7;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        // Digital eyes - glowing green/blue
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        const eyeWidth = this.radius * 0.6;
        const eyeHeight = this.radius * 0.15;
        const eyeY = -this.radius * 0.2;
        
        // Left eye
        ctx.fillRect(-eyeWidth/2 - 2, eyeY - eyeHeight/2, eyeWidth * 0.4, eyeHeight);
        
        // Right eye
        ctx.fillRect(2, eyeY - eyeHeight/2, eyeWidth * 0.4, eyeHeight);
        
        // Data stream effect in eyes
        ctx.fillStyle = this.color + '44';
        const time = Date.now() / 100;
        for (let i = 0; i < 3; i++) {
            const streamY = (eyeY - eyeHeight/2) + (time + i * 3) % eyeHeight;
            ctx.fillRect(-eyeWidth/2 - 2, streamY, eyeWidth * 0.4, 1);
            ctx.fillRect(2, streamY, eyeWidth * 0.4, 1);
        }
        
        // Central processor core
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color + '88';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Matrix code effect
        ctx.font = 'bold 6px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color + '66';
        const code = Math.random() > 0.5 ? '1' : '0';
        ctx.fillText(code, 0, 0);
        
        // Aiming indicator
        if (this.lastDirection.x !== 0 || this.lastDirection.y !== 0) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.setLineDash([2, 2]);
            
            const aimLength = this.radius * 2;
            const angle = Math.atan2(this.lastDirection.y, this.lastDirection.x);
            const aimX = Math.cos(angle) * aimLength;
            const aimY = Math.sin(angle) * aimLength;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(aimX, aimY);
            ctx.stroke();
            
            // Aiming reticle
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(aimX, aimY, 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    public addScore(points: number): void {
        this.score = Math.max(0, this.score + points); // Don't go below 0
    }

    public takeDamage(damage: number): boolean {
        if (this.invulnerableTimer > 0 || this.shieldActive) {
            return false; // No damage taken
        }
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            return true; // Bot died
        }
        return false;
    }

    public respawn(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.invulnerableTimer = this.invulnerableDuration;
        this.lives--;
    }

    public isAlive(): boolean {
        return this.lives > 0;
    }

    public getPlayerIndex(): number {
        return this.playerIndex;
    }

    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    public addLifeProgress(progress: number): void {
        this.lifeProgress += progress;
        if (this.lifeProgress >= 1) {
            this.lives++;
            this.lifeProgress -= 1;
        }
    }

    public hasPowerUp(powerUp: string): boolean {
        return this.powerUps.has(powerUp);
    }

    public addPowerUp(powerUp: string): void {
        this.powerUps.add(powerUp);
        
        // Apply power-up effects
        switch (powerUp) {
            case 'rapidFire':
                this.shotCooldown = 50; // Halve cooldown
                break;
            case 'speedBoost':
                // Speed boost handled in update method
                break;
        }
    }

    public getPowerUps(): Set<string> {
        return this.powerUps;
    }
}