import { generateAssets } from './assets.js';
import { generateLevel } from './level-generator.js';
import { GamePhysics } from './physics.js';
import { 
    TILE_SIZE, 
    GRID_WIDTH, 
    GRID_HEIGHT, 
    ELEMENT_TYPES,
    KEY_MAPPINGS,
    GAME_SETTINGS
} from './constants.js';
import { formatTime } from './utils.js';

/**
 * Main game class
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size based on grid dimensions
        this.canvas.width = GRID_WIDTH * TILE_SIZE;
        this.canvas.height = GRID_HEIGHT * TILE_SIZE;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.diamondsElement = document.getElementById('diamonds');
        this.timeElement = document.getElementById('time');
        this.levelElement = document.getElementById('level');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        
        // Game state
        this.isRunning = false;
        this.level = 1;
        this.score = 0;
        this.diamondsCollected = 0;
        this.requiredDiamonds = 0;
        this.totalDiamonds = 0;
        this.timeRemaining = GAME_SETTINGS.INITIAL_TIME;
        
        // Animation frame ID for cancellation
        this.animationFrameId = null;
        
        // Timer ID for game clock
        this.timerInterval = null;
        
        // Physics step counter
        this.physicsStep = 0;
        
        // Load assets
        this.sprites = generateAssets();
        
        // Set up input handling
        this.setupEventListeners();
        
        // Set up the initial screen
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
    }
    
    /**
     * Set up event listeners for keyboard input
     */
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            // Handle directional input
            const direction = KEY_MAPPINGS[e.key];
            if (direction) {
                e.preventDefault();
                this.handlePlayerMove(direction);
            }
        });
        
        // Prevent page scrolling with arrow keys
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Maintain aspect ratio while fitting the canvas to the container
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;
        
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        // Calculate dimensions to maintain aspect ratio
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        // Set display size
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
    
    /**
     * Start a new game
     */
    startGame() {
        this.level = 1;
        this.score = 0;
        this.startButton.style.display = 'none';
        this.restartButton.style.display = 'inline-block';
        this.startLevel();
    }
    
    /**
     * Restart the game
     */
    restartGame() {
        // Stop any running game
        this.stopGame();
        this.level = 1;
        this.score = 0;
        this.startLevel();
    }
    
    /**
     * Stop the current game
     */
    stopGame() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Start the current level
     */
    startLevel() {
        // Generate a new level
        const levelData = generateLevel(this.level);
        this.grid = levelData.grid;
        this.playerPosition = levelData.playerPosition;
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.totalDiamonds = levelData.diamonds.length;
        this.diamondsCollected = 0;
        this.timeRemaining = GAME_SETTINGS.INITIAL_TIME;
        
        // Create physics engine for the level
        this.physics = new GamePhysics(this.grid);
        
        // Update UI
        this.updateUI();
        
        // Start the game loop
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
        
        // Start the timer
        this.timerInterval = setInterval(() => {
            if (this.isRunning) {
                this.timeRemaining--;
                this.updateUI();
                
                if (this.timeRemaining <= 0) {
                    this.handlePlayerDeath();
                }
            }
        }, 1000);
        
        // Handle initial resize
        this.handleResize();
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render the game
        this.render();
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Update physics every few frames for falling objects
        this.physicsStep++;
        if (this.physicsStep >= GAME_SETTINGS.BOULDER_FALL_SPEED) {
            const physicsUpdated = this.physics.update();
            
            // Check if any falling objects crushed the player
            if (physicsUpdated && this.physics.checkCrush(this.playerPosition.x, this.playerPosition.y)) {
                this.handlePlayerDeath();
            }
            
            // Reset physics step counter
            this.physicsStep = 0;
            
            // Update enemy positions every physics update
            this.updateEnemies();
        }
    }
    
    /**
     * Update enemy positions and check for collisions
     */
    updateEnemies() {
        // Only move enemies occasionally to make them slower than the player
        if (Math.random() > GAME_SETTINGS.ENEMY_SPEED) return;
        
        // Move enemies
        const enemyResult = this.physics.moveEnemies(this.enemies, this.playerPosition);
        this.enemies = enemyResult.updatedEnemies;
        
        // Check if player died
        if (enemyResult.playerDied) {
            this.handlePlayerDeath();
        }
    }
    
    /**
     * Handle player movement
     * @param {string} direction - The direction to move ('UP', 'DOWN', 'LEFT', 'RIGHT')
     */
    handlePlayerMove(direction) {
        const moveResult = this.physics.movePlayer(this.playerPosition, direction);
        
        if (moveResult.success) {
            // Update player position
            this.playerPosition = moveResult.newPosition;
            
            // Handle diamond collection
            if (moveResult.collectDiamond) {
                this.diamondsCollected++;
                this.score += GAME_SETTINGS.DIAMOND_VALUE;
                this.updateUI();
                
                // Check if exit should be unlocked
                if (this.diamondsCollected >= this.requiredDiamonds) {
                    // Visual indicator that exit is active
                    this.grid[this.exitPosition.y][this.exitPosition.x] = ELEMENT_TYPES.EXIT;
                }
            }
            
            // Check if player reached the exit
            if (moveResult.exitReached && this.diamondsCollected >= this.requiredDiamonds) {
                this.completeLevel();
            }
            
            // Check if player died
            if (moveResult.died) {
                this.handlePlayerDeath();
            }
            
            // Update the grid in the physics engine
            this.grid = this.physics.getGrid();
        }
    }
    
    /**
     * Handle player death
     */
    handlePlayerDeath() {
        this.isRunning = false;
        this.showMessage('Game Over! Press Restart to try again.');
        this.restartButton.style.display = 'inline-block';
        this.stopGame();
    }
    
    /**
     * Complete the current level
     */
    completeLevel() {
        // Add bonus points for completing the level
        const timeBonus = this.timeRemaining * 2;
        this.score += timeBonus;
        
        // Move to the next level
        this.level++;
        
        if (this.level > GAME_SETTINGS.LEVEL_COUNT) {
            // Player beat the game
            this.showMessage(`You beat the game! Final score: ${this.score}`);
            this.stopGame();
        } else {
            // Start the next level
            this.showMessage(`Level ${this.level - 1} complete! Time bonus: ${timeBonus} points`);
            setTimeout(() => this.startLevel(), 2000);
        }
    }
    
    /**
     * Show a message on screen
     * @param {string} message - The message to display
     */
    showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageElement.style.color = 'white';
        messageElement.style.padding = '20px';
        messageElement.style.borderRadius = '10px';
        messageElement.style.fontSize = '24px';
        messageElement.style.textAlign = 'center';
        messageElement.style.zIndex = '100';
        
        this.canvas.parentElement.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 2000);
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the grid
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const element = this.grid[y][x];
                
                // Skip empty spaces
                if (element === ELEMENT_TYPES.EMPTY) continue;
                
                // Get correct sprite for element
                let sprite;
                switch (element) {
                    case ELEMENT_TYPES.WALL:
                        sprite = this.sprites.WALL;
                        break;
                    case ELEMENT_TYPES.DIRT:
                        sprite = this.sprites.DIRT;
                        break;
                    case ELEMENT_TYPES.BOULDER:
                        sprite = this.sprites.BOULDER;
                        break;
                    case ELEMENT_TYPES.DIAMOND:
                        sprite = this.sprites.DIAMOND;
                        break;
                    case ELEMENT_TYPES.EXIT:
                        sprite = this.sprites.EXIT;
                        break;
                    case ELEMENT_TYPES.PLAYER:
                        sprite = this.sprites.PLAYER;
                        break;
                    case ELEMENT_TYPES.ENEMY:
                        sprite = this.sprites.ENEMY;
                        break;
                    default:
                        continue;
                }
                
                // Draw the sprite
                this.ctx.drawImage(sprite, x * TILE_SIZE, y * TILE_SIZE);
            }
        }
    }
    
    /**
     * Update the UI elements
     */
    updateUI() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.requiredDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        this.levelElement.textContent = `Level: ${this.level}`;
    }
}

// Initialize the game when the page is loaded
window.addEventListener('load', () => {
    const game = new Game();
});
