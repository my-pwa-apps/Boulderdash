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
    ENEMY: 7
};

// Colors matching classic Boulder Dash aesthetic
export const COLORS = {
    EMPTY: '#000000',
    WALL: '#555555',        // Gray stone
    DIRT: '#8B4513',        // Brown earth
    BOULDER: '#A9A9A9',     // Gray boulder
    DIAMOND: '#00FFFF',     // Cyan diamond
    EXIT: '#FF00FF',        // Magenta portal
    PLAYER: '#FFFF00',      // Yellow player
    ENEMY: '#FF0000'        // Red enemy
};

// Game settings balanced for classic Boulder Dash feel
export const GAME_SETTINGS = {
    DIAMOND_VALUE: 10,              // Points per diamond
    REQUIRED_DIAMONDS_PERCENT: 0.7, // Need 70% of diamonds
    INITIAL_TIME: 180,              // 3 minutes initial time
    ENEMY_SPEED: 0.4,               // Balanced enemy speed
    BOULDER_FALL_SPEED: 4,          // Natural falling speed
    LEVEL_COUNT: 10                 // Total levels
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
