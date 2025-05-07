import { generateAssets } from './assets.js';
import { generateLevel } from './level-generator.js';
import { GamePhysics } from './physics.js';
import { 
    TILE_SIZE, 
    GRID_WIDTH, 
    GRID_HEIGHT, 
    ELEMENT_TYPES,
    KEY_MAPPINGS,
    GAME_SETTINGS,
    DIRECTIONS
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
        this.gameOver = false;
        this.level = 1;
        this.score = 0;
        this.diamondsCollected = 0;
        this.requiredDiamonds = 0;
        this.totalDiamonds = 0;
        this.timeRemaining = GAME_SETTINGS.INITIAL_TIME;
        
        // Player state
        this.playerPosition = { x: 0, y: 0 };
        this.exitOpen = false;
        
        // Enemy state
        this.enemies = [];
        this.enemyMoveCounter = 0;
        
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
        
        // Draw title screen
        this.drawTitleScreen();
    }
    
    /**
     * Set up event listeners for keyboard input
     */
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.gameOver) return;
            
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
        
        // Apply CSS scaling
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
    
    /**
     * Start a new game
     */
    startGame() {
        this.level = 1;
        this.score = 0;
        this.isRunning = true;
        this.gameOver = false;
        
        this.startButton.style.display = 'none';
        this.restartButton.style.display = 'inline-block';
        
        this.loadLevel(this.level);
        this.startTimer();
        this.gameLoop();
        
        // Initial resize
        this.handleResize();
    }
    
    /**
     * Restart the current game
     */
    restartGame() {
        this.stopTimer();
        this.startGame();
    }
    
    /**
     * Start the game timer
     */
    startTimer() {
        this.stopTimer();
        this.timeRemaining = GAME_SETTINGS.INITIAL_TIME + (this.level * 30);
        
        this.timerInterval = setInterval(() => {
            if (this.isRunning && !this.gameOver) {
                this.timeRemaining--;
                this.updateHUD();
                
                if (this.timeRemaining <= 0) {
                    this.handlePlayerDeath("Time's up!");
                }
            }
        }, 1000);
    }
    
    /**
     * Stop the game timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Load a level
     * @param {number} levelNumber - The level number to load
     */
    loadLevel(levelNumber) {
        // Generate the level
        const levelData = generateLevel(levelNumber);
        
        // Set up game state
        this.grid = levelData.grid;
        this.playerPosition = levelData.playerPosition;
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.totalDiamonds = levelData.diamonds.length;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        
        // Create physics engine
        this.physics = new GamePhysics(this.grid);
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update the heads-up display
     */
    updateHUD() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.totalDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        this.levelElement.textContent = `Level: ${this.level}`;
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Update physics
        this.updatePhysics();
        
        // Update enemies periodically
        this.enemyMoveCounter++;
        if (this.enemyMoveCounter >= 20) {
            this.updateEnemies();
            this.enemyMoveCounter = 0;
        }
        
        // Check for player crushing
        this.checkPlayerStatus();
        
        // Render the game
        this.render();
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update game physics
     */
    updatePhysics() {
        // Only run physics every few frames for performance
        this.physicsStep++;
        if (this.physicsStep >= 3) {
            this.physics.update();
            this.physicsStep = 0;
        }
    }
    
    /**
     * Update enemy movement
     */
    updateEnemies() {
        if (this.enemies.length > 0) {
            this.enemies = this.physics.moveEnemies(
                this.enemies, 
                this.playerPosition.x, 
                this.playerPosition.y
            );
            
            // Check if enemy caught the player
            if (this.physics.checkEnemyCollision(this.playerPosition.x, this.playerPosition.y, this.enemies)) {
                this.handlePlayerDeath("Caught by an enemy!");
            }
        }
    }
    
    /**
     * Check player status for crushing, etc.
     */
    checkPlayerStatus() {
        if (!this.isRunning || this.gameOver) return;
        
        // Check if player is crushed by falling objects
        if (this.physics.isPlayerCrushed(this.playerPosition.x, this.playerPosition.y)) {
            this.handlePlayerDeath("Crushed by a falling object!");
        }
        
        // Check if exit should be open
        if (this.diamondsCollected >= this.requiredDiamonds && !this.exitOpen) {
            this.exitOpen = true;
            this.showMessage("Exit is now open!");
        }
    }
    
    /**
     * Handle player movement
     * @param {string} direction - Direction to move (UP, DOWN, LEFT, RIGHT)
     */
    handlePlayerMove(direction) {
        if (!this.isRunning || this.gameOver) return;
        
        const moveResult = this.physics.movePlayer(
            this.playerPosition.x,
            this.playerPosition.y,
            direction
        );
        
        if (moveResult.success) {
            this.playerPosition.x = moveResult.newX;
            this.playerPosition.y = moveResult.newY;
            
            // Check if diamond collected
            if (moveResult.collected) {
                this.diamondsCollected++;
                this.score += GAME_SETTINGS.DIAMOND_VALUE;
                this.updateHUD();
            }
            
            // Check if player reached exit
            if (moveResult.exit && this.exitOpen) {
                this.completeLevel();
            }
            
            // Check if player was crushed
            if (moveResult.crushed) {
                this.handlePlayerDeath("Caught by an enemy!");
            }
        }
    }
    
    /**
     * Complete the current level
     */
    completeLevel() {
        this.level++;
        
        if (this.level > GAME_SETTINGS.LEVEL_COUNT) {
            this.gameWon();
        } else {
            this.showMessage(`Level ${this.level - 1} completed!`);
            this.stopTimer();
            
            // Add bonus points for remaining time
            const timeBonus = this.timeRemaining * 5;
            this.score += timeBonus;
            
            setTimeout(() => {
                this.loadLevel(this.level);
                this.startTimer();
            }, 2000);
        }
    }
    
    /**
     * Handle player death
     * @param {string} reason - Reason for death
     */
    handlePlayerDeath(reason) {
        this.isRunning = false;
        this.gameOver = true;
        this.showMessage(`Game Over! ${reason}`);
        
        // Stop the timer
        this.stopTimer();
        
        // Show restart button
        this.restartButton.style.display = 'inline-block';
    }
    
    /**
     * Handle game completion
     */
    gameWon() {
        this.isRunning = false;
        this.gameOver = true;
        this.showMessage(`Congratulations! You've won with ${this.score} points!`);
        
        // Stop the timer
        this.stopTimer();
        
        // Show restart button
        this.restartButton.style.display = 'inline-block';
    }
    
    /**
     * Show a message on screen
     * @param {string} text - The message to show
     */
    showMessage(text) {
        // Draw message overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
        
        this.ctx.font = '24px Arial, sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 10);
    }
    
    /**
     * Draw the title screen
     */
    drawTitleScreen() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title text
        this.ctx.font = '36px Arial, sans-serif';
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BOULDER DASH', this.canvas.width / 2, this.canvas.height / 3);
        
        // Draw instructions
        this.ctx.font = '22px Arial, sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Collect diamonds and reach the exit!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '18px Arial, sans-serif';
        this.ctx.fillText('Arrow keys or WASD to move', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        // Draw some decorative elements
        this.drawSampleElements();
    }
    
    /**
     * Draw sample game elements on the title screen
     */
    drawSampleElements() {
        // Draw some sample diamonds and boulders around the edges
        for (let i = 0; i < 8; i++) {
            const x = (i % 4) * (this.canvas.width / 4) + TILE_SIZE;
            
            // Diamonds at the top
            this.ctx.drawImage(this.sprites[ELEMENT_TYPES.DIAMOND], 
                x, TILE_SIZE, 
                TILE_SIZE, TILE_SIZE);
            
            // Boulders at the bottom
            this.ctx.drawImage(this.sprites[ELEMENT_TYPES.BOULDER], 
                x, this.canvas.height - TILE_SIZE * 2, 
                TILE_SIZE, TILE_SIZE);
        }
    }
    
    /**
     * Render the game state
     */
    render() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const element = this.grid[y][x];
                
                // Skip empty cells
                if (element === ELEMENT_TYPES.EMPTY) continue;
                
                // Draw the element
                this.ctx.drawImage(
                    this.sprites[element],
                    x * TILE_SIZE,
                    y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
        
        // Open exit indication
        if (this.exitOpen) {
            // Add pulsing effect to the exit
            const pulseScale = 1 + 0.1 * Math.sin(Date.now() / 200);
            const exitX = this.exitPosition.x * TILE_SIZE;
            const exitY = this.exitPosition.y * TILE_SIZE;
            
            this.ctx.save();
            this.ctx.translate(exitX + TILE_SIZE / 2, exitY + TILE_SIZE / 2);
            this.ctx.scale(pulseScale, pulseScale);
            this.ctx.drawImage(
                this.sprites[ELEMENT_TYPES.EXIT],
                -TILE_SIZE / 2,
                -TILE_SIZE / 2,
                TILE_SIZE,
                TILE_SIZE
            );
            this.ctx.restore();
        }
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
