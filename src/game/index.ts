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
    private spawnInterval: number = 300; // Spawn more frequently for Matrix effect
    private bugSpawnTimer: number = 0;
    private bugSpawnInterval: number = 3000; // Spawn bug every 3 seconds
    private hasInteracted: boolean = false;
    private gameState: 'menu' | 'playing' | 'gameOver' = 'menu';

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
        
        // Setup menu
        this.setupMenu();
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
    
    private setupMenu(): void {
        const menuEl = document.getElementById('game-menu');
        const startButton = document.getElementById('start-button');
        const player1UI = document.getElementById('player1-ui');
        const player2UI = document.getElementById('player2-ui');
        
        if (menuEl && startButton && player1UI && player2UI) {
            player1UI.classList.add('hidden');
            player2UI.classList.add('hidden');
            
            const startGame = () => {
                const connectedCount = this.gamepadManager.getConnectedCount();
                if (connectedCount === 0) {
                    // Update menu text
                    const p = menuEl.querySelector('p');
                    if (p) p.textContent = 'Please connect at least one gamepad!';
                    return;
                }
                
                menuEl.classList.add('hidden');
                player1UI.classList.remove('hidden');
                if (connectedCount > 1) {
                    player2UI.classList.remove('hidden');
                } else {
                    // Single player mode - hide second bot
                    this.bots = [this.bots[0]];
                }
                this.gameState = 'playing';
                this.handleFirstInteraction();
            };
            
            startButton.addEventListener('click', startGame);
            
            // Check for gamepad A button press in menu
            this.menuGamepadCheck = setInterval(() => {
                if (this.gameState !== 'menu') {
                    clearInterval(this.menuGamepadCheck);
                    return;
                }
                
                for (let i = 0; i < 2; i++) {
                    const gamepadState = this.gamepadManager.getGamepadState(i);
                    if (gamepadState?.buttons.a) {
                        startGame();
                        break;
                    }
                }
                
                // Update player count display
                const connectedCount = this.gamepadManager.getConnectedCount();
                const p = menuEl.querySelector('p');
                if (p) {
                    if (connectedCount === 0) {
                        p.textContent = 'Connect your gamepads to play!';
                    } else if (connectedCount === 1) {
                        p.textContent = '1 gamepad connected - Press A to start!';
                    } else {
                        p.textContent = `${connectedCount} gamepads connected - Press A to start!`;
                    }
                }
            }, 100);
        }
    }
    
    private menuGamepadCheck?: number;

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
        if (this.gameState !== 'playing') return;
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
        
        // Remove off-screen bits
        this.bits = this.bits.filter(bit => !bit.isOffScreen());

        // Update bugs
        this.bugs.forEach(bug => {
            bug.setTarget(this.bits, this.bytes, this.bots);
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

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.life -= deltaTime;
            particle.vx *= 0.98; // Friction
            particle.vy *= 0.98;
            return particle.life > 0;
        });

        // Update scores in UI
        this.updateScoreDisplay();
    }
    
    private checkPowerUpUnlock(bot: Bot): void {
        const score = bot.score;
        
        // Power-up thresholds
        if (score >= 50 && !bot.hasPowerUp('rapidFire')) {
            bot.addPowerUp('rapidFire');
            this.createPowerUpEffect(bot.x, bot.y, 'Rapid Fire!');
        }
        if (score >= 100 && !bot.hasPowerUp('tripleBurst')) {
            bot.addPowerUp('tripleBurst');
            this.createPowerUpEffect(bot.x, bot.y, 'Triple Burst!');
        }
        if (score >= 200 && !bot.hasPowerUp('piercing')) {
            bot.addPowerUp('piercing');
            this.createPowerUpEffect(bot.x, bot.y, 'Piercing Shots!');
        }
        if (score >= 300 && !bot.hasPowerUp('speedBoost')) {
            bot.addPowerUp('speedBoost');
            this.createPowerUpEffect(bot.x, bot.y, 'Speed Boost!');
        }
    }
    
    private createPowerUpEffect(x: number, y: number, text: string): void {
        // Add to UI notifications (implement later)
        console.log(`Power-up unlocked: ${text}`);
    }

    private spawnCollectible(): void {
        const margin = 50;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        
        // 90% chance for bit (falling from top), 10% for byte (appears in middle)
        if (Math.random() < 0.9) {
            this.bits.push(new Bit(x, -10)); // Start above screen
        } else {
            // Bytes appear in playable area
            const y = margin + Math.random() * (this.canvas.height - margin * 2);
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
                    
                    // Replenish health slightly
                    bot.heal(2);
                    
                    // Check for power-up thresholds
                    this.checkPowerUpUnlock(bot);
                    
                    this.audioManager.playCollectSound(false);
                    return false; // Remove collected bit
                }
                return true;
            });

            this.bytes = this.bytes.filter(byte => {
                if (bot.collidesWith(byte)) {
                    bot.addScore(byte.getValue());
                    
                    // Replenish health significantly and gradually restore a life
                    bot.heal(20);
                    bot.addLifeProgress(0.25); // 4 bytes = 1 life
                    
                    this.audioManager.playCollectSound(true);
                    return false; // Remove collected byte
                }
                return true;
            });

            // Check bug collisions
            this.bugs.forEach(bug => {
                if (bot.collidesWith(bug)) {
                    const damage = bug.getDamage();
                    if (bot.takeDamage(damage)) {
                        // Bot died
                        this.handleBotDeath(bot);
                    } else if (!bot.hasShield()) {
                        this.audioManager.playHitSound();
                        this.createPlayerHitEffect(bot.x, bot.y);
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
                }
            });
        });

        // Check projectile-bug collisions
        this.projectiles = this.projectiles.filter(projectile => {
            let projectileHit = false;
            
            this.bugs = this.bugs.filter(bug => {
                if (!projectileHit && projectile.collidesWith(bug)) {
                    projectileHit = true; // Mark projectile as used
                    
                    if (bug.takeDamage()) {
                        // Bug died
                        const shooter = this.bots[projectile.ownerId];
                        if (shooter) {
                            // More points for bigger bugs
                            const points = 3 + bug.getGrowthLevel() * 2;
                            shooter.addScore(points);
                        }
                        this.audioManager.playBugDestroySound();
                        this.createBugDeathEffect(bug.x, bug.y, bug.getGrowthLevel());
                        return false; // Remove bug
                    } else {
                        // Bug survived - play hit sound
                        this.audioManager.playHitSound();
                        return true; // Keep bug
                    }
                }
                return true;
            });
            
            return !projectileHit; // Remove projectile if it hit
        });
        
        // Let bugs collect bits and bytes
        this.bugs.forEach(bug => {
            this.bits = this.bits.filter(bit => {
                if (bug.collidesWith(bit)) {
                    bug.collect();
                    return false;
                }
                return true;
            });
            
            this.bytes = this.bytes.filter(byte => {
                if (bug.collidesWith(byte)) {
                    bug.collect();
                    return false;
                }
                return true;
            });
        });
    }
    
    private handleBotDeath(bot: Bot): void {
        if (bot.isAlive()) {
            // Respawn at original position
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const offset = 100;
            const x = bot.getPlayerIndex() === 0 ? centerX - offset : centerX + offset;
            bot.respawn(x, centerY);
        } else {
            // Check if both players are dead
            const allDead = this.bots.every(b => !b.isAlive());
            if (allDead) {
                this.gameState = 'gameOver';
                this.showGameOver();
            }
        }
    }
    
    private showGameOver(): void {
        const menuEl = document.getElementById('game-menu');
        if (menuEl) {
            const h1 = menuEl.querySelector('h1');
            if (h1) h1.textContent = 'Game Over';
            menuEl.classList.remove('hidden');
        }
    }
    
    private createBugDeathEffect(x: number, y: number, growthLevel: number): void {
        // Create explosion particles based on bug size
        const particleCount = 10 + growthLevel * 5;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200 * (1 + growthLevel * 0.3),
                vy: (Math.random() - 0.5) * 200 * (1 + growthLevel * 0.3),
                life: 1000,
                color: COLORS.bug,
                size: 3 + growthLevel
            });
        }
    }
    
    private createPlayerHitEffect(x: number, y: number): void {
        // Create impact effect
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
    
    private particles: Array<{
        x: number, y: number, vx: number, vy: number,
        life: number, color: string, size: number
    }> = [];

    private updateScoreDisplay(): void {
        // Update player 1
        const p1Score = document.querySelector('#player1-ui .score-value');
        const p1Health = document.querySelector('#player1-ui .health-fill') as HTMLElement;
        const p1HealthText = document.querySelector('#player1-ui .health-text');
        const p1Lives = document.querySelector('#player1-ui .lives-value');
        
        if (this.bots[0]) {
            const bot = this.bots[0];
            const healthPercent = Math.max(0, (bot.health / bot.maxHealth) * 100);
            
            if (p1Score) p1Score.textContent = bot.score.toString();
            if (p1Health) p1Health.style.width = healthPercent + '%';
            if (p1HealthText) p1HealthText.textContent = Math.floor(healthPercent) + '%';
            if (p1Lives) p1Lives.textContent = bot.lives.toString();
        }
        
        // Update player 2
        const p2Score = document.querySelector('#player2-ui .score-value');
        const p2Health = document.querySelector('#player2-ui .health-fill') as HTMLElement;
        const p2HealthText = document.querySelector('#player2-ui .health-text');
        const p2Lives = document.querySelector('#player2-ui .lives-value');
        
        if (this.bots[1]) {
            const bot = this.bots[1];
            const healthPercent = Math.max(0, (bot.health / bot.maxHealth) * 100);
            
            if (p2Score) p2Score.textContent = bot.score.toString();
            if (p2Health) p2Health.style.width = healthPercent + '%';
            if (p2HealthText) p2HealthText.textContent = Math.floor(healthPercent) + '%';
            if (p2Lives) p2Lives.textContent = bot.lives.toString();
        }
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
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / 1000;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw bots
        this.bots.forEach(bot => bot.render(this.ctx));
    }
}