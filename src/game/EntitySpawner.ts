import { Bit } from './Bit';
import { Byte } from './Byte';
import { Bug } from './Bug';
import { Boss, SwarmBoss } from './Boss';
import { Level } from './Level';

export class EntitySpawner {
    private spawnTimer: number = 0;
    private spawnInterval: number = 300; // Spawn more frequently for Matrix effect
    private bugSpawnTimer: number = 0;
    private bugSpawnInterval: number = 3000; // Spawn bug every 3 seconds
    
    public update(deltaTime: number): void {
        this.spawnTimer += deltaTime;
        this.bugSpawnTimer += deltaTime;
    }
    
    public shouldSpawnCollectible(): boolean {
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            return true;
        }
        return false;
    }
    
    public shouldSpawnBug(): boolean {
        if (this.bugSpawnTimer >= this.bugSpawnInterval) {
            this.bugSpawnTimer = 0;
            return true;
        }
        return false;
    }
    
    public spawnCollectible(canvasWidth: number, canvasHeight: number): Bit | Byte {
        const margin = 50;
        const x = margin + Math.random() * (canvasWidth - margin * 2);
        
        // 90% chance for bit (falling from top), 10% for byte (appears in middle)
        if (Math.random() < 0.9) {
            return new Bit(x, -10); // Start above screen
        } else {
            // Bytes appear in playable area
            const y = margin + Math.random() * (canvasHeight - margin * 2);
            return new Byte(x, y);
        }
    }
    
    public spawnBug(canvasWidth: number, canvasHeight: number): Bug {
        const margin = 50;
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;
        
        switch (edge) {
            case 0: // Top
                x = margin + Math.random() * (canvasWidth - margin * 2);
                y = margin;
                break;
            case 1: // Right
                x = canvasWidth - margin;
                y = margin + Math.random() * (canvasHeight - margin * 2);
                break;
            case 2: // Bottom
                x = margin + Math.random() * (canvasWidth - margin * 2);
                y = canvasHeight - margin;
                break;
            case 3: // Left
                x = margin;
                y = margin + Math.random() * (canvasHeight - margin * 2);
                break;
            default:
                x = canvasWidth / 2;
                y = canvasHeight / 2;
        }
        
        return new Bug(x, y);
    }
    
    public spawnBoss(level: Level, levelNumber: number, canvasWidth: number, canvasHeight: number): Boss {
        const config = level.getConfig();
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Create boss based on type
        switch (config.bossType) {
            case 'SwarmBoss':
                return new SwarmBoss(centerX, centerY - 100, levelNumber);
            // Add more boss types later
            default:
                return new SwarmBoss(centerX, centerY - 100, levelNumber);
        }
    }
    
    public processBossAttacks(attacks: any[], bugs: Bug[]): void {
        attacks.forEach(attack => {
            switch (attack.type) {
                case 'spawn_minibug':
                    // Spawn a mini bug at specified position
                    const bug = new Bug(attack.x, attack.y);
                    bugs.push(bug);
                    break;
                // Add more attack types as we implement more bosses
            }
        });
    }
    
    public updateSpawnRates(config: any): void {
        this.bugSpawnInterval = config.bugSpawnInterval;
    }
    
    public resetTimers(): void {
        this.spawnTimer = 0;
        this.bugSpawnTimer = 0;
    }
}