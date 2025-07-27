import { Entity } from './Entity';
import { COLORS, SIZES, SPEEDS } from './constants';

export class Bot extends Entity {
    private vx: number = 0;
    private vy: number = 0;
    private playerIndex: number;
    public score: number = 0;
    private lastShotTime: number = 0;
    private shotCooldown: number = 100; // 100ms between shots for rapid fire
    private lastDirection: { x: number, y: number } = { x: 1, y: 0 };
    private shieldActive: boolean = false;
    private shieldDuration: number = 2000; // 2 seconds
    private shieldTimer: number = 0;

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
        
        // Draw cute bot body
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = this.color + '44';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        const eyeSize = this.radius * 0.2;
        const eyeSpacing = this.radius * 0.5;
        const eyeY = -this.radius * 0.2;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-eyeSpacing + eyeSize/2, eyeY - eyeSize/2, eyeSize/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing + eyeSize/2, eyeY - eyeSize/2, eyeSize/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, this.radius * 0.1, this.radius * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
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

    public getPlayerIndex(): number {
        return this.playerIndex;
    }
}