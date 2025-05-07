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
        this.lastUpdatedCell = null; // Track the last updated cell for animation
    }
    
    /**
     * Update the physics state of the game
     * @returns {boolean} - Whether any physics updates occurred
     */
    update() {
        // Clear the set of falling objects
        this.fallingObjects.clear();
        this.lastUpdatedCell = null;
        
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
                        this.lastUpdatedCell = { x, y: y+1, type: 'fall' };
                        physicsUpdated = true;
                    }
                    // Check if object can roll
                    else if (this.canRoll(x, y)) {
                        physicsUpdated = true;
                        // The tryRoll method handles the cell update tracking
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
     * @param {number} direction - Direction to roll (1 for right, -1 for left)
     * @returns {boolean} - Whether the object rolled successfully
     */
    tryRoll(x, y, direction) {
        const element = this.grid[y][x];
        
        // Check if we can roll in that direction
        if (x + direction >= 0 && 
            x + direction < this.width &&
            this.grid[y][x + direction] === ELEMENT_TYPES.EMPTY &&
            this.grid[y + 1][x + direction] === ELEMENT_TYPES.EMPTY) {
            
            // Move the object
            this.grid[y][x + direction] = element;
            this.grid[y][x] = ELEMENT_TYPES.EMPTY;
            
            // Track the last updated cell
            this.lastUpdatedCell = { x: x + direction, y, type: 'roll' };
            
            // Add to falling objects for next update
            this.fallingObjects.add(`${x+direction},${y}`);
            
            return true;
        }
        
        return false;
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
     * Handle player movement with pushing mechanics
     * @param {number} playerX - Player's current x position
     * @param {number} playerY - Player's current y position
     * @param {string} direction - Direction to move
     * @returns {Object} - Result of the move {success, newX, newY, collected, crushed, exit}
     */
    movePlayer(playerX, playerY, direction) {
        console.log(`Moving player from ${playerX}, ${playerY} in direction ${direction}`);
        
        // Validate input coordinates
        if (!isInBounds(playerX, playerY, this.width, this.height)) {
            console.error(`Invalid player position: ${playerX}, ${playerY}`);
            return { success: false };
        }

        const dir = DIRECTIONS[direction];
        if (!dir) {
            console.error(`Invalid direction: ${direction}`);
            return { success: false };
        }

        const newX = playerX + dir.x;
        const newY = playerY + dir.y;

        // Check if the move is valid
        if (!isInBounds(newX, newY, this.width, this.height)) {
            console.log(`Cannot move: out of bounds`);
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
                // Enter exit
                this.grid[newY][newX] = ELEMENT_TYPES.PLAYER;
                this.grid[playerY][playerX] = ELEMENT_TYPES.EMPTY;
                result.success = true;
                result.newX = newX;
                result.newY = newY;
                result.exit = true;
                break;

            case ELEMENT_TYPES.ENEMY:
                // Player dies on contact with enemy
                result.crushed = true;
                break;
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
     * Check if player is crushed by a falling object
     * @param {number} playerX - Player's x coordinate
     * @param {number} playerY - Player's y coordinate
     * @returns {boolean} - Whether the player is crushed
     */
    isPlayerCrushed(playerX, playerY) {
        // Check cell above the player
        if (playerY > 0) {
            const aboveElement = this.grid[playerY - 1][playerX];
            
            if ((aboveElement === ELEMENT_TYPES.BOULDER || aboveElement === ELEMENT_TYPES.DIAMOND) &&
                this.isFallingAt(playerX, playerY - 1)) {
                return true;
            }
        }
        
        // Also check if player is crushed from the sides (boulder rolling onto player)
        if (this.lastUpdatedCell && 
            this.lastUpdatedCell.type === 'roll' &&
            this.lastUpdatedCell.y === playerY) {
            
            const cellElement = this.grid[this.lastUpdatedCell.y][this.lastUpdatedCell.x];
            
            // If a boulder just rolled onto the player cell
            if (cellElement === ELEMENT_TYPES.BOULDER && 
                Math.abs(this.lastUpdatedCell.x - playerX) <= 1) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Move enemies toward the player
     * @param {Array<{x: number, y: number}>} enemies - Array of enemy positions
     * @param {number} playerX - Player's x coordinate
     * @param {number} playerY - Player's y coordinate
     * @returns {Array<{x: number, y: number}>} - Updated enemy positions
     */
    moveEnemies(enemies, playerX, playerY) {
        const updatedEnemies = [];
        
        for (const enemy of enemies) {
            // 20% chance enemy doesn't move
            if (Math.random() < 0.2) {
                updatedEnemies.push({ x: enemy.x, y: enemy.y });
                continue;
            }
            
            // Determine best direction to move toward player
            const directions = [];
            
            // Add horizontal direction
            if (playerX < enemy.x) {
                directions.push({ dx: -1, dy: 0 });
            } else if (playerX > enemy.x) {
                directions.push({ dx: 1, dy: 0 });
            }
            
            // Add vertical direction
            if (playerY < enemy.y) {
                directions.push({ dx: 0, dy: -1 });
            } else if (playerY > enemy.y) {
                directions.push({ dx: 0, dy: 1 });
            }
            
            // Add diagonal directions for smarter movement
            if (playerX < enemy.x && playerY < enemy.y) {
                directions.push({ dx: -1, dy: -1 }); // Up-left
            } else if (playerX > enemy.x && playerY < enemy.y) {
                directions.push({ dx: 1, dy: -1 });  // Up-right
            } else if (playerX < enemy.x && playerY > enemy.y) {
                directions.push({ dx: -1, dy: 1 });  // Down-left
            } else if (playerX > enemy.x && playerY > enemy.y) {
                directions.push({ dx: 1, dy: 1 });   // Down-right
            }
            
            // Add random direction for more unpredictable movement
            const randomDirs = [
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 }
            ];
            directions.push(randomDirs[Math.floor(Math.random() * randomDirs.length)]);
            
            // Shuffle for some randomness
            let moved = false;
            directions.sort(() => Math.random() - 0.5);
            
            // Try each direction
            for (const dir of directions) {
                const newX = enemy.x + dir.dx;
                const newY = enemy.y + dir.dy;
                
                // Check if valid move
                if (isInBounds(newX, newY, this.width, this.height) &&
                    (this.grid[newY][newX] === ELEMENT_TYPES.EMPTY || 
                     this.grid[newY][newX] === ELEMENT_TYPES.DIRT ||
                     this.grid[newY][newX] === ELEMENT_TYPES.PLAYER)) {
                    
                    // Check if moving onto player
                    if (this.grid[newY][newX] === ELEMENT_TYPES.PLAYER) {
                        // Enemy catches player - just update position
                        updatedEnemies.push({ x: newX, y: newY });
                    } else {
                        // Move enemy
                        this.grid[newY][newX] = ELEMENT_TYPES.ENEMY;
                        this.grid[enemy.y][enemy.x] = ELEMENT_TYPES.EMPTY;
                        updatedEnemies.push({ x: newX, y: newY });
                    }
                    
                    moved = true;
                    break;
                }
            }
            
            // If couldn't move, stay in place
            if (!moved) {
                updatedEnemies.push({ x: enemy.x, y: enemy.y });
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
     * Check if a boulder or diamond would crush an enemy
     * @param {Array<{x: number, y: number}>} enemies - Array of enemy positions
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
        }
        
        return crushedIndices;
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
