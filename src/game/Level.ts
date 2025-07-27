export interface LevelConfig {
    levelNumber: number;
    bugSpawnInterval: number;
    bugSpeed: number;
    bugHealth: number;
    maxBugs: number;
    bitsRequired: number;
    bossType: string;
    backgroundColor?: string;
}

export class Level {
    private config: LevelConfig;
    private bitsCollected: number = 0;
    private bugsKilled: number = 0;
    private bossSpawned: boolean = false;
    private isComplete: boolean = false;

    constructor(levelNumber: number) {
        this.config = this.generateLevelConfig(levelNumber);
    }

    private generateLevelConfig(levelNumber: number): LevelConfig {
        // Difficulty scaling formulas
        const baseInterval = 3000;
        const intervalReduction = Math.max(500, baseInterval - (levelNumber * 20));
        
        const baseBugHealth = 1;
        const healthIncrease = Math.floor((levelNumber - 1) / 10) + 1;
        
        const maxBugs = Math.min(10 + Math.floor(levelNumber / 5), 50);
        
        // Bits required: 124 for level 1, then increases
        const bitsRequired = levelNumber === 1 ? 124 : 100 + (levelNumber * 24);

        // Boss types rotate through different patterns with creative variations
        const bossTypes = [
            'SwarmBoss',      // Spawns mini-bugs
            'TankBoss',       // High health, slow
            'SpeedBoss',      // Fast, unpredictable
            'SplitBoss',      // Splits when damaged
            'ShieldBoss',     // Periodic invulnerability
            'LaserBoss',      // Shoots laser beams
            'TeleportBoss',   // Teleports around
            'MimicBoss',      // Copies player abilities
            'GravityBoss',    // Pulls items and projectiles
            'TimeBoss'        // Slows down time
        ];
        
        const bossType = bossTypes[(levelNumber - 1) % bossTypes.length];

        return {
            levelNumber,
            bugSpawnInterval: intervalReduction,
            bugSpeed: 1 + (levelNumber * 0.1),
            bugHealth: healthIncrease,
            maxBugs,
            bitsRequired,
            bossType,
            backgroundColor: this.getLevelColor(levelNumber)
        };
    }

    private getLevelColor(level: number): string {
        // Gradually shift background color through levels
        const hue = (level * 3) % 360;
        return `hsl(${hue}, 10%, 10%)`;
    }

    public addBit(): void {
        this.bitsCollected++;
    }

    public addBugKill(): void {
        this.bugsKilled++;
    }

    public shouldSpawnBoss(): boolean {
        return this.bitsCollected >= this.config.bitsRequired && !this.bossSpawned;
    }

    public markBossSpawned(): void {
        this.bossSpawned = true;
    }

    public markComplete(): void {
        this.isComplete = true;
    }

    public getConfig(): LevelConfig {
        return this.config;
    }

    public getProgress(): number {
        return Math.min(1, this.bitsCollected / this.config.bitsRequired);
    }

    public getBitsCollected(): number {
        return this.bitsCollected;
    }

    public getBitsRequired(): number {
        return this.config.bitsRequired;
    }

    public isLevelComplete(): boolean {
        return this.isComplete;
    }
}