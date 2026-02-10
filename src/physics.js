import { ELEMENT_TYPES, DIRECTIONS } from './constants.js';
import { isInBounds, cloneGrid } from './utils.js';

/**
 * Handle the physics and game rules
 */
export class GamePhysics {
    constructor(grid) {
        this.grid = cloneGrid(grid);
        this.width = this.grid[0].length;
        this.height = this.grid.length;
        this.fallingObjects = new Set(); // Persistent set: objects enter when they start falling, leave when at rest
        this.lastUpdatedCell = null; // Track the last updated cell for animation
        this.playerCrushedThisFrame = false; // Flag for crush detection
    }
    
    /**
     * Get a copy of the current physics grid
     * @returns {Array<Array<number>>} - A clone of the current grid
     */
    getGrid() {
        return cloneGrid(this.grid);
    }
    
    /**
     * Get a direct reference to the physics grid (no clone, read-only use)
     * @returns {Array<Array<number>>} - The current grid by reference
     */
    getGridRef() {
        return this.grid;
    }
    
    /**
     * Update the physics state of the game (optimized)
     * Uses a persistent fallingObjects set — objects enter when they start
     * moving (fall/roll/push) and are removed when they come to rest.
     * A falling object crushes the player; a resting object does not.
     * @returns {boolean} - Whether any physics updates occurred
     */
    update() {
        this.lastUpdatedCell = null;
        this.playerCrushedThisFrame = false;
        
        // Track which positions we process this tick (to update fallingObjects)
        const processedThisTick = new Set();
        
        let physicsUpdated = false;
        
        // Optimized scan from bottom to top for better falling physics
        for (let y = this.height - 2; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                const element = this.grid[y][x];
                
                // Only process boulders and diamonds
                if (element !== ELEMENT_TYPES.BOULDER && element !== ELEMENT_TYPES.DIAMOND) {
                    continue;
                }
                
                const key = `${x},${y}`;
                processedThisTick.add(key);
                
                // Inline canFall check for performance
                const below = this.grid[y + 1][x];
                
                if (below === ELEMENT_TYPES.EMPTY) {
                    // Direct fall
                    this.grid[y + 1][x] = element;
                    this.grid[y][x] = ELEMENT_TYPES.EMPTY;
                    this.fallingObjects.delete(key);
                    this.fallingObjects.add(`${x},${y+1}`);
                    this.lastUpdatedCell = { x, y: y+1, type: 'fall' };
                    physicsUpdated = true;
                } else if (below === ELEMENT_TYPES.PLAYER) {
                    // Only crush if this object is actively falling
                    if (this.fallingObjects.has(key)) {
                        // Falling object lands on player - crush them!
                        this.grid[y + 1][x] = element;
                        this.grid[y][x] = ELEMENT_TYPES.EMPTY;
                        this.fallingObjects.delete(key);
                        this.playerCrushedThisFrame = true;
                        this.lastUpdatedCell = { x, y: y+1, type: 'crush' };
                        physicsUpdated = true;
                    } else {
                        // Not falling — boulder is resting, player can stand under it
                        // Try to roll off the player's head
                        if (this.tryRollOptimized(x, y)) {
                            physicsUpdated = true;
                        }
                    }
                } else if (below === ELEMENT_TYPES.MAGIC_WALL) {
                    // Magic wall: Boulder becomes diamond, diamond becomes boulder
                    // Only if there's space below the magic wall
                    if (y + 2 < this.height && this.grid[y + 2][x] === ELEMENT_TYPES.EMPTY) {
                        const convertedElement = element === ELEMENT_TYPES.BOULDER ? 
                            ELEMENT_TYPES.DIAMOND : ELEMENT_TYPES.BOULDER;
                        this.grid[y + 2][x] = convertedElement;
                        this.grid[y][x] = ELEMENT_TYPES.EMPTY;
                        this.fallingObjects.delete(key);
                        this.fallingObjects.add(`${x},${y+2}`);
                        this.lastUpdatedCell = { x, y: y+2, type: 'magic' };
                        physicsUpdated = true;
                    } else {
                        // Can't pass through magic wall, come to rest
                        this.fallingObjects.delete(key);
                    }
                } else if (below === ELEMENT_TYPES.BOULDER || 
                          below === ELEMENT_TYPES.DIAMOND || 
                          below === ELEMENT_TYPES.WALL) {
                    // Try to roll off rounded surface
                    if (this.tryRollOptimized(x, y)) {
                        // Rolling transfers falling state (handled inside tryRollOptimized)
                        this.fallingObjects.delete(key);
                        physicsUpdated = true;
                    } else {
                        // Can't roll, come to rest
                        this.fallingObjects.delete(key);
                    }
                } else {
                    // On dirt or other non-empty surface — at rest
                    this.fallingObjects.delete(key);
                }
            }
        }
        
