import { generateAssets } from './assets.js';
import { generateLevel } from './level-generator.js';
import { GamePhysics } from './physics.js';
import { SoundManager } from './sound.js';
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
        
        // Add visual effect properties first so they're available
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.gameTime = 0; // For various timing effects
        this.playerAnimationFrame = 0;
        this.playerAnimationCounter = 0;
        
        // Background pattern needs to be created after canvas context is available
        this.backgroundPattern = this.createBackgroundPattern();
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.diamondsElement = document.getElementById('diamonds');
        this.timeElement = document.getElementById('time');
        this.levelElement = document.getElementById('level');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        
        // Create mute button
        this.createMuteButton();
        
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
        this.playerDirection = 'RIGHT'; // For animation
        
        // Enemy state
        this.enemies = [];
        this.enemyMoveCounter = 0;
        
        // Animation frame ID for cancellation
        this.animationFrameId = null;
        
        // Timer ID for game clock
        this.timerInterval = null;
        
        // Physics step counter
        this.physicsStep = 0;
        
        // Animation counter
        this.animationCounter = 0;
        
        // Particle effects system
        this.particles = [];
        
        // Load assets
        this.sprites = generateAssets();
        
        // Initialize sound manager
        this.sound = new SoundManager();
        
        // Set up input handling
        this.setupEventListeners();
          // Set up the initial screen
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // Help modal functionality
        this.helpButton = document.getElementById('helpButton');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelpButton = document.getElementById('closeHelpButton');
        
        this.helpButton.addEventListener('click', () => {
            this.helpModal.style.display = 'block';
            if (this.isRunning) {
                this.pauseGame();
            }
        });
        
        this.closeHelpButton.addEventListener('click', () => {
            this.helpModal.style.display = 'none';
            if (!this.gameOver && !this.isRunning) {
                this.resumeGame();
            }
        });
        
        // Initialize the title screen properly using requestAnimationFrame
        // This ensures all methods are properly defined before calling
        requestAnimationFrame(() => {
            this.drawTitleScreen();
        });
    }
    
    /**
     * Create a background pattern for the game
     * @returns {CanvasPattern} - The created pattern
     */
    createBackgroundPattern() {
        // Create a small canvas for the pattern
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const patternCtx = patternCanvas.getContext('2d');
        
        // Draw a subtle grid pattern
        patternCtx.fillStyle = '#0a0a0a';
        patternCtx.fillRect(0, 0, 20, 20);
        patternCtx.strokeStyle = '#1a1a1a';
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(20, 0);
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(0, 20);
        patternCtx.stroke();
        
        // Create and return the pattern
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }
    
    /**
     * Create mute button
     */
    createMuteButton() {
        this.muteButton = document.createElement('button');
        this.muteButton.id = 'muteButton';
        this.muteButton.textContent = '🔊';
        this.muteButton.title = 'Mute/Unmute Sound';
        this.muteButton.style.position = 'absolute';
        this.muteButton.style.top = '10px';
        this.muteButton.style.right = '10px';
        
        const controlsDiv = document.querySelector('.controls-info');
        controlsDiv.appendChild(this.muteButton);
        
        this.muteButton.addEventListener('click', () => {
            const muted = this.sound.toggleMute();
            this.muteButton.textContent = muted ? '🔇' : '🔊';
        });
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
        
        // Handle visibility change to pause game when tab is not active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.pauseGame();
            }
        });
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
     * Pause the game
     */
    pauseGame() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.stopTimer();
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Display pause message
        this.renderMessage('GAME PAUSED', 'Press any key to continue');
        
        // Resume on any key press
        const resumeHandler = (e) => {
            window.removeEventListener('keydown', resumeHandler);
            if (!this.gameOver) {
                this.resumeGame();
            }
        };
        
        window.addEventListener('keydown', resumeHandler);
    }
    
    /**
     * Resume the game after pause
     */
    resumeGame() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTimer();
        this.gameLoop();
    }
    
    /**
     * Start the game timer
     */
    startTimer() {
        this.stopTimer();
        
        if (!this.timeRemaining) {
            this.timeRemaining = GAME_SETTINGS.INITIAL_TIME + (this.level * 30);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.isRunning && !this.gameOver) {
                this.timeRemaining--;
                this.updateHUD();
                
                if (this.timeRemaining <= 0) {
                    this.handlePlayerDeath("Time's up!");
                }
                
                // Flash time when low
                if (this.timeRemaining <= 15) {
                    this.timeElement.style.color = this.timeRemaining % 2 === 0 ? '#ff5555' : 'white';
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
        this.playerPosition = { ...levelData.playerPosition }; // Make a copy to avoid reference issues
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.totalDiamonds = levelData.diamonds.length;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.particles = [];
        
        // Create physics engine
        this.physics = new GamePhysics(this.grid);
        
        // Explicitly ensure player position is set in both grids
        const { x, y } = this.playerPosition;
        
        // Set player in game grid
        this.grid[y][x] = ELEMENT_TYPES.PLAYER;
        
        // Set player in physics grid
        this.physics.setCell(x, y, ELEMENT_TYPES.PLAYER);
        
        console.log(`Player position set at: ${x}, ${y}`); // Debug log
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update the heads-up display
     */
    updateHUD() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.requiredDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        this.levelElement.textContent = `Level: ${this.level}`;
    }
    
    /**
     * Main game loop with optimized rendering
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = now - (this.lastUpdateTime || now);
        this.lastUpdateTime = now;
        
        // Cap delta time to avoid large jumps after tab switch
        const cappedDelta = Math.min(deltaTime, 33); // Max ~30 FPS worth of updates
        
        // Update game time
        this.gameTime += cappedDelta / 16; // Normalize time increment
        
        // Update physics at a fixed rate to ensure consistent behavior
        this.physicsAccumulator = (this.physicsAccumulator || 0) + cappedDelta;
        const physicsStep = 50; // ms between physics updates
        
        // Run physics updates at fixed intervals
        while (this.physicsAccumulator >= physicsStep) {
            this.updatePhysics();
            this.physicsAccumulator -= physicsStep;
        }
        
        // Update enemies periodically with time-based movement
        this.enemyMoveCounter += cappedDelta;
        if (this.enemyMoveCounter >= 400) { // 400ms between enemy updates
            this.updateEnemies();
            this.enemyMoveCounter = 0;
        }
        
        // Update animations based on elapsed time
        this.animationCounter += cappedDelta;
        if (this.animationCounter > 1000) { // 1 second animation cycle
            this.animationCounter = 0;
        }
        
        // Update player animation
        this.playerAnimationCounter += cappedDelta;
        if (this.playerAnimationCounter > 150) { // 150ms per frame
            this.playerAnimationCounter = 0;
            this.playerAnimationFrame = (this.playerAnimationFrame + 1) % 4;
        }
        
        // Update screen shake with time decay
        if (this.screenShake > 0) {
            this.screenShake -= cappedDelta / 20; // Decay based on time
        }
        
        // Update particles with time-based movement
        this.updateParticles(cappedDelta / 16);
        
        // Check for player crushing
        this.checkPlayerStatus();
        
        // Only render at display refresh rate
        this.render();
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Create a crash animation at the specified position
     * @param {number} x - The x coordinate of the crash
     * @param {number} y - The y coordinate of the crash
     */
    createCrashAnimation(x, y) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Add screen shake
        this.screenShake = 20;
        this.screenShakeIntensity = 5;

        // Create explosion-like particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const size = Math.random() * 5 + 3;
            const life = Math.random() * 40 + 30;
            
            // Debris particles
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 3 === 0 ? '#ff8800' : (i % 3 === 1 ? '#ffcc00' : '#ff3300'),
                size: size,
                life: life,
                gravity: 0.2,
                type: 'debris'
            });
        }
        
        // Add dust cloud
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            const speed = Math.random() * 1.5;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#aaaaaa',
                size: Math.random() * 8 + 4,
                life: Math.random() * 60 + 30,
                gravity: 0.05,
                type: 'dust',
                opacity: 0.7
            });
        }
    }
    
    /**
     * Update particle effects
     * @param {number} dt - Time delta (in arbitrary units)
     */
    updateParticles(dt) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 0) * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
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
        this.playerPosition = { ...levelData.playerPosition }; // Make a copy to avoid reference issues
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.totalDiamonds = levelData.diamonds.length;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.particles = [];
        
        // Create physics engine
        this.physics = new GamePhysics(this.grid);
        
        // Explicitly ensure player position is set in both grids
        const { x, y } = this.playerPosition;
        
        // Set player in game grid
        this.grid[y][x] = ELEMENT_TYPES.PLAYER;
        
        // Set player in physics grid
        this.physics.setCell(x, y, ELEMENT_TYPES.PLAYER);
        
        console.log(`Player position set at: ${x}, ${y}`); // Debug log
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update the heads-up display
     */
    updateHUD() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.requiredDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        this.levelElement.textContent = `Level: ${this.level}`;
    }
    
    /**
     * Main game loop with optimized rendering
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = now - (this.lastUpdateTime || now);
        this.lastUpdateTime = now;
        
        // Cap delta time to avoid large jumps after tab switch
        const cappedDelta = Math.min(deltaTime, 33); // Max ~30 FPS worth of updates
        
        // Update game time
        this.gameTime += cappedDelta / 16; // Normalize time increment
        
        // Update physics at a fixed rate to ensure consistent behavior
        this.physicsAccumulator = (this.physicsAccumulator || 0) + cappedDelta;
        const physicsStep = 50; // ms between physics updates
        
        // Run physics updates at fixed intervals
        while (this.physicsAccumulator >= physicsStep) {
            this.updatePhysics();
            this.physicsAccumulator -= physicsStep;
        }
        
        // Update enemies periodically with time-based movement
        this.enemyMoveCounter += cappedDelta;
        if (this.enemyMoveCounter >= 400) { // 400ms between enemy updates
            this.updateEnemies();
            this.enemyMoveCounter = 0;
        }
        
        // Update animations based on elapsed time
        this.animationCounter += cappedDelta;
        if (this.animationCounter > 1000) { // 1 second animation cycle
            this.animationCounter = 0;
        }
        
        // Update player animation
        this.playerAnimationCounter += cappedDelta;
        if (this.playerAnimationCounter > 150) { // 150ms per frame
            this.playerAnimationCounter = 0;
            this.playerAnimationFrame = (this.playerAnimationFrame + 1) % 4;
        }
        
        // Update screen shake with time decay
        if (this.screenShake > 0) {
            this.screenShake -= cappedDelta / 20; // Decay based on time
        }
        
        // Update particles with time-based movement
        this.updateParticles(cappedDelta / 16);
        
        // Check for player crushing
        this.checkPlayerStatus();
        
        // Only render at display refresh rate
        this.render();
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Create a crash animation at the specified position
     * @param {number} x - The x coordinate of the crash
     * @param {number} y - The y coordinate of the crash
     */
    createCrashAnimation(x, y) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Add screen shake
        this.screenShake = 20;
        this.screenShakeIntensity = 5;

        // Create explosion-like particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const size = Math.random() * 5 + 3;
            const life = Math.random() * 40 + 30;
            
            // Debris particles
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 3 === 0 ? '#ff8800' : (i % 3 === 1 ? '#ffcc00' : '#ff3300'),
                size: size,
                life: life,
                gravity: 0.2,
                type: 'debris'
            });
        }
        
        // Add dust cloud
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            const speed = Math.random() * 1.5;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#aaaaaa',
                size: Math.random() * 8 + 4,
                life: Math.random() * 60 + 30,
                gravity: 0.05,
                type: 'dust',
                opacity: 0.7
            });
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
        this.playerPosition = { ...levelData.playerPosition }; // Make a copy to avoid reference issues
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.totalDiamonds = levelData.diamonds.length;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.particles = [];
        
        // Create physics engine
        this.physics = new GamePhysics(this.grid);
        
        // Explicitly ensure player position is set in both grids
        const { x, y } = this.playerPosition;
        
        // Set player in game grid
        this.grid[y][x] = ELEMENT_TYPES.PLAYER;
        
        // Set player in physics grid
        this.physics.setCell(x, y, ELEMENT_TYPES.PLAYER);
        
        console.log(`Player position set at: ${x}, ${y}`); // Debug log
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update the heads-up display
     */
    updateHUD() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.requiredDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        this.levelElement.textContent = `Level: ${this.level}`;
    }
    
    /**
     * Main game loop with optimized rendering
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = now - (this.lastUpdateTime || now);
        this.lastUpdateTime = now;
        
        // Cap delta time to avoid large jumps after tab switch
        const cappedDelta = Math.min(deltaTime, 33); // Max ~30 FPS worth of updates
        
        // Update game time
        this.gameTime += cappedDelta / 16; // Normalize time increment
        
        // Update physics at a fixed rate to ensure consistent behavior
        this.physicsAccumulator = (this.physicsAccumulator || 0) + cappedDelta;
        const physicsStep = 50; // ms between physics updates
        
        // Run physics updates at fixed intervals
        while (this.physicsAccumulator >= physicsStep) {
            this.updatePhysics();
            this.physicsAccumulator -= physicsStep;
        }
        
        // Update enemies periodically with time-based movement
        this.enemyMoveCounter += cappedDelta;
        if (this.enemyMoveCounter >= 400) { // 400ms between enemy updates
            this.updateEnemies();
            this.enemyMoveCounter = 0;
        }
        
        // Update animations based on elapsed time
        this.animationCounter += cappedDelta;
        if (this.animationCounter > 1000) { // 1 second animation cycle
            this.animationCounter = 0;
        }
        
        // Update player animation
        this.playerAnimationCounter += cappedDelta;
        if (this.playerAnimationCounter > 150) { // 150ms per frame
            this.playerAnimationCounter = 0;
            this.playerAnimationFrame = (this.playerAnimationFrame + 1) % 4;
        }
        
        // Update screen shake with time decay
        if (this.screenShake > 0) {
            this.screenShake -= cappedDelta / 20; // Decay based on time
        }
        
        // Update particles with time-based movement
        this.updateParticles(cappedDelta / 16);
        
        // Check for player crushing
        this.checkPlayerStatus();
        
        // Only render at display refresh rate
        this.render();
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Create a crash animation at the specified position
     * @param {number} x - The x coordinate of the crash
     * @param {number} y - The y coordinate of the crash
     */
    createCrashAnimation(x, y) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Add screen shake
        this.screenShake = 20;
        this.screenShakeIntensity = 5;

        // Create explosion-like particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const size = Math.random() * 5 + 3;
            const life = Math.random() * 40 + 30;
            
            // Debris particles
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 3 === 0 ? '#ff8800' : (i % 3 === 1 ? '#ffcc00' : '#ff3300'),
                size: size,
                life: life,
                gravity: 0.2,
                type: 'debris'
            });
        }
        
        // Add dust cloud
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            const speed = Math.random() * 1.5;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#aaaaaa',
                size: Math.random() * 8 + 4,
                life: Math.random() * 60 + 30,
                gravity: 0.05,
                type: 'dust',
                opacity: 0.7
            });
        }
    }
    
    /**
     * Draw the title screen
     */
    drawTitleScreen() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game title
        this.ctx.font = 'bold 48px sans-serif';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BOULDERDASH', this.canvas.width / 2, this.canvas.height / 2 - 40);

        // Draw instructions
        this.ctx.font = '24px sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Press Start to Play', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
}

/**
 * Start the game when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
