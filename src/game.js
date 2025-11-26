import { generateAssets } from './assets.js';
import { generateLevel } from './level-generator.js';
import { GamePhysics } from './physics.js';
import { SoundManager } from './sound.js';
import { TouchControls } from './touch-controls.js';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, ELEMENT_TYPES, KEY_MAPPINGS, GAME_SETTINGS } from './constants.js';
import { formatTime } from './utils.js';
import { initializeFirebase, saveHighScore, getHighScores, logGameEvent } from './firebase-config.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
        this.ctx.imageSmoothingEnabled = false; // Ensure crisp pixel art
        this.canvas.width = GRID_WIDTH * TILE_SIZE;
        this.canvas.height = GRID_HEIGHT * TILE_SIZE;
        this.screenShake = 0;
        this.gameTime = 0;
        this.playerAnimationFrame = 0;
        this.playerAnimationCounter = 0;
        this.particles = [];
        this.backgroundPattern = this.createBackgroundPattern();
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.diamondsElement = document.getElementById('diamonds');
        this.timeElement = document.getElementById('time');
        this.levelElement = document.getElementById('level');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.helpButton = document.getElementById('helpButton');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelpButton = document.getElementById('closeHelpButton');
        this.isRunning = false;
        this.gameOver = false;
        this.levelComplete = false;
        this.level = 1;
        this.score = 0;
        this.diamondsCollected = 0;
        this.requiredDiamonds = 0;
        this.timeRemaining = GAME_SETTINGS.INITIAL_TIME;
        this.playerPosition = { x: 0, y: 0 };
        this.exitOpen = false;
        this.playerDirection = 'RIGHT';
        this.playerNextDirection = null;
        this.spacePressed = false;
        this.enemies = [];
        this.enemyMoveCounter = 0;
        this.grid = [];
        this.physics = null;
        this.exitPosition = null;
        this.animationFrameId = null;
        this.timerInterval = null;
        this.physicsAccumulator = 0;
        this.lastUpdateTime = 0;
        this.sprites = generateAssets();
        this.sound = new SoundManager();
        this.createMuteButton();
        this.setupEventListeners();
        this.setupButtonListeners();
        
        // Initialize touch controls for mobile
        this.touchControls = new TouchControls(this);
        
        // Initialize Firebase
        this.firebaseInitialized = initializeFirebase();
        if (this.firebaseInitialized) {
            logGameEvent('game_loaded');
        }
        
        // Load and display high score
        this.loadHighScore();
        
        // Auto-play demo mode
        this.demoMode = false;
        this.demoTimeout = null;
        this.aiPath = [];
        this.aiMoveCounter = 0;
        this.startDemoTimeout();
        
        // Exit visual effects
        this.screenFlash = 0;
        this.exitSparkleTimer = 0;
        
        requestAnimationFrame(() => this.drawTitleScreen());
    }
    
    createBackgroundPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 32;
        patternCanvas.height = 32;
        const patternCtx = patternCanvas.getContext('2d');
        
        // Deep space background
        patternCtx.fillStyle = '#0a0a12';
        patternCtx.fillRect(0, 0, 32, 32);
        
        // Subtle grid pattern
        patternCtx.strokeStyle = 'rgba(100, 100, 150, 0.05)';
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        patternCtx.moveTo(0, 16);
        patternCtx.lineTo(32, 16);
        patternCtx.moveTo(16, 0);
        patternCtx.lineTo(16, 32);
        patternCtx.stroke();
        
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }
    
    createMuteButton() {
        this.muteButton = document.createElement('button');
        this.muteButton.id = 'muteButton';
        this.muteButton.textContent = '';
        this.muteButton.title = 'Mute/Unmute Sound';
        this.muteButton.style.position = 'absolute';
        this.muteButton.style.top = '10px';
        this.muteButton.style.right = '10px';
        const controlsDiv = document.querySelector('.controls-info');
        if (controlsDiv) controlsDiv.appendChild(this.muteButton);
        this.muteButton.addEventListener('click', () => {
            const muted = this.sound.toggleMute();
            this.muteButton.textContent = muted ? '🔇' : '🔊';
        });
        
        // Initialize debug display (keep hidden for production)
        this.debugDisplay = document.getElementById('debugDisplay');
        // Uncomment to show debug info: this.debugDisplay.classList.remove('hidden');
    }
    
    setupButtonListeners() {
        this.startButton.addEventListener('click', () => {
            this.cancelDemoTimeout();
            this.startGame();
        });
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.helpButton.addEventListener('click', () => {
            this.cancelDemoTimeout();
            this.helpModal.style.display = 'block';
            if (this.isRunning) this.pauseGame();
        });
        this.closeHelpButton.addEventListener('click', () => {
            this.helpModal.style.display = 'none';
        });
        
        // Cancel demo timeout on any click interaction
        document.addEventListener('click', () => {
            if (!this.isRunning && !this.demoMode) {
                this.cancelDemoTimeout();
            }
        });
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            // If in demo mode, any key returns to splash screen
            if (this.demoMode) {
                e.preventDefault();
                this.exitDemoMode();
                return;
            }
            
            // Cancel demo timeout if user presses any key on splash screen
            if (!this.isRunning) {
                this.cancelDemoTimeout();
            }
            
            // Handle space bar for grab action
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                if (this.isRunning && !this.gameOver && !this.levelComplete) {
                    this.spacePressed = true;
                }
                return;
            }
            
            const direction = KEY_MAPPINGS[e.key];
            if (direction) {
                e.preventDefault();
                // Only queue direction if game is actively running
                if (this.isRunning && !this.gameOver && !this.levelComplete) {
                    this.playerNextDirection = direction;
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            // Release space bar
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                this.spacePressed = false;
            }
        });
        
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.gameOver) {
                this.pauseGame();
            }
        });
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        // Get available space for canvas
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate available height (viewport minus header, HUD, controls, and margins)
        const headerHeight = document.querySelector('.game-header')?.offsetHeight || 150;
        const controlsHeight = document.querySelector('.game-controls')?.offsetHeight || 120;
        const margins = 80; // Total vertical margins and padding
        
        const availableHeight = viewportHeight - headerHeight - controlsHeight - margins;
        const availableWidth = Math.min(
            container.clientWidth - 40,
            viewportWidth - 60
        );
        
        // Use aspect ratio to calculate dimensions
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        // Try width-constrained first
        let width = Math.min(availableWidth, this.canvas.width);
        let height = width / aspectRatio;
        
        // If height doesn't fit, constrain by height instead
        if (height > availableHeight) {
            height = Math.min(availableHeight, this.canvas.height);
            width = height * aspectRatio;
        }
        
        // Apply calculated dimensions
        this.canvas.style.width = `${Math.floor(width)}px`;
        this.canvas.style.height = `${Math.floor(height)}px`;
    }
    
    startGame(isDemoMode = false) {
        this.cancelDemoTimeout();
        this.demoMode = isDemoMode;
        this.level = 1;
        this.score = 0;
        this.isRunning = true;
        this.gameOver = false;
        this.levelComplete = false;
        
        if (!isDemoMode) {
            this.startButton.classList.add('hidden');
            this.restartButton.classList.remove('hidden');
        }
        
        this.helpModal.style.display = 'none';
        this.loadLevel(this.level);
        this.startTimer();
        this.gameLoop();
        this.handleResize();
        
        // Log game start event (not for demo mode)
        if (this.firebaseInitialized && !isDemoMode) {
            logGameEvent('game_start', { level: this.level });
        }
    }
    
    restartGame() {
        this.stopTimer();
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.startGame();
    }
    
    pauseGame() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.stopTimer();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    resumeGame() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTimer();
        this.gameLoop();
    }
    
    startTimer() {
        this.stopTimer();
        if (!this.timeRemaining) {
            this.timeRemaining = GAME_SETTINGS.INITIAL_TIME + (this.level * 30);
        }
        this.timerInterval = setInterval(() => {
            if (this.isRunning && !this.gameOver && !this.levelComplete) {
                this.timeRemaining--;
                this.updateHUD();
                if (this.timeRemaining <= 0) {
                    this.handlePlayerDeath("Time's up!");
                }
                if (this.timeRemaining <= 15) {
                    this.timeElement.style.color = this.timeRemaining % 2 === 0 ? '#ff5555' : '#ffcc00';
                }
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    loadLevel(levelNumber) {
        const levelData = generateLevel(levelNumber);
        this.grid = levelData.grid;
        this.playerPosition = { ...levelData.playerPosition };
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.levelName = levelData.levelName || `Cave ${String.fromCharCode(64 + levelNumber)}`;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.particles = [];
        this.playerAnimationFrame = 0;
        this.playerAnimationCounter = 0;
        
        // Set time limit from level data or use default
        this.timeRemaining = levelData.timeLimit || (GAME_SETTINGS.INITIAL_TIME + (levelNumber * 30));
        
        this.physics = new GamePhysics(this.grid);
        const { x, y } = this.playerPosition;
        this.grid[y][x] = ELEMENT_TYPES.PLAYER;
        this.physics.setCell(x, y, ELEMENT_TYPES.PLAYER);
        this.updateHUD();
    }
    
    async loadHighScore() {
        try {
            const scores = await getHighScores(1);
            this.highScore = scores.length > 0 ? scores[0].score : 0;
            this.updateHighScoreDisplay();
        } catch (error) {
            console.error('Error loading high score:', error);
            this.highScore = 0;
        }
    }
    
    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `Best: ${this.highScore}`;
        }
    }
    
    updateHUD() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.updateHighScoreDisplay();
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.requiredDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        const caveName = this.levelName ? ` - ${this.levelName}` : '';
        this.levelElement.textContent = `Cave ${String.fromCharCode(64 + this.level)}${caveName}`;
        this.timeElement.style.color = '#ffcc00';
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = now - (this.lastUpdateTime || now);
        this.lastUpdateTime = now;
        const cappedDelta = Math.min(deltaTime, 33);
        this.gameTime += cappedDelta / 16;
        
        this.physicsAccumulator = (this.physicsAccumulator || 0) + cappedDelta;
        const physicsStep = 50;
        while (this.physicsAccumulator >= physicsStep) {
            this.updatePhysics();
            this.physicsAccumulator -= physicsStep;
        }
        
        this.enemyMoveCounter += cappedDelta;
        if (this.enemyMoveCounter >= 400) {
            this.updateEnemies();
            this.enemyMoveCounter = 0;
        }
        
        // AI control in demo mode
        if (this.demoMode) {
            this.aiMoveCounter += cappedDelta;
            if (this.aiMoveCounter >= 200) {
                const aiDirection = this.getAIMove();
                if (aiDirection) {
                    this.handlePlayerMove(aiDirection);
                }
                this.aiMoveCounter = 0;
            }
        } else if (this.playerNextDirection) {
            // If space is pressed, grab item instead of moving
            if (this.spacePressed) {
                this.handlePlayerGrab(this.playerNextDirection);
            } else {
                this.handlePlayerMove(this.playerNextDirection);
            }
            this.playerNextDirection = null;
        }
        
        // Sync grid from physics after all updates
        if (this.physics) {
            this.grid = this.physics.getGrid();
        }
        
        this.playerAnimationCounter += cappedDelta;
        if (this.playerAnimationCounter > 150) {
            this.playerAnimationCounter = 0;
            this.playerAnimationFrame = (this.playerAnimationFrame + 1) % 4;
        }
        
        if (this.screenShake > 0) {
            this.screenShake -= cappedDelta / 20;
        }
        
        // Decay screen flash
        if (this.screenFlash > 0) {
            this.screenFlash -= cappedDelta / 10;
        }
        
        // Create exit sparkles periodically when exit is open
        if (this.exitOpen && this.exitPosition) {
            this.exitSparkleTimer += cappedDelta;
            if (this.exitSparkleTimer >= 150) {
                this.createExitSparkles();
                this.exitSparkleTimer = 0;
            }
        }
        
        this.updateParticles(cappedDelta / 16);
        this.render();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePhysics() {
        if (!this.physics) return;
        this.physics.update();
        if (this.physics.isPlayerCrushed(this.playerPosition.x, this.playerPosition.y)) {
            this.handlePlayerDeath('Crushed!');
        }
    }
    
    getAIMove() {
        const px = this.playerPosition.x;
        const py = this.playerPosition.y;
        
        // Initialize AI memory
        if (!this.aiMemory) {
            this.aiMemory = {
                lastPositions: [],
                exploredCells: new Set(),
                targetCache: null,
                stuckCounter: 0,
                lastMoveTime: Date.now()
            };
        }
        
        // Track position history (last 10 moves)
        const posKey = `${px},${py}`;
        this.aiMemory.lastPositions.push(posKey);
        if (this.aiMemory.lastPositions.length > 10) {
            this.aiMemory.lastPositions.shift();
        }
        
        // Detect if stuck (same position repeated or oscillating)
        const recentPositions = this.aiMemory.lastPositions.slice(-8);
        const uniquePositions = new Set(recentPositions);
        const isStuck = uniquePositions.size <= 2 && recentPositions.length >= 6;
        
        // Also detect if repeating same 2-position pattern (e.g., A->B->A->B)
        const isOscillating = recentPositions.length >= 4 && 
            recentPositions[recentPositions.length - 1] === recentPositions[recentPositions.length - 3] &&
            recentPositions[recentPositions.length - 2] === recentPositions[recentPositions.length - 4];
        
        if (isStuck || isOscillating) {
            this.aiMemory.stuckCounter++;
            // Clear target cache when stuck
            this.aiMemory.targetCache = null;
        } else {
            this.aiMemory.stuckCounter = Math.max(0, this.aiMemory.stuckCounter - 1);
        }
        
        // Mark current cell as explored
        this.aiMemory.exploredCells.add(posKey);
        
        // If severely stuck (immediate action on oscillation), force smart exploration
        if (this.aiMemory.stuckCounter >= 2) {
            // If stuck for too long, stop demo mode
            if (!this.aiMemory.totalStuckCount) {
                this.aiMemory.totalStuckCount = 0;
            }
            this.aiMemory.totalStuckCount++;
            
            if (this.aiMemory.totalStuckCount > 15) {
                console.log('AI permanently stuck - ending demo mode');
                this.stopDemo();
                return null;
            }
            
            console.log(`AI stuck (${this.aiMemory.totalStuckCount}/15) - forcing smart exploration`);
            this.aiMemory.stuckCounter = 0;
            
            // Try risky BFS first - allows moves that might be dangerous but gets us unstuck
            const riskyDir = this.findNearestTargetBFS(px, py, true);
            if (riskyDir) {
                this.aiMemory.exploredCells.clear();
                this.aiMemory.lastPositions = []; // Clear position history to reset
                return riskyDir;
            }
            
            // SMART ESCAPE: Evaluate all moves with aggressive scoring toward unexplored areas
            const dirs = ['RIGHT', 'LEFT', 'DOWN', 'UP'];
            const validMoves = [];
            
            for (const dir of dirs) {
                const testMove = this.getNewPosition(px, py, dir);
                const testKey = `${testMove.x},${testMove.y}`;
                // Allow risky moves when stuck
                if (!this.isValidAIMove(testMove.x, testMove.y, true)) continue;
                
                let score = 0;
                const cell = this.grid[testMove.y][testMove.x];
                
                // Heavily prioritize directions that haven't been tried recently
                const lastVisitIndex = this.aiMemory.lastPositions.lastIndexOf(testKey);
                if (lastVisitIndex === -1) {
                    score += 1000; // Never visited - highest priority!
                } else {
                    const turnsAgo = this.aiMemory.lastPositions.length - lastVisitIndex;
                    score += turnsAgo * 50; // More points for longer ago
                }
                
                // Big bonus for diamonds
                if (cell === ELEMENT_TYPES.DIAMOND) score += 2000;
                
                // Bonus for dirt (means unexplored path)
                if (cell === ELEMENT_TYPES.DIRT) score += 300;
                
                // Bonus for moving away from oscillation zone
                const recentPositions = this.aiMemory.lastPositions.slice(-6);
                const isInOscillationZone = recentPositions.includes(testKey);
                if (!isInOscillationZone) score += 400;
                
                // Penalize returning to exact previous position
                if (this.aiMemory.lastPositions.length > 0 && 
                    testKey === this.aiMemory.lastPositions[this.aiMemory.lastPositions.length - 1]) {
                    score -= 500;
                }
                
                validMoves.push({ dir, key: testKey, score });
            }
            
            if (validMoves.length > 0) {
                // Sort by highest score (best escape route)
                validMoves.sort((a, b) => b.score - a.score);
                
                // Pick the best choice
                const chosen = validMoves[0];
                
                // Clear explored cells to allow revisit from different angle
                this.aiMemory.exploredCells.clear();
                
                return chosen.dir;
            }
        } else {
            // Reset total stuck count when making progress
            if (this.aiMemory.totalStuckCount) {
                this.aiMemory.totalStuckCount = Math.max(0, this.aiMemory.totalStuckCount - 1);
            }
        }
        
        // Use BFS to find the nearest reachable target (Diamond, Exit, or Dirt)
        // This is much more robust for mazes than A* to a specific target
        const nextDir = this.findNearestTargetBFS(px, py);
        if (nextDir) {
            return nextDir;
        }
        
        // Fallback: evaluate all valid moves with scoring
        const validMoves = this.evaluateAllMoves(px, py, null);
        
        if (validMoves.length === 0) {
            // Last resort: try any valid direction
            const dirs = ['RIGHT', 'LEFT', 'DOWN', 'UP'];
            for (let i = 0; i < dirs.length; i++) {
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                const testPos = this.getNewPosition(px, py, dir);
                if (this.isValidAIMove(testPos.x, testPos.y)) {
                    return dir;
                }
            }
            return 'RIGHT'; // Ultimate fallback
        }
        
        // Pick best move, with some randomness if stuck
        if (this.aiMemory.stuckCounter > 2) {
            // Pick random from top 3 moves
            const topMoves = validMoves.slice(0, Math.min(3, validMoves.length));
            return topMoves[Math.floor(Math.random() * topMoves.length)].dir;
        }
        
        return validMoves[0].dir;
    }
    
    findNearestTargetBFS(px, py, allowRisky = false) {
        // BFS to find nearest reachable diamond, exit (if open), or dirt
        // This guarantees finding a path if one exists
        const visited = new Set([`${px},${py}`]);
        const maxNodes = 2000; // Allow searching the entire grid multiple times if needed
        let nodesProcessed = 0;
        
        // Initialize queue with immediate neighbors
        const queue = [];
        const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        
        // Start by adding all valid neighbors
        for (const dir of dirs) {
            const nextPos = this.getNewPosition(px, py, dir);
            const key = `${nextPos.x},${nextPos.y}`;
            if (this.isValidAIMove(nextPos.x, nextPos.y, allowRisky)) {
                visited.add(key);
                queue.push({ x: nextPos.x, y: nextPos.y, path: [dir], firstDir: dir });
            }
        }
        
        let nearestDirtPath = null;
        let nearestDirtDist = Infinity;
        
        while (queue.length > 0) {
            const current = queue.shift();
            nodesProcessed++;
            
            if (nodesProcessed > maxNodes) break;
            
            const cell = this.grid[current.y][current.x];
            
            // Found a diamond - immediate return
            if (cell === ELEMENT_TYPES.DIAMOND) {
                return current.firstDir;
            }
            
            // Found the exit when it's open - immediate return
            if (this.exitOpen && cell === ELEMENT_TYPES.EXIT) {
                return current.firstDir;
            }
            
            // Track nearest dirt as fallback (for exploration)
            if (cell === ELEMENT_TYPES.DIRT && current.path.length < nearestDirtDist) {
                nearestDirtPath = current.firstDir;
                nearestDirtDist = current.path.length;
            }
            
            // Explore neighbors in shuffled order to avoid directional bias
            const shuffledDirs = [...dirs];
            for (let i = shuffledDirs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledDirs[i], shuffledDirs[j]] = [shuffledDirs[j], shuffledDirs[i]];
            }
            
            for (const dir of shuffledDirs) {
                const nextPos = this.getNewPosition(current.x, current.y, dir);
                const key = `${nextPos.x},${nextPos.y}`;
                
                if (!visited.has(key) && this.isValidAIMove(nextPos.x, nextPos.y, allowRisky)) {
                    visited.add(key);
                    queue.push({ 
                        x: nextPos.x, 
                        y: nextPos.y, 
                        path: [...current.path, dir],
                        firstDir: current.firstDir  // Keep track of original direction
                    });
                }
            }
        }
        
        // If no diamond/exit found, go to nearest dirt for exploration
        if (nearestDirtPath) {
            return nearestDirtPath;
        }
        
        return null;
    }

    // Deprecated methods removed: findBestTarget, findUnexploredTarget, findPathAStar, reconstructPath
    
    evaluateAllMoves(px, py, target) {
        const validMoves = [];
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        
        for (const dir of directions) {
            const newPos = this.getNewPosition(px, py, dir);
            if (!this.isValidAIMove(newPos.x, newPos.y)) continue;
            
            let score = 0;
            const cell = this.grid[newPos.y][newPos.x];
            
            // Base scores
            if (cell === ELEMENT_TYPES.DIAMOND) score += 1000;
            if (cell === ELEMENT_TYPES.DIRT) score += 5;
            if (cell === ELEMENT_TYPES.EMPTY) score += 2;
            
            // Distance to target
            if (target) {
                const currentDist = Math.abs(target.x - px) + Math.abs(target.y - py);
                const newDist = Math.abs(target.x - newPos.x) + Math.abs(target.y - newPos.y);
                score += (currentDist - newDist) * 10;
            }
            
            // Penalize recently visited cells
            const posKey = `${newPos.x},${newPos.y}`;
            const recentVisits = this.aiMemory.lastPositions.filter(p => p === posKey).length;
            score -= recentVisits * 20;
            
            // Prefer unexplored areas
            if (!this.aiMemory.exploredCells.has(posKey)) {
                score += 15;
            }
            
            validMoves.push({ dir, score, pos: newPos });
        }
        
        validMoves.sort((a, b) => b.score - a.score);
        return validMoves;
    }
    
    getDirectionToPosition(fromX, fromY, toX, toY) {
        if (toX > fromX) return 'RIGHT';
        if (toX < fromX) return 'LEFT';
        if (toY > fromY) return 'DOWN';
        if (toY < fromY) return 'UP';
        return 'RIGHT'; // Default
    }
    
    getNewPosition(x, y, direction) {
        const newPos = { x, y };
        switch (direction) {
            case 'UP': newPos.y--; break;
            case 'DOWN': newPos.y++; break;
            case 'LEFT': newPos.x--; break;
            case 'RIGHT': newPos.x++; break;
        }
        return newPos;
    }
    
    isValidAIMove(x, y, allowRisky = false) {
        // Check bounds
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
            return false;
        }
        
        // Check if cell is safe to move into
        const cell = this.grid[y][x];
        const isValidCell = cell === ELEMENT_TYPES.EMPTY || 
                           cell === ELEMENT_TYPES.DIRT || 
                           cell === ELEMENT_TYPES.DIAMOND ||
                           (cell === ELEMENT_TYPES.EXIT && this.exitOpen);
        
        if (!isValidCell) {
            return false;
        }
        
        if (!allowRisky) {
            // Check for boulders directly above - but ONLY if moving into empty space
            // Dirt is safe because digging it means the boulder won't fall immediately
            if (y > 0 && cell === ELEMENT_TYPES.EMPTY) {
                const above = this.grid[y - 1][x];
                if (above === ELEMENT_TYPES.BOULDER) {
                    return false; // Dangerous - could be crushed
                }
            }
            
            // Check diagonally for boulders that might roll - only for empty cells
            if (y > 0 && cell === ELEMENT_TYPES.EMPTY) {
                // Check left diagonal
                if (x > 0 && this.grid[y - 1][x - 1] === ELEMENT_TYPES.BOULDER) {
                    const belowBoulder = this.grid[y][x - 1];
                    if (belowBoulder === ELEMENT_TYPES.BOULDER || belowBoulder === ELEMENT_TYPES.WALL) {
                        return false; // Boulder might roll here
                    }
                }
                // Check right diagonal
                if (x < GRID_WIDTH - 1 && this.grid[y - 1][x + 1] === ELEMENT_TYPES.BOULDER) {
                    const belowBoulder = this.grid[y][x + 1];
                    if (belowBoulder === ELEMENT_TYPES.BOULDER || belowBoulder === ELEMENT_TYPES.WALL) {
                        return false; // Boulder might roll here
                    }
                }
            }
            
            // Avoid positions next to enemies
            if (this.enemies && this.enemies.length > 0) {
                for (const enemy of this.enemies) {
                    const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
                    if (dist <= 1) {
                        return false; // Too close to enemy
                    }
                }
            }
        }
        
        return true;
    }
    
    handlePlayerMove(direction) {
        if (!this.physics) return;
        this.playerDirection = direction;
        const result = this.physics.movePlayer(
            this.playerPosition.x, 
            this.playerPosition.y, 
            direction,
            this.exitOpen  // Pass exitOpen status to physics
        );
        
        if (result.success) {
            this.playerPosition.x = result.newX;
            this.playerPosition.y = result.newY;
            
            if (result.collected) {
                this.diamondsCollected++;
                this.score += GAME_SETTINGS.DIAMOND_VALUE;
                this.sound.play('collect');
                if (this.diamondsCollected >= this.requiredDiamonds) {
                    this.exitOpen = true;
                    this.sound.play('exit');
                    this.screenFlash = 30; // Flash effect
                    this.createExitSparkles(); // Initial burst
                }
            }
            
            if (result.exit && this.exitOpen) {
                this.completeLevel();
            }
            
            if (result.crushed) {
                this.handlePlayerDeath('Enemy contact!');
            }
            
            this.updateHUD();
        }
    }
    
    handlePlayerGrab(direction) {
        if (!this.physics) return;
        this.playerDirection = direction;
        const result = this.physics.grabItem(this.playerPosition.x, this.playerPosition.y, direction);
        
        if (result.collected) {
            this.diamondsCollected++;
            this.score += GAME_SETTINGS.DIAMOND_VALUE;
            this.sound.play('collect');
            if (this.diamondsCollected >= this.requiredDiamonds) {
                this.exitOpen = true;
                this.sound.play('exit');
                this.screenFlash = 30; // Flash effect
                this.createExitSparkles(); // Initial burst
            }
            this.updateHUD();
        }
    }
    
    updateEnemies() {
        if (!this.physics) return;
        this.enemies = this.physics.moveEnemies(this.enemies, this.playerPosition.x, this.playerPosition.y);
        
        if (this.physics.checkEnemyCollision(this.playerPosition.x, this.playerPosition.y, this.enemies)) {
            this.handlePlayerDeath('Enemy contact!');
        }
        
        const crushedEnemies = this.physics.checkEnemiesCrushed(this.enemies);
        for (const idx of crushedEnemies.reverse()) {
            this.createCrashAnimation(this.enemies[idx].x, this.enemies[idx].y);
            this.sound.play('crush');
            this.score += 100;
            this.enemies.splice(idx, 1);
        }
    }
    
    handlePlayerDeath(reason) {
        this.sound.play('crush');
        this.gameOver = true;
        this.isRunning = false;
        this.stopTimer();
        // Show restart button when game is over
        this.restartButton.classList.remove('hidden');
        this.startButton.classList.add('hidden');
        
        // Log game over event and save high score (only for real players, not demo mode)
        if (this.firebaseInitialized && !this.demoMode) {
            logGameEvent('game_over', { 
                reason: reason, 
                level: this.level, 
                score: this.score 
            });
            
            // Save high score to Firebase
            if (this.score > 0) {
                saveHighScore('Player', this.score, this.level);
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.updateHighScoreDisplay();
                }
                this.showHighScoreMessage();
            }
        }
    }
    
    completeLevel() {
        this.sound.play('complete');
        this.levelComplete = true;
        this.isRunning = false;
        this.stopTimer();
        this.score += this.timeRemaining * 5;
        this.updateHUD();
        
        // Log level complete event (only for real players, not demo mode)
        if (this.firebaseInitialized && !this.demoMode) {
            logGameEvent('level_complete', { 
                level: this.level, 
                score: this.score,
                timeRemaining: this.timeRemaining 
            });
        }
        
        setTimeout(() => {
            if (this.levelComplete) this.nextLevel();
        }, 3000);
    }
    
    async showHighScoreMessage() {
        try {
            const scores = await getHighScores(10);
            const currentRank = scores.findIndex(s => s.timestamp === scores[scores.length - 1]?.timestamp) + 1;
            
            if (currentRank > 0 && currentRank <= 10) {
                console.log(`🏆 New High Score! Rank #${currentRank} with ${this.score} points`);
            }
            
            // Log top 5 to console
            console.log('🏆 Top 5 High Scores:');
            scores.slice(0, 5).forEach((s, i) => {
                console.log(`${i + 1}. Level ${s.level} - ${s.score} points - ${new Date(s.timestamp).toLocaleDateString()}`);
            });
        } catch (error) {
            console.error('Error displaying high scores:', error);
        }
    }
    
    nextLevel() {
        this.level++;
        this.levelComplete = false;
        this.gameOver = false;
        this.isRunning = true;
        this.timeRemaining = 0;
        this.loadLevel(this.level);
        this.startTimer();
        this.gameLoop();
    }
    
    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 0) * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    
    createExitSparkles() {
        if (!this.exitPosition) return;
        
        const centerX = this.exitPosition.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = this.exitPosition.y * TILE_SIZE + TILE_SIZE / 2;
        
        // Create sparkle particles around the exit
        const sparkleCount = this.screenFlash > 0 ? 20 : 8; // More on initial burst
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + Math.random() * 0.5;
            const distance = Math.random() * TILE_SIZE * 0.8;
            const speed = this.screenFlash > 0 ? Math.random() * 2 + 1 : Math.random() * 0.8 + 0.3;
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 30 + 20;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5, // Float upward
                color: ['#00ff00', '#00ffff', '#ffff00', '#ffffff'][Math.floor(Math.random() * 4)],
                size: size,
                life: life,
                gravity: -0.02, // Negative gravity (float up)
                opacity: 0.9
            });
        }
    }
    
    createCrashAnimation(x, y) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        this.screenShake = 20;
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const size = Math.random() * 5 + 3;
            const life = Math.random() * 40 + 30;
            this.particles.push({
                x: centerX, y: centerY,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                color: i % 3 === 0 ? '#ff8800' : (i % 3 === 1 ? '#ffcc00' : '#ff3300'),
                size: size, life: life, gravity: 0.2
            });
        }
        
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            const speed = Math.random() * 1.5;
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                color: '#aaaaaa', size: Math.random() * 8 + 4,
                life: Math.random() * 60 + 30, gravity: 0.05, opacity: 0.7
            });
        }
    }
    
    render() {
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * 4 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * 4 : 0;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        // Fill background
        this.ctx.fillStyle = this.backgroundPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen flash effect
        if (this.screenFlash > 0) {
            const flashAlpha = Math.min(0.3, this.screenFlash / 60);
            this.ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (this.grid && this.grid.length > 0) {
            for (let y = 0; y < this.grid.length; y++) {
                for (let x = 0; x < this.grid[y].length; x++) {
                    this.drawTile(x, y, this.grid[y][x]);
                    
                    // Add glowing effect to exit when open
                    if (this.exitOpen && this.exitPosition && 
                        x === this.exitPosition.x && y === this.exitPosition.y) {
                        const time = Date.now() / 1000;
                        const pulse = Math.sin(time * 4) * 0.3 + 0.7;
                        const posX = x * TILE_SIZE;
                        const posY = y * TILE_SIZE;
                        
                        this.ctx.strokeStyle = `rgba(0, 255, 0, ${pulse})`;
                        this.ctx.lineWidth = 3;
                        this.ctx.strokeRect(posX + 2, posY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                        
                        this.ctx.shadowColor = '#00ff00';
                        this.ctx.shadowBlur = 15 * pulse;
                        this.ctx.strokeRect(posX + 2, posY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }
        
        for (const enemy of this.enemies) {
            this.drawTile(enemy.x, enemy.y, ELEMENT_TYPES.ENEMY);
        }
        
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life / (p.life + 10)) * (p.opacity || 1);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        if (this.gameOver) {
            this.drawMessage('GAME OVER', 'Press Restart', '#ff0000');
        } else if (this.levelComplete) {
            this.drawMessage('LEVEL COMPLETE', `Score: ${this.score}`, '#00ff00');
        }
        
        // Show demo mode indicator
        if (this.demoMode && !this.gameOver && !this.levelComplete) {
            const time = Date.now() / 1000;
            const blink = Math.floor(time * 2) % 2;
            if (blink) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.fillRect(10, 10, 200, 50);
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(10, 10, 200, 50);
                
                this.ctx.fillStyle = '#ffff00';
                this.ctx.font = 'bold 20px Courier New';
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'top';
                this.ctx.fillText('★ DEMO MODE ★', 20, 18);
                this.ctx.font = '12px Courier New';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText('Press any key to exit', 20, 40);
            }
        }
        
        this.ctx.restore();
    }
    
    drawTile(x, y, element) {
        const posX = x * TILE_SIZE;
        const posY = y * TILE_SIZE;
        if (this.sprites[element]) {
            this.ctx.drawImage(this.sprites[element], posX, posY, TILE_SIZE, TILE_SIZE);
        }
    }
    
    drawMessage(title, subtitle, color) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Semi-transparent background with blur effect
        this.ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
        this.ctx.beginPath();
        this.ctx.roundRect(centerX - 180, centerY - 70, 360, 140, 12);
        this.ctx.fill();
        
        // Border glow
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.roundRect(centerX - 180, centerY - 70, 360, 140, 12);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Title with glow
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 28px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(title, centerX, centerY - 20);
        this.ctx.shadowBlur = 0;
        
        // Subtitle
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.fillText(subtitle, centerX, centerY + 30);
    }
    
    startDemoTimeout() {
        this.cancelDemoTimeout();
        this.demoTimeout = setTimeout(() => {
            this.startGame(true); // Start in demo mode
        }, 5000); // 5 seconds
    }
    
    cancelDemoTimeout() {
        if (this.demoTimeout) {
            clearTimeout(this.demoTimeout);
            this.demoTimeout = null;
        }
    }
    
    exitDemoMode() {
        this.demoMode = false;
        this.aiPath = [];
        this.aiMemory = null; // Reset AI memory
        this.isRunning = false;
        this.gameOver = false;
        this.stopTimer();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.startButton.classList.remove('hidden');
        this.restartButton.classList.add('hidden');
        this.startDemoTimeout();
        requestAnimationFrame(() => this.drawTitleScreen());
    }
    
    drawTitleScreen() {
        const time = Date.now() / 1000;
        
        // Black background with grid
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Animated title with multiple layers
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - 80;
        
        // Shadow layers for depth
        this.ctx.font = 'bold 64px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Cyan shadow
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillText('BOULDER DASH', centerX + 6, centerY + 6);
        
        // Magenta shadow
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillText('BOULDER DASH', centerX + 4, centerY + 4);
        
        // Main text with glow
        const glowIntensity = Math.sin(time * 3) * 0.5 + 0.5;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 20 + glowIntensity * 20;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText('BOULDER DASH', centerX, centerY);
        this.ctx.shadowBlur = 0;
        
        // Subtitle with typewriter effect
        this.ctx.font = '24px Courier New';
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('★ COLLECT DIAMONDS AND ESCAPE! ★', centerX, centerY + 80);
        this.ctx.shadowBlur = 0;
        
        // Blinking "Press Start" text
        const blink = Math.floor(time * 2) % 2;
        if (blink) {
            this.ctx.font = 'bold 28px Courier New';
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText('▶ PRESS START GAME ◀', centerX, centerY + 140);
            this.ctx.shadowBlur = 0;
        }
        
        // Copyright/credit text
        this.ctx.font = '16px Courier New';
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('© 1984 RETRO ARCADE CLASSICS', centerX, this.canvas.height - 30);
        
        // Animated border effect
        this.ctx.strokeStyle = `rgba(255, 0, 255, ${glowIntensity})`;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
        
        // Request next frame for animation
        if (!this.isRunning) {
            requestAnimationFrame(() => this.drawTitleScreen());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
