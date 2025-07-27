export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    
    public update(deltaTime: number): void {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.life -= deltaTime;
            particle.vx *= 0.98; // Friction
            particle.vy *= 0.98;
            return particle.life > 0;
        });
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life / 1000;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    public createBugDeathEffect(x: number, y: number, growthLevel: number, bugColor: string): void {
        const particleCount = 10 + growthLevel * 5;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200 * (1 + growthLevel * 0.3),
                vy: (Math.random() - 0.5) * 200 * (1 + growthLevel * 0.3),
                life: 1000,
                color: bugColor,
                size: 3 + growthLevel
            });
        }
    }
    
    public createPlayerHitEffect(x: number, y: number): void {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                life: 500,
                color: '#ffffff',
                size: 4
            });
        }
    }
}