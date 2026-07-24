import assert from 'node:assert/strict';
import { GameCore } from '../src/game-core.js';
import { GamePhysics } from '../src/physics.js';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  ELEMENT_TYPES as T
} from '../src/constants.js';

/**
 * Headless unit tests for the pure GameCore rules engine.
 * No DOM/canvas/audio/Firebase is required — these exercise gameplay rules
 * directly, which was impossible before the GameCore extraction.
 */

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
}

// Build a GameCore around a hand-crafted grid with injected physics so we can
// exercise specific scenarios deterministically.
function makeCore(grid, player, opts = {}) {
  const core = new GameCore();
  core.physics = new GamePhysics(grid);
  core.playerPosition = { x: player.x, y: player.y };
  core.requiredDiamonds = opts.requiredDiamonds ?? 1;
  core.diamondValue = opts.diamondValue ?? 10;
  core.extraDiamondValue = opts.extraDiamondValue ?? core.diamondValue;
  core.exitOpen = opts.exitOpen ?? false;
  core.diamondsCollected = opts.diamondsCollected ?? 0;
  core.score = opts.score ?? 0;
  return core;
}

// --- loadLevel against real generated levels --------------------------------
test('loadLevel installs a valid board', () => {
  const core = new GameCore();
  for (let level = 1; level <= 3; level++) {
    core.loadLevel(level);
    assert.equal(core.grid.length, GRID_HEIGHT, `level ${level} height`);
    assert.ok(core.grid.every((row) => row.length === GRID_WIDTH), `level ${level} width`);
    assert.equal(core.grid[core.playerPosition.y][core.playerPosition.x], T.PLAYER, `level ${level} player cell`);
    assert.equal(core.grid[core.exitPosition.y][core.exitPosition.x], T.EXIT, `level ${level} exit cell`);
    assert.ok(core.requiredDiamonds > 0, `level ${level} requires diamonds`);
    assert.ok(core.timeRemaining > 0, `level ${level} has time`);
    assert.equal(core.exitOpen, false, `level ${level} starts with closed exit`);
    assert.equal(core.diamondsCollected, 0, `level ${level} starts with zero diamonds`);
  }
});

// --- Movement & digging -----------------------------------------------------
test('moving into empty space relocates the player without collecting', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.EMPTY, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.success, true);
  assert.equal(ev.collected, false);
  assert.deepEqual(core.playerPosition, { x: 2, y: 1 });
});

// --- Diamond collection opens the exit at the required count -----------------
test('collecting the last required diamond opens the exit', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.DIAMOND, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 }, { requiredDiamonds: 1, diamondValue: 10 });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.collected, true);
  assert.equal(ev.exitOpened, true);
  assert.equal(core.exitOpen, true);
  assert.equal(core.diamondsCollected, 1);
  assert.equal(core.score, 10);
});

test('diamonds collected after the exit opens use the extra value', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.DIAMOND, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 }, { requiredDiamonds: 5, diamondValue: 10, extraDiamondValue: 20, exitOpen: true });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.collected, true);
  assert.equal(ev.exitOpened, false);
  assert.equal(core.score, 20);
});

// --- Exit rules -------------------------------------------------------------
test('a closed exit blocks the player', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.EXIT, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 }, { exitOpen: false });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.success, false);
  assert.equal(ev.reachedExit, false);
  assert.deepEqual(core.playerPosition, { x: 1, y: 1 });
});

test('an open exit can be reached to complete the level', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.EXIT, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 }, { exitOpen: true });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.success, true);
  assert.equal(ev.reachedExit, true);
});

// --- Grab -------------------------------------------------------------------
test('grab collects a diamond without moving the player', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.DIAMOND, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 }, { requiredDiamonds: 1 });

  const ev = core.grab('RIGHT');
  assert.equal(ev.collected, true);
  assert.deepEqual(core.playerPosition, { x: 1, y: 1 });
  assert.equal(core.physics.getGridRef()[1][2], T.EMPTY);
});

// --- Boulder pushing --------------------------------------------------------
test('a boulder with empty space beyond it can be pushed', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.BOULDER, T.EMPTY, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.success, true);
  assert.deepEqual(core.playerPosition, { x: 2, y: 1 });
  const g = core.physics.getGridRef();
  assert.equal(g[1][2], T.PLAYER);
  assert.equal(g[1][3], T.BOULDER);
});

// --- Physics crush ----------------------------------------------------------
test('a resting boulder above the player does not crush (escape window)', () => {
  const core = makeCore([
    [T.BOULDER],
    [T.PLAYER],
    [T.WALL]
  ], { x: 0, y: 1 });

  // Boulder is not flagged as falling -> player is safe this tick.
  const { crushed } = core.stepPhysics();
  assert.equal(crushed, false);
});

test('a falling boulder lands on the player and crushes them', () => {
  const core = makeCore([
    [T.BOULDER],
    [T.PLAYER],
    [T.WALL]
  ], { x: 0, y: 1 });

  // Flag the boulder as actively falling, then it lands on the player.
  core.physics.fallingObjects.add('0,0');
  const { crushed } = core.stepPhysics();
  assert.equal(crushed, true);
});

// --- Enemy contact ----------------------------------------------------------
test('an enemy that steps onto the player kills them', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.EMPTY, T.PLAYER, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 2, y: 1 });
  core.enemies = [{ x: 1, y: 1, direction: 'RIGHT', type: T.ENEMY }];

  const { playerKilled, kills } = core.stepEnemies();
  assert.equal(playerKilled, true);
  assert.equal(kills.length, 0);
});

test('walking into an enemy kills the player without moving them', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL, T.WALL],
    [T.WALL, T.PLAYER, T.ENEMY, T.WALL],
    [T.WALL, T.WALL, T.WALL, T.WALL]
  ], { x: 1, y: 1 });

  const ev = core.movePlayer('RIGHT');
  assert.equal(ev.success, false);
  assert.equal(ev.crushed, true);
  assert.deepEqual(core.playerPosition, { x: 1, y: 1 });
});

// --- Butterfly crush → diamonds + score ------------------------------------
test('a crushed butterfly explodes into diamonds and scores', () => {
  const core = makeCore([
    [T.WALL, T.WALL, T.WALL],
    [T.WALL, T.EMPTY, T.WALL],
    [T.WALL, T.EMPTY, T.WALL],
    [T.WALL, T.WALL, T.WALL]
  ], { x: 0, y: 0 }, { diamondValue: 10 });

  // Place a falling boulder directly above a trapped butterfly.
  core.physics.setCell(1, 1, T.BOULDER);
  core.physics.fallingObjects.add('1,1');
  core.enemies = [{ x: 1, y: 2, direction: 'DOWN', type: T.BUTTERFLY }];

  const { playerKilled, kills } = core.stepEnemies();
  assert.equal(playerKilled, false);
  assert.equal(kills.length, 1);
  assert.equal(kills[0].type, T.BUTTERFLY);
  assert.ok(kills[0].diamondsCreated > 0, 'butterfly produced diamonds');
  assert.ok(core.score >= 100, 'butterfly kill awards points');
});

// --- Timer ------------------------------------------------------------------
test('tickTime reports a timeout when the clock reaches zero', () => {
  const core = new GameCore();
  core.timeRemaining = 2;
  assert.equal(core.tickTime().timedOut, false);
  assert.equal(core.timeRemaining, 1);
  assert.equal(core.tickTime().timedOut, true);
  assert.equal(core.timeRemaining, 0);
});

console.log(`Core tests passed (${passed} cases)`);
