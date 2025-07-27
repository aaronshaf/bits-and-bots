import { Entity } from './Entity';
import { COLORS, SIZES, SPEEDS } from './constants';

export class Bug extends Entity {
    private vx: number;
    private vy: number;
    private targetChangeTimer: number = 0;
    private targetChangeInterval: number = 500; // More responsive targeting
    private collectedCount: number = 0;
    private growthLevel: number = 0;
    private baseRadius: number;
    private targetEntity: Entity | null = null;
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.bug, COLORS.bug);
        this.baseRadius = SIZES.bug;
        this.setRandomVelocity();
    }
    
    // Override collision radius to account for legs
    public getCollisionRadius(): number {
        return this.radius * 1.5; // Legs extend beyond body
    }

    private setRandomVelocity(): void {
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    public setTarget(bits: Entity[], bytes: Entity[], bots: Entity[]): void {
        // Find nearest target (prioritize bytes > bits > bots)
        let nearestTarget: Entity | null = null;
        let nearestDistance = Infinity;

        // Check bytes first (most valuable)
        [...bytes, ...bits, ...bots].forEach(entity => {
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = entity;
            }
        });

        this.targetEntity = nearestTarget;
    }

    public update(deltaTime: number): void {
        // Update velocity based on target
        if (this.targetEntity) {
            const dx = this.targetEntity.x - this.x;
            const dy = this.targetEntity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Move towards target with increased speed based on growth
                const speedMultiplier = 1 + (this.growthLevel * 0.3);
                this.vx = (dx / distance) * speedMultiplier;
                this.vy = (dy / distance) * speedMultiplier;
            }
        } else {
            // Random movement if no target
            this.targetChangeTimer += deltaTime;
            if (this.targetChangeTimer >= this.targetChangeInterval) {
                this.setRandomVelocity();
                this.targetChangeTimer = 0;
            }
        }

        // Update position
        const speed = SPEEDS.bug * (deltaTime / 1000);
        this.x += this.vx * speed;
        this.y += this.vy * speed;
    }

    public collect(): void {
        this.collectedCount++;
        
        // Grow every 3 collections
        if (this.collectedCount % 3 === 0) {
            this.growthLevel++;
            this.radius = this.baseRadius * (1 + this.growthLevel * 0.2);
        }
    }

    public getGrowthLevel(): number {
        return this.growthLevel;
    }

    public getDamage(): number {
        return 5 + (this.growthLevel * 2); // More damage as bug grows
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Scale based on growth
        const scale = 1 + (this.growthLevel * 0.2);
        ctx.scale(scale, scale);
        
        // More aggressive wiggle for bigger bugs
        const wiggle = Math.sin(Date.now() / (100 - this.growthLevel * 10)) * (2 + this.growthLevel);
        ctx.rotate(wiggle * 0.05);
        
        // Draw legs (6 legs for a proper bug)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const legLength = this.radius * 1.5;
            const x1 = Math.cos(angle) * this.radius * 0.8;
            const y1 = Math.sin(angle) * this.radius * 0.8;
            const x2 = Math.cos(angle) * legLength;
            const y2 = Math.sin(angle) * legLength;
            
            // Leg segments
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            const midX = (x1 + x2) / 2 + Math.sin(angle + Date.now() / 200) * 3;
            const midY = (y1 + y2) / 2 + Math.cos(angle + Date.now() / 200) * 3;
            ctx.lineTo(midX, midY);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Leg joints
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(midX, midY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Bug body (abdomen)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.3, this.radius * 0.8, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bug head
        ctx.beginPath();
        ctx.arc(0, -this.radius * 0.5, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Pattern on body
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(0, this.radius);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Evil eyes - get redder with growth
        ctx.globalAlpha = 1;
        const eyeRedness = Math.min(255, 200 + this.growthLevel * 20);
        ctx.fillStyle = `rgb(${eyeRedness}, 0, 0)`;
        const eyeSize = 3 + this.growthLevel * 0.5;
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.radius * 0.3, -this.radius * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye glow - more intense with growth
        ctx.fillStyle = '#ffaaaa';
        ctx.globalAlpha = 0.6 + this.growthLevel * 0.1;
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.5, eyeSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.radius * 0.3, -this.radius * 0.5, eyeSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Antennae
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.2, -this.radius * 0.8);
        ctx.quadraticCurveTo(-this.radius * 0.3, -this.radius * 1.2, -this.radius * 0.4, -this.radius * 1.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.2, -this.radius * 0.8);
        ctx.quadraticCurveTo(this.radius * 0.3, -this.radius * 1.2, this.radius * 0.4, -this.radius * 1.3);
        ctx.stroke();
        
        ctx.restore();
    }

    public bounceOffWalls(width: number, height: number): void {
        if (this.x - this.radius <= 0 || this.x + this.radius >= width) {
            this.vx = -this.vx;
            this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        }
        if (this.y - this.radius <= 0 || this.y + this.radius >= height) {
            this.vy = -this.vy;
            this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
        }
    }
}