import { GameState } from './GameState';
import { AudioManager } from '../AudioManager';

export class CollisionSystem {
    private gameState: GameState;
    private audioManager: AudioManager;
    private onBotDeath: (bot: any) => void;
    private onBossDefeat: () => void;
    private onCreateEffect: (type: string, x: number, y: number, level?: number) => void;
    private onCheckPowerUp: (bot: any) => void;

    constructor(
        gameState: GameState, 
        audioManager: AudioManager,
        callbacks: {
            onBotDeath: (bot: any) => void,
            onBossDefeat: () => void,
            onCreateEffect: (type: string, x: number, y: number, level?: number) => void,
            onCheckPowerUp: (bot: any) => void
        }
    ) {
        this.gameState = gameState;
        this.audioManager = audioManager;
        this.onBotDeath = callbacks.onBotDeath;
        this.onBossDefeat = callbacks.onBossDefeat;
        this.onCreateEffect = callbacks.onCreateEffect;
        this.onCheckPowerUp = callbacks.onCheckPowerUp;
    }

    public checkAllCollisions(canvasWidth: number, canvasHeight: number): void {
        // Check bot-collectible collisions
        this.gameState.bots.forEach(bot => {
            // Bot-bit collisions
            this.gameState.bits = this.gameState.bits.filter(bit => {
                if (bot.collidesWith(bit)) {
                    bot.addScore(bit.getValue());
                    this.gameState.currentLevel.addBit();
                    bot.heal(2);
                    this.onCheckPowerUp(bot);
                    this.audioManager.playCollectSound(false);
                    return false;
                }
                return true;
            });

            // Bot-byte collisions
            this.gameState.bytes = this.gameState.bytes.filter(byte => {
                if (bot.collidesWith(byte)) {
                    bot.addScore(byte.getValue());
                    bot.heal(20);
                    bot.addLifeProgress(0.25);
                    this.audioManager.playCollectSound(true);
                    return false;
                }
                return true;
            });

            // Bot-bug collisions
            this.gameState.bugs.forEach(bug => {
                if (bot.collidesWith(bug)) {
                    const damage = bug.getDamage();
                    if (bot.takeDamage(damage)) {
                        this.onBotDeath(bot);
                    } else if (!bot.hasShield()) {
                        this.audioManager.playHitSound();
                        this.onCreateEffect('playerHit', bot.x, bot.y);
                        // Push bot away
                        const dx = bot.x - bug.x;
                        const dy = bot.y - bug.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0) {
                            bot.x += (dx / distance) * 30;
                            bot.y += (dy / distance) * 30;
                            bot.keepInBounds(canvasWidth, canvasHeight);
                        }
                    }
                }
            });
            
            // Bot-boss collision
            if (this.gameState.boss && bot.collidesWith(this.gameState.boss)) {
                const damage = 20;
                if (bot.takeDamage(damage)) {
                    this.onBotDeath(bot);
                } else if (!bot.hasShield()) {
                    this.audioManager.playHitSound();
                    this.onCreateEffect('playerHit', bot.x, bot.y);
                    // Push bot away from boss
                    const dx = bot.x - this.gameState.boss.x;
                    const dy = bot.y - this.gameState.boss.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        bot.x += (dx / distance) * 50;
                        bot.y += (dy / distance) * 50;
                        bot.keepInBounds(canvasWidth, canvasHeight);
                    }
                }
            }
        });

        // Check projectile-bug collisions
        this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
            let projectileHit = false;
            
            this.gameState.bugs = this.gameState.bugs.filter(bug => {
                if (!projectileHit && projectile.collidesWith(bug)) {
                    projectileHit = true;
                    
                    if (bug.takeDamage()) {
                        // Bug died
                        const shooter = this.gameState.bots[projectile.ownerId];
                        if (shooter) {
                            const points = 3 + bug.getGrowthLevel() * 2;
                            shooter.addScore(points);
                        }
                        this.audioManager.playBugDestroySound();
                        this.onCreateEffect('bugDeath', bug.x, bug.y, bug.getGrowthLevel());
                        return false;
                    } else {
                        this.audioManager.playHitSound();
                        return true;
                    }
                }
                return true;
            });
            
            return !projectileHit;
        });
        
        // Check projectile-boss collisions
        if (this.gameState.boss) {
            this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
                if (this.gameState.boss && projectile.collidesWith(this.gameState.boss)) {
                    if (this.gameState.boss.takeDamage()) {
                        this.onBossDefeat();
                        this.gameState.boss = null;
                    } else {
                        this.audioManager.playHitSound();
                    }
                    return false;
                }
                return true;
            });
        }
        
        // Let bugs collect bits and bytes
        this.gameState.bugs.forEach(bug => {
            this.gameState.bits = this.gameState.bits.filter(bit => {
                if (bug.collidesWith(bit)) {
                    bug.collect();
                    return false;
                }
                return true;
            });
            
            this.gameState.bytes = this.gameState.bytes.filter(byte => {
                if (bug.collidesWith(byte)) {
                    bug.collect();
                    return false;
                }
                return true;
            });
        });
    }
}