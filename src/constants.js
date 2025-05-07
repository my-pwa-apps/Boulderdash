// Game constants
export const TILE_SIZE = 32;
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
    REQUIRED_DIAMONDS_PERCENT: 0.8, // You need to collect 80% of diamonds to open the exit
    INITIAL_TIME: 120, // in seconds
    ENEMY_SPEED: 0.5, // Moves per second
    BOULDER_FALL_SPEED: 5, // Frames per movement
    LEVEL_COUNT: 5
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
