// Game constants
export const TILE_SIZE = 24; // Reduced for better scaling
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

// Colors for procedurally generated elements
export const COLORS = {
    EMPTY: '#000000',
    WALL: '#555555',
    DIRT: '#8B4513',
    BOULDER: '#A9A9A9',
    DIAMOND: '#00FFFF',
    EXIT: '#FF00FF',
    PLAYER: '#FFFF00',
    ENEMY: '#FF0000'
};

// Game settings
export const GAME_SETTINGS = {
    DIAMOND_VALUE: 10,
    REQUIRED_DIAMONDS_PERCENT: 0.75, // Reduced to make levels easier
    INITIAL_TIME: 150, // Increased for more relaxed gameplay
    ENEMY_SPEED: 0.4, // Slightly slower enemies
    BOULDER_FALL_SPEED: 4, // Faster falling boulders
    LEVEL_COUNT: 10 // Increased level count
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
    s: 'DOWN',
    a: 'LEFT',
    d: 'RIGHT'
};
