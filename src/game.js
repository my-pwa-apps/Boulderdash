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
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Update game time
        this.gameTime++;
        
        // Update physics
        this.updatePhysics();
        
        // Update enemies periodically
        this.enemyMoveCounter++;
        if (this.enemyMoveCounter >= 20) {
            this.updateEnemies();
            this.enemyMoveCounter = 0;
        }
        
        // Update animation counter
        this.animationCounter++;
        if (this.animationCounter > 60) {
            this.animationCounter = 0;
        }
        
        // Update player animation
        this.playerAnimationCounter++;
        if (this.playerAnimationCounter > 10) {
            this.playerAnimationCounter = 0;
            this.playerAnimationFrame = (this.playerAnimationFrame + 1) % 4;
        }
        
        // Update screen shake effect
        if (this.screenShake > 0) {
            this.screenShake--;
        }
        
        // Update particles
        this.updateParticles();
        
        // Check for player crushing
        this.checkPlayerStatus();
        
        // Render the game
        this.render();
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Optimized physics update
     */
    updatePhysics() {
        // Track objects that need to fall in the next update
        const objectsToFall = new Set();

        // Only scan where it's needed - start from second-to-bottom row
        for (let y = GRID_HEIGHT - 2; y >= 0; y--) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const element = this.grid[y][x];
                // Only check boulders and diamonds (optimization)
                if ((element === ELEMENT_TYPES.BOULDER || element === ELEMENT_TYPES.DIAMOND) && 
                    this.grid[y + 1][x] === ELEMENT_TYPES.EMPTY) {
                    // Quick add to set as string key for better performance
                    objectsToFall.add(`${x},${y}`);
                }
            }
        }

        // Batch update physics objects
        let physicsChanged = false;
        if (objectsToFall.size > 0) {
            // Convert string keys back to array coordinates
            const fallingCoords = Array.from(objectsToFall).map(pos => {
                const [x, y] = pos.split(',').map(Number);
                return [x, y];
            });
            
            // Add all at once to physics engine
            physicsChanged = this.physics.updateFallingObjects(fallingCoords);
        } else {
            physicsChanged = this.physics.update();
        }

        // Check for falling objects and their interaction with the player
        if (physicsChanged && this.physics.fallingObjects.size > 0) {
            // Convert string keys to coordinates for checking
            for (const posKey of this.physics.fallingObjects) {
                const [x, y] = posKey.split(',').map(Number);
                
                // If a falling object lands on the player's position, handle crushing
                if (x === this.playerPosition.x && y + 1 === this.playerPosition.y) {
                    this.sound.play('crush');
                    this.createCrashAnimation(this.playerPosition.x, this.playerPosition.y);
                    this.handlePlayerDeath("Crushed by a falling object!");
                    return;
                }
            }

            // Play fall sound if something moved (throttle for many falling objects)
            if (!this.lastFallSoundTime || performance.now() - this.lastFallSoundTime > 100) {
                this.sound.play('fall');
                this.lastFallSoundTime = performance.now();
            }
        }
    }
    
    /**
     * Time-based particle update
     * @param {number} deltaFactor - Time-based factor for smooth animation
     */
    updateParticles(deltaFactor = 1) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Scale movement by time factor
            particle.x += particle.vx * deltaFactor;
            particle.y += particle.vy * deltaFactor;
            
            // Apply gravity and friction based on particle type
            const gravity = (particle.gravity || 0.1) * deltaFactor;
            particle.vy += gravity;
            
            // Different behavior for different particle types with time-based decay
            if (particle.type === 'debris') {
                particle.vx *= (0.95 ** deltaFactor);
                particle.vy *= (0.95 ** deltaFactor);
            } else {
                particle.vx *= (0.97 ** deltaFactor);
                particle.vy *= (0.97 ** deltaFactor);
            }
            
            // Reduce life proportional to time
            particle.life -= deltaFactor;
            
            // Remove dead particles
            if (particle.life <= 0) {
                // Optimize by swapping with the last element to avoid array shifts
                if (i < this.particles.length - 1) {
                    this.particles[i] = this.particles[this.particles.length - 1];
                    i++; // Re-check this index in the next iteration
                }
                this.particles.pop();
            }
        }
    }
    
    /**
     * Render optimization with layer separation
     */
    render() {
        const ctx = this.ctx;
        
        // Clear the canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        ctx.fillStyle = this.backgroundPattern;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.applyScreenShake();
        
        // Draw a subtle ambient lighting effect
        const ambientCycle = Math.sin(this.gameTime / 60) * 0.1 + 0.9;
        ctx.fillStyle = `rgba(20, 20, 40, ${0.1 * ambientCycle})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pre-categorize elements for more efficient rendering
        const specialElements = [];
        const regularElements = [];
        
        // Gather elements to render with position data
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const element = this.grid?.[y]?.[x];
                
                // Skip empty cells
                if (!element || element === ELEMENT_TYPES.EMPTY) continue;
                
                // Skip exit when open - handled separately for animation
                if (element === ELEMENT_TYPES.EXIT && this.exitOpen) continue;
                
                if (element === ELEMENT_TYPES.PLAYER || element === ELEMENT_TYPES.DIAMOND) {
                    specialElements.push({ x, y, type: element });
                } else {
                    regularElements.push({ x, y, type: element });
                }
            }
        }
        
        // Render regular elements first
        this.renderElements(regularElements);
        
        // Handle exit animation when open
        if (this.exitOpen) {
            this.renderExit();
        }
        
        // Render special elements on top
        this.renderSpecialElements(specialElements);
        
        // Draw particles
        this.drawParticles();
        
        // Reset any transformations from screen shake
        if (this.screenShake > 0) {
            this.ctx.restore();
        }
    }
    
    /**
     * Render regular game elements efficiently in batches
     * @param {Array} elements - Array of element position data
     */
    renderElements(elements) {
        // Group elements by type for batch rendering
        const elementsByType = {};
        
        // Group elements
        for (const elem of elements) {
            if (!elementsByType[elem.type]) {
                elementsByType[elem.type] = [];
            }
            elementsByType[elem.type].push(elem);
        }
        
        // Render each type in batches
        for (const type in elementsByType) {
            const typeElements = elementsByType[type];
            const sprite = this.sprites[type];
            
            // Draw all elements of this type
            for (const elem of typeElements) {
                this.ctx.drawImage(
                    sprite,
                    elem.x * TILE_SIZE,
                    elem.y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );
                
                // Special handling for boulders with lighting effects
                if (parseInt(type) === ELEMENT_TYPES.BOULDER) {
                    this.addBoulderLighting(elem.x, elem.y);
                }
            }
        }
    }
    
    /**
     * Add lighting effect to boulder
     */
    addBoulderLighting(x, y) {
        try {
            const lightAngle = (this.gameTime || 0) / 100;
            const gradX = Math.cos(lightAngle) * TILE_SIZE/2 + TILE_SIZE/2;
            const gradY = Math.sin(lightAngle) * TILE_SIZE/2 + TILE_SIZE/2;
            
            // Skip if any values are not finite
            if (!isFinite(x * TILE_SIZE + gradX) || 
                !isFinite(y * TILE_SIZE + gradY)) {
                return;
            }
            
            const gradient = this.ctx.createRadialGradient(
                x * TILE_SIZE + gradX,
                y * TILE_SIZE + gradY,
                TILE_SIZE/8,
                x * TILE_SIZE + TILE_SIZE/2,
                y * TILE_SIZE + TILE_SIZE/2,
                TILE_SIZE
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } catch (error) {
            // Silently fail - no need to warn on every frame
        }
    }
    
    /**
     * Render special elements (player, diamonds) with animations
     */
    renderSpecialElements(elements) {
        for (const elem of elements) {
            if elem.type === ELEMENT_TYPES.PLAYER) {
                this.renderPlayer(elem.x, elem.y);
            } else if (elem.type === ELEMENT_TYPES.DIAMOND) {
                this.renderDiamond(elem.x, elem.y);
            }
        }
    }
    
    /**
     * Render player with animation
     */
    renderPlayer(x, y) {
        const directionOffset = {
            'UP': 0.25,
            'RIGHT': 0.5,
            'DOWN': 0.75,
            'LEFT': 0
        }[this.playerDirection] || 0;
        
        this.ctx.save();
        this.ctx.translate(
            x * TILE_SIZE + TILE_SIZE/2,
            y * TILE_SIZE + TILE_SIZE/2
        );
        
        // Add slight bobbing motion based on game time
        const bob = Math.sin(this.gameTime / 10) * 2;
        this.ctx.translate(0, bob);
        
        this.ctx.rotate(directionOffset * Math.PI * 2);
        this.ctx.drawImage(
            this.sprites[ELEMENT_TYPES.PLAYER],
            -TILE_SIZE/2,
            -TILE_SIZE/2,
            TILE_SIZE,
            TILE_SIZE
        );
        this.ctx.restore();
    }
    
    /**
     * Render diamond with sparkle effect
     */
    renderDiamond(x, y) {
        const sparkleIntensity = (Math.sin(this.gameTime / 10 + x * 0.5 + y * 0.7) + 1) / 2;
        
        // Draw the diamond
        this.ctx.drawImage(
            this.sprites[ELEMENT_TYPES.DIAMOND],
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
        );
        
        // Add sparkle overlay
        this.ctx.fillStyle = `rgba(255, 255, 255, ${sparkleIntensity * 0.3})`;
        this.ctx.fillRect(
            x * TILE_SIZE + TILE_SIZE/4,
            y * TILE_SIZE + TILE_SIZE/4,
            TILE_SIZE/2,
            TILE_SIZE/2
        );
    }
    
    /**
     * Render exit with animation
     */
    renderExit() {
        const exitX = this.exitPosition.x * TILE_SIZE;
        const exitY = this.exitPosition.y * TILE_SIZE;
        
        // Add pulsing effect to the exit - use performance.now() for smooth animation
        const pulseScale = 1 + 0.15 * Math.sin(performance.now() / 150);
        const rotationAngle = Math.sin(performance.now() / 1000) * 0.1;
        
        this.ctx.save();
        this.ctx.translate(exitX + TILE_SIZE / 2, exitY + TILE_SIZE / 2);
        this.ctx.scale(pulseScale, pulseScale);
        this.ctx.rotate(rotationAngle);
        
        // Add glowing effect
        const glowSize = 1.5 + 0.3 * Math.sin(performance.now() / 300);
        this.ctx.globalAlpha = 0.4;
        this.ctx.drawImage(
            this.sprites[ELEMENT_TYPES.EXIT],
            -TILE_SIZE / 2 * glowSize,
            -TILE_SIZE / 2 * glowSize,
            TILE_SIZE * glowSize,
            TILE_SIZE * glowSize
        );
        
        // Draw the actual exit
        this.ctx.globalAlpha = 1.0;
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

/**
 * Time-based particle update
 * @param {number} deltaFactor - Time-based factor for smooth animation
 */
updateParticles(deltaFactor = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        
        // Scale movement by time factor
        particle.x += particle.vx * deltaFactor;
        particle.y += particle.vy * deltaFactor;
        
        // Apply gravity and friction based on particle type
        const gravity = (particle.gravity || 0.1) * deltaFactor;
        particle.vy += gravity;
        
        // Different behavior for different particle types with time-based decay
        if (particle.type === 'debris') {
            particle.vx *= (0.95 ** deltaFactor);
            particle.vy *= (0.95 ** deltaFactor);
        } else {
            particle.vx *= (0.97 ** deltaFactor);
            particle.vy *= (0.97 ** deltaFactor);
        }
        
        // Reduce life proportional to time
        particle.life -= deltaFactor;
        
        // Remove dead particles
        if (particle.life <= 0) {
            // Optimize by swapping with the last element to avoid array shifts
            if (i < this.particles.length - 1) {
                this.particles[i] = this.particles[this.particles.length - 1];
                i++; // Re-check this index in the next iteration
            }
            this.particles.pop();
        }
    }
}

/**
 * Render optimization with layer separation
 */
render() {
    const ctx = this.ctx;
    
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background pattern
    ctx.fillStyle = this.backgroundPattern;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply screen shake
    this.applyScreenShake();
    
    // Draw a subtle ambient lighting effect
    const ambientCycle = Math.sin(this.gameTime / 60) * 0.1 + 0.9;
    ctx.fillStyle = `rgba(20, 20, 40, ${0.1 * ambientCycle})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Pre-categorize elements for more efficient rendering
    const specialElements = [];
    const regularElements = [];
    
    // Gather elements to render with position data
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const element = this.grid?.[y]?.[x];
            
            // Skip empty cells
            if (!element || element === ELEMENT_TYPES.EMPTY) continue;
            
            // Skip exit when open - handled separately for animation
            if (element === ELEMENT_TYPES.EXIT && this.exitOpen) continue;
            
            if (element === ELEMENT_TYPES.PLAYER || element === ELEMENT_TYPES.DIAMOND) {
                specialElements.push({ x, y, type: element });
            } else {
                regularElements.push({ x, y, type: element });
            }
        }
    }
    
    // Render regular elements first
    this.renderElements(regularElements);
    
    // Handle exit animation when open
    if (this.exitOpen) {
        this.renderExit();
    }
    
    // Render special elements on top
    this.renderSpecialElements(specialElements);
    
    // Draw particles
    this.drawParticles();
    
    // Reset any transformations from screen shake
    if (this.screenShake > 0) {
        this.ctx.restore();
    }
}

