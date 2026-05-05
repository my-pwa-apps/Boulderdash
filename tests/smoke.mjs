import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateLevel } from '../src/level-generator.js';
import { GamePhysics } from '../src/physics.js';
import { GRID_WIDTH, GRID_HEIGHT, ELEMENT_TYPES } from '../src/constants.js';

for (let level = 1; level <= 16; level++) {
  const levelData = generateLevel(level);
  assert.equal(levelData.grid.length, GRID_HEIGHT, `level ${level} height`);
  assert.equal(levelData.grid.every((row) => row.length === GRID_WIDTH), true, `level ${level} width`);
  assert.ok(levelData.playerPosition, `level ${level} player position`);
  assert.ok(levelData.exitPosition, `level ${level} exit position`);
  assert.equal(levelData.grid[levelData.playerPosition.y][levelData.playerPosition.x], ELEMENT_TYPES.PLAYER, `level ${level} player cell`);
  assert.equal(levelData.grid[levelData.exitPosition.y][levelData.exitPosition.x], ELEMENT_TYPES.EXIT, `level ${level} exit cell`);
}

{
  const grid = [
    [ELEMENT_TYPES.WALL, ELEMENT_TYPES.WALL, ELEMENT_TYPES.WALL, ELEMENT_TYPES.WALL],
    [ELEMENT_TYPES.WALL, ELEMENT_TYPES.PLAYER, ELEMENT_TYPES.DIAMOND, ELEMENT_TYPES.WALL],
    [ELEMENT_TYPES.WALL, ELEMENT_TYPES.EMPTY, ELEMENT_TYPES.EXIT, ELEMENT_TYPES.WALL],
    [ELEMENT_TYPES.WALL, ELEMENT_TYPES.WALL, ELEMENT_TYPES.WALL, ELEMENT_TYPES.WALL]
  ];
  const physics = new GamePhysics(grid);
  const collect = physics.movePlayer(1, 1, 'RIGHT', false);
  assert.equal(collect.success, true, 'player can collect a diamond');
  assert.equal(collect.collected, true, 'diamond collection is reported');
  const blockedExit = physics.movePlayer(2, 1, 'DOWN', false);
  assert.equal(blockedExit.success, false, 'closed exit blocks movement');
  const openExit = physics.movePlayer(2, 1, 'DOWN', true);
  assert.equal(openExit.success, true, 'open exit allows movement');
  assert.equal(openExit.exit, true, 'exit completion is reported');
}

const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.start_url, './', 'manifest start_url is relative for GitHub Pages');
assert.equal(manifest.scope, './', 'manifest scope is relative for GitHub Pages');
assert.equal(manifest.shortcuts[0].url, './?action=new', 'manifest shortcut URL is relative');
assert.ok(manifest.icons.every((icon) => icon.src.startsWith('./public/')), 'manifest icons use real local assets');

const serviceWorker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const requiredCachedAssets = [
  './index.html',
  './style.css?v=1.3.0',
  './manifest.json',
  './public/icon.svg',
  './public/icon-192.svg',
  './public/icon-512.svg',
  './src/assets.js?v=1.3.0',
  './src/classic-levels.js?v=1.3.0',
  './src/constants.js?v=1.3.0',
  './src/firebase-config.js?v=1.3.0',
  './src/game.js?v=1.3.0',
  './src/level-generator.js?v=1.3.0',
  './src/physics.js?v=1.3.0',
  './src/sound.js?v=1.3.0',
  './src/touch-controls.js?v=1.3.0',
  './src/utils.js?v=1.3.0'
];

for (const asset of requiredCachedAssets) {
  assert.ok(serviceWorker.includes(asset), `service worker precaches ${asset}`);
}

assert.ok(!serviceWorker.includes('sync-scores'), 'service worker has no placeholder sync handler');
assert.ok(!serviceWorker.includes('manifest-icon-192.png'), 'service worker does not reference missing icons');

console.log('Smoke tests passed');
