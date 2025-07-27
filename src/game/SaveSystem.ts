export interface GameSaveData {
    levelNumber: number;
    player1Score: number;
    player2Score: number;
    player1Lives: number;
    player2Lives: number;
    musicVolume: number;
    sfxVolume: number;
    timestamp: number;
}

export class SaveSystem {
    private static readonly SAVE_KEY = 'bits-and-bots-save';
    
    public static saveGame(data: GameSaveData): void {
        try {
            const saveData = {
                ...data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            // Game saved successfully
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }
    
    public static loadGame(): GameSaveData | null {
        try {
            const savedString = localStorage.getItem(this.SAVE_KEY);
            if (!savedString) return null;
            
            const savedData = JSON.parse(savedString) as GameSaveData;
            
            // Check if save is from the last 24 hours
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - savedData.timestamp > dayInMs) {
                // Save data is too old, ignoring
                return null;
            }
            
            // Game loaded successfully
            return savedData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }
    
    public static clearSave(): void {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            // Save data cleared
        } catch (error) {
            console.error('Failed to clear save:', error);
        }
    }
    
    public static hasSaveData(): boolean {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
}