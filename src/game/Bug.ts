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
    private currentRadius: number;
    private targetRadius: number;
    private health: number = 1;
    private maxHealth: number = 1;
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.bug, COLORS.bug);
        this.baseRadius = SIZES.bug;
        this.currentRadius = SIZES.bug;
        this.targetRadius = SIZES.bug;
        this.setRandomVelocity();
    }
    
    // Override collision radius to account for body only
    public getCollisionRadius(): number {
        return this.radius; // More precise collision detection
    }

    private setRandomVelocity(): void {
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    public setTarget(bits: Entity[], bytes: Entity[], bots: Entity[]): void {
        // Find nearest target (prioritize bots > bytes > bits for aggression)
        let nearestTarget: Entity | null = null;
        let nearestDistance = Infinity;

        // Prioritize bots when grown
        const targets = this.growthLevel >= 2 ? [...bots, ...bytes, ...bits] : [...bytes, ...bits, ...bots];
        
        targets.forEach(entity => {
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
                // Move towards target with moderate speed based on growth
                const speedMultiplier = 1 + (this.growthLevel * 0.2); // More balanced speed
                this.vx = (dx / distance) * speedMultiplier;
                this.vy = (dy / distance) * speedMultiplier;
                
                // Add slight prediction if chasing a bot (only for larger bugs)
                if (this.targetEntity.constructor.name === 'Bot' && this.growthLevel >= 3) {
                    const predictAmount = 0.05 * this.growthLevel;
                    this.vx += (this.targetEntity as any).vx * predictAmount;
                    this.vy += (this.targetEntity as any).vy * predictAmount;
                }
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
        
        // Smooth radius animation
        if (Math.abs(this.currentRadius - this.targetRadius) > 0.1) {
            this.currentRadius += (this.targetRadius - this.currentRadius) * 0.1;
            this.radius = this.currentRadius;
        }
    }

    public collect(): void {
        this.collectedCount++;
        
        // Grow every 3 collections
        if (this.collectedCount % 3 === 0 && this.growthLevel < 5) { // Cap at level 5
            this.growthLevel++;
            this.targetRadius = this.baseRadius * (1 + this.growthLevel * 0.1); // Subtle size increase
            this.health = (this.growthLevel + 1) * 2; // More health
            this.maxHealth = this.health;
        }
    }
    
    public takeDamage(): boolean {
        this.health--;
        if (this.health <= 0) {
            return true; // Bug is dead
        }
        
        // Visual feedback - temporarily shrink
        this.currentRadius *= 0.9;
        return false;
    }

    public getGrowthLevel(): number {
        return this.growthLevel;
    }

    public getDamage(): number {
        return 10 + (this.growthLevel * 5); // Much more damage as bug grows
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Scale based on growth (subtle)
        const scale = 1 + (this.growthLevel * 0.1);
        ctx.scale(scale, scale);
        
        // More aggressive wiggle and rotation for bigger bugs
        const wiggle = Math.sin(Date.now() / (100 - this.growthLevel * 15)) * (2 + this.growthLevel * 2);
        ctx.rotate(wiggle * 0.08);
        
        // Add pulsing glow for higher level bugs
        if (this.growthLevel >= 2) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 5 + this.growthLevel * 3 + Math.sin(Date.now() / 200) * 5;
        }
        
        // Draw legs - more spider-like and aggressive for higher levels
        const legCount = 6 + this.growthLevel; // More legs as it grows
        ctx.strokeStyle = this.growthLevel >= 3 ? '#000' : this.color;
        ctx.lineWidth = 2 + this.growthLevel * 0.5;
        
        for (let i = 0; i < legCount; i++) {
            const angle = (i / legCount) * Math.PI * 2;
            const legLength = this.radius * (1.5 + this.growthLevel * 0.2);
            const x1 = Math.cos(angle) * this.radius * 0.8;
            const y1 = Math.sin(angle) * this.radius * 0.8;
            const x2 = Math.cos(angle) * legLength;
            const y2 = Math.sin(angle) * legLength;
            
            // More erratic movement for higher level bugs
            const twitch = this.growthLevel * 2;
            
            // Leg segments
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            const midX = (x1 + x2) / 2 + Math.sin(angle + Date.now() / (200 - this.growthLevel * 20)) * (3 + twitch);
            const midY = (y1 + y2) / 2 + Math.cos(angle + Date.now() / (200 - this.growthLevel * 20)) * (3 + twitch);
            ctx.lineTo(midX, midY);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Spiky leg ends for higher levels
            if (this.growthLevel >= 3) {
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 + Math.cos(angle) * 3, y2 + Math.sin(angle) * 3);
                ctx.lineTo(x2 + Math.cos(angle + 0.3) * 2, y2 + Math.sin(angle + 0.3) * 2);
                ctx.closePath();
                ctx.fill();
            }
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