/**
 * Render regular game elements efficiently in batches
 * @param {Array} elements - Array of element position data
 */
renderElements(elements) {
    // Group elements by type for batch rendering
    const elementsByType = {};
    
    // Group elements
    for (const elem of elements) {
        if (!elementsByType[elem.type]) {
            elementsByType[elem.type] = [];
        }
        elementsByType[elem.type].push(elem);
    }
    
    // Render each type in batches
    for (const type in elementsByType) {
        const typeElements = elementsByType[type];
        const sprite = this.sprites[type];
        
        // Draw all elements of this type
        for (const elem of typeElements) {
            this.ctx.drawImage(
                sprite,
                elem.x * TILE_SIZE,
                elem.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );
            
            // Special handling for boulders with lighting effects
            if (parseInt(type) === ELEMENT_TYPES.BOULDER) {
                this.addBoulderLighting(elem.x, elem.y);
            }
        }
    }
}

/**
 * Add lighting effect to boulder
 */
addBoulderLighting(x, y) {
    try {
        const lightAngle = (this.gameTime || 0) / 100;
        const gradX = Math.cos(lightAngle) * TILE_SIZE/2 + TILE_SIZE/2;
        const gradY = Math.sin(lightAngle) * TILE_SIZE/2 + TILE_SIZE/2;
        
        // Skip if any values are not finite
        if (!isFinite(x * TILE_SIZE + gradX) || 
            !isFinite(y * TILE_SIZE + gradY)) {
            return;
        }
        
        const gradient = this.ctx.createRadialGradient(
            x * TILE_SIZE + gradX,
            y * TILE_SIZE + gradY,
            TILE_SIZE/8,
            x * TILE_SIZE + TILE_SIZE/2,
            y * TILE_SIZE + TILE_SIZE/2,
            TILE_SIZE
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } catch (error) {
        // Silently fail - no need to warn on every frame
    }
}

/**
 * Render special elements (player, diamonds) with animations
 */
renderSpecialElements(elements) {
    for (const elem of elements) {
        if (elem.type === ELEMENT_TYPES.PLAYER) {
            this.renderPlayer(elem.x, elem.y);
        } else if (elem.type === ELEMENT_TYPES.DIAMOND) {
            this.renderDiamond(elem.x, elem.y);
        }
    }
}

/**
 * Render player with animation
 */
renderPlayer(x, y) {
    const directionOffset = {
        'UP': 0.25,
        'RIGHT': 0.5,
        'DOWN': 0.75,
        'LEFT': 0
    }[this.playerDirection] || 0;
    
    this.ctx.save();
    this.ctx.translate(
        x * TILE_SIZE + TILE_SIZE/2,
        y * TILE_SIZE + TILE_SIZE/2
    );
    
    // Add slight bobbing motion based on game time
    const bob = Math.sin(this.gameTime / 10) * 2;
    this.ctx.translate(0, bob);
    
    this.ctx.rotate(directionOffset * Math.PI * 2);
    this.ctx.drawImage(
        this.sprites[ELEMENT_TYPES.PLAYER],
        -TILE_SIZE/2,
        -TILE_SIZE/2,
        TILE_SIZE,
        TILE_SIZE
    );
    this.ctx.restore();
}

/**
 * Render diamond with sparkle effect
 */
renderDiamond(x, y) {
    const sparkleIntensity = (Math.sin(this.gameTime / 10 + x * 0.5 + y * 0.7) + 1) / 2;
    
    // Draw the diamond
    this.ctx.drawImage(
        this.sprites[ELEMENT_TYPES.DIAMOND],
        x * TILE_SIZE,
        y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
    );
    
    // Add sparkle overlay
    this.ctx.fillStyle = `rgba(255, 255, 255, ${sparkleIntensity * 0.3})`;
    this.ctx.fillRect(
        x * TILE_SIZE + TILE_SIZE/4,
        y * TILE_SIZE + TILE_SIZE/4,
        TILE_SIZE/2,
        TILE_SIZE/2
    );
}

/**
 * Render exit with animation
 */
renderExit() {
    const exitX = this.exitPosition.x * TILE_SIZE;
    const exitY = this.exitPosition.y * TILE_SIZE;
    
    // Add pulsing effect to the exit - use performance.now() for smooth animation
    const pulseScale = 1 + 0.15 * Math.sin(performance.now() / 150);
    const rotationAngle = Math.sin(performance.now() / 1000) * 0.1;
    
    this.ctx.save();
    this.ctx.translate(exitX + TILE_SIZE / 2, exitY + TILE_SIZE / 2);
    this.ctx.scale(pulseScale, pulseScale);
    this.ctx.rotate(rotationAngle);
    
    // Add glowing effect
    const glowSize = 1.5 + 0.3 * Math.sin(performance.now() / 300);
    this.ctx.globalAlpha = 0.4;
    this.ctx.drawImage(
        this.sprites[ELEMENT_TYPES.EXIT],
        -TILE_SIZE / 2 * glowSize,
        -TILE_SIZE / 2 * glowSize,
        TILE_SIZE * glowSize,
        TILE_SIZE * glowSize
    );
    
    // Draw the actual exit
    this.ctx.globalAlpha = 1.0;
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

/**
 * Start the game when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
const game = new Game();
});