        // Clean up any stale entries (objects that were destroyed or collected)
        for (const key of this.fallingObjects) {
            if (!processedThisTick.has(key)) {
                this.fallingObjects.delete(key);
            }
        }
        
        return physicsUpdated;
    }
    
    /**
     * Check if a position contains a falling object
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {boolean} - Whether the position has a falling object
     */
    isFallingAt(x, y) {
        return this.fallingObjects.has(`${x},${y}`);
    }
    
    /**
     * Move the player in a direction
     * @param {number} playerX - Player's current x coordinate
     * @param {number} playerY - Player's current y coordinate
     * @param {string} direction - Direction to move ('UP', 'DOWN', 'LEFT', 'RIGHT')
     * @param {boolean} exitOpen - Whether the exit is open (enough diamonds collected)
     * @returns {Object} - Object with success, new position, and collected flags
     */
    movePlayer(playerX, playerY, direction, exitOpen = false) {
        // Validate input coordinates
        if (!isInBounds(playerX, playerY, this.width, this.height)) {
            return { success: false };
        }

        const dir = DIRECTIONS[direction];
        if (!dir) {
            return { success: false };
        }

        const newX = playerX + dir.x;
        const newY = playerY + dir.y;

        // Check if the move is valid
        if (!isInBounds(newX, newY, this.width, this.height)) {
            return { success: false };
        }

        // Force player position in grid to avoid desync
        this.grid[playerY][playerX] = ELEMENT_TYPES.PLAYER;

        // Check target cell
        const targetElement = this.grid[newY][newX];

        // Result object
        const result = {
            success: false,
            newX: playerX,
            newY: playerY,
            collected: false,
            crushed: false,
            exit: false
        };

        switch (targetElement) {
            case ELEMENT_TYPES.EMPTY:
            case ELEMENT_TYPES.DIRT:
                // Move to empty space or dig through dirt
                this.grid[newY][newX] = ELEMENT_TYPES.PLAYER;
                this.grid[playerY][playerX] = ELEMENT_TYPES.EMPTY;
                result.success = true;
                result.newX = newX;
                result.newY = newY;
                break;

            case ELEMENT_TYPES.DIAMOND:
                // Collect diamond
                this.grid[newY][newX] = ELEMENT_TYPES.PLAYER;
                this.grid[playerY][playerX] = ELEMENT_TYPES.EMPTY;
                result.success = true;
                result.newX = newX;
                result.newY = newY;
                result.collected = true;
                break;

            case ELEMENT_TYPES.BOULDER:
                // Try to push boulder
                if (this.tryPushBoulder(newX, newY, dir.x, dir.y)) {
                    this.grid[newY][newX] = ELEMENT_TYPES.PLAYER;
                    this.grid[playerY][playerX] = ELEMENT_TYPES.EMPTY;
                    result.success = true;
                    result.newX = newX;
                    result.newY = newY;
                }
                break;

            case ELEMENT_TYPES.EXIT:
                if (exitOpen) {
                    this.grid[newY][newX] = ELEMENT_TYPES.PLAYER;
                    this.grid[playerY][playerX] = ELEMENT_TYPES.EMPTY;
                    result.success = true;
                    result.newX = newX;
                    result.newY = newY;
                    result.exit = true;
                }
                break;

            case ELEMENT_TYPES.ENEMY:
                // Player dies on contact with enemy
                result.crushed = true;
                break;
        }

        return result;
    }
    
    /**
     * Grab an item in a direction without moving (classic Boulder Dash mechanic)
     * @param {number} playerX - Player's current x coordinate
     * @param {number} playerY - Player's current y coordinate
     * @param {string} direction - Direction to grab ('UP', 'DOWN', 'LEFT', 'RIGHT')
     * @returns {Object} - Result with collected flag
     */
    grabItem(playerX, playerY, direction) {
        // Validate input coordinates
        if (!isInBounds(playerX, playerY, this.width, this.height)) {
            return { collected: false };
        }

        const dir = DIRECTIONS[direction];
        if (!dir) {
            return { collected: false };
        }

        const targetX = playerX + dir.x;
        const targetY = playerY + dir.y;

        // Check if the target is valid
        if (!isInBounds(targetX, targetY, this.width, this.height)) {
            return { collected: false };
        }

        const targetElement = this.grid[targetY][targetX];

        // Result object
        const result = {
            collected: false
        };

        // Can only grab dirt or diamonds
        if (targetElement === ELEMENT_TYPES.DIRT || targetElement === ELEMENT_TYPES.DIAMOND) {
            // Remove the item without moving player
            this.grid[targetY][targetX] = ELEMENT_TYPES.EMPTY;
            result.collected = (targetElement === ELEMENT_TYPES.DIAMOND);
        }

        return result;
    }
    
    /**
     * Try to push a boulder in a direction
     * @param {number} x - Boulder's x coordinate
     * @param {number} y - Boulder's y coordinate
     * @param {number} dirX - X direction to push
     * @param {number} dirY - Y direction to push
     * @returns {boolean} - Whether the boulder was pushed
     */
    tryPushBoulder(x, y, dirX, dirY) {
        // Can only push horizontally
        if (dirY !== 0) return false;
        
        const targetX = x + dirX;
        const targetY = y;
        
        // Check if target cell is empty
        if (isInBounds(targetX, targetY, this.width, this.height) && 
            this.grid[targetY][targetX] === ELEMENT_TYPES.EMPTY) {
            
            // Move the boulder
            this.grid[targetY][targetX] = ELEMENT_TYPES.BOULDER;
            
            // Track the boulder as a falling object so it can continue falling on next update
            this.fallingObjects.add(`${targetX},${targetY}`);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Optimized roll attempt (right first, then left)
     * @returns {boolean} Whether the roll succeeded
     */
    tryRollOptimized(x, y) {
        const element = this.grid[y][x];
        
        // Try rolling right first
        if (x + 1 < this.width && 
            this.grid[y][x + 1] === ELEMENT_TYPES.EMPTY && 
            this.grid[y + 1][x + 1] === ELEMENT_TYPES.EMPTY) {
            
            this.grid[y][x + 1] = element;
            this.grid[y][x] = ELEMENT_TYPES.EMPTY;
            this.lastUpdatedCell = { x: x + 1, y, type: 'roll' };
            this.fallingObjects.add(`${x+1},${y}`);
            return true;
        }
        
        // Then try left
        if (x - 1 >= 0 && 
            this.grid[y][x - 1] === ELEMENT_TYPES.EMPTY && 
            this.grid[y + 1][x - 1] === ELEMENT_TYPES.EMPTY) {
            
            this.grid[y][x - 1] = element;
            this.grid[y][x] = ELEMENT_TYPES.EMPTY;
            this.lastUpdatedCell = { x: x - 1, y, type: 'roll' };
            this.fallingObjects.add(`${x-1},${y}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if player is crushed by a falling object
     * Only returns true if a boulder/diamond has ACTUALLY landed on the player
     * In classic Boulder Dash, you have one frame to escape before getting crushed
     */
    isPlayerCrushed(playerX, playerY) {
        // Check if crushed this frame by a falling object
        if (this.playerCrushedThisFrame) {
            return true;
        }
        
        // ONLY check if there's a boulder or diamond that has landed ON the player's position
        // This happens when physics.update() moves a falling object onto the player
        const playerElement = this.grid[playerY][playerX];
        if (playerElement === ELEMENT_TYPES.BOULDER || playerElement === ELEMENT_TYPES.DIAMOND) {
            // Something has actually landed on the player - they're crushed!
            return true;
        }
        
        // Do NOT check for falling objects above - this gives player time to escape
        // This matches the original Boulder Dash gameplay feel
        return false;
    }
    
    /**
     * Classic Boulder Dash wall-following enemy movement.
     * Fireflies follow the left wall: try left, try straight, try right, reverse.
     * Enemies can only move through EMPTY spaces or onto the PLAYER.
     * @param {Array<Object>} enemies - Array of enemy objects {x, y, direction}
     * @param {number} playerX - Player's x coordinate
     * @param {number} playerY - Player's y coordinate
     * @returns {Array<Object>} - Updated enemy positions with directions
     */
    moveEnemies(enemies, playerX, playerY) {
        const updatedEnemies = [];
        
        // Direction turn tables for left-wall following
        const turnLeft = { UP: 'LEFT', LEFT: 'DOWN', DOWN: 'RIGHT', RIGHT: 'UP' };
        const turnRight = { UP: 'RIGHT', RIGHT: 'DOWN', DOWN: 'LEFT', LEFT: 'UP' };
        const reverse = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        const dirDelta = { UP: { dx: 0, dy: -1 }, DOWN: { dx: 0, dy: 1 }, LEFT: { dx: -1, dy: 0 }, RIGHT: { dx: 1, dy: 0 } };
        
        for (const enemy of enemies) {
            // Ensure enemy has a direction (backwards compat)
            if (!enemy.direction) enemy.direction = 'DOWN';
            
            let moved = false;
            let newDir = enemy.direction;
            
            // Classic wall-following: try left, straight, right, reverse
            const tryOrder = [
                turnLeft[enemy.direction],
                enemy.direction,
                turnRight[enemy.direction],
                reverse[enemy.direction]
            ];
            
            for (const dir of tryOrder) {
                const delta = dirDelta[dir];
                const newX = enemy.x + delta.dx;
                const newY = enemy.y + delta.dy;
                
                if (isInBounds(newX, newY, this.width, this.height) &&
                    (this.grid[newY][newX] === ELEMENT_TYPES.EMPTY || 
                     this.grid[newY][newX] === ELEMENT_TYPES.PLAYER)) {
                    
                    newDir = dir;
                    
                    if (this.grid[newY][newX] === ELEMENT_TYPES.PLAYER) {
                        updatedEnemies.push({ x: newX, y: newY, direction: newDir });
                    } else {
                        this.grid[newY][newX] = ELEMENT_TYPES.ENEMY;
                        this.grid[enemy.y][enemy.x] = ELEMENT_TYPES.EMPTY;
                        updatedEnemies.push({ x: newX, y: newY, direction: newDir });
                    }
                    
                    moved = true;
                    break;
                }
            }
            
            if (!moved) {
                updatedEnemies.push({ x: enemy.x, y: enemy.y, direction: enemy.direction });
            }
        }
        
        return updatedEnemies;
    }
    
    /**
     * Check if player collided with any enemies
     * @param {number} playerX - Player's x coordinate
     * @param {number} playerY - Player's y coordinate
     * @param {Array<{x: number, y: number}>} enemies - Array of enemy positions
     * @returns {boolean} - Whether player collided with an enemy
     */
    checkEnemyCollision(playerX, playerY, enemies) {
        return enemies.some(enemy => enemy.x === playerX && enemy.y === playerY);
    }
    
    /**
     * Check if a boulder or diamond would crush an enemy.
     * In classic Boulder Dash, crushed enemies explode into diamonds (3x3 area).
     * @param {Array<Object>} enemies - Array of enemy positions
     * @returns {Array<number>} - Indices of enemies that are crushed
     */
    checkEnemiesCrushed(enemies) {
        const crushedIndices = [];
        
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            // Check if there's a falling object above
            if (enemy.y > 0) {
                const aboveElement = this.grid[enemy.y - 1][enemy.x];
                if ((aboveElement === ELEMENT_TYPES.BOULDER || aboveElement === ELEMENT_TYPES.DIAMOND) &&
                    this.isFallingAt(enemy.x, enemy.y - 1)) {
                    crushedIndices.push(i);
                }
            }
            
            // Also check if something landed ON the enemy position
            if (this.grid[enemy.y][enemy.x] === ELEMENT_TYPES.BOULDER ||
                this.grid[enemy.y][enemy.x] === ELEMENT_TYPES.DIAMOND) {
                if (!crushedIndices.includes(i)) {
                    crushedIndices.push(i);
                }
            }
        }
        
        return crushedIndices;
    }
    
    /**
     * Explode an enemy into diamonds in a 3x3 area (classic Boulder Dash behavior).
     * @param {number} x - Enemy x position
     * @param {number} y - Enemy y position
     * @returns {number} - Number of diamonds created
     */
    explodeEnemy(x, y) {
        let diamondsCreated = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (!isInBounds(nx, ny, this.width, this.height)) continue;
                
                const cell = this.grid[ny][nx];
                // Replace dirt, empty, boulders, and the enemy itself with diamonds
                // Don't replace walls, exit, player, or other enemies
                if (cell === ELEMENT_TYPES.DIRT || 
                    cell === ELEMENT_TYPES.EMPTY || 
                    cell === ELEMENT_TYPES.BOULDER ||
                    cell === ELEMENT_TYPES.ENEMY) {
                    this.grid[ny][nx] = ELEMENT_TYPES.DIAMOND;
                    diamondsCreated++;
                }
            }
        }
        
        return diamondsCreated;
    }
    
    /**
     * Get the current last updated cell for animation purposes
     * @returns {Object|null} - The last updated cell or null
     */
    getLastUpdatedCell() {
        return this.lastUpdatedCell;
    }
    
    /**
     * Set a specific cell to a given element type
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @param {number} elementType - The element type to set
     */
    setCell(x, y, elementType) {
        if (isInBounds(x, y, this.width, this.height)) {
            this.grid[y][x] = elementType;
        }
    }
}
