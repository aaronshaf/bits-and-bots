import { Bot } from './Bot';
import { Level } from './Level';
import { SaveSystem, GameSaveData } from './SaveSystem';

export class UIManager {
    private menuGamepadCheck?: number;
    
    public setupMenu(
        bots: Bot[],
        gamepadManager: any,
        onStartGame: () => void,
        onFirstInteraction: () => void,
        canvas: HTMLCanvasElement
    ): void {
        const menuEl = document.getElementById('game-menu');
        const startButton = document.getElementById('start-button');
        const player1UI = document.getElementById('player1-ui');
        const player2UI = document.getElementById('player2-ui');
        
        if (menuEl && startButton && player1UI && player2UI) {
            player1UI.classList.add('hidden');
            player2UI.classList.add('hidden');
            
            // Check for saved game
            const savedGame = SaveSystem.loadGame();
            if (savedGame) {
                const p = menuEl.querySelector('p');
                if (p) p.textContent = `Continue from Level ${savedGame.levelNumber}? Connect gamepads to play!`;
                startButton.textContent = 'Continue Game';
            }
            
            const startGame = () => {
                const connectedCount = gamepadManager.getConnectedCount();
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
                    while (bots.length > 1) {
                        bots.pop();
                    }
                }
                
                onStartGame();
            };
            
            startButton.addEventListener('click', startGame);
            
            // Add click handler to canvas for audio initialization
            const initAudioOnClick = async () => {
                await onFirstInteraction();
                canvas.removeEventListener('click', initAudioOnClick);
            };
            canvas.addEventListener('click', initAudioOnClick);
            
            // Check for gamepad A button press in menu
            this.menuGamepadCheck = setInterval(() => {
                if (menuEl.classList.contains('hidden')) {
                    clearInterval(this.menuGamepadCheck);
                    return;
                }
                
                for (let i = 0; i < 2; i++) {
                    const gamepadState = gamepadManager.getGamepadState(i);
                    if (gamepadState?.buttons.a) {
                        startGame();
                        break;
                    }
                }
                
                // Update player count display
                const connectedCount = gamepadManager.getConnectedCount();
                const p = menuEl.querySelector('p');
                if (p) {
                    if (connectedCount === 0) {
                        p.textContent = 'Click anywhere to enable audio, then press A to start!';
                    } else if (connectedCount === 1) {
                        p.textContent = '1 gamepad connected - Press A to start!';
                    } else {
                        p.textContent = `${connectedCount} gamepads connected - Press A to start!`;
                    }
                }
            }, 100);
        }
    }
    
    public setupPreferences(
        audioManager: any,
        isPausedRef: { value: boolean },
        gameState: string
    ): void {
        const modal = document.getElementById('preferences-modal');
        const closeBtn = document.getElementById('close-preferences');
        const musicSlider = document.getElementById('music-volume') as HTMLInputElement;
        const sfxSlider = document.getElementById('sfx-volume') as HTMLInputElement;
        
        if (!modal || !closeBtn || !musicSlider || !sfxSlider) {
            console.error('Preferences elements not found');
            return;
        }
        
        // Ensure modal starts hidden
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // Initialize volume displays
        const updateVolumeDisplay = (slider: HTMLInputElement) => {
            const valueSpan = slider.nextElementSibling as HTMLSpanElement;
            if (valueSpan) {
                valueSpan.textContent = slider.value + '%';
            }
        };
        
        // Set initial values
        updateVolumeDisplay(musicSlider);
        updateVolumeDisplay(sfxSlider);
        
        musicSlider.addEventListener('input', () => {
            updateVolumeDisplay(musicSlider);
            audioManager.setMusicVolume(parseInt(musicSlider.value) / 100);
        });
        
        sfxSlider.addEventListener('input', () => {
            updateVolumeDisplay(sfxSlider);
            audioManager.setSfxVolume(parseInt(sfxSlider.value) / 100);
        });
        
        // Close modal handlers
        const closeModal = () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            if (gameState === 'playing') {
                isPausedRef.value = false;
            }
        };
        
        // Open modal handler
        const openModal = () => {
            modal.classList.remove('hidden');
            modal.style.display = '';
            isPausedRef.value = true;
        };
        
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
        
        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Prevent clicks inside modal content from bubbling
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === ',' || e.key === 'p' || e.key === 'P') {
                if (gameState === 'playing') {
                    if (modal.classList.contains('hidden') || modal.style.display === 'none') {
                        openModal();
                    } else {
                        closeModal();
                    }
                }
            } else if (e.key === 'Escape') {
                if (!modal.classList.contains('hidden') || modal.style.display !== 'none') {
                    closeModal();
                }
            }
        });
    }
    
    public updateScoreDisplay(bots: Bot[], currentLevel: Level, levelNumber: number): void {
        // Update player 1
        const p1Score = document.querySelector('#player1-ui .score-value');
        const p1Health = document.querySelector('#player1-ui .health-fill') as HTMLElement;
        const p1HealthText = document.querySelector('#player1-ui .health-text');
        const p1Lives = document.querySelector('#player1-ui .lives-value');
        
        if (bots[0]) {
            const bot = bots[0];
            const healthPercent = Math.max(0, (bot.health / bot.maxHealth) * 100);
            
            if (p1Score) p1Score.textContent = this.formatDataSize(bot.score);
            if (p1Health) p1Health.style.width = healthPercent + '%';
            if (p1HealthText) p1HealthText.textContent = Math.floor(healthPercent) + '%';
            if (p1Lives) p1Lives.textContent = bot.lives.toString();
        }
        
        // Update player 2
        const p2Score = document.querySelector('#player2-ui .score-value');
        const p2Health = document.querySelector('#player2-ui .health-fill') as HTMLElement;
        const p2HealthText = document.querySelector('#player2-ui .health-text');
        const p2Lives = document.querySelector('#player2-ui .lives-value');
        
        if (bots[1]) {
            const bot = bots[1];
            const healthPercent = Math.max(0, (bot.health / bot.maxHealth) * 100);
            
            if (p2Score) p2Score.textContent = this.formatDataSize(bot.score);
            if (p2Health) p2Health.style.width = healthPercent + '%';
            if (p2HealthText) p2HealthText.textContent = Math.floor(healthPercent) + '%';
            if (p2Lives) p2Lives.textContent = bot.lives.toString();
        }
        
        // Update level progress
        const levelNumberEl = document.querySelector('.level-number');
        const progressFill = document.querySelector('.progress-fill') as HTMLElement;
        const progressText = document.querySelector('.progress-text');
        
        if (levelNumberEl) levelNumberEl.textContent = levelNumber.toString();
        if (progressFill) {
            const progress = currentLevel.getProgress() * 100;
            progressFill.style.width = progress + '%';
        }
        if (progressText) {
            const bitsCollected = currentLevel.getBitsCollected();
            const bitsRequired = currentLevel.getBitsRequired();
            progressText.textContent = `${bitsCollected}/${bitsRequired} bits`;
        }
    }
    
    public showGameOver(): void {
        const menuEl = document.getElementById('game-menu');
        if (menuEl) {
            const h1 = menuEl.querySelector('h1');
            if (h1) h1.textContent = 'Game Over';
            menuEl.classList.remove('hidden');
        }
    }
    
    public loadSavedGameUI(savedData: GameSaveData): void {
        const musicSlider = document.getElementById('music-volume') as HTMLInputElement;
        const sfxSlider = document.getElementById('sfx-volume') as HTMLInputElement;
        if (musicSlider) musicSlider.value = (savedData.musicVolume * 100).toString();
        if (sfxSlider) sfxSlider.value = (savedData.sfxVolume * 100).toString();
    }
    
    private formatDataSize(bits: number): string {
        // Convert bits to appropriate unit
        if (bits < 8) {
            return `${bits} bit${bits !== 1 ? 's' : ''}`;
        } else if (bits < 8 * 1024) {
            const bytes = Math.floor(bits / 8);
            return `${bytes} B`;
        } else if (bits < 8 * 1024 * 1024) {
            const kb = (bits / (8 * 1024)).toFixed(1);
            return `${kb} KB`;
        } else if (bits < 8 * 1024 * 1024 * 1024) {
            const mb = (bits / (8 * 1024 * 1024)).toFixed(1);
            return `${mb} MB`;
        } else {
            const gb = (bits / (8 * 1024 * 1024 * 1024)).toFixed(2);
            return `${gb} GB`;
        }
    }
}