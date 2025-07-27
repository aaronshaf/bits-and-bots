import { Entity } from './Entity';
import { COLORS, SIZES } from './constants';

export class Byte extends Entity {
    private bitPattern: string[];
    private formationTime: number = 0;
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.byte, COLORS.byte);
        // Generate random 8-bit pattern
        this.bitPattern = Array(8).fill(0).map(() => Math.random() > 0.5 ? '1' : '0');
    }

    public update(deltaTime: number): void {
        // Gentle pulsing animation
        this.formationTime += deltaTime / 1000;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Pulsing scale
        const pulse = 1 + Math.sin(this.formationTime * 3) * 0.05;
        ctx.scale(pulse, pulse);
        
        // Container glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color + '22';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        
        // Draw byte container - hexagonal shape
        const size = this.radius * 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw 8 bits in a circular pattern
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 5;
        
        const bitRadius = size * 0.65;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i - Math.PI / 2;
            const x = Math.cos(angle) * bitRadius;
            const y = Math.sin(angle) * bitRadius;
            
            // Bit glow background
            ctx.fillStyle = this.color + '44';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Bit value
            ctx.fillStyle = this.color;
            ctx.fillText(this.bitPattern[i], x, y);
        }
        
        // Center indicator showing this is a byte (8 bits)
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = this.color + '88';
        ctx.shadowBlur = 0;
        ctx.fillText('8', 0, 0);
        
        ctx.restore();
    }
    
    // Override collision radius for the byte container
    public getCollisionRadius(): number {
        return this.radius * 1.6;
    }

    public getValue(): number {
        return 8; // Bytes are worth 8 points (8 bits = 1 byte)
    }
}