import { ELEMENT_TYPES, GRID_WIDTH, GRID_HEIGHT } from './constants.js';
import { getRandomInt, createGrid, isInBounds, shuffleArray } from './utils.js';
import { CLASSIC_CAVES, parsePattern } from './classic-levels.js';

/**
 * Generate a level for the game
 * Levels 1-16: Classic Boulder Dash caves
 * Levels 17+: Procedurally generated based on classic patterns
 * @param {number} level - Current level number (affects difficulty)
 * @returns {Object} - Level data
 */
export function generateLevel(level) {
    // For levels 1-16, use classic caves
    if (level >= 1 && level <= 16) {
        return generateClassicLevel(level);
    }
    
    // For levels 17+, use enhanced procedural generation
    return generateProceduralLevel(level);
}

/**
 * Generate a classic Boulder Dash cave (levels 1-16)
 */
function generateClassicLevel(level) {
    const caveIndex = level - 1;
    const cave = CLASSIC_CAVES[caveIndex];
    
    const parsed = parsePattern(cave.pattern, GRID_WIDTH, GRID_HEIGHT);
    
    return {
        grid: parsed.grid,
        playerPosition: parsed.playerPos,
        exitPosition: parsed.exitPos,
        diamonds: parsed.diamonds,
        enemies: parsed.enemies,
        requiredDiamonds: cave.diamondsRequired,
        levelNumber: level,
        levelName: cave.name,
        timeLimit: cave.timeLimit
    };
}

/**
 * Generate procedural level based on classic cave patterns (level 17+)
 */
function generateProceduralLevel(level) {
    // Use classic caves as templates, combining and modifying them
    const templateIndex = (level - 17) % CLASSIC_CAVES.length;
    const template = CLASSIC_CAVES[templateIndex];
    
    // Normalize level difficulty (1-10 scale for advanced levels)
    const difficulty = Math.min(10, Math.max(1, Math.floor((level - 16) / 2) + 1));
    
    // Start with template pattern but add variation
    const parsed = parsePattern(template.pattern, GRID_WIDTH, GRID_HEIGHT);
    const grid = parsed.grid;
    
    // Modify the template grid
    enhanceGrid(grid, difficulty, level);
    
    // Add additional elements based on difficulty
    const diamondCount = template.diamondsRequired + (difficulty * 3);
    const boulderCount = 20 + (difficulty * 8);
    const enemyCount = template.enemies + difficulty;
    
    // Add more boulders
    addBoulders(grid, boulderCount);
    
    // Add more diamonds
    const allDiamonds = addDiamonds(grid, diamondCount);
    
    // Place player (reuse from template or find new position)
    let playerPos = parsed.playerPos;
    if (!playerPos || Math.random() > 0.5) {
        playerPos = placeElement(grid, ELEMENT_TYPES.PLAYER, 2, 2, 6, 6);
    }
    
    // Place exit (reuse from template or find new position)
    let exitPos = parsed.exitPos;
    if (!exitPos || Math.random() > 0.5) {
        exitPos = placeElement(grid, ELEMENT_TYPES.EXIT, 
            GRID_WIDTH - 7, GRID_HEIGHT - 7, 
            GRID_WIDTH - 2, GRID_HEIGHT - 2);
    }
    
    // Add more enemies with direction for wall-following
    const allEnemies = [...parsed.enemies];
    for (let i = parsed.enemies.length; i < enemyCount; i++) {
        const enemyPos = placeElement(grid, ELEMENT_TYPES.ENEMY, 
            8, 8, GRID_WIDTH - 3, GRID_HEIGHT - 3);
        if (enemyPos) {
            allEnemies.push({ ...enemyPos, direction: 'DOWN' });
        }
    }
    
    // Calculate required diamonds (gets harder)
    const requiredDiamonds = Math.ceil(allDiamonds.length * (0.65 + difficulty * 0.02));
    
    // Calculate time limit (gets tighter)
    const timeLimit = Math.max(90, template.timeLimit - difficulty * 5);
    
    return {
        grid,
        playerPosition: playerPos,
        exitPosition: exitPos,
        diamonds: allDiamonds,
        enemies: allEnemies,
        requiredDiamonds,
        levelNumber: level,
        levelName: `${template.name} +${level - 16}`,
        timeLimit
    };
}

