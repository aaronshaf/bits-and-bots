import { Bot } from './Bot';
import { Bit } from './Bit';
import { Byte } from './Byte';
import { Bug } from './Bug';
import { Worm } from './Worm';
import { Projectile } from './Projectile';
import { GamepadManager } from './GamepadManager';
import { AudioManager } from './AudioManager';
import { COLORS } from './constants';
import { Level } from './Level';
import { Boss } from './Boss';
import { SaveSystem, GameSaveData } from './SaveSystem';
import { UIManager } from './UIManager';
import { ParticleSystem } from './ParticleSystem';
import { EntitySpawner } from './EntitySpawner';
import { CollisionSystem } from './systems/CollisionSystem';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private bots: Bot[] = [];
    private bits: Bit[] = [];
    private bytes: Byte[] = [];
    private bugs: Bug[] = [];
    private worms: Worm[] = [];
    private projectiles: Projectile[] = [];
    private gamepadManager: GamepadManager;
    private audioManager: AudioManager;
    private hasInteracted: boolean = false;
    private gameState: 'menu' | 'playing' | 'gameOver' = 'menu';
    private isPaused: boolean = false;
    private currentLevel: Level;
    private levelNumber: number = 1;
    private boss: Boss | null = null;
    private autoSaveTimer: number = 0;
    private autoSaveInterval: number = 5000;
    
    // New system managers
    private uiManager: UIManager;
    private particleSystem: ParticleSystem;
    private entitySpawner: EntitySpawner;
    private collisionSystem: CollisionSystem;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = ctx;
        this.gamepadManager = new GamepadManager();
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager();
        this.particleSystem = new ParticleSystem();
        this.entitySpawner = new EntitySpawner();
        this.collisionSystem = new CollisionSystem(
            this.audioManager,
            this.particleSystem,
            (bot: Bot) => this.handleBotDeath(bot),
            () => this.handleBossDefeat(),
            (bot: Bot) => this.checkPowerUpUnlock(bot)
        );
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initializeBots();
        this.currentLevel = new Level(this.levelNumber);
        
        this.setupUI();
        this.setupDevShortcuts();
    }
    
    private initializeBots(): void {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offset = 100;
        
        this.bots.push(new Bot(centerX - offset, centerY, 0));
        this.bots.push(new Bot(centerX + offset, centerY, 1));
    }
    
    private setupUI(): void {
        // Setup menu
        setTimeout(() => {
            this.uiManager.setupMenu(
                this.bots,
                this.gamepadManager,
                () => this.onGameStart(),
                () => this.handleFirstInteraction(),
                this.canvas
            );
            
            const isPausedRef = { value: this.isPaused };
            this.uiManager.setupPreferences(
                this.audioManager,
                isPausedRef,
                this.gameState
            );
            // Update isPaused from ref
            Object.defineProperty(this, 'isPaused', {
                get: () => isPausedRef.value,
                set: (value) => { isPausedRef.value = value; }
            });
        }, 0);
    }
    
    private async handleFirstInteraction(): Promise<void> {
        if (!this.hasInteracted) {
            this.hasInteracted = true;
            await this.audioManager.init();
        }
    }
    
    private onGameStart(): void {
        // Load saved game if available
        const savedGame = SaveSystem.loadGame();
        if (savedGame) {
            this.loadSavedGame(savedGame);
        }
        
        this.gameState = 'playing';
        
        // Initialize audio and start music
        this.handleFirstInteraction().then(async () => {
            await this.audioManager.playLevelMusic(this.levelNumber);
        });
    }
    
    private loadSavedGame(savedData: GameSaveData): void {
        this.levelNumber = savedData.levelNumber;
        this.currentLevel = new Level(this.levelNumber);
        
        if (this.bots[0]) {
            this.bots[0].score = savedData.player1Score;
            this.bots[0].lives = savedData.player1Lives;
        }
        if (this.bots[1]) {
            this.bots[1].score = savedData.player2Score;
            this.bots[1].lives = savedData.player2Lives;
        }
        
        this.audioManager.setMusicVolume(savedData.musicVolume);
        this.audioManager.setSfxVolume(savedData.sfxVolume);
        
        this.uiManager.loadSavedGameUI(savedData);
    }
    
    private saveGame(): void {
        if (this.gameState !== 'playing') return;
        
        const saveData: GameSaveData = {
            levelNumber: this.levelNumber,
            player1Score: this.bots[0]?.score || 0,
            player2Score: this.bots[1]?.score || 0,
            player1Lives: this.bots[0]?.lives || 3,
            player2Lives: this.bots[1]?.lives || 3,
            musicVolume: parseFloat((document.getElementById('music-volume') as HTMLInputElement)?.value || '80') / 100,
            sfxVolume: parseFloat((document.getElementById('sfx-volume') as HTMLInputElement)?.value || '40') / 100,
            timestamp: Date.now()
        };
        
        SaveSystem.saveGame(saveData);
    }
    
    private setupDevShortcuts(): void {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.addEventListener('keydown', (e) => {
                if (this.gameState !== 'playing') return;
                
                if (e.key === '<') {
                    const newLevel = Math.max(1, this.levelNumber - 1);
                    if (newLevel !== this.levelNumber) {
                        this.levelNumber = newLevel;
                        this.startDevLevel();
                    }
                } else if (e.key === '>') {
                    const newLevel = Math.min(100, this.levelNumber + 1);
                    if (newLevel !== this.levelNumber) {
                        this.levelNumber = newLevel;
                        this.startDevLevel();
                    }
                }
            });
        }
    }
    
    private startDevLevel(): void {
        this.currentLevel = new Level(this.levelNumber);
        this.boss = null;
        this.bugs = [];
        this.worms = [];
        this.bits = [];
        this.bytes = [];
        this.projectiles = [];
        
        const config = this.currentLevel.getConfig();
        this.entitySpawner.updateSpawnRates(config);
        this.entitySpawner.resetTimers();
        
        this.bots.forEach(bot => {
            bot.health = bot.maxHealth;
        });
        
        const levelNumber = document.querySelector('.level-number');
        if (levelNumber) levelNumber.textContent = this.levelNumber.toString();
        
        this.audioManager.playLevelMusic(this.levelNumber).catch(console.error);
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
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        // Auto-save
        this.autoSaveTimer += deltaTime;
        if (this.autoSaveTimer >= this.autoSaveInterval) {
            this.saveGame();
            this.autoSaveTimer = 0;
        }
        
        // Update bots
        this.updateBots(deltaTime);
        
        // Update entities
        this.bits.forEach(bit => bit.update(deltaTime));
        this.bytes.forEach(byte => byte.update(deltaTime));
        this.bits = this.bits.filter(bit => !bit.isOffScreen());
        
        this.bugs.forEach(bug => {
            bug.setTarget(this.bits, this.bytes, this.bots);
            bug.update(deltaTime);
            bug.bounceOffWalls(this.canvas.width, this.canvas.height);
        });
        
        this.worms.forEach(worm => {
            worm.setTarget(this.bits, this.bytes, this.bots);
            worm.update(deltaTime);
            worm.bounceOffWalls(this.canvas.width, this.canvas.height);
        });
        
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return !projectile.isExpired() && 
                   projectile.x >= 0 && projectile.x <= this.canvas.width &&
                   projectile.y >= 0 && projectile.y <= this.canvas.height;
        });
        
        // Update spawner
        this.entitySpawner.update(deltaTime);
        if (this.entitySpawner.shouldSpawnCollectible()) {
            const collectible = this.entitySpawner.spawnCollectible(this.canvas.width, this.canvas.height);
            if (collectible instanceof Bit) {
                this.bits.push(collectible);
            } else {
                this.bytes.push(collectible);
            }
        }
        
        if (this.entitySpawner.shouldSpawnBug()) {
            this.bugs.push(this.entitySpawner.spawnBug(this.canvas.width, this.canvas.height));
        }
        
        if (this.entitySpawner.shouldSpawnWorm()) {
            this.worms.push(this.entitySpawner.spawnWorm(this.canvas.width, this.canvas.height));
        }
        
        // Check collisions
        this.collisionSystem.checkCollisions(
            this.bots, this.bits, this.bytes, this.bugs, this.worms,
            this.projectiles, this.boss, this.currentLevel,
            this.canvas.width, this.canvas.height
        );
        
        // Update particles
        this.particleSystem.update(deltaTime);
        
        // Update UI
        this.uiManager.updateScoreDisplay(this.bots, this.currentLevel, this.levelNumber);
        
        // Check for boss spawn
        if (this.currentLevel.shouldSpawnBoss() && !this.boss) {
            this.boss = this.entitySpawner.spawnBoss(this.currentLevel, this.levelNumber, this.canvas.width, this.canvas.height);
            this.currentLevel.markBossSpawned();
            this.bugs = []; // Clear regular bugs when boss appears
            this.worms = []; // Clear worms when boss appears
        }
        
        // Update boss
        if (this.boss) {
            this.boss.update(deltaTime, this.bots, this.projectiles);
            const attacks = this.boss.attack();
            this.entitySpawner.processBossAttacks(attacks, this.bugs);
        }
    }
    
    private updateBots(deltaTime: number): void {
        this.bots.forEach((bot, index) => {
            const gamepadState = this.gamepadManager.getGamepadState(index);
            if (gamepadState) {
                bot.setVelocity(gamepadState.axes.leftX, gamepadState.axes.leftY);
                bot.setAimDirection(gamepadState.axes.rightX, gamepadState.axes.rightY);
                
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
                
                if (gamepadState.buttons.b && !bot.hasShield()) {
                    bot.activateShield();
                    this.audioManager.playShieldSound();
                }
            }
            
            bot.update(deltaTime);
            bot.keepInBounds(this.canvas.width, this.canvas.height);
        });
    }
    
    private checkPowerUpUnlock(bot: Bot): void {
        const score = bot.score;
        
        if (score >= 50 && !bot.hasPowerUp('rapidFire')) {
            bot.addPowerUp('rapidFire');
        }
        if (score >= 100 && !bot.hasPowerUp('tripleBurst')) {
            bot.addPowerUp('tripleBurst');
        }
        if (score >= 200 && !bot.hasPowerUp('piercing')) {
            bot.addPowerUp('piercing');
        }
        if (score >= 300 && !bot.hasPowerUp('speedBoost')) {
            bot.addPowerUp('speedBoost');
        }
    }
    
    private handleBotDeath(bot: Bot): void {
        if (bot.isAlive()) {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const offset = 100;
            const x = bot.getPlayerIndex() === 0 ? centerX - offset : centerX + offset;
            bot.respawn(x, centerY);
        } else {
            const allDead = this.bots.every(b => !b.isAlive());
            if (allDead) {
                this.gameState = 'gameOver';
                this.uiManager.showGameOver();
            }
        }
    }
    
    private handleBossDefeat(): void {
        this.bots.forEach(bot => {
            bot.addScore(100 * this.levelNumber);
        });
        
        this.audioManager.playBugDestroySound();
        this.particleSystem.createBugDeathEffect(this.boss!.x, this.boss!.y, 10, COLORS.bug);
        
        this.currentLevel.markComplete();
        this.audioManager.playLevelCompleteSound();
        
        setTimeout(() => {
            this.startNextLevel();
        }, 2000);
    }
    
    private startNextLevel(): void {
        this.levelNumber++;
        this.currentLevel = new Level(this.levelNumber);
        this.boss = null;
        this.bugs = [];
        this.worms = [];
        this.bits = [];
        this.bytes = [];
        
        const config = this.currentLevel.getConfig();
        this.entitySpawner.updateSpawnRates(config);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offset = 100;
        this.bots[0].x = centerX - offset;
        this.bots[0].y = centerY;
        if (this.bots[1]) {
            this.bots[1].x = centerX + offset;
            this.bots[1].y = centerY;
        }
        
        this.audioManager.playLevelMusic(this.levelNumber).catch(console.error);
        this.saveGame();
    }
    
    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.bits.forEach(bit => bit.render(this.ctx));
        this.bytes.forEach(byte => byte.render(this.ctx));
        this.bugs.forEach(bug => bug.render(this.ctx));
        this.worms.forEach(worm => worm.render(this.ctx));
        
        if (this.boss) {
            this.boss.render(this.ctx);
        }
        
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        this.particleSystem.render(this.ctx);
        this.bots.forEach(bot => bot.render(this.ctx));
    }
}