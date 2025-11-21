import { COLORS, ELEMENT_TYPES, TILE_SIZE } from './constants.js';

/**
 * Darken a color by a given factor
 * @param {string} color - The color in hex format
 * @param {number} factor - The darkening factor (0-1)
 * @returns {string} - The darkened color
 */
function darkenColor(color, factor) {
    // Extract RGB components
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    
    // Darken each component
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a color by a given factor
 * @param {string} color - The color in hex format
 * @param {number} factor - The lightening factor (0-1)
 * @returns {string} - The lightened color
 */
function lightenColor(color, factor) {
    // Extract RGB components
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    
    // Lighten each component
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Add a static sprite cache to avoid regenerating the same sprites
const spriteCache = new Map();

/**
 * Generate a procedural sprite for a game element with caching
 * @param {string} color - The main color of the element
 * @param {number} type - The element type
 * @returns {HTMLCanvasElement} - A canvas element with the generated sprite
 */
function generateSprite(color, type) {
    // Create a cache key based on color and type
    const cacheKey = `${color}_${type}`;
    
    // Check if sprite is already in cache
    if (spriteCache.has(cacheKey)) {
        return spriteCache.get(cacheKey);
    }
    
    // Create new canvas and context
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    // Fill background only if needed (most sprites are opaque)
    if (type !== ELEMENT_TYPES.EMPTY) {
        ctx.fillStyle = COLORS.EMPTY;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
    
    // Optimize drawing based on type
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
    
    // Store in cache and return
    spriteCache.set(cacheKey, canvas);
    return canvas;
}

/**
 * Generate all game assets efficiently
 * @returns {Object} - Object containing all sprite canvases
 */
export function generateAssets() {
    // Clear cache when regenerating all assets
    spriteCache.clear();
    
    const assets = {};
    
    // Batch create sprites for better performance
    Object.entries(ELEMENT_TYPES).forEach(([type, value]) => {
        const color = COLORS[type];
        assets[value] = generateSprite(color, value);
    });
    
    return assets;
}

/**
 * Draw a procedural wall tile (Metal Plate Style)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawWall(ctx, color) {
    // Base metal plate
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    const darkColor = darkenColor(color, 0.6);
    const lightColor = lightenColor(color, 0.4);
    
    // Inner plate (bevel effect)
    ctx.fillStyle = darkenColor(color, 0.8);
    ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    
    // Rivets in corners
    ctx.fillStyle = lightColor;
    const rivetSize = 3;
    const offset = 6;
    
    // Top-left
    ctx.beginPath(); ctx.arc(offset, offset, rivetSize, 0, Math.PI*2); ctx.fill();
    // Top-right
    ctx.beginPath(); ctx.arc(TILE_SIZE-offset, offset, rivetSize, 0, Math.PI*2); ctx.fill();
    // Bottom-left
    ctx.beginPath(); ctx.arc(offset, TILE_SIZE-offset, rivetSize, 0, Math.PI*2); ctx.fill();
    // Bottom-right
    ctx.beginPath(); ctx.arc(TILE_SIZE-offset, TILE_SIZE-offset, rivetSize, 0, Math.PI*2); ctx.fill();
    
    // Cross pattern
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(TILE_SIZE-4, TILE_SIZE-4);
    ctx.moveTo(TILE_SIZE-4, 4);
    ctx.lineTo(4, TILE_SIZE-4);
    ctx.stroke();
}

/**
 * Draw a procedural dirt tile (Textured)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawDirt(ctx, color) {
    // Base dirt color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Add specs and variations
    const darkColor = darkenColor(color, 0.6);
    const lightColor = lightenColor(color, 0.4);
    
    // Noise texture
    for (let i = 0; i < 40; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        
        ctx.fillStyle = Math.random() > 0.5 ? darkColor : lightColor;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Subtle grid lines for "diggable" look
    ctx.strokeStyle = darkenColor(color, 0.8);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, TILE_SIZE/2);
    ctx.lineTo(TILE_SIZE, TILE_SIZE/2);
    ctx.moveTo(TILE_SIZE/2, 0);
    ctx.lineTo(TILE_SIZE/2, TILE_SIZE);
    ctx.stroke();
}

/**
 * Draw a procedural boulder tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawBoulder(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const radius = TILE_SIZE / 2.2;

    // Add a gradient to give 3D effect
    const gradient = ctx.createRadialGradient(
        centerX - radius / 3,
        centerY - radius / 3,
        0,
        centerX,
        centerY,
        radius
    );

    gradient.addColorStop(0, lightenColor(color, 0.8));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 0.7));

    // Draw the boulder
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add cracks for texture
    ctx.strokeStyle = darkenColor(color, 0.5);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const startX = centerX + (Math.random() - 0.5) * radius;
        const startY = centerY + (Math.random() - 0.5) * radius;
        const endX = startX + (Math.random() - 0.5) * (radius / 2);
        const endY = startY + (Math.random() - 0.5) * (radius / 2);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

/**
 * Draw a procedural diamond tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawDiamond(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const size = TILE_SIZE / 2.5;
    
    // Create a shiny diamond shape
    const points = [
        { x: centerX, y: centerY - size },           // Top
        { x: centerX + size, y: centerY },           // Right
        { x: centerX, y: centerY + size },           // Bottom
        { x: centerX - size, y: centerY }            // Left
    ];
    
    // Set up a gradient for a shiny effect
    const gradient = ctx.createLinearGradient(
        centerX - size, centerY - size,
        centerX + size, centerY + size
    );
    
    gradient.addColorStop(0, lightenColor(color, 0.9));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, lightenColor(color, 0.7));
    
    // Draw the diamond shape
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Add a shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size / 2);
    ctx.lineTo(centerX + size / 3, centerY);
    ctx.lineTo(centerX, centerY - size / 5);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a procedural exit tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawExit(ctx, color) {
    // Draw a portal-like exit
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const outerRadius = TILE_SIZE / 2.2;
    const innerRadius = TILE_SIZE / 3.5;
    
    // Outer circle
    const gradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, outerRadius
    );
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner circle
    ctx.fillStyle = COLORS.EMPTY;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some stars or sparkles in the portal
    ctx.fillStyle = 'white';
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const x = centerX + Math.cos(angle) * (innerRadius * 0.7);
        const y = centerY + Math.sin(angle) * (innerRadius * 0.7);
        
        const starSize = TILE_SIZE / 20;
        
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw a procedural player tile - Cute miner character inspired by Dig Dug & Mr. Do!
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color (bright yellow)
 */
function drawPlayer(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const headRadius = TILE_SIZE / 3.5;
    
    // === MINING HELMET (with light) ===
    // Helmet body (red/orange)
    ctx.fillStyle = '#FF6B35'; // Orange-red helmet
    ctx.beginPath();
    ctx.arc(centerX, centerY - 2, headRadius * 1.3, Math.PI, 0, false);
    ctx.fill();
    
    // Helmet brim/visor
    ctx.fillStyle = darkenColor('#FF6B35', 0.7);
    ctx.fillRect(
        centerX - headRadius * 1.4,
        centerY - 2,
        headRadius * 2.8,
        headRadius * 0.3
    );
    
    // Helmet light (cute round lamp)
    ctx.fillStyle = '#FFD700'; // Gold light
    ctx.beginPath();
    ctx.arc(centerX, centerY - headRadius * 1.3, headRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Light beam (subtle glow)
    ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX, centerY - headRadius * 1.3, headRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // === CUTE ROUND FACE (yellow) ===
    ctx.fillStyle = color; // Bright yellow face
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Face highlight (shiny effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - headRadius * 0.3, centerY - headRadius * 0.3, headRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // === BIG CUTE EYES ===
    const eyeRadius = headRadius / 2.5;
    const eyeSpacing = headRadius * 0.7;
    
    // Left eye white
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - eyeSpacing, centerY - headRadius * 0.2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right eye white
    ctx.beginPath();
    ctx.arc(centerX + eyeSpacing, centerY - headRadius * 0.2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Left pupil (large and cute)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(centerX - eyeSpacing + eyeRadius * 0.1, centerY - headRadius * 0.15, eyeRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Right pupil (large and cute)
    ctx.beginPath();
    ctx.arc(centerX + eyeSpacing + eyeRadius * 0.1, centerY - headRadius * 0.15, eyeRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye sparkles (makes it lively!)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - eyeSpacing + eyeRadius * 0.3, centerY - headRadius * 0.3, eyeRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX + eyeSpacing + eyeRadius * 0.3, centerY - headRadius * 0.3, eyeRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // === HAPPY SMILE ===
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY + headRadius * 0.1, headRadius * 0.5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    
    // Rosy cheeks (adorable!)
    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(
        centerX - headRadius * 1.1,
        centerY + headRadius * 0.2,
        headRadius * 0.3,
        headRadius * 0.25,
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(
        centerX + headRadius * 1.1,
        centerY + headRadius * 0.2,
        headRadius * 0.3,
        headRadius * 0.25,
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // === MINER OVERALLS (blue denim style) ===
    const bodyTop = centerY + headRadius * 0.9;
    const bodyWidth = headRadius * 1.4;
    const bodyHeight = TILE_SIZE - bodyTop - 2;
    
    // Blue overalls body
    ctx.fillStyle = '#4A90E2'; // Nice blue color
    ctx.fillRect(
        centerX - bodyWidth / 2,
        bodyTop,
        bodyWidth,
        bodyHeight
    );
    
    // Overall straps
    const strapWidth = bodyWidth * 0.2;
    ctx.fillStyle = darkenColor('#4A90E2', 0.8);
    
    // Left strap
    ctx.fillRect(
        centerX - bodyWidth * 0.3,
        bodyTop,
        strapWidth,
        bodyHeight * 0.6
    );
    
    // Right strap
    ctx.fillRect(
        centerX + bodyWidth * 0.3 - strapWidth,
        bodyTop,
        strapWidth,
        bodyHeight * 0.6
    );
    
    // Strap buttons (gold)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX - bodyWidth * 0.25, bodyTop + bodyHeight * 0.15, strapWidth * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX + bodyWidth * 0.25, bodyTop + bodyHeight * 0.15, strapWidth * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Front pocket (detail)
    ctx.strokeStyle = darkenColor('#4A90E2', 0.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(
        centerX - bodyWidth * 0.25,
        bodyTop + bodyHeight * 0.4,
        bodyWidth * 0.5,
        bodyHeight * 0.35
    );
    
    // === CUTE LITTLE ARMS (holding pickaxe) ===
    const armColor = color;
    const armRadius = headRadius * 0.4;
    
    // Left arm
    ctx.fillStyle = armColor;
    ctx.beginPath();
    ctx.arc(centerX - bodyWidth * 0.6, bodyTop + bodyHeight * 0.3, armRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right arm
    ctx.beginPath();
    ctx.arc(centerX + bodyWidth * 0.6, bodyTop + bodyHeight * 0.3, armRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // === TINY PICKAXE (mining tool) ===
    // Handle
    ctx.strokeStyle = '#8B4513'; // Brown handle
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + bodyWidth * 0.6, bodyTop + bodyHeight * 0.3);
    ctx.lineTo(centerX + bodyWidth * 0.9, bodyTop - headRadius * 0.3);
    ctx.stroke();
    
    // Pickaxe head
    ctx.fillStyle = '#A9A9A9'; // Gray metal
    ctx.beginPath();
    ctx.moveTo(centerX + bodyWidth * 0.9, bodyTop - headRadius * 0.3);
    ctx.lineTo(centerX + bodyWidth * 1.1, bodyTop - headRadius * 0.5);
    ctx.lineTo(centerX + bodyWidth * 0.95, bodyTop - headRadius * 0.2);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a procedural enemy tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawEnemy(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const radius = TILE_SIZE / 2.5;
    
    // Main body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    const eyeRadius = radius / 3;
    const eyeOffset = radius / 2;
    
    ctx.fillStyle = 'white';
    
    // Left eye
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - eyeOffset/2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(centerX + eyeOffset, centerY - eyeOffset/2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils (angry look)
    ctx.fillStyle = 'black';
    const pupilRadius = eyeRadius / 1.8;
    
    // Left pupil
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset - pupilRadius/3, centerY - eyeOffset/2, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right pupil
    ctx.beginPath();
    ctx.arc(centerX + eyeOffset + pupilRadius/3, centerY - eyeOffset/2, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth (jagged)
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(centerX - radius/2, centerY + radius/3);
    
    // Jagged teeth pattern
    const teethCount = 7;
    const mouthWidth = radius;
    
    for (let i = 0; i <= teethCount; i++) {
        const x = centerX - radius/2 + (i * mouthWidth / teethCount);
        const y = centerY + radius/3 + (i % 2 === 0 ? radius/5 : 0);
        ctx.lineTo(x, y);
    }
    
    ctx.lineTo(centerX + radius/2, centerY + radius/3);
    ctx.lineTo(centerX + radius/2, centerY + radius/2);
    ctx.lineTo(centerX - radius/2, centerY + radius/2);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a magic wall (converts boulders to diamonds when they fall through)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color (bright green)
 */
function drawMagicWall(ctx, color) {
    // Animated striped pattern
    const stripeWidth = 3;
    const darkColor = darkenColor(color, 0.5);
    
    // Diagonal stripes
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    ctx.fillStyle = darkColor;
    for (let i = -TILE_SIZE; i < TILE_SIZE * 2; i += stripeWidth * 2) {
        ctx.fillRect(i, 0, stripeWidth, TILE_SIZE);
        ctx.save();
        ctx.translate(TILE_SIZE / 2, TILE_SIZE / 2);
        ctx.rotate(Math.PI / 4);
        ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
        ctx.fillRect(i, 0, stripeWidth, TILE_SIZE);
        ctx.restore();
    }
    
    // Border glow effect
    ctx.strokeStyle = lightenColor(color, 0.3);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
}


