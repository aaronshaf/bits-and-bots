export const COLORS = {
    background: '#1a1a1a',
    grid: '#333',
    player1: '#00ff88',
    player2: '#ff6b6b',
    bit: '#00ff00',  // Matrix green
    byte: '#00ff00', // Matrix green
    bug: '#ff4757',
    worm: '#d2691e', // Sandy brown
    powerUp: '#a29bfe',
} as const;

export const SIZES = {
    bot: 20,
    bit: 3,
    byte: 12,
    bug: 12,
    worm: 10,
    powerUp: 16,
} as const;

export const SPEEDS = {
    bot: 200, // pixels per second
    bug: 120, // Moderate speed for balanced gameplay
    worm: 80, // Slower, more strategic movement
    projectile: 600, // Increased for more responsive shooting
} as const;

export const UI = {
    scoreMargin: 20,
    fontSize: 24,
} as const;