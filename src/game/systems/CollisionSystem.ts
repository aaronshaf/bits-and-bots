import { Bot } from '../Bot';
import { Bit } from '../Bit';
import { Byte } from '../Byte';
import { Bug } from '../Bug';
import { Worm } from '../Worm';
import { Projectile } from '../Projectile';
import { Boss } from '../Boss';
import { Level } from '../Level';
import { AudioManager } from '../AudioManager';
import { ParticleSystem } from '../ParticleSystem';
import { COLORS } from '../constants';

export class CollisionSystem {
    constructor(
        private audioManager: AudioManager,
        private particleSystem: ParticleSystem,
        private onBotDeath: (bot: Bot) => void,
        private onBossDefeat: () => void,
        private onCheckPowerUp: (bot: Bot) => void
    ) {}

    public checkCollisions(
        bots: Bot[],
        bits: Bit[],
        bytes: Byte[],
        bugs: Bug[],
        worms: Worm[],
        projectiles: Projectile[],
        boss: Boss | null,
        currentLevel: Level,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        // Check bot-collectible collisions
        bots.forEach(bot => {
            // Bot-bit collisions
            for (let i = bits.length - 1; i >= 0; i--) {
                if (bot.collidesWith(bits[i])) {
                    bot.addScore(bits[i].getValue());
                    currentLevel.addBit();
                    bot.heal(2);
                    this.onCheckPowerUp(bot);
                    this.audioManager.playCollectSound(false);
                    bits.splice(i, 1);
                }
            }

            // Bot-byte collisions
            for (let i = bytes.length - 1; i >= 0; i--) {
                if (bot.collidesWith(bytes[i])) {
                    bot.addScore(bytes[i].getValue());
                    bot.heal(20);
                    bot.addLifeProgress(0.25);
                    this.audioManager.playCollectSound(true);
                    bytes.splice(i, 1);
                }
            }

            // Bot-bug collisions
            bugs.forEach(bug => {
                if (bot.collidesWith(bug)) {
                    const damage = bug.getDamage();
                    if (bot.takeDamage(damage)) {
                        this.onBotDeath(bot);
                    } else if (!bot.hasShield()) {
                        this.audioManager.playHitSound();
                        this.particleSystem.createPlayerHitEffect(bot.x, bot.y);
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
            
            // Bot-worm collisions
            worms.forEach(worm => {
                if (bot.collidesWith(worm)) {
                    const damage = worm.getDamage();
                    if (bot.takeDamage(damage)) {
                        this.onBotDeath(bot);
                    } else if (!bot.hasShield()) {
                        this.audioManager.playHitSound();
                        this.particleSystem.createPlayerHitEffect(bot.x, bot.y);
                        // Push bot away with stronger force
                        const dx = bot.x - worm.x;
                        const dy = bot.y - worm.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0) {
                            bot.x += (dx / distance) * 40;
                            bot.y += (dy / distance) * 40;
                            bot.keepInBounds(canvasWidth, canvasHeight);
                        }
                    }
                }
            });
            
            // Bot-boss collision
            if (boss && bot.collidesWith(boss)) {
                const damage = 20;
                if (bot.takeDamage(damage)) {
                    this.onBotDeath(bot);
                } else if (!bot.hasShield()) {
                    this.audioManager.playHitSound();
                    this.particleSystem.createPlayerHitEffect(bot.x, bot.y);
                    // Push bot away from boss
                    const dx = bot.x - boss.x;
                    const dy = bot.y - boss.y;
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
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            let projectileHit = false;
            
            for (let j = bugs.length - 1; j >= 0; j--) {
                const bug = bugs[j];
                if (projectile.collidesWith(bug)) {
                    projectileHit = true;
                    
                    if (bug.takeDamage()) {
                        // Bug died
                        const shooter = bots[projectile.ownerId];
                        if (shooter) {
                            const points = 3 + bug.getGrowthLevel() * 2;
                            shooter.addScore(points);
                        }
                        this.audioManager.playBugDestroySound();
                        this.particleSystem.createBugDeathEffect(bug.x, bug.y, bug.getGrowthLevel(), COLORS.bug);
                        bugs.splice(j, 1);
                    } else {
                        this.audioManager.playHitSound();
                    }
                    break;
                }
            }
            
            if (projectileHit) {
                projectiles.splice(i, 1);
            }
        }
        
        // Check projectile-worm collisions
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            let projectileHit = false;
            
            for (let j = worms.length - 1; j >= 0; j--) {
                const worm = worms[j];
                if (projectile.collidesWith(worm)) {
                    projectileHit = true;
                    
                    if (worm.takeDamage()) {
                        // Worm died
                        const shooter = bots[projectile.ownerId];
                        if (shooter) {
                            const points = 5 + worm.getGrowthLevel() * 3;
                            shooter.addScore(points);
                        }
                        this.audioManager.playBugDestroySound();
                        this.particleSystem.createBugDeathEffect(worm.x, worm.y, worm.getGrowthLevel(), COLORS.worm);
                        worms.splice(j, 1);
                    } else {
                        this.audioManager.playHitSound();
                    }
                    break;
                }
            }
            
            if (projectileHit) {
                projectiles.splice(i, 1);
            }
        }
        
        // Check projectile-boss collisions
        if (boss) {
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const projectile = projectiles[i];
                if (projectile.collidesWith(boss)) {
                    if (boss.takeDamage()) {
                        this.onBossDefeat();
                    } else {
                        this.audioManager.playHitSound();
                    }
                    projectiles.splice(i, 1);
                }
            }
        }
        
        // Let bugs collect bits and bytes
        bugs.forEach(bug => {
            for (let i = bits.length - 1; i >= 0; i--) {
                if (bug.collidesWith(bits[i])) {
                    bug.collect();
                    bits.splice(i, 1);
                }
            }
            
            for (let i = bytes.length - 1; i >= 0; i--) {
                if (bug.collidesWith(bytes[i])) {
                    bug.collect();
                    bytes.splice(i, 1);
                }
            }
        });
        
        // Let worms collect bits and bytes
        worms.forEach(worm => {
            for (let i = bits.length - 1; i >= 0; i--) {
                if (worm.collidesWith(bits[i])) {
                    worm.collect();
                    bits.splice(i, 1);
                }
            }
            
            for (let i = bytes.length - 1; i >= 0; i--) {
                if (worm.collidesWith(bytes[i])) {
                    worm.collect();
                    bytes.splice(i, 1);
                }
            }
        });
    }
}