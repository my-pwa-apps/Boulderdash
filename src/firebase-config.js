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

// Save high score to Firebase
export async function saveHighScore(playerName, score, level) {
  if (!database) {
    console.warn('Firebase database not initialized');
    return false;
  }
  
  try {
    const scoresRef = database.ref('highscores');
    const newScoreRef = scoresRef.push();
    await newScoreRef.set({
      playerName: playerName,
      score: score,
      level: level,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    console.log('High score saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving high score:', error);
    return false;
  }
}

// Get top high scores from Firebase
export async function getHighScores(limit = 10) {
  if (!database) {
    console.warn('Firebase database not initialized');
    return [];
  }
  
  try {
    const scoresRef = database.ref('highscores');
    const snapshot = await scoresRef
      .orderByChild('score')
      .limitToLast(limit)
      .once('value');
    
    const scores = [];
    snapshot.forEach((childSnapshot) => {
      scores.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Sort descending by score
    return scores.reverse();
  } catch (error) {
    console.error('Error fetching high scores:', error);
    return [];
  }
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
