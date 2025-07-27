import { Level } from '../Level';
import { Bot, Bug, Bit, Byte, Projectile, Boss } from '../entities';

export type GameMode = 'menu' | 'playing' | 'gameOver';

export class GameState {
    // Game mode
    public gameState: GameMode = 'menu';
    
    // Entities
    public bots: Bot[] = [];
    public bits: Bit[] = [];
    public bytes: Byte[] = [];
    public bugs: Bug[] = [];
    public projectiles: Projectile[] = [];
    public boss: Boss | null = null;
    
    // Level management
    public currentLevel: Level;
    public levelNumber: number = 1;
    
    // Spawn timers
    public spawnTimer: number = 0;
    public spawnInterval: number = 300; // Matrix effect frequency
    public bugSpawnTimer: number = 0;
    public bugSpawnInterval: number = 3000; // 3 seconds
    
    // Particles for effects
    public particles: Array<{
        x: number, y: number, vx: number, vy: number,
        life: number, color: string, size: number
    }> = [];
    
    constructor() {
        this.currentLevel = new Level(this.levelNumber);
    }
    
    public reset(): void {
        this.bots = [];
        this.bits = [];
        this.bytes = [];
        this.bugs = [];
        this.projectiles = [];
        this.boss = null;
        this.particles = [];
        this.spawnTimer = 0;
        this.bugSpawnTimer = 0;
    }
    
    public startNewLevel(levelNumber: number): void {
        this.levelNumber = levelNumber;
        this.currentLevel = new Level(levelNumber);
        this.boss = null;
        this.bugs = [];
        this.bits = [];
        this.bytes = [];
        
        // Update spawn rates based on level
        const config = this.currentLevel.getConfig();
        this.bugSpawnInterval = config.bugSpawnInterval;
    }
}