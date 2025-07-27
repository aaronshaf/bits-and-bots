import { Entity } from './Entity';
import { COLORS } from './constants';

export abstract class Boss extends Entity {
    protected health: number;
    protected maxHealth: number;
    protected phase: number = 1;
    protected level: number;
    protected attackTimer: number = 0;
    protected attackInterval: number = 2000;
    protected isDefeated: boolean = false;

    constructor(x: number, y: number, radius: number, level: number, health: number) {
        super(x, y, radius, COLORS.bug);
        this.level = level;
        this.health = health;
        this.maxHealth = health;
    }

    public abstract update(deltaTime: number, playerBots: Entity[], projectiles: Entity[]): void;
    public abstract attack(): any[];
    public abstract getAttackPattern(): string;

    public takeDamage(damage: number = 1): boolean {
        this.health -= damage;
        
        // Phase changes
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent <= 0.66 && this.phase === 1) {
            this.phase = 2;
            this.onPhaseChange(2);
        } else if (healthPercent <= 0.33 && this.phase === 2) {
            this.phase = 3;
            this.onPhaseChange(3);
        }

        if (this.health <= 0) {
            this.isDefeated = true;
            return true;
        }
        return false;
    }

    protected onPhaseChange(newPhase: number): void {
        // Override in subclasses for phase-specific behavior
    }

    public getHealthPercent(): number {
        return Math.max(0, this.health / this.maxHealth);
    }

    public isAlive(): boolean {
        return !this.isDefeated;
    }

    // Common boss rendering with health bar
    public renderHealthBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = 200;
        const barHeight = 10;
        const barY = 50;
        const barX = (ctx.canvas.width - barWidth) / 2;

        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = this.getHealthPercent();
        const fillColor = healthPercent > 0.66 ? '#00ff88' : healthPercent > 0.33 ? '#ffaa00' : '#ff4757';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss name
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.getAttackPattern(), ctx.canvas.width / 2, barY - 10);
    }
}

// SwarmBoss - spawns mini-bugs
export class SwarmBoss extends Boss {
    private swarmTimer: number = 0;
    private swarmInterval: number = 3000;
    private miniBugs: any[] = [];

    constructor(x: number, y: number, level: number) {
        const health = 50 + level * 10;
        super(x, y, 30, level, health);
        this.attackInterval = 3000;
    }

    public update(deltaTime: number, playerBots: Entity[], projectiles: Entity[]): void {
        this.attackTimer += deltaTime;
        this.swarmTimer += deltaTime;

        // Move towards center
        const centerX = 400; // Adjust based on canvas
        const centerY = 300;
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 100) {
            this.x += (dx / dist) * 50 * (deltaTime / 1000);
            this.y += (dy / dist) * 50 * (deltaTime / 1000);
        }
    }

    public attack(): any[] {
        if (this.swarmTimer >= this.swarmInterval) {
            this.swarmTimer = 0;
            const attacks = [];
            // Spawn 3-5 mini bugs around the boss
            const count = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const distance = 50;
                attacks.push({
                    type: 'spawn_minibug',
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance
                });
            }
            return attacks;
        }
        return [];
    }

    public getAttackPattern(): string {
        return `Swarm Boss - Level ${this.level}`;
    }

    protected onPhaseChange(newPhase: number): void {
        this.swarmInterval = Math.max(1000, this.swarmInterval - 500);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Pulsing effect
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.scale(pulse, pulse);
        
        // Main body - larger bug
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        
        // Draw multiple overlapping circles for swarm effect
        for (let i = 0; i < 5; i++) {
            const offsetX = Math.sin(Date.now() / 300 + i) * 5;
            const offsetY = Math.cos(Date.now() / 300 + i) * 5;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Evil eyes cluster
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        const eyePositions = [
            {x: -10, y: -5}, {x: 10, y: -5}, {x: 0, y: -10},
            {x: -5, y: 5}, {x: 5, y: 5}
        ];
        eyePositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
        this.renderHealthBar(ctx);
    }
}