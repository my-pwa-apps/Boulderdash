// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBI4EHlV9xr2TsPZQz8FY7LYZdESXsW4gk",
  authDomain: "boulderdash-ae84b.firebaseapp.com",
  databaseURL: "https://boulderdash-ae84b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "boulderdash-ae84b",
  storageBucket: "boulderdash-ae84b.firebasestorage.app",
  messagingSenderId: "647333113999",
  appId: "1:647333113999:web:10e2927e3060767c1580fa",
  measurementId: "G-V90SBV44G7"
};

// Initialize Firebase (will need Firebase SDK loaded)
let firebaseApp = null;
let database = null;

export function initializeFirebase() {
  try {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined') {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      database = firebase.database();
      
      console.log('Firebase Realtime Database initialized successfully');
      return true;
    } else {
      console.warn('Firebase SDK not loaded');
      return false;
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// Save high score to localStorage (Firebase read-only)
export async function saveHighScore(playerName, score, level) {
  try {
    // Get existing high scores from localStorage
    const scores = getHighScoresSync();
    
    // Add new score
    scores.push({
      playerName: playerName || 'Player',
      score: score,
      level: level,
      timestamp: Date.now()
    });
    
    // Sort by score (descending) and keep top 100
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 100);
    
    // Save back to localStorage
    localStorage.setItem('boulderdash_highscores', JSON.stringify(topScores));
    console.log('High score saved to localStorage');
    return true;
  } catch (error) {
    console.error('Error saving high score:', error);
    return false;
  }
}

// Get top high scores from localStorage
export async function getHighScores(limit = 10) {
  return getHighScoresSync().slice(0, limit);
}

// Synchronous helper for getting high scores
function getHighScoresSync() {
  try {
    const stored = localStorage.getItem('boulderdash_highscores');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading high scores:', error);
  }
  return [];
}

// Store game statistics in database (instead of analytics)
export async function logGameEvent(eventName, eventParams = {}) {
  if (!database) return;
  
  try {
    const eventsRef = database.ref('game_events');
    await eventsRef.push({
      event: eventName,
      params: eventParams,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (error) {
    // Silently fail if Firebase permissions not set up
    // This is expected and doesn't affect gameplay
    console.log('Firebase logging disabled (no write permissions)');
  }
}

export { firebaseConfig };
