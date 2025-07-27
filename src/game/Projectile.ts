import { Entity } from './Entity';
import { SPEEDS } from './constants';

export class Projectile extends Entity {
    private vx: number;
    private vy: number;
    private lifetime: number = 2000; // 2 seconds
    private age: number = 0;
    public ownerId: number;
    private bitValue: string;
    private rotation: number = 0;

    constructor(x: number, y: number, direction: { x: number, y: number }, ownerId: number, color: string) {
        super(x, y, 4, color);
        this.ownerId = ownerId;
        this.bitValue = Math.random() > 0.5 ? '1' : '0';
        
        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length > 0) {
            this.vx = direction.x / length;
            this.vy = direction.y / length;
        } else {
            this.vx = 1;
            this.vy = 0;
        }
    }

    public update(deltaTime: number): void {
        const speed = SPEEDS.projectile * (deltaTime / 1000);
        this.x += this.vx * speed;
        this.y += this.vy * speed;
        
        this.age += deltaTime;
        this.rotation += deltaTime * 0.01; // Spin effect
    }

    public isExpired(): boolean {
        return this.age >= this.lifetime;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const alpha = 1 - (this.age / this.lifetime);
        ctx.globalAlpha = alpha;
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Draw the bit value
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        ctx.fillText(this.bitValue, 0, 0);
        
        // Trail effect
        ctx.globalAlpha = alpha * 0.3;
        ctx.scale(1.5, 1.5);
        ctx.fillText(this.bitValue, 0, 0);
        
        ctx.restore();
    }
    
    // Override collision radius for text-based projectile
    public getCollisionRadius(): number {
        return 8;
    }
}