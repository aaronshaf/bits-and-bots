import { Entity } from './Entity';
import { COLORS, SIZES, SPEEDS } from './constants';

export class Worm extends Entity {
    private segments: { x: number, y: number }[] = [];
    private segmentCount: number = 8;
    private targetChangeTimer: number = 0;
    private targetChangeInterval: number = 1000;
    private direction: number = 0;
    private waveAmplitude: number = 0.3;
    private waveFrequency: number = 0.1;
    private time: number = 0;
    private health: number = 3;
    private maxHealth: number = 3;
    private growthLevel: number = 0;
    private collectedCount: number = 0;
    private baseRadius: number;
    private currentRadius: number;
    private targetRadius: number;
    private targetEntity: Entity | null = null;
    
    constructor(x: number, y: number) {
        super(x, y, SIZES.worm, COLORS.worm);
        this.baseRadius = SIZES.worm;
        this.currentRadius = SIZES.worm;
        this.targetRadius = SIZES.worm;
        this.initializeSegments();
    }
    
    private initializeSegments(): void {
        for (let i = 0; i < this.segmentCount; i++) {
            this.segments.push({
                x: this.x - i * this.radius * 1.5,
                y: this.y
            });
        }
    }
    
    public getCollisionRadius(): number {
        return this.radius * 0.9;
    }
    
    public setTarget(bits: Entity[], bytes: Entity[], bots: Entity[]): void {
        let nearestTarget: Entity | null = null;
        let nearestDistance = Infinity;
        
        const targets = this.growthLevel >= 2 ? [...bots, ...bytes, ...bits] : [...bits, ...bytes];
        
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
        this.time += deltaTime / 1000;
        
        if (this.targetEntity) {
            const dx = this.targetEntity.x - this.x;
            const dy = this.targetEntity.y - this.y;
            const targetDirection = Math.atan2(dy, dx);
            
            const angleDiff = ((targetDirection - this.direction) + Math.PI * 2) % (Math.PI * 2);
            if (angleDiff > Math.PI) {
                this.direction -= 0.05;
            } else {
                this.direction += 0.05;
            }
        } else {
            this.targetChangeTimer += deltaTime;
            if (this.targetChangeTimer >= this.targetChangeInterval) {
                this.direction += (Math.random() - 0.5) * Math.PI;
                this.targetChangeTimer = 0;
            }
        }
        
        const speed = SPEEDS.worm * (deltaTime / 1000) * (1 + this.growthLevel * 0.15);
        this.x += Math.cos(this.direction) * speed;
        this.y += Math.sin(this.direction) * speed;
        
        let prevX = this.x;
        let prevY = this.y;
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const dx = prevX - segment.x;
            const dy = prevY - segment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const targetDistance = this.radius * 1.2;
            
            if (distance > targetDistance) {
                const moveRatio = (distance - targetDistance) / distance;
                segment.x += dx * moveRatio;
                segment.y += dy * moveRatio;
            }
            
            prevX = segment.x;
            prevY = segment.y;
        }
        
        if (Math.abs(this.currentRadius - this.targetRadius) > 0.1) {
            this.currentRadius += (this.targetRadius - this.currentRadius) * 0.1;
            this.radius = this.currentRadius;
        }
    }
    
    public collect(): void {
        this.collectedCount++;
        
        if (this.collectedCount % 4 === 0 && this.growthLevel < 4) {
            this.growthLevel++;
            this.segmentCount += 2;
            this.targetRadius = this.baseRadius * (1 + this.growthLevel * 0.15);
            this.health = 3 + this.growthLevel * 2;
            this.maxHealth = this.health;
            
            const lastSegment = this.segments[this.segments.length - 1];
            for (let i = 0; i < 2; i++) {
                this.segments.push({
                    x: lastSegment.x,
                    y: lastSegment.y
                });
            }
        }
    }
    
    public takeDamage(): boolean {
        this.health--;
        if (this.health <= 0) {
            return true;
        }
        
        this.currentRadius *= 0.85;
        
        if (this.segments.length > 3) {
            this.segments.pop();
            this.segmentCount--;
        }
        
        return false;
    }
    
    public getGrowthLevel(): number {
        return this.growthLevel;
    }
    
    public getDamage(): number {
        return 15 + (this.growthLevel * 8);
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        if (this.growthLevel >= 2) {
            ctx.shadowColor = COLORS.worm;
            ctx.shadowBlur = 10 + this.growthLevel * 5 + Math.sin(Date.now() / 300) * 3;
        }
        
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            const scale = 1 - (i / this.segments.length) * 0.3;
            const segmentRadius = this.radius * scale;
            
            ctx.fillStyle = i % 2 === 0 ? COLORS.worm : '#8b5a00';
            
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segmentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            if (i < this.segments.length - 1) {
                const nextSegment = this.segments[i + 1];
                ctx.strokeStyle = COLORS.worm;
                ctx.lineWidth = segmentRadius * 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(segment.x, segment.y);
                ctx.lineTo(nextSegment.x, nextSegment.y);
                ctx.stroke();
            }
            
            if (i % 3 === 0 && this.growthLevel >= 1) {
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                for (let j = 0; j < 2; j++) {
                    const angle = (j * Math.PI) + Math.sin(this.time * 3 + i) * 0.3;
                    const legX = segment.x + Math.cos(angle) * segmentRadius * 1.5;
                    const legY = segment.y + Math.sin(angle) * segmentRadius * 1.5;
                    ctx.beginPath();
                    ctx.moveTo(segment.x, segment.y);
                    ctx.lineTo(legX, legY);
                    ctx.stroke();
                }
            }
        }
        
        const headScale = 1.2 + Math.sin(this.time * 5) * 0.1;
        ctx.fillStyle = COLORS.worm;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * headScale, this.radius * headScale * 0.9, this.direction, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        const eyeOffset = this.radius * 0.5;
        const eyeAngle = this.direction - Math.PI / 6;
        const eyeX1 = this.x + Math.cos(eyeAngle) * eyeOffset;
        const eyeY1 = this.y + Math.sin(eyeAngle) * eyeOffset;
        const eyeAngle2 = this.direction + Math.PI / 6;
        const eyeX2 = this.x + Math.cos(eyeAngle2) * eyeOffset;
        const eyeY2 = this.y + Math.sin(eyeAngle2) * eyeOffset;
        
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const mouthX = this.x + Math.cos(this.direction) * this.radius * 0.7;
        const mouthY = this.y + Math.sin(this.direction) * this.radius * 0.7;
        ctx.beginPath();
        ctx.arc(mouthX, mouthY, this.radius * 0.3, this.direction - 0.5, this.direction + 0.5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    public bounceOffWalls(width: number, height: number): void {
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.direction = Math.PI - this.direction;
        } else if (this.x + this.radius >= width) {
            this.x = width - this.radius;
            this.direction = Math.PI - this.direction;
        }
        
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.direction = -this.direction;
        } else if (this.y + this.radius >= height) {
            this.y = height - this.radius;
            this.direction = -this.direction;
        }
    }
}