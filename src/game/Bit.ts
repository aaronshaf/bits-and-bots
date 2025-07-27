import { Entity } from './Entity';
import { COLORS, SIZES } from './constants';

export class Bit extends Entity {
    private bitValue: string;
    private fallSpeed: number;
    private opacity: number;
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.bit, COLORS.bit);
        this.bitValue = Math.random() > 0.5 ? '1' : '0';
        this.fallSpeed = 50 + Math.random() * 30; // Variable fall speeds
        this.opacity = 0.3 + Math.random() * 0.7; // Varying opacity for depth
        this.y = -10; // Start above screen
    }

    public update(deltaTime: number): void {
        // Fall down like Matrix rain
        this.y += this.fallSpeed * (deltaTime / 1000);
        
        // Fade as it falls
        if (this.y > window.innerHeight * 0.7) {
            this.opacity *= 0.99;
        }
    }
    
    public isOffScreen(): boolean {
        return this.y > window.innerHeight + 20 || this.opacity < 0.1;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Matrix-style glow trail
        const gradient = ctx.createLinearGradient(this.x, this.y - 20, this.x, this.y + 5);
        gradient.addColorStop(0, this.color + '00');
        gradient.addColorStop(0.7, this.color + '44');
        gradient.addColorStop(1, this.color + 'ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - 6, this.y - 20, 12, 25);
        
        // Draw the bit value
        ctx.font = `bold 12px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillText(this.bitValue, this.x, this.y);
        
        ctx.restore();
    }
    
    // Override collision radius since we're using text
    public getCollisionRadius(): number {
        return 7; // Approximate radius for text collision
    }

    public getValue(): number {
        return 1; // Bits are worth 1 point
    }
}