import { Entity } from './Entity';
import { COLORS, SIZES } from './constants';

export class Bit extends Entity {
    private pulseTime: number = 0;
    private sparkleTime: number = 0;
    private bitValue: string;
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.bit, COLORS.bit);
        this.sparkleTime = Math.random() * Math.PI * 2;
        this.bitValue = Math.random() > 0.5 ? '1' : '0';
    }

    public update(deltaTime: number): void {
        // Add a gentle floating animation
        this.pulseTime += deltaTime / 1000;
        this.sparkleTime += deltaTime / 500;
        const pulseScale = 1 + Math.sin(this.pulseTime * 3) * 0.1;
        this.radius = SIZES.bit * pulseScale;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Subtle glow
        const glowSize = 12;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, this.color + '44');
        gradient.addColorStop(0.5, this.color + '22');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the bit value (1 or 0)
        ctx.font = `bold 14px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        ctx.fillText(this.bitValue, 0, 0);
        
        // Add a subtle outline for better visibility
        ctx.strokeStyle = this.color + '66';
        ctx.lineWidth = 1;
        ctx.strokeText(this.bitValue, 0, 0);
        
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