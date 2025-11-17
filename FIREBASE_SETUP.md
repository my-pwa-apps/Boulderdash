# Firebase Database Permissions Setup

## Current Issue
Your Firebase Realtime Database is currently **read-only**, preventing high scores from being saved.

## Fix Instructions

### 1. Open Firebase Console
Go to: [Firebase Database Rules](https://console.firebase.google.com/project/boulderdash-ae84b/database/boulderdash-ae84b-default-rtdb/rules)

Or navigate manually:
- Go to https://console.firebase.google.com
- Select project: **boulderdash-ae84b**
- Click **Realtime Database** in left menu
- Click **Rules** tab

### 2. Update Rules
Replace the current rules with:

```json
{
  "rules": {
    "highscores": {
      ".read": true,
      ".write": true,
      ".indexOn": ["score"]
    },
    "game_events": {
      ".read": false,
      ".write": true
    }
  }
}
```

### 3. Publish Changes
Click the **Publish** button to apply the new rules.

## What These Rules Do

### `highscores` node:
- ✅ **`.read: true`** - Anyone can read high scores (view leaderboard)
- ✅ **`.write: true`** - Anyone can write high scores (submit scores)
- ✅ **`.indexOn: ["score"]`** - Optimizes queries sorted by score

### `game_events` node:
- ❌ **`.read: false`** - Game events are private (analytics only)
- ✅ **`.write: true`** - Game can log events for analytics

## Security Note

⚠️ **Public write access** means anyone can submit high scores. For a production app, consider:

1. **Add validation rules** to prevent score manipulation:
```json
"highscores": {
  "$scoreId": {
    ".validate": "newData.hasChildren(['playerName', 'score', 'level', 'timestamp']) && newData.child('score').isNumber() && newData.child('level').isNumber()"
  }
}
```

2. **Use Firebase Authentication** to track users:
```json
"highscores": {
  ".write": "auth != null"
}
```

3. **Add server-side validation** using Cloud Functions to verify scores

## Testing

After updating the rules:
1. Refresh your game (Ctrl+F5)
2. Play and die (to trigger game over)
3. Check browser console - should see "High score saved successfully" ✅
4. Check Firebase Console → Data tab to see your high score

## Current Database URL
```
https://boulderdash-ae84b-default-rtdb.europe-west1.firebasedatabase.app
```
