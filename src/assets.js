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
        const size = Math.random() * 2 + 1;
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw a procedural boulder tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawBoulder(ctx, color) {
    // Create a rounded boulder
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const radius = TILE_SIZE / 2.2;
    
    // Add a gradient to give 3D effect
    const gradient = ctx.createRadialGradient(
        centerX - radius/3, centerY - radius/3, 0,
        centerX, centerY, radius
    );
    
    gradient.addColorStop(0, lightenColor(color, 0.8));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 0.7));
    
    // Draw the boulder
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some texture/cracks
    ctx.strokeStyle = darkenColor(color, 0.6);
    ctx.lineWidth = 1;
    
    // Random cracks
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
 * Draw a procedural player tile
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} color - The main color
 */
function drawPlayer(ctx, color) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const headRadius = TILE_SIZE / 5;
    const bodyHeight = TILE_SIZE / 2.2;
    
    // Body
    ctx.fillStyle = color;
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - bodyHeight/3, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.ellipse(
        centerX, centerY + bodyHeight/6,
        TILE_SIZE/5, bodyHeight/2,
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Arms
    const armWidth = TILE_SIZE / 12;
    const armLength = TILE_SIZE / 3.5;
    
    ctx.fillRect(
        centerX - armLength, 
        centerY - bodyHeight/8,
        armLength * 2,
        armWidth
    );
    
    // Legs
    const legWidth = TILE_SIZE / 10;
    const legLength = TILE_SIZE / 3;
    const legSpacing = TILE_SIZE / 8;
    
    // Left leg
    ctx.fillRect(
        centerX - legSpacing,
        centerY + bodyHeight/6,
        legWidth,
        legLength
    );
    
    // Right leg
    ctx.fillRect(
        centerX + legSpacing - legWidth,
        centerY + bodyHeight/6,
        legWidth,
        legLength
    );
    
    // Add eyes
    ctx.fillStyle = 'white';
    const eyeRadius = headRadius / 3;
    const eyeOffsetX = headRadius / 2;
    const eyeOffsetY = headRadius / 10;
    
    // Left eye
    ctx.beginPath();
    ctx.arc(
        centerX - eyeOffsetX, 
        centerY - bodyHeight/3 - eyeOffsetY,
        eyeRadius, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(
        centerX + eyeOffsetX, 
        centerY - bodyHeight/3 - eyeOffsetY,
        eyeRadius, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Add pupils
    ctx.fillStyle = 'black';
    const pupilRadius = eyeRadius / 2;
    
    // Left pupil
    ctx.beginPath();
    ctx.arc(
        centerX - eyeOffsetX, 
        centerY - bodyHeight/3 - eyeOffsetY,
        pupilRadius, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Right pupil
    ctx.beginPath();
    ctx.arc(
        centerX + eyeOffsetX, 
        centerY - bodyHeight/3 - eyeOffsetY,
        pupilRadius, 0, Math.PI * 2
    );
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

/**
 * Generate all game assets
 * @returns {Object} - Object containing all sprite canvases
 */
export function generateAssets() {
    const assets = {};
    
    // Generate sprites for each element type
    for (const type in ELEMENT_TYPES) {
        const elementType = ELEMENT_TYPES[type];
        const color = COLORS[type];
        assets[elementType] = generateSprite(color, elementType);
    }
    
    return assets;
}
