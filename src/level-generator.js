import { ELEMENT_TYPES, GRID_WIDTH, GRID_HEIGHT } from './constants.js';
import { getRandomInt, createGrid, isInBounds, shuffleArray } from './utils.js';

/**
 * Generate a random level for the game
 * @param {number} level - Current level number (affects difficulty)
 * @returns {Object} - Level data
 */
export function generateLevel(level) {
    // Normalize level difficulty (1-5 scale)
    const difficulty = Math.min(5, Math.max(1, level));
    
    // Create empty grid
    const grid = createGrid(GRID_WIDTH, GRID_HEIGHT, ELEMENT_TYPES.EMPTY);
    
    // Fill grid with level elements
    addWalls(grid);
    addDirt(grid);
    
    // Add interactive elements (their quantity depends on the level difficulty)
    const diamondCount = 20 + (difficulty * 5);
    const boulderCount = 30 + (difficulty * 7);
    const enemyCount = Math.floor(difficulty * 1.5);
    
    addBoulders(grid, boulderCount);
    const diamonds = addDiamonds(grid, diamondCount);
    
    // Place player at top left area (with some safe space)
    const playerPos = placeElement(grid, ELEMENT_TYPES.PLAYER, 2, 2, 5, 5);
    
    // Place exit at bottom right area
    const exitPos = placeElement(grid, ELEMENT_TYPES.EXIT, 
        GRID_WIDTH - 6, GRID_HEIGHT - 6, 
        GRID_WIDTH - 3, GRID_HEIGHT - 3);
    
    // Add enemies
    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
        // Keep enemies away from player starting position
        const enemyPos = placeElement(grid, ELEMENT_TYPES.ENEMY, 
            8, 8, GRID_WIDTH - 3, GRID_HEIGHT - 3);
        
        if (enemyPos) {
            enemies.push(enemyPos);
        }
    }
    
    // Calculate minimum required diamonds
    const requiredDiamonds = Math.ceil(diamonds.length * 0.7);
    
    return {
        grid,
        playerPosition: playerPos,
        exitPosition: exitPos,
        diamonds: diamonds,
        enemies,
        requiredDiamonds,
        levelNumber: level
    };
}

/**
 * Add wall borders and some random interior walls
 * @param {Array<Array<number>>} grid - The game grid
 */
function addWalls(grid) {
    const width = grid[0].length;
    const height = grid.length;
    
    // Add border walls
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Border walls
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                grid[y][x] = ELEMENT_TYPES.WALL;
            }
        }
    }
    
    // Add some random interior wall segments
    const wallSegments = getRandomInt(5, 10);
    
    for (let i = 0; i < wallSegments; i++) {
        // Decide if horizontal or vertical wall
        const isHorizontal = Math.random() > 0.5;
        
        if (isHorizontal) {
            const wallY = getRandomInt(5, height - 6);
            const wallStartX = getRandomInt(5, width - 10);
            const wallLength = getRandomInt(5, 10);
            
            // Add horizontal wall with gaps
            for (let x = wallStartX; x < Math.min(width - 2, wallStartX + wallLength); x++) {
                // Add some gaps for player to pass through
                if (Math.random() > 0.7) continue;
                grid[wallY][x] = ELEMENT_TYPES.WALL;
            }
        } else {
            const wallX = getRandomInt(5, width - 6);
            const wallStartY = getRandomInt(5, height - 10);
            const wallLength = getRandomInt(5, 10);
            
            // Add vertical wall with gaps
            for (let y = wallStartY; y < Math.min(height - 2, wallStartY + wallLength); y++) {
                // Add some gaps for player to pass through
                if (Math.random() > 0.7) continue;
                grid[y][wallX] = ELEMENT_TYPES.WALL;
            }
        }
    }
}

/**
 * Fill empty areas with dirt
 * @param {Array<Array<number>>} grid - The game grid
 */
function addDirt(grid) {
    const width = grid[0].length;
    const height = grid.length;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Fill non-wall cells with dirt
            if (grid[y][x] === ELEMENT_TYPES.EMPTY) {
                // Add dirt with some empty patches
                if (Math.random() > 0.1) {
                    grid[y][x] = ELEMENT_TYPES.DIRT;
                }
            }
        }
    }
}

/**
 * Add boulders to the grid
 * @param {Array<Array<number>>} grid - The game grid
 * @param {number} count - Number of boulders to place
 */
