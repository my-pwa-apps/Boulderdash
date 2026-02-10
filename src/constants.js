// Game constants
export const TILE_SIZE = 24;
export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 22;

// Game element types
export const ELEMENT_TYPES = {
    EMPTY: 0,
    WALL: 1,
    DIRT: 2,
    BOULDER: 3,
    DIAMOND: 4,
    EXIT: 5,
    PLAYER: 6,
    ENEMY: 7,
    MAGIC_WALL: 8
};

// Colors - Modern retro arcade palette with better contrast
export const COLORS = {
    EMPTY: '#0a0a12',       // Deep space dark (not pure black)
    WALL: '#6b4878',        // Muted purple walls
    DIRT: '#8B6914',        // Richer golden brown
    BOULDER: '#7a7a8a',     // Cool gray with slight blue
    DIAMOND: '#00E5FF',     // Electric cyan diamond
    EXIT: '#FF00FF',        // Hot magenta portal
    PLAYER: '#FFD700',      // Gold player (more visible)
    ENEMY: '#FF3344',       // Slightly orange-red enemy
    MAGIC_WALL: '#39FF14'   // Neon green magic wall
};

// Game settings balanced for classic Boulder Dash feel
export const GAME_SETTINGS = {
    DIAMOND_VALUE: 10,              // Points per diamond
    REQUIRED_DIAMONDS_PERCENT: 0.7, // Need 70% of diamonds
    INITIAL_TIME: 180,              // 3 minutes initial time
    ENEMY_SPEED: 0.4,               // Balanced enemy speed
    BOULDER_FALL_SPEED: 4,          // Natural falling speed
    LEVEL_COUNT: 16                // Total classic levels
};

// Direction constants
export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Key mappings
export const KEY_MAPPINGS = {
    ArrowUp: 'UP',
    ArrowDown: 'DOWN',
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
    w: 'UP',
    W: 'UP',
    s: 'DOWN',
    S: 'DOWN',
    a: 'LEFT',
    A: 'LEFT',
    d: 'RIGHT',
    D: 'RIGHT'
};