/**
 * Enhance a grid with additional complexity
 */
function enhanceGrid(grid, difficulty, level) {
    const width = grid[0].length;
    const height = grid.length;
    
    // Add random walls to increase complexity
    const wallSegments = Math.floor(difficulty / 2);
    for (let i = 0; i < wallSegments; i++) {
        const isHorizontal = Math.random() > 0.5;
        
        if (isHorizontal) {
            const wallY = getRandomInt(3, height - 4);
            const wallStartX = getRandomInt(3, width - 8);
            const wallLength = getRandomInt(3, 7);
            
            for (let x = wallStartX; x < Math.min(width - 2, wallStartX + wallLength); x++) {
                if (Math.random() > 0.6 && grid[wallY][x] === ELEMENT_TYPES.DIRT) {
                    grid[wallY][x] = ELEMENT_TYPES.WALL;
                }
            }
        } else {
            const wallX = getRandomInt(3, width - 4);
            const wallStartY = getRandomInt(3, height - 8);
            const wallLength = getRandomInt(3, 7);
            
            for (let y = wallStartY; y < Math.min(height - 2, wallStartY + wallLength); y++) {
                if (Math.random() > 0.6 && grid[y][wallX] === ELEMENT_TYPES.DIRT) {
                    grid[y][wallX] = ELEMENT_TYPES.WALL;
                }
            }
        }
    }
    
    // Randomly convert some dirt to empty space (creates caves)
    if (difficulty > 3) {
        const emptyCount = Math.floor(difficulty * 5);
        for (let i = 0; i < emptyCount; i++) {
            const x = getRandomInt(2, width - 3);
            const y = getRandomInt(2, height - 3);
            if (grid[y][x] === ELEMENT_TYPES.DIRT) {
                grid[y][x] = ELEMENT_TYPES.EMPTY;
            }
        }
    }
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
 * Fill the empty grid with dirt
 * @param {Array<Array<number>>} grid - The game grid
 */
function addDirt(grid) {
    const width = grid[0].length;
    const height = grid.length;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // If cell is empty, fill with dirt
            if (grid[y][x] === ELEMENT_TYPES.EMPTY) {
                grid[y][x] = ELEMENT_TYPES.DIRT;
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
    // Create boulder clusters
    const clusterCount = Math.floor(count / 4);
    
    for (let c = 0; c < clusterCount; c++) {
        // Choose a random point for the cluster center
        const centerX = getRandomInt(5, grid[0].length - 6);
        const centerY = getRandomInt(5, grid.length - 6);
        
        // Add boulders around the center point
        const clusterSize = getRandomInt(2, 5);
        
        for (let i = 0; i < clusterSize; i++) {
            const offsetX = getRandomInt(-3, 3);
            const offsetY = getRandomInt(-3, 3);
            const x = Math.min(Math.max(1, centerX + offsetX), grid[0].length - 2);
            const y = Math.min(Math.max(1, centerY + offsetY), grid.length - 2);
            
            // Place boulder if the space is dirt
            if (grid[y][x] === ELEMENT_TYPES.DIRT) {
                grid[y][x] = ELEMENT_TYPES.BOULDER;
            }
        }
    }
    
    // Add some individual boulders
    const remainingBoulders = count - (clusterCount * 4);
    
    for (let i = 0; i < remainingBoulders; i++) {
        // Choose a random location for the boulder
        const x = getRandomInt(2, grid[0].length - 3);
        const y = getRandomInt(2, grid.length - 3);
        
        // Place boulder if the space is dirt
        if (grid[y][x] === ELEMENT_TYPES.DIRT) {
            grid[y][x] = ELEMENT_TYPES.BOULDER;
        }
    }
}

/**
 * Add diamonds to the grid
 * @param {Array<Array<number>>} grid - The game grid
 * @param {number} count - Number of diamonds to place
 * @returns {Array<{x: number, y: number}>} - Positions of placed diamonds
 */
function addDiamonds(grid, count) {
    const diamonds = [];
    
    // Some diamonds in small clusters
    const clusterCount = Math.floor(count / 3);
    
    for (let c = 0; c < clusterCount; c++) {
        // Choose a random point for the cluster center
        const centerX = getRandomInt(3, grid[0].length - 4);
        const centerY = getRandomInt(3, grid.length - 4);
        
        // Add diamonds around the center point
        const clusterSize = getRandomInt(2, 4);
        
        for (let i = 0; i < clusterSize; i++) {
            const offsetX = getRandomInt(-2, 2);
            const offsetY = getRandomInt(-2, 2);
            const x = Math.min(Math.max(1, centerX + offsetX), grid[0].length - 2);
            const y = Math.min(Math.max(1, centerY + offsetY), grid.length - 2);
            
            // Place diamond if the space is dirt
            if (grid[y][x] === ELEMENT_TYPES.DIRT) {
                grid[y][x] = ELEMENT_TYPES.DIAMOND;
                diamonds.push({ x, y });
            }
        }
    }
    
    // Rest of diamonds are scattered individually
    const scatteredCount = count - diamonds.length;
    let attempts = 0;
    
    while (diamonds.length < count && attempts < 100) {
        attempts++;
        
        // Choose a random location for the diamond
        const x = getRandomInt(1, grid[0].length - 2);
        const y = getRandomInt(1, grid.length - 2);
        
        // Place diamond if the space is dirt
        if (grid[y][x] === ELEMENT_TYPES.DIRT) {
            grid[y][x] = ELEMENT_TYPES.DIAMOND;
            diamonds.push({ x, y });
        }
    }
    
    return diamonds;
}

/**
 * Place an element at a random position within a specified area
 * @param {Array<Array<number>>} grid - The game grid
 * @param {number} element - The element type to place
 * @param {number} minX - Minimum x coordinate
 * @param {number} minY - Minimum y coordinate
 * @param {number} maxX - Maximum x coordinate
 * @param {number} maxY - Maximum y coordinate
 * @returns {{x: number, y: number}} - Position where the element was placed
 */
function placeElement(grid, element, minX, minY, maxX, maxY) {
    // Try to find an empty spot
    let attempts = 0;
    while (attempts < 50) {
        const x = getRandomInt(minX, maxX);
        const y = getRandomInt(minY, maxY);
        
        // Check if position is valid
        if (isInBounds(x, y, grid[0].length, grid.length) && 
            grid[y][x] === ELEMENT_TYPES.DIRT) {
            
            grid[y][x] = element;
            return { x, y };
        }
        
        attempts++;
    }
    
    // If no spot found, force placement at the center of the region
    const x = Math.floor((minX + maxX) / 2);
    const y = Math.floor((minY + maxY) / 2);
    
    if (isInBounds(x, y, grid[0].length, grid.length)) {
        grid[y][x] = element;
        return { x, y };
    }
    
    // Fallback to a default position
    return { x: minX, y: minY };
}

/**
 * Validate a generated level to ensure it's playable
 * @param {Array<Array<number>>} grid - The game grid
 * @param {{x: number, y: number}} playerPos - Player position
 * @param {{x: number, y: number}} exitPos - Exit position
 * @returns {boolean} - Whether the level is valid
 */
export function validateLevel(grid, playerPos, exitPos) {
    // Check if player and exit are placed
    if (!playerPos || !exitPos) return false;
    
    // Simple path validation - just check that there's a reasonable number of empty spaces
    // For a more thorough check, we'd need a path finding algorithm
    let emptyCount = 0;
    
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] === ELEMENT_TYPES.DIRT || 
                grid[y][x] === ELEMENT_TYPES.DIAMOND ||
                grid[y][x] === ELEMENT_TYPES.EMPTY) {
                emptyCount++;
            }
        }
    }
    
    // At least 60% of the grid should be traversable
    const totalSize = grid.length * grid[0].length;
    return emptyCount / totalSize > 0.6;
}
