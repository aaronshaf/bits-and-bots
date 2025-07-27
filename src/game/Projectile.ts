import { Entity } from './Entity';
import { SPEEDS } from './constants';

export class Projectile extends Entity {
    private vx: number;
    private vy: number;
    private lifetime: number = 2000; // 2 seconds
    private age: number = 0;
    public ownerId: number;

    constructor(x: number, y: number, direction: { x: number, y: number }, ownerId: number, color: string) {
        super(x, y, 4, color);
        this.ownerId = ownerId;
        
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
    }

    public isExpired(): boolean {
        return this.age >= this.lifetime;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = 1 - (this.age / this.lifetime); // Fade out over time
        super.render(ctx);
        ctx.restore();
    }
}