import { Bot } from './Bot';
import { Bit } from './Bit';
import { Byte } from './Byte';
import { Bug } from './Bug';
import { Projectile } from './Projectile';
import { GamepadManager } from './GamepadManager';
import { AudioManager } from './AudioManager';
import { COLORS } from './constants';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private bots: Bot[] = [];
    private bits: Bit[] = [];
    private bytes: Byte[] = [];
    private bugs: Bug[] = [];
    private projectiles: Projectile[] = [];
    private gamepadManager: GamepadManager;
    private audioManager: AudioManager;
    private spawnTimer: number = 0;
    private spawnInterval: number = 1000; // Spawn every 1 second
    private bugSpawnTimer: number = 0;
    private bugSpawnInterval: number = 3000; // Spawn bug every 3 seconds
    private hasInteracted: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = ctx;
        this.gamepadManager = new GamepadManager();
        this.audioManager = new AudioManager();
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initializeBots();
        
        // Start audio on first user interaction
        this.canvas.addEventListener('click', () => this.handleFirstInteraction());
        window.addEventListener('gamepadconnected', () => this.handleFirstInteraction());
    }

    private initializeBots(): void {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offset = 100;
        
        this.bots.push(new Bot(centerX - offset, centerY, 0));
        this.bots.push(new Bot(centerX + offset, centerY, 1));
    }
    
    private async handleFirstInteraction(): Promise<void> {
        if (!this.hasInteracted) {
            this.hasInteracted = true;
            await this.audioManager.init();
            this.audioManager.startMusic();
        }
    }

    private resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public start(): void {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    public stop(): void {
        this.isRunning = false;
    }

    private gameLoop = (currentTime: number): void => {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    };

    private update(deltaTime: number): void {
        // Update gamepad input for each bot
        this.bots.forEach((bot, index) => {
            const gamepadState = this.gamepadManager.getGamepadState(index);
            if (gamepadState) {
                bot.setVelocity(gamepadState.axes.leftX, gamepadState.axes.leftY);
                bot.setAimDirection(gamepadState.axes.rightX, gamepadState.axes.rightY);
                
                // Handle shooting (A button)
                if (gamepadState.buttons.a && bot.canShoot()) {
                    const direction = bot.getShootDirection();
                    this.projectiles.push(new Projectile(
                        bot.x,
                        bot.y,
                        direction,
                        bot.getPlayerIndex(),
                        bot.color
                    ));
                    bot.shoot();
                    this.audioManager.playShootSound();
                }
                
                // Handle shield (B button)
                if (gamepadState.buttons.b && !bot.hasShield()) {
                    bot.activateShield();
                    this.audioManager.playShieldSound();
                }
            }
            
            bot.update(deltaTime);
            bot.keepInBounds(this.canvas.width, this.canvas.height);
        });

        // Update collectibles
        this.bits.forEach(bit => bit.update(deltaTime));
        this.bytes.forEach(byte => byte.update(deltaTime));

        // Update bugs
        this.bugs.forEach(bug => {
            bug.update(deltaTime);
            bug.bounceOffWalls(this.canvas.width, this.canvas.height);
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            // Remove if expired or out of bounds
            return !projectile.isExpired() && 
                   projectile.x >= 0 && projectile.x <= this.canvas.width &&
                   projectile.y >= 0 && projectile.y <= this.canvas.height;
        });

        // Spawn new collectibles
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnCollectible();
            this.spawnTimer = 0;
        }

        // Spawn new bugs
        this.bugSpawnTimer += deltaTime;
        if (this.bugSpawnTimer >= this.bugSpawnInterval) {
            this.spawnBug();
            this.bugSpawnTimer = 0;
        }

        // Check collisions
        this.checkCollisions();

        // Update scores in UI
        this.updateScoreDisplay();
    }

    private spawnCollectible(): void {
        const margin = 50;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);
        
        // 80% chance for bit, 20% for byte
        if (Math.random() < 0.8) {
            this.bits.push(new Bit(x, y));
        } else {
            this.bytes.push(new Byte(x, y));
        }
    }

    private spawnBug(): void {
        const margin = 50;
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;
        
        switch (edge) {
            case 0: // Top
                x = margin + Math.random() * (this.canvas.width - margin * 2);
                y = margin;
                break;
            case 1: // Right
                x = this.canvas.width - margin;
                y = margin + Math.random() * (this.canvas.height - margin * 2);
                break;
            case 2: // Bottom
                x = margin + Math.random() * (this.canvas.width - margin * 2);
                y = this.canvas.height - margin;
                break;
            case 3: // Left
                x = margin;
                y = margin + Math.random() * (this.canvas.height - margin * 2);
                break;
            default:
                x = this.canvas.width / 2;
                y = this.canvas.height / 2;
        }
        
        this.bugs.push(new Bug(x, y));
    }

    private checkCollisions(): void {
        // Check bot-bit collisions
        this.bots.forEach(bot => {
            this.bits = this.bits.filter(bit => {
                if (bot.collidesWith(bit)) {
                    bot.addScore(bit.getValue());
                    this.audioManager.playCollectSound(false);
                    return false; // Remove collected bit
                }
                return true;
            });

            this.bytes = this.bytes.filter(byte => {
                if (bot.collidesWith(byte)) {
                    bot.addScore(byte.getValue());
                    this.audioManager.playCollectSound(true);
                    return false; // Remove collected byte
                }
                return true;
            });

            // Check bug collisions (reduce score)
            this.bugs.forEach(bug => {
                if (bot.collidesWith(bug) && !bot.hasShield()) {
                    bot.addScore(-5); // Lose 5 points when hit by bug
                    this.audioManager.playHitSound();
                    // Push bot away from bug
                    const dx = bot.x - bug.x;
                    const dy = bot.y - bug.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        bot.x += (dx / distance) * 30;
                        bot.y += (dy / distance) * 30;
                        bot.keepInBounds(this.canvas.width, this.canvas.height);
                    }
                }
            });
        });

        // Check projectile-bug collisions
        this.projectiles.forEach(projectile => {
            this.bugs = this.bugs.filter(bug => {
                if (projectile.collidesWith(bug)) {
                    // Award points to the bot that shot the projectile
                    const shooter = this.bots[projectile.ownerId];
                    if (shooter) {
                        shooter.addScore(3); // 3 points for destroying a bug
                    }
                    this.audioManager.playBugDestroySound();
                    return false; // Remove bug
                }
                return true;
            });
        });
    }

    private updateScoreDisplay(): void {
        const player1Score = document.querySelector('#player1-score .score');
        const player2Score = document.querySelector('#player2-score .score');
        
        if (player1Score) player1Score.textContent = this.bots[0]?.score.toString() ?? '0';
        if (player2Score) player2Score.textContent = this.bots[1]?.score.toString() ?? '0';
    }

    private render(): void {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw collectibles
        this.bits.forEach(bit => bit.render(this.ctx));
        this.bytes.forEach(byte => byte.render(this.ctx));
        
        // Draw bugs
        this.bugs.forEach(bug => bug.render(this.ctx));
        
        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Draw bots
        this.bots.forEach(bot => bot.render(this.ctx));
    }
}