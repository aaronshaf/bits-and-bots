export abstract class Entity {
    public x: number;
    public y: number;
    public radius: number;
    public color: string;

    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    public abstract update(deltaTime: number): void;

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    public collidesWith(other: Entity): boolean {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const thisRadius = this.getCollisionRadius();
        const otherRadius = other.getCollisionRadius();
        return distance < thisRadius + otherRadius;
    }
    
    public getCollisionRadius(): number {
        return this.radius;
    }

    public keepInBounds(width: number, height: number): void {
        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    }
}