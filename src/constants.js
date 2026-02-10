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
    ENEMY: 7,       // Firefly (left-wall follower, explodes to space)
    MAGIC_WALL: 8,
    BUTTERFLY: 9    // Butterfly (right-wall follower, explodes to diamonds)
};

// C64 color palette - authentic Commodore 64 Boulder Dash colors
export const C64 = {
    BLACK:      '#000000',
    WHITE:      '#FFFFFF',
    RED:        '#880000',
    CYAN:       '#AAFFEE',
    PURPLE:     '#CC44CC',
    GREEN:      '#00CC55',
    BLUE:       '#0000AA',
    YELLOW:     '#EEEE77',
    ORANGE:     '#DD8855',
    BROWN:      '#664400',
    LIGHT_RED:  '#FF7777',
    DARK_GREY:  '#333333',
    GREY:       '#777777',
    LIGHT_GREEN:'#AAFF66',
    LIGHT_BLUE: '#0088FF',
    LIGHT_GREY: '#BBBBBB'
};

// Colors mapped to game elements using authentic C64 BD palette
export const COLORS = {
    EMPTY: C64.BLACK,           // Pure black background
    WALL: C64.LIGHT_BLUE,       // Steel wall - light blue (C64 Cave A)
    DIRT: C64.BROWN,            // Brown dirt
    BOULDER: C64.LIGHT_GREY,    // Grey boulder
    DIAMOND: C64.WHITE,         // White/cyan diamond
    EXIT: C64.GREY,             // Steel door (flashes green when open)
    PLAYER: C64.WHITE,          // Rockford - white
    ENEMY: C64.RED,             // Firefly - red
    MAGIC_WALL: C64.PURPLE,     // Magic wall - purple shimmer
    BUTTERFLY: C64.PURPLE       // Butterfly - purple
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
