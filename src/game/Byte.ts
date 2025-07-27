import { Entity } from './Entity';
import { COLORS, SIZES } from './constants';

export class Byte extends Entity {
    private rotationAngle: number = 0;
    private floatOffset: number = 0;
    private bitPattern: string[];
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.byte, COLORS.byte);
        this.floatOffset = Math.random() * Math.PI * 2;
        // Generate random 8-bit pattern
        this.bitPattern = Array(8).fill(0).map(() => Math.random() > 0.5 ? '1' : '0');
    }

    public update(deltaTime: number): void {
        // Rotate the byte
        this.rotationAngle += (deltaTime / 1000) * Math.PI;
        this.floatOffset += deltaTime / 1000;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        const floatY = Math.sin(this.floatOffset * 2) * 2;
        ctx.translate(this.x, this.y + floatY);
        ctx.rotate(this.rotationAngle);
        
        // Outer glow
        const glowSize = this.radius * 2;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, this.color + '66');
        gradient.addColorStop(0.5, this.color + '33');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Background container with rounded corners
        const containerSize = this.radius * 1.4;
        const cornerRadius = 3;
        
        ctx.fillStyle = this.color + '44';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(-containerSize + cornerRadius, -containerSize);
        ctx.lineTo(containerSize - cornerRadius, -containerSize);
        ctx.arc(containerSize - cornerRadius, -containerSize + cornerRadius, cornerRadius, -Math.PI/2, 0);
        ctx.lineTo(containerSize, containerSize - cornerRadius);
        ctx.arc(containerSize - cornerRadius, containerSize - cornerRadius, cornerRadius, 0, Math.PI/2);
        ctx.lineTo(-containerSize + cornerRadius, containerSize);
        ctx.arc(-containerSize + cornerRadius, containerSize - cornerRadius, cornerRadius, Math.PI/2, Math.PI);
        ctx.lineTo(-containerSize, -containerSize + cornerRadius);
        ctx.arc(-containerSize + cornerRadius, -containerSize + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw 8 bits in a 2x4 grid
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        
        const bitSize = 7;
        const spacing = 9;
        const startX = -spacing * 1.5;
        const startY = -spacing / 2;
        
        for (let i = 0; i < 8; i++) {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const x = startX + col * spacing;
            const y = startY + row * spacing;
            
            // Bit background
            ctx.fillStyle = this.color + '22';
            ctx.fillRect(x - bitSize/2, y - bitSize/2, bitSize, bitSize);
            
            // Bit value
            ctx.fillStyle = this.bitPattern[i] === '1' ? this.color : this.color + '88';
            ctx.fillText(this.bitPattern[i], x, y);
        }
        
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