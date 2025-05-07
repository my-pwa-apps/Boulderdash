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
        
        // Initialize the title screen (moved after drawTitleScreen is defined)
        setTimeout(() => this.drawTitleScreen(), 0);
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
        this.showMessage('GAME PAUSED', 'Press any key to continue');
        
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
     * Update game physics
     */
    updatePhysics() {
        // Only run physics every few frames for performance
        this.physicsStep++;
        if (this.physicsStep >= 3) {
            const physicsChanged = this.physics.update();

            // Check for falling objects and their interaction with the player
            if (physicsChanged) {
                for (const [x, y] of this.physics.fallingObjects) {
                    // If a falling object lands on the player's position, handle crushing
                    if (x === this.playerPosition.x && y + 1 === this.playerPosition.y) {
                        this.sound.play('crush');
                        this.createCrashAnimation(this.playerPosition.x, this.playerPosition.y);
                        this.handlePlayerDeath("Crushed by a falling object!");
                        return;
                    }
                }

                // Play fall sound if something moved
                if (this.physics.fallingObjects.size > 0) {
                    this.sound.play('fall');
                }
            }

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
            this.sound.play('crush');
            this.handlePlayerDeath("Crushed by a falling object!");
            return;
        }
        
        // Check if exit should be open
        if (this.diamondsCollected >= this.requiredDiamonds && !this.exitOpen) {
            this.exitOpen = true;
            this.sound.play('exit');
            this.showMessage("Exit is now open!");
            
            // Add particles effect around the exit
            this.createExitParticles();
        }
    }
    
    /**
     * Handle player movement
     * @param {string} direction - Direction to move (UP, DOWN, LEFT, RIGHT)
     */
    handlePlayerMove(direction) {
        if (!this.isRunning || this.gameOver) return;

        console.log(`Attempting to move player in direction: ${direction}`);
        console.log(`Current position: ${this.playerPosition.x}, ${this.playerPosition.y}`);

        // Store direction for player sprite facing
        this.playerDirection = direction;

        // Validate player position before movement
        if (this.playerPosition.x === undefined || this.playerPosition.y === undefined) {
            console.error('Invalid player position');
            this.playerPosition = { x: 2, y: 2 }; // Set fallback position
        }

        const moveResult = this.physics.movePlayer(
            this.playerPosition.x,
            this.playerPosition.y,
            direction
        );

        console.log('Move result:', moveResult);

        if (moveResult.success) {
            // Clear the old player position in the grid
            this.grid[this.playerPosition.y][this.playerPosition.x] = ELEMENT_TYPES.EMPTY;

            // Update the player's position
            this.playerPosition.x = moveResult.newX;
            this.playerPosition.y = moveResult.newY;

            // Set the new player position in the grid
            this.grid[this.playerPosition.y][this.playerPosition.x] = ELEMENT_TYPES.PLAYER;

            console.log(`Player moved to: ${this.playerPosition.x}, ${this.playerPosition.y}`);

            // Play movement sound
            this.sound.play('move');

            // Check if diamond collected
            if (moveResult.collected) {
                this.diamondsCollected++;
                this.score += GAME_SETTINGS.DIAMOND_VALUE;
                this.updateHUD();

                // Play collect sound
                this.sound.play('collect');

                // Add particles effect
                this.createCollectParticles(moveResult.newX, moveResult.newY);
            }

            // Check if player reached exit
            if (moveResult.exit && this.exitOpen) {
                this.completeLevel();
            }

            // Check if player was crushed
            if (moveResult.crushed) {
                this.sound.play('crush');
                this.handlePlayerDeath("Caught by an enemy!");
            }
        }
    }
    
    /**
     * Complete the current level
     */
    completeLevel() {
        this.level++;
        
        // Play level complete sound
        this.sound.play('complete');
        
        if (this.level > GAME_SETTINGS.LEVEL_COUNT) {
            this.gameWon();
        } else {
            this.showMessage(`Level ${this.level - 1} completed!`);
            this.stopTimer();
            
            // Add bonus points for remaining time
            const timeBonus = this.timeRemaining * 5;
            this.score += timeBonus;
            
            // Create celebration particles
            this.createCelebrationParticles();
            
            setTimeout(() => {
                this.loadLevel(this.level);
                this.timeRemaining = GAME_SETTINGS.INITIAL_TIME + (this.level * 30);
                this.startTimer();
            }, 3000);
        }
    }
    
    /**
     * Handle player death
     * @param {string} reason - Reason for death
     */
    handlePlayerDeath(reason) {
        this.isRunning = false;
        this.gameOver = true;
        
        // Play game over sound
        this.sound.play('gameOver');
        
        this.showMessage(`Game Over!`, reason);
        
        // Create death particles
        this.createDeathParticles();
        
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
        
        // Play level complete sound
        this.sound.play('complete');
        
        this.showMessage(`Congratulations!`, `You've won with ${this.score} points!`);
        
        // Create celebration particles
        this.createCelebrationParticles();
        
        // Stop the timer
        this.stopTimer();
        
        // Show restart button
        this.restartButton.style.display = 'inline-block';
    }
    
    /**
     * Create particles when collecting a diamond
     */
    createCollectParticles(x, y) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Create sparkles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#00FFFF',
                size: Math.random() * 3 + 1,
                life: 30
            });
        }
    }
    
    /**
     * Create particles when exit opens
     */
    createExitParticles() {
        const centerX = this.exitPosition.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = this.exitPosition.y * TILE_SIZE + TILE_SIZE / 2;
        
        // Create sparkles around exit
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 10;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                color: '#FF00FF',
                size: Math.random() * 4 + 2,
                life: 60
            });
        }
    }
    
    /**
     * Create celebration particles
     */
    createCelebrationParticles() {
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                size: Math.random() * 5 + 2,
                life: Math.random() * 90 + 30
            });
        }
    }
    
    /**
     * Create death particles
     */
    createDeathParticles() {
        const centerX = this.playerPosition.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = this.playerPosition.y * TILE_SIZE + TILE_SIZE / 2;
        
        // Create explosion effect
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: `hsl(${Math.random() * 60}, 100%, 50%)`,
                size: Math.random() * 4 + 2,
                life: Math.random() * 60 + 20
            });
        }
    }
    
    /**
     * Update all particles
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity and friction based on particle type
            const gravity = particle.gravity || 0.1;
            particle.vy += gravity;
            
            // Different behavior for different particle types
            if (particle.type === 'debris') {
                // Debris bounces and loses energy
                particle.vx *= 0.95;
                particle.vy *= 0.95;
            } else {
                // Default particle behavior
                particle.vx *= 0.97;
                particle.vy *= 0.97;
            }
            
            // Reduce life
            particle.life--;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Draw all particles
     */
    drawParticles() {
        for (const particle of this.particles) {
            // Calculate opacity based on remaining life
            const baseOpacity = particle.opacity !== undefined ? particle.opacity : 1;
            const opacity = baseOpacity * (particle.life / (particle.type === 'dust' ? 90 : 60));
            
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = opacity;
            
            // Draw the particle based on its type
            if (particle.type === 'dust') {
                // Dust is more cloud-like
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (particle.type === 'debris') {
                // Debris can be small squares or triangles
                if (Math.random() > 0.5) {
                    // Square
                    this.ctx.fillRect(
                        particle.x - particle.size/2,
                        particle.y - particle.size/2,
                        particle.size,
                        particle.size
                    );
                } else {
                    // Triangle
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y - particle.size/2);
                    this.ctx.lineTo(particle.x + particle.size/2, particle.y + particle.size/2);
                    this.ctx.lineTo(particle.x - particle.size/2, particle.y + particle.size/2);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            } else {
                // Default particle shape is circle
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Reset global alpha
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Apply screen shake effect to the context
     */
    applyScreenShake() {
        if (this.screenShake <= 0) return;
        
        // Calculate shake offset
        const intensity = this.screenShakeIntensity * (this.screenShake / 20);
        const shakeX = (Math.random() * 2 - 1) * intensity;
        const shakeY = (Math.random() * 2 - 1) * intensity;
        
        // Apply the shake
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
    }
    
    /**
     * Render the game state
     */
    render() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        this.ctx.fillStyle = this.backgroundPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.applyScreenShake();
        
        // Draw a subtle ambient lighting effect
        const ambientCycle = Math.sin(this.gameTime / 60) * 0.1 + 0.9;
        this.ctx.fillStyle = `rgba(20, 20, 40, ${0.1 * ambientCycle})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid with fading edges
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const element = this.grid?.[y]?.[x];
                
                // Skip empty or undefined cells
                if (!element || element === ELEMENT_TYPES.EMPTY) continue;
                
                // Special handling for exit when open
                if (element === ELEMENT_TYPES.EXIT && this.exitOpen) {
                    // Animated exit gets drawn separately
                    continue;
                }
                
                // Special handling for player
                if (element === ELEMENT_TYPES.PLAYER) {
                    // Get animation frame 
                    const frameOffset = this.playerAnimationFrame * 0.25;
                    const directionOffset = {
                        'UP': 0.25,
                        'RIGHT': 0.5,
                        'DOWN': 0.75,
                        'LEFT': 0
                    }[this.playerDirection] || 0;
                    
                    // Draw player with animation
                    this.ctx.save();
                    this.ctx.translate(
                        x * TILE_SIZE + TILE_SIZE/2,
                        y * TILE_SIZE + TILE_SIZE/2
                    );
                    
                    // Add slight bobbing motion
                    const bob = Math.sin(this.gameTime / 10) * 2;
                    this.ctx.translate(0, bob);
                    
                    this.ctx.rotate(directionOffset * Math.PI * 2);
                    this.ctx.drawImage(
                        this.sprites[element],
                        -TILE_SIZE/2,
                        -TILE_SIZE/2,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                    this.ctx.restore();
                    continue;
                }
                
                // Special handling for diamonds to add sparkle
                if (element === ELEMENT_TYPES.DIAMOND) {
                    const sparkleIntensity = (Math.sin(this.gameTime / 10 + x * 0.5 + y * 0.7) + 1) / 2;
                    
                    // Draw the diamond
                    this.ctx.drawImage(
                        this.sprites[element],
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
                    continue;
                }
                
                // Regular element rendering
                this.ctx.drawImage(
                    this.sprites[element],
                    x * TILE_SIZE,
                    y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );
                
                // Add dynamic lighting to boulders with protection against NaN values
                if (element === ELEMENT_TYPES.BOULDER) {
                    try {
                        const lightAngle = (this.gameTime || 0) / 100;
                        const gradX = Math.cos(lightAngle) * TILE_SIZE/2 + TILE_SIZE/2;
                        const gradY = Math.sin(lightAngle) * TILE_SIZE/2 + TILE_SIZE/2;
                        
                        // Check if all values are finite
                        if (isFinite(x * TILE_SIZE + gradX) && 
                            isFinite(y * TILE_SIZE + gradY) &&
                            isFinite(TILE_SIZE/8) &&
                            isFinite(x * TILE_SIZE + TILE_SIZE/2) &&
                            isFinite(y * TILE_SIZE + TILE_SIZE/2) &&
                            isFinite(TILE_SIZE)) {
                            
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
                        }
                    } catch (error) {
                        console.warn('Could not render boulder lighting effect', error);
                    }
                }
            }
        }
        
        // Handle exit animation when open
        if (this.exitOpen) {
            const exitX = this.exitPosition.x * TILE_SIZE;
            const exitY = this.exitPosition.y * TILE_SIZE;
            
            // Add pulsing effect to the exit
            const pulseScale = 1 + 0.15 * Math.sin(Date.now() / 150);
            const rotationAngle = Math.sin(Date.now() / 1000) * 0.1;
            
            this.ctx.save();
            this.ctx.translate(exitX + TILE_SIZE / 2, exitY + TILE_SIZE / 2);
            this.ctx.scale(pulseScale, pulseScale);
            this.ctx.rotate(rotationAngle);
            
            // Add glowing effect
            const glowSize = 1.5 + 0.3 * Math.sin(Date.now() / 300);
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
        
        // Draw particles
        this.drawParticles();
        
        // Reset any transformations from screen shake
        if (this.screenShake > 0) {
            this.ctx.restore();
        }
    }
    
    /**
     * Draw the title screen
     */
    drawTitleScreen() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        this.ctx.fillStyle = this.backgroundPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title text
        this.ctx.font = 'bold 36px Arial, sans-serif';
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BOULDER DASH', this.canvas.width / 2, this.canvas.height / 3);
        
        // Draw instructions
        this.ctx.font = '22px Arial, sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Collect diamonds and reach the exit!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '18px Arial, sans-serif';
        this.ctx.fillText('Arrow keys or WASD to move', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Collect the required diamonds to open the exit', this.canvas.width / 2, this.canvas.height / 2 + 70);
        this.ctx.fillText('Avoid falling rocks and enemies', this.canvas.width / 2, this.canvas.height / 2 + 100);
        
        // Draw some decorative elements
        this.drawSampleElements();
        
        // Create title screen particles
        if (Math.random() < 0.05 && this.particles.length < 50) {
            const x = Math.random() * this.canvas.width;
            const y = this.canvas.height / 3 - 30;
            
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 1,
                vy: Math.random() * 1 + 0.5,
                color: '#ffcc00',
                size: Math.random() * 3 + 1,
                life: 100
            });
        }
        
        // Update and draw particles
        this.updateParticles();
        this.drawParticles();
        
        // Continue animation if not started
        if (!this.isRunning) {
            requestAnimationFrame(() => this.drawTitleScreen());
        }
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
        
        // Draw animated player
        const playerX = this.canvas.width / 2 - TILE_SIZE / 2;
        const playerY = this.canvas.height - TILE_SIZE * 4;
        this.ctx.drawImage(this.sprites[ELEMENT_TYPES.PLAYER], 
            playerX, playerY, 
            TILE_SIZE, TILE_SIZE);
    }
    
    /**
     * Show a message on screen
     * @param {string} title - The message title
     * @param {string} subtitle - The message subtitle (optional)
     */
    showMessage(title, subtitle) {
        // Draw message overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        
        const height = subtitle ? 120 : 80;
        this.ctx.fillRect(0, this.canvas.height / 2 - height/2, this.canvas.width, height);
        
        // Draw title
        this.ctx.font = 'bold 28px Arial, sans-serif';
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 10);
        
        // Draw subtitle if provided
        if (subtitle) {
            this.ctx.font = '20px Arial, sans-serif';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
