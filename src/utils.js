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
    if (!grid || !Array.isArray(grid)) return [];
    return grid.map(row => Array.isArray(row) ? [...row] : []);
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

/**
 * Sleep/pause execution for a given number of milliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise} - A promise that resolves after the given time
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function to prevent excessive calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Linearly interpolate between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} - The interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