function addBoulders(grid, count) {
    const width = grid[0].length;
    const height = grid.length;
    
    // Try to cluster some boulders together
    const clusters = Math.min(10, Math.floor(count / 3));
    
    for (let c = 0; c < clusters; c++) {
        const clusterX = getRandomInt(3, width - 4);
        const clusterY = getRandomInt(3, height - 4);
        const clusterSize = getRandomInt(2, 4);
        
        for (let dy = -clusterSize; dy <= clusterSize; dy++) {
            for (let dx = -clusterSize; dx <= clusterSize; dx++) {
                const x = clusterX + dx;
                const y = clusterY + dy;
                
                if (isInBounds(x, y, width, height) && grid[y][x] === ELEMENT_TYPES.DIRT) {
                    if (Math.random() > 0.5) {
                        grid[y][x] = ELEMENT_TYPES.BOULDER;
                    }
                }
            }
        }
    }
    
    // Place remaining boulders randomly
    let placedBoulders = 0;
    let attempts = 0;
    
    while (placedBoulders < count && attempts < count * 3) {
        attempts++;
        
        const x = getRandomInt(2, width - 3);
        const y = getRandomInt(2, height - 3);
        
        if (grid[y][x] === ELEMENT_TYPES.DIRT) {
            grid[y][x] = ELEMENT_TYPES.BOULDER;
            placedBoulders++;
        }
    }
}

/**
 * Add diamonds to the grid
 * @param {Array<Array<number>>} grid - The game grid
 * @param {number} count - Number of diamonds to place
 * @returns {Array<{x: number, y: number}>} - Array of diamond positions
 */
function addDiamonds(grid, count) {
    const width = grid[0].length;
    const height = grid.length;
    const diamonds = [];
    
    // Create some diamond clusters
    const clusters = Math.min(8, Math.floor(count / 4));
    
    for (let c = 0; c < clusters; c++) {
        const clusterX = getRandomInt(3, width - 4);
        const clusterY = getRandomInt(3, height - 4);
        const clusterSize = getRandomInt(1, 3);
        
        for (let dy = -clusterSize; dy <= clusterSize; dy++) {
            for (let dx = -clusterSize; dx <= clusterSize; dx++) {
                const x = clusterX + dx;
                const y = clusterY + dy;
                
                if (isInBounds(x, y, width, height) && grid[y][x] === ELEMENT_TYPES.DIRT) {
                    if (Math.random() > 0.5) {
                        grid[y][x] = ELEMENT_TYPES.DIAMOND;
                        diamonds.push({x, y});
                    }
                }
            }
        }
    }
    
    // Place remaining diamonds randomly
    let placedDiamonds = diamonds.length;
    let attempts = 0;
    
    while (placedDiamonds < count && attempts < count * 3) {
        attempts++;
        
        const x = getRandomInt(2, width - 3);
        const y = getRandomInt(2, height - 3);
        
        if (grid[y][x] === ELEMENT_TYPES.DIRT) {
            grid[y][x] = ELEMENT_TYPES.DIAMOND;
            diamonds.push({x, y});
            placedDiamonds++;
        }
    }
    
    return diamonds;
}

/**
 * Place an element in the grid within specified bounds
 * @param {Array<Array<number>>} grid - The game grid
 * @param {number} elementType - Type of element to place
 * @param {number} minX - Minimum X coordinate
 * @param {number} minY - Minimum Y coordinate
 * @param {number} maxX - Maximum X coordinate
 * @param {number} maxY - Maximum Y coordinate
 * @returns {Object|null} - Position where element was placed or null
 */
function placeElement(grid, elementType, minX, minY, maxX, maxY) {
    const width = grid[0].length;
    const height = grid.length;
    
    // Ensure bounds are valid
    minX = Math.max(1, minX);
    minY = Math.max(1, minY);
    maxX = Math.min(width - 2, maxX);
    maxY = Math.min(height - 2, maxY);
    
    // Create a list of possible positions
    const positions = [];
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (grid[y][x] === ELEMENT_TYPES.DIRT || grid[y][x] === ELEMENT_TYPES.EMPTY) {
                positions.push({x, y});
            }
        }
    }
    
    // Shuffle positions and try to place element
    const shuffledPositions = shuffleArray(positions);
    
    if (shuffledPositions.length > 0) {
        const pos = shuffledPositions[0];
        grid[pos.y][pos.x] = elementType;
        return {x: pos.x, y: pos.y};
    }
    
    return null;
}
