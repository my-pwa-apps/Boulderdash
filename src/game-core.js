import { generateLevel } from './level-generator.js?v=1.4.3';
import { GamePhysics } from './physics.js?v=1.4.3';
import { ELEMENT_TYPES, GAME_SETTINGS } from './constants.js?v=1.4.3';

/**
 * GameCore — pure game-state and rules engine.
 *
 * It owns the logical state of a Boulder Dash session (grid, player, enemies,
 * score, diamonds, timer, win/lose state) and the rules that mutate it. It has
 * NO dependency on the DOM, canvas, audio, Firebase, timers or animation, which
 * makes it fully unit-testable in a headless environment.
 *
 * Methods mutate state and return plain "event" objects describing what
 * happened. The surrounding adapter (the `Game` class) is responsible for all
 * side effects — rendering, sound, particles, persistence — driven by those
 * events. This keeps presentation concerns out of the rules engine.
 */
export class GameCore {
    constructor() {
        this.grid = [];
        this.physics = null;
        this.playerPosition = { x: 0, y: 0 };
        this.exitPosition = null;
        this.enemies = [];
        this.level = 1;
        this.score = 0;
        this.diamondsCollected = 0;
        this.requiredDiamonds = 0;
        this.exitOpen = false;
        this.timeRemaining = GAME_SETTINGS.INITIAL_TIME;
        this.diamondValue = GAME_SETTINGS.DIAMOND_VALUE;
        this.extraDiamondValue = GAME_SETTINGS.DIAMOND_VALUE;
        this.levelName = '';
    }

    /**
     * Build and install a level. Mirrors the original Game.loadLevel data setup.
     * @param {number} levelNumber - 1-based level index.
     * @returns {Object} The raw level data from the generator.
     */
    loadLevel(levelNumber) {
        const levelData = generateLevel(levelNumber);

        this.level = levelNumber;
        this.grid = levelData.grid;
        this.playerPosition = { ...levelData.playerPosition };
        this.exitPosition = levelData.exitPosition;
        this.enemies = levelData.enemies;
        this.requiredDiamonds = levelData.requiredDiamonds;
        this.levelName = levelData.levelName || `Cave ${String.fromCharCode(64 + levelNumber)}`;
        this.diamondsCollected = 0;
        this.exitOpen = false;
        this.diamondValue = levelData.diamondValue || GAME_SETTINGS.DIAMOND_VALUE;
        this.extraDiamondValue = levelData.extraDiamondValue || this.diamondValue;
        this.timeRemaining = levelData.timeLimit || (GAME_SETTINGS.INITIAL_TIME + (levelNumber * 30));

        this.physics = new GamePhysics(this.grid);
        const { x, y } = this.playerPosition;
        this.grid[y][x] = ELEMENT_TYPES.PLAYER;
        this.physics.setCell(x, y, ELEMENT_TYPES.PLAYER);

        return levelData;
    }

    /**
     * Apply a player move in the given direction.
     * Preserves the original behavior exactly, including that crush/enemy-contact
     * is only surfaced when the underlying move succeeded.
     * @param {string} direction - 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
     * @returns {{success:boolean, collected:boolean, exitOpened:boolean, reachedExit:boolean, crushed:boolean}}
     */
    movePlayer(direction) {
        const events = {
            success: false,
            collected: false,
            exitOpened: false,
            reachedExit: false,
            crushed: false
        };

        if (!this.physics) return events;

        const result = this.physics.movePlayer(
            this.playerPosition.x,
            this.playerPosition.y,
            direction,
            this.exitOpen
        );

        if (result.success) {
            this.playerPosition.x = result.newX;
            this.playerPosition.y = result.newY;
            events.success = true;

            if (result.collected) {
                events.collected = true;
                this._collectDiamond(events);
            }

            if (result.exit && this.exitOpen) {
                events.reachedExit = true;
            }
        }

        events.crushed = result.crushed === true;

        return events;
    }

    /**
     * Grab an item (dirt/diamond) in a direction without moving the player.
     * @param {string} direction - 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
     * @returns {{collected:boolean, exitOpened:boolean}}
     */
    grab(direction) {
        const events = { collected: false, exitOpened: false };

        if (!this.physics) return events;

        const result = this.physics.grabItem(this.playerPosition.x, this.playerPosition.y, direction);

        if (result.collected) {
            events.collected = true;
            this._collectDiamond(events);
        }

        return events;
    }

    /**
     * Advance falling/rolling physics by one step and report whether the player
     * was crushed.
     * @returns {{crushed:boolean}}
     */
    stepPhysics() {
        if (!this.physics) return { crushed: false, updated: false, movement: null };

        const updated = this.physics.update();
        return {
            crushed: this.physics.isPlayerCrushed(this.playerPosition.x, this.playerPosition.y),
            updated,
            movement: this.physics.lastUpdatedCell?.type || null
        };
    }

    /**
     * Advance enemy movement by one step: move enemies, detect player collision,
     * resolve crushed enemies (with explosions and scoring).
     * @returns {{playerKilled:boolean, kills:Array<{x:number,y:number,type:number,diamondsCreated:number}>}}
     */
    stepEnemies() {
        if (!this.physics) return { playerKilled: false, kills: [] };

        this.enemies = this.physics.moveEnemies(this.enemies, this.playerPosition.x, this.playerPosition.y);

        const playerKilled = this.physics.checkEnemyCollision(
            this.playerPosition.x,
            this.playerPosition.y,
            this.enemies
        );

        const kills = [];
        const crushedEnemies = this.physics.checkEnemiesCrushed(this.enemies);
        for (const idx of crushedEnemies.reverse()) {
            const enemy = this.enemies[idx];
            let diamondsCreated = 0;

            if (enemy.type === ELEMENT_TYPES.BUTTERFLY) {
                diamondsCreated = this.physics.explodeButterfly(enemy.x, enemy.y);
                this.score += 100 + (diamondsCreated * this.diamondValue);
            } else {
                this.physics.explodeFirefly(enemy.x, enemy.y);
                this.score += 100;
            }

            kills.push({ x: enemy.x, y: enemy.y, type: enemy.type, diamondsCreated });
            this.enemies.splice(idx, 1);
        }

        return { playerKilled, kills };
    }

    /**
     * Decrement the remaining time by one second.
     * @returns {{timedOut:boolean}}
     */
    tickTime() {
        this.timeRemaining--;
        return { timedOut: this.timeRemaining <= 0 };
    }

    /**
     * Sync the logical grid reference to the physics grid (called after a
     * physics step so renderers read the up-to-date board).
     */
    syncGrid() {
        if (this.physics) {
            this.grid = this.physics.getGridRef();
        }
    }

    /**
     * Whether enough diamonds have been collected to open the exit.
     * @returns {boolean}
     */
    hasRequiredDiamonds() {
        return this.diamondsCollected >= this.requiredDiamonds;
    }

    /**
     * Shared diamond-collection bookkeeping (count, score, exit opening).
     * @private
     */
    _collectDiamond(events) {
        this.diamondsCollected++;
        this.score += this.exitOpen ? this.extraDiamondValue : this.diamondValue;

        if (this.diamondsCollected >= this.requiredDiamonds && !this.exitOpen) {
            this.exitOpen = true;
            events.exitOpened = true;
        }
    }
}
