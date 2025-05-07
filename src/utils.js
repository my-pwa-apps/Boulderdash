// Utility functions for the Boulderdash game

/**
 * Check if coordinates are within the game grid
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @param {number} width - The grid width
 * @param {number} height - The grid height
 * @returns {boolean} - Whether the coordinates are within bounds
 */
export function isInBounds(x, y, width, height) {
    return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Get a random integer between min (inclusive) and max (inclusive)
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - A random integer
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array
 */
export function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate the Manhattan distance between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} - The Manhattan distance
 */
export function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Deep clone a 2D array (grid)
 * @param {Array<Array>} grid - The 2D grid to clone
 * @returns {Array<Array>} - A deep copy of the grid
 */
export function cloneGrid(grid) {
    return grid.map(row => [...row]);
}

/**
 * Create a 2D array filled with a specified value
 * @param {number} width - The width of the grid
 * @param {number} height - The height of the grid
 * @param {any} fillValue - The value to fill the grid with
 * @returns {Array<Array>} - A new 2D array
 */
export function createGrid(width, height, fillValue) {
    return Array(height).fill().map(() => Array(width).fill(fillValue));
}
