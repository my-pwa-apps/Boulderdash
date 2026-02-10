import { COLORS, ELEMENT_TYPES, TILE_SIZE, C64 } from './constants.js';

/**
 * C64 Boulder Dash - Authentic pixel art sprite generation
 * All sprites are drawn to match the original Commodore 64 game's 
 * characteristic blocky pixel style using the C64 16-color palette.
 */

// Static sprite cache to avoid regenerating the same sprites
const spriteCache = new Map();

/**
 * Draw a sprite from a pixel map definition.
 * Each row is an array of color values (or null for transparent).
 * Pixels are scaled to fill the TILE_SIZE.
 */
function drawPixelMap(ctx, map) {
    const rows = map.length;
    const cols = map[0].length;
    const pxW = TILE_SIZE / cols;
    const pxH = TILE_SIZE / rows;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const color = map[y][x];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(
                    Math.floor(x * pxW), 
                    Math.floor(y * pxH), 
                    Math.ceil(pxW), 
                    Math.ceil(pxH)
                );
            }
        }
    }
}

/**
 * Generate a procedural sprite for a game element with caching
 */
function generateSprite(color, type) {
    const cacheKey = `${color}_${type}`;
    if (spriteCache.has(cacheKey)) {
        return spriteCache.get(cacheKey);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    // Clear to black for all sprites  
    ctx.fillStyle = C64.BLACK;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    switch (type) {
        case ELEMENT_TYPES.WALL:
            drawWall(ctx, color);
            break;
        case ELEMENT_TYPES.DIRT:
            drawDirt(ctx, color);
            break;
        case ELEMENT_TYPES.BOULDER:
            drawBoulder(ctx, color);
            break;
        case ELEMENT_TYPES.DIAMOND:
            drawDiamond(ctx, color);
            break;
        case ELEMENT_TYPES.EXIT:
            drawExit(ctx, color);
            break;
        case ELEMENT_TYPES.PLAYER:
            drawPlayer(ctx, color);
            break;
        case ELEMENT_TYPES.ENEMY:
            drawEnemy(ctx, color);
            break;
        case ELEMENT_TYPES.MAGIC_WALL:
            drawMagicWall(ctx, color);
            break;
        default:
            break;
    }
    
    spriteCache.set(cacheKey, canvas);
    return canvas;
}

/**
 * Generate all game assets
 */
export function generateAssets() {
    spriteCache.clear();
    
    const assets = {};
    Object.entries(ELEMENT_TYPES).forEach(([type, value]) => {
        const color = COLORS[type];
        assets[value] = generateSprite(color, value);
    });
    
    return assets;
}

/**
 * C64 Boulder Dash steel wall - solid colored rectangle with beveled edge.
 * In the original, walls were solid colored blocks with a subtle 3D look
 * using the C64's limited palette (typically light blue or grey).
 */
function drawWall(ctx, color) {
    const W = color;           // Wall main color
    const H = C64.WHITE;       // Highlight
    const S = C64.DARK_GREY;   // Shadow
    const M = C64.GREY;        // Mid-tone

    // Classic C64 steel wall: beveled block with highlight top-left, shadow bottom-right
    const map = [
        [H, H, H, H, H, H, H, M],
        [H, W, W, W, W, W, M, S],
        [H, W, W, W, W, W, M, S],
        [H, W, W, W, W, W, M, S],
        [H, W, W, W, W, W, M, S],
        [H, W, W, W, W, W, M, S],
        [H, M, M, M, M, M, M, S],
        [M, S, S, S, S, S, S, S],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash dirt - brown textured block.
 * Original used a pseudo-random dot pattern in brown tones.
 */
function drawDirt(ctx, color) {
    const D = color;            // Brown dirt
    const L = C64.ORANGE;       // Lighter brown/orange highlights
    const K = '#442200';        // Darker brown shadow

    // Textured dirt with scattered lighter/darker pixels (C64 style)
    const map = [
        [D, D, L, D, D, D, K, D],
        [D, K, D, D, L, D, D, D],
        [D, D, D, K, D, D, D, L],
        [L, D, D, D, D, K, D, D],
        [D, D, K, D, D, D, D, D],
        [D, L, D, D, D, D, K, D],
        [D, D, D, L, D, D, D, D],
        [K, D, D, D, D, L, D, K],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash boulder - round grey rock.
 * Original was a circular grey object with simple highlight/shadow.
 */
function drawBoulder(ctx, color) {
    const B = color;            // Boulder color (light grey)
    const H = C64.WHITE;        // Highlight
    const S = C64.GREY;         // Shadow mid
    const D = C64.DARK_GREY;    // Dark shadow
    const K = C64.BLACK;        // Background

    // Round boulder with C64-style shading
    const map = [
        [K, K, K, S, S, K, K, K],
        [K, K, S, H, H, B, K, K],
        [K, S, H, H, B, B, S, K],
        [S, H, H, B, B, B, S, D],
        [S, H, B, B, B, S, D, D],
        [K, S, B, B, S, S, D, K],
        [K, K, S, S, S, D, K, K],
        [K, K, K, D, D, K, K, K],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash diamond - the iconic rotating octagonal gem.
 * In the original, diamonds were white/cyan and animated through 
 * 8 rotation frames. This is the default "full" frame.
 */
function drawDiamond(ctx, color) {
    const W = C64.WHITE;        // Bright white
    const C = C64.CYAN;         // Cyan sparkle
    const B = C64.LIGHT_BLUE;   // Blue accent
    const K = C64.BLACK;        // Background

    // Classic diamond shape - octagonal with sparkle
    const map = [
        [K, K, K, C, C, K, K, K],
        [K, K, C, W, W, C, K, K],
        [K, C, W, W, W, W, C, K],
        [C, W, W, W, W, W, W, B],
        [C, W, W, W, W, W, B, B],
        [K, C, W, W, W, B, B, K],
        [K, K, C, W, B, B, K, K],
        [K, K, K, B, B, K, K, K],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash exit - looks like steel wall until opened,
 * then flashes/pulses. Static frame shows a distinctive door.
 */
function drawExit(ctx, color) {
    const W = color;            // Exit main color (grey)
    const H = C64.LIGHT_GREY;   // Highlight
    const S = C64.DARK_GREY;    // Shadow
    
    // Exit looks like a solid steel block (same bevel as wall but darker)
    const map = [
        [H, H, H, H, H, H, H, W],
        [H, W, W, W, W, W, W, S],
        [H, W, S, W, W, S, W, S],
        [H, W, W, W, W, W, W, S],
        [H, W, W, W, W, W, W, S],
        [H, W, S, W, W, S, W, S],
        [H, W, W, W, W, W, W, S],
        [W, S, S, S, S, S, S, S],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash player - Rockford!
 * The iconic character: simple pixel face/body.
 */
function drawPlayer(ctx, color) {
    const W = C64.WHITE;        // Rockford's skin/body
    const K = C64.BLACK;        // Background / outline
    const B = C64.BLUE;         // Shirt / clothing
    const Y = C64.YELLOW;       // Hat accent

    // Classic Rockford - blocky humanoid figure with face
    const map = [
        [K, K, Y, Y, Y, Y, K, K],
        [K, Y, W, W, W, W, Y, K],
        [K, W, K, W, W, K, W, K],
        [K, W, W, W, W, W, W, K],
        [K, K, B, B, B, B, K, K],
        [K, B, B, B, B, B, B, K],
        [K, K, B, K, K, B, K, K],
        [K, K, W, K, K, W, K, K],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash enemy - Firefly.
 * In the original, fireflies were diamond-shaped colored sprites.
 */
function drawEnemy(ctx, color) {
    const R = color;            // Red enemy color
    const L = C64.LIGHT_RED;    // Light red highlight
    const O = C64.ORANGE;       // Orange accent  
    const K = C64.BLACK;        // Background
    const Y = C64.YELLOW;       // Eye/spark

    // Firefly - diamond/square shape, angular body
    const map = [
        [K, K, K, R, R, K, K, K],
        [K, K, R, L, L, R, K, K],
        [K, R, L, Y, Y, L, R, K],
        [R, L, Y, O, O, Y, L, R],
        [R, L, Y, O, O, Y, L, R],
        [K, R, L, Y, Y, L, R, K],
        [K, K, R, L, L, R, K, K],
        [K, K, K, R, R, K, K, K],
    ];
    
    drawPixelMap(ctx, map);
}

/**
 * C64 Boulder Dash magic wall - brick pattern that shimmers.
 */
function drawMagicWall(ctx, color) {
    const M = color;            // Magic wall purple
    const L = C64.LIGHT_RED;    // Lighter accent
    const D = C64.BLUE;         // Darker accent
    const K = C64.BLACK;        // Mortar lines
    const W = C64.WHITE;        // Sparkle

    // Brick pattern with magical shimmer pixels
    const map = [
        [M, M, M, K, M, M, M, M],
        [M, M, M, K, M, W, M, M],
        [K, K, K, K, K, K, K, K],
        [M, M, M, M, M, K, L, L],
        [W, M, M, M, M, K, L, L],
        [K, K, K, K, K, K, K, K],
        [M, M, K, D, D, D, M, M],
        [M, M, K, D, D, D, W, M],
    ];
    
    drawPixelMap(ctx, map);
}


