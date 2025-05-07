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
        this.fallingObjects = new Set(); // Track falling boulders and diamonds
    }
    
    /**
     * Update the physics state of the game
     * @returns {boolean} - Whether any physics updates occurred
     */
    update() {
        // Clear the set of falling objects
        this.fallingObjects.clear();
        
        // Check for falling boulders and diamonds
        let physicsUpdated = false;
        
        // Scan grid from bottom to top for better falling physics
        for (let y = this.height - 2; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                const element = this.grid[y][x];
                
                if (element === ELEMENT_TYPES.BOULDER || element === ELEMENT_TYPES.DIAMOND) {
                    // Check if object can fall
                    if (this.canFall(x, y)) {
                        // Move object down
                        this.grid[y + 1][x] = element;
                        this.grid[y][x] = ELEMENT_TYPES.EMPTY;
                        this.fallingObjects.add(`${x},${y+1}`);
                        physicsUpdated = true;
                    }
                    // Check if object can roll
                    else if (this.canRoll(x, y)) {
                        physicsUpdated = true;
                    }
                }
            }
        }
        
        return physicsUpdated;
    }
    
    /**
     * Check if an object at (x,y) can fall directly down
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {boolean} - Whether the object can fall
     */
    canFall(x, y) {
        // Check if there's empty space below
        if (y + 1 < this.height && this.grid[y + 1][x] === ELEMENT_TYPES.EMPTY) {
            return true;
        }
        return false;
    }
    
    /**
     * Check if an object at (x,y) can roll to the side
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {boolean} - Whether the object rolled
     */
    canRoll(x, y) {
        const element = this.grid[y][x];
        
        // Check if object is on top of another boulder/diamond or a wall
        if (y + 1 >= this.height) return false;
        
        const elementBelow = this.grid[y + 1][x];
        if (elementBelow !== ELEMENT_TYPES.BOULDER && 
            elementBelow !== ELEMENT_TYPES.DIAMOND && 
            elementBelow !== ELEMENT_TYPES.WALL && 
            elementBelow !== ELEMENT_TYPES.PLAYER) {
            return false;
        }
        
        // Try to roll right first
        if (this.tryRoll(x, y, 1)) {
            return true;
        }
        
        // Then try to roll left
        if (this.tryRoll(x, y, -1)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Try to roll an object in a given direction
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @param {number} dx - The x direction (-1 for left, 1 for right)
     * @returns {boolean} - Whether the object rolled
     */
    tryRoll(x, y, dx) {
        if (!isInBounds(x + dx, y, this.width, this.height) || 
            !isInBounds(x + dx, y + 1, this.width, this.height)) {
            return false;
        }
        
        const element = this.grid[y][x];
        
        // Check if there's space to roll (need both adjacent and below adjacent to be empty)
        if (this.grid[y][x + dx] === ELEMENT_TYPES.EMPTY && 
            this.grid[y + 1][x + dx] === ELEMENT_TYPES.EMPTY) {
            
            // Move object
            this.grid[y][x + dx] = element;
            this.grid[y][x] = ELEMENT_TYPES.EMPTY;
            this.fallingObjects.add(`${x+dx},${y}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if there's a crushing hazard at the given position
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {boolean} - Whether there's a crushing hazard
     */
    checkCrush(x, y) {
        return this.fallingObjects.has(`${x},${y}`);
    }
    
    /**
     * Handle player movement
     * @param {Object} playerPos - Player position {x, y}
     * @param {string} direction - Direction to move ('UP', 'DOWN', 'LEFT', 'RIGHT')
     * @returns {Object} - Movement result
     */
    movePlayer(playerPos, direction) {
        const dir = DIRECTIONS[direction];
        if (!dir) return { success: false };
        
        // Calculate new position
        const newX = playerPos.x + dir.x;
        const newY = playerPos.y + dir.y;
        
        // Check if the new position is valid
        if (!isInBounds(newX, newY, this.width, this.height)) {
            return { success: false };
        }
        
        const targetElement = this.grid[newY][newX];
        let collectDiamond = false;
        let exitReached = false;
        let died = false;
        
        // Check what's in the target position
        switch (targetElement) {
            case ELEMENT_TYPES.EMPTY:
            case ELEMENT_TYPES.DIRT:
                // Can move freely into empty space or dirt
                break;
                
            case ELEMENT_TYPES.DIAMOND:
                collectDiamond = true;
                break;
                
            case ELEMENT_TYPES.EXIT:
                exitReached = true;
                break;
                
            case ELEMENT_TYPES.BOULDER:
                // Check if the boulder can be pushed
                if (dir.x !== 0 && dir.y === 0) { // Only horizontal push
                    const pushX = newX + dir.x;
                    
                    if (isInBounds(pushX, newY, this.width, this.height) && 
                        this.grid[newY][pushX] === ELEMENT_TYPES.EMPTY) {
                        // Move the boulder
                        this.grid[newY][pushX] = ELEMENT_TYPES.BOULDER;
                        break;
                    }
                }
                // If boulder can't be pushed, block movement
                return { success: false };
                
            case ELEMENT_TYPES.ENEMY:
                died = true;
                break;
                
            case ELEMENT_TYPES.WALL:
            default:
                // Can't move into walls
                return { success: false };
        }
        
        // Update the grid
        this.grid[playerPos.y][playerPos.x] = ELEMENT_TYPES.EMPTY;
        this.grid[newY][newX] = ELEMENT_TYPES.PLAYER;
        
        return {
            success: true,
            newPosition: { x: newX, y: newY },
            collectDiamond,
            exitReached,
            died
        };
    }
    
    /**
     * Move enemies in the game
     * @param {Array<{x: number, y: number}>} enemies - Array of enemy positions
     * @param {Object} playerPos - Player position {x, y}
     * @returns {Object} - Movement results including updated enemy positions and whether player died
     */
    moveEnemies(enemies, playerPos) {
        const updatedEnemies = [];
        let playerDied = false;
        
        for (const enemy of enemies) {
            // Check if enemy is still alive (might have been crushed by a boulder)
            if (this.grid[enemy.y][enemy.x] !== ELEMENT_TYPES.ENEMY) {
                continue;
            }
            
            // Enemy AI: Simple movement towards player if possible
            // Randomly decide to move horizontally or vertically first
            const moveHorizontalFirst = Math.random() > 0.5;
            let moved = false;
            
            if (moveHorizontalFirst) {
                moved = this.tryMoveEnemyHorizontal(enemy, playerPos) || 
                        this.tryMoveEnemyVertical(enemy, playerPos);
            } else {
                moved = this.tryMoveEnemyVertical(enemy, playerPos) || 
                        this.tryMoveEnemyHorizontal(enemy, playerPos);
            }
            
            // If the enemy couldn't move, keep it at its current position
            if (!moved) {
                updatedEnemies.push(enemy);
            }
            
            // Check if enemy reached player
            if (playerPos.x === enemy.x && playerPos.y === enemy.y) {
                playerDied = true;
            }
        }
        
        return { updatedEnemies, playerDied };
    }
    
    /**
     * Try to move an enemy horizontally toward the player
     * @param {Object} enemy - Enemy position {x, y}
     * @param {Object} playerPos - Player position {x, y}
     * @returns {boolean} - Whether the enemy moved
     */
    tryMoveEnemyHorizontal(enemy, playerPos) {
        const dx = Math.sign(playerPos.x - enemy.x);
        if (dx === 0) return false;
        
        const newX = enemy.x + dx;
        if (!isInBounds(newX, enemy.y, this.width, this.height)) return false;
        
        const targetElement = this.grid[enemy.y][newX];
        
        // Enemy can only move to empty spaces, dirt, or the player position
        if (targetElement === ELEMENT_TYPES.EMPTY || 
            targetElement === ELEMENT_TYPES.DIRT || 
            targetElement === ELEMENT_TYPES.PLAYER) {
            
            // Update grid
            this.grid[enemy.y][enemy.x] = ELEMENT_TYPES.EMPTY;
            this.grid[enemy.y][newX] = ELEMENT_TYPES.ENEMY;
            
            // Update enemy position
            enemy.x = newX;
            return true;
        }
        
        return false;
    }
    
    /**
     * Try to move an enemy vertically toward the player
     * @param {Object} enemy - Enemy position {x, y}
     * @param {Object} playerPos - Player position {x, y}
     * @returns {boolean} - Whether the enemy moved
     */
    tryMoveEnemyVertical(enemy, playerPos) {
        const dy = Math.sign(playerPos.y - enemy.y);
        if (dy === 0) return false;
        
        const newY = enemy.y + dy;
        if (!isInBounds(enemy.x, newY, this.width, this.height)) return false;
        
        const targetElement = this.grid[newY][enemy.x];
        
        // Enemy can only move to empty spaces, dirt, or the player position
        if (targetElement === ELEMENT_TYPES.EMPTY || 
            targetElement === ELEMENT_TYPES.DIRT || 
            targetElement === ELEMENT_TYPES.PLAYER) {
            
            // Update grid
            this.grid[enemy.y][enemy.x] = ELEMENT_TYPES.EMPTY;
            this.grid[newY][enemy.x] = ELEMENT_TYPES.ENEMY;
            
            // Update enemy position
            enemy.y = newY;
            return true;
        }
        
        return false;
    }
    
    /**
     * Get the current grid state
     * @returns {Array<Array<number>>} - The current game grid
     */
    getGrid() {
        return this.grid;
    }
}
