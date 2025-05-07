import { COLORS, ELEMENT_TYPES, TILE_SIZE } from './constants.js';

/**
 * Generate a procedural sprite for a game element
 * @param {string} color - The main color of the element
 * @param {number} type - The element type
 * @returns {HTMLCanvasElement} - A canvas element with the generated sprite
 */
function generateSprite(color, type) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = COLORS.EMPTY;
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
        default:
            break;
    }
    
    return canvas;
}

/**
 * Draw a procedural wall tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawWall(ctx, color) {
    const brickWidth = TILE_SIZE / 4;
    const brickHeight = TILE_SIZE / 3;
    const darkColor = darkenColor(color, 0.7);
    
    // Draw brick pattern
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    ctx.fillStyle = darkColor;
    
    // Draw horizontal lines
    for (let y = brickHeight; y < TILE_SIZE; y += brickHeight) {
        ctx.fillRect(0, y - 1, TILE_SIZE, 2);
    }
    
    // Draw vertical lines (staggered)
    for (let row = 0; row < 3; row++) {
        const offset = row % 2 ? 0 : brickWidth / 2;
        for (let x = offset; x < TILE_SIZE; x += brickWidth) {
            ctx.fillRect(x - 1, row * brickHeight, 2, brickHeight);
        }
    }
}

/**
 * Draw a procedural dirt tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawDirt(ctx, color) {
    // Base dirt color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Add specs and variations
    const darkColor = darkenColor(color, 0.7);
    const lightColor = lightenColor(color, 0.7);
    
    ctx.fillStyle = darkColor;
    for (let i = 0; i < 15; i++) {
        const size = Math.random() * 3 + 1;
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = lightColor;
    for (let i = 0; i < 10; i++) {
        const size = Math.random() * 2 + 0.5;
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw a procedural boulder
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawBoulder(ctx, color) {
    // Draw circular boulder
    const radius = TILE_SIZE * 0.45;
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    
    // Create gradient
    const gradient = ctx.createRadialGradient(
        centerX - radius/3, centerY - radius/3, radius/10,
        centerX, centerY, radius
    );
    
    const lightColor = lightenColor(color, 0.6);
    const darkColor = darkenColor(color, 0.5);
    
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkColor);
    
    // Draw boulder
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some texture
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < 5; i++) {
        const startAngle = Math.random() * Math.PI * 2;
        const arcLength = Math.random() * Math.PI / 2 + Math.PI / 4;
        const arcRadius = Math.random() * (radius - 5) + 5;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, startAngle, startAngle + arcLength);
        ctx.stroke();
    }
}

/**
 * Draw a procedural diamond
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawDiamond(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const size = TILE_SIZE * 0.4;
    
    // Create points for diamond shape
    const points = [
        { x: centerX, y: centerY - size },        // Top
        { x: centerX + size, y: centerY },        // Right
        { x: centerX, y: centerY + size },        // Bottom
        { x: centerX - size, y: centerY }         // Left
    ];
    
    // Create gradient
    const lightColor = lightenColor(color, 0.8);
    const darkColor = darkenColor(color, 0.6);
    
    // Draw diamond
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createLinearGradient(
        centerX - size, centerY - size, 
        centerX + size, centerY + size
    );
    gradient.addColorStop(0, darkColor);
    gradient.addColorStop(0.5, lightColor);
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.3, centerY - size * 0.3);
    ctx.lineTo(centerX - size * 0.1, centerY - size * 0.5);
    ctx.lineTo(centerX + size * 0.2, centerY - size * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
}

/**
 * Draw a procedural exit
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawExit(ctx, color) {
    const padding = TILE_SIZE * 0.1;
    const size = TILE_SIZE - padding * 2;
    
    // Draw exit background
    ctx.fillStyle = COLORS.EMPTY;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Draw exit frame
    ctx.fillStyle = color;
    ctx.fillRect(padding, padding, size, size);
    
    // Draw inner exit (black hole effect)
    const gradient = ctx.createRadialGradient(
        TILE_SIZE / 2, TILE_SIZE / 2, size / 10,
        TILE_SIZE / 2, TILE_SIZE / 2, size / 2
    );
    
    gradient.addColorStop(0, 'rgba(100, 100, 100, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(padding * 2, padding * 2, size - padding * 2, size - padding * 2);
    
    // Add some sparkles
    ctx.fillStyle = 'white';
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const distance = size / 3;
        const x = TILE_SIZE / 2 + Math.cos(angle) * distance;
        const y = TILE_SIZE / 2 + Math.sin(angle) * distance;
        
        const sparkSize = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, sparkSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw a procedural player character
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawPlayer(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const headRadius = TILE_SIZE / 5;
    
    // Draw body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY - headRadius/2, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw body
    ctx.beginPath();
    ctx.moveTo(centerX - headRadius, centerY);
    ctx.lineTo(centerX + headRadius, centerY);
    ctx.lineTo(centerX + headRadius * 0.8, centerY + TILE_SIZE * 0.3);
    ctx.lineTo(centerX - headRadius * 0.8, centerY + TILE_SIZE * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Draw eyes
    const eyeOffset = headRadius / 2;
    ctx.fillStyle = 'white';
    
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - headRadius/2 - 1, headRadius/3, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset, centerY - headRadius/2 - 1, headRadius/3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - headRadius/2 - 1, headRadius/6, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset, centerY - headRadius/2 - 1, headRadius/6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw arms
    ctx.strokeStyle = color;
    ctx.lineWidth = headRadius / 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(centerX - headRadius, centerY + headRadius/2);
    ctx.lineTo(centerX - headRadius * 2, centerY + headRadius);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + headRadius, centerY + headRadius/2);
    ctx.lineTo(centerX + headRadius * 2, centerY + headRadius);
    ctx.stroke();
    
    // Draw legs
    ctx.beginPath();
    ctx.moveTo(centerX - headRadius/2, centerY + TILE_SIZE * 0.3);
    ctx.lineTo(centerX - headRadius, centerY + TILE_SIZE * 0.4);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + headRadius/2, centerY + TILE_SIZE * 0.3);
    ctx.lineTo(centerX + headRadius, centerY + TILE_SIZE * 0.4);
    ctx.stroke();
}

/**
 * Draw a procedural enemy
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawEnemy(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const size = TILE_SIZE * 0.35;
    
    // Draw body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    const eyeDistance = size / 2;
    const eyeSize = size / 3;
    const eyeY = centerY - size / 4;
    
    // Eye whites
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - eyeDistance, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(centerX + eyeDistance, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX - eyeDistance, eyeY, eyeSize/2, 0, Math.PI * 2);
    ctx.arc(centerX + eyeDistance, eyeY, eyeSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw fangs
    ctx.fillStyle = 'white';
    const mouthY = centerY + size/2;
    
    ctx.beginPath();
    ctx.moveTo(centerX - size/2, mouthY);
    ctx.lineTo(centerX - size/4, mouthY - size/3);
    ctx.lineTo(centerX, mouthY);
    ctx.lineTo(centerX + size/4, mouthY - size/3);
    ctx.lineTo(centerX + size/2, mouthY);
    ctx.fill();
    
    // Draw tentacles/spikes
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const angles = [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3];
    
    angles.forEach(angle => {
        const spikeLength = Math.random() * (size/2) + size;
        const startX = centerX + Math.cos(angle) * size;
        const startY = centerY + Math.sin(angle) * size;
        const endX = centerX + Math.cos(angle) * spikeLength;
        const endY = centerY + Math.sin(angle) * spikeLength;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    });
}

/**
 * Helper to darken a color by a factor
 * @param {string} color - Hex color code
 * @param {number} factor - Value between 0-1 
 * @returns {string} - Darkened color
 */
function darkenColor(color, factor) {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    
    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Helper to lighten a color by a factor
 * @param {string} color - Hex color code
 * @param {number} factor - Value between 0-1 
 * @returns {string} - Lightened color
 */
function lightenColor(color, factor) {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Generate all the game sprites
 * @returns {Object} - An object containing all the sprite canvases
 */
export function generateAssets() {
    const sprites = {};
    
    for (const [name, type] of Object.entries(ELEMENT_TYPES)) {
        if (type === ELEMENT_TYPES.EMPTY) continue;
        sprites[name] = generateSprite(COLORS[name], type);
    }
    
    return sprites;
}
