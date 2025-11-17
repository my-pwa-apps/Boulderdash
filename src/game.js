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
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GRID_WIDTH * TILE_SIZE;
        this.canvas.height = GRID_HEIGHT * TILE_SIZE;
        this.screenShake = 0;
        this.gameTime = 0;
        this.playerAnimationFrame = 0;
        this.playerAnimationCounter = 0;
        this.particles = [];
        this.backgroundPattern = this.createBackgroundPattern();
        this.scoreElement = document.getElementById('score');
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
        
        requestAnimationFrame(() => this.drawTitleScreen());
    }
    
    createBackgroundPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const patternCtx = patternCanvas.getContext('2d');
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
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.helpButton.addEventListener('click', () => {
            this.helpModal.style.display = 'block';
            if (this.isRunning) this.pauseGame();
        });
        this.closeHelpButton.addEventListener('click', () => {
            this.helpModal.style.display = 'none';
        });
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
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
    
    startGame() {
        this.level = 1;
        this.score = 0;
        this.isRunning = true;
        this.gameOver = false;
        this.levelComplete = false;
        this.startButton.classList.add('hidden');
        this.restartButton.classList.remove('hidden');
        this.helpModal.style.display = 'none';
        this.loadLevel(this.level);
        this.startTimer();
        this.gameLoop();
        this.handleResize();
        
        // Log game start event
        if (this.firebaseInitialized) {
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
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.particles = [];
        this.playerAnimationFrame = 0;
        this.playerAnimationCounter = 0;
        
        this.physics = new GamePhysics(this.grid);
        const { x, y } = this.playerPosition;
        this.grid[y][x] = ELEMENT_TYPES.PLAYER;
        this.physics.setCell(x, y, ELEMENT_TYPES.PLAYER);
        this.updateHUD();
    }
    
    updateHUD() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.diamondsElement.textContent = `Diamonds: ${this.diamondsCollected}/${this.requiredDiamonds}`;
        this.timeElement.textContent = `Time: ${formatTime(this.timeRemaining)}`;
        this.levelElement.textContent = `Level: ${this.level}`;
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
        
        if (this.playerNextDirection) {
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
        
        // Log game over event and save high score if enabled
        if (this.firebaseInitialized) {
            logGameEvent('game_over', { 
                reason: reason, 
                level: this.level, 
                score: this.score 
            });
            
            // Optionally save high score (you can prompt for player name)
            if (this.score > 0) {
                saveHighScore('Player', this.score, this.level);
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
        
        // Log level complete event
        if (this.firebaseInitialized) {
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
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * 5 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * 5 : 0;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        this.ctx.fillStyle = this.backgroundPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.grid && this.grid.length > 0) {
            for (let y = 0; y < this.grid.length; y++) {
                for (let x = 0; x < this.grid[y].length; x++) {
                    this.drawTile(x, y, this.grid[y][x]);
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
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(centerX - 200, centerY - 80, 400, 160);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(centerX - 200, centerY - 80, 400, 160);
        
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(title, centerX, centerY - 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(subtitle, centerX, centerY + 30);
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
