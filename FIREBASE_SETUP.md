# Firebase Database Permissions Setup

Firebase is optional. The game stores a local best score in `localStorage` when Firebase is unavailable, so the core game still works offline and without database permissions.

## Fix Instructions

### 1. Open Firebase Console
Go to: [Firebase Database Rules](https://console.firebase.google.com/project/boulderdash-ae84b/database/boulderdash-ae84b-default-rtdb/rules)

Or navigate manually:
- Go to https://console.firebase.google.com
- Select project: **boulderdash-ae84b**
- Click **Realtime Database** in left menu
- Click **Rules** tab

### 2. Update Rules
Use validation rules instead of public unrestricted writes:

```json
{
  "rules": {
    "highscores": {
      ".read": true,
      ".indexOn": ["score"],
      "$scoreId": {
        ".write": true,
        ".validate": "newData.hasChildren(['playerName', 'score', 'level', 'timestamp']) && newData.child('playerName').isString() && newData.child('playerName').val().matches(/^[A-Za-z0-9 _-]{1,20}$/) && newData.child('score').isNumber() && newData.child('score').val() >= 0 && newData.child('score').val() <= 10000000 && newData.child('level').isNumber() && newData.child('level').val() >= 1 && newData.child('timestamp').isNumber()"
      }
    },
    "game_events": {
      ".read": false,
      "$eventId": {
        ".write": true,
        ".validate": "newData.hasChildren(['event', 'params', 'timestamp']) && newData.child('event').isString() && newData.child('event').val().matches(/^.{1,40}$/) && newData.child('timestamp').isNumber()"
      }
    }
  }
}
```

### 3. Publish Changes
Click the **Publish** button to apply the new rules.

## What These Rules Do

### `highscores` node:
- ✅ **`.read: true`** - Anyone can read high scores (view leaderboard)
- ✅ **validated writes** - Clients can submit scores only in the expected shape and range
- ✅ **`.indexOn: ["score"]`** - Optimizes queries sorted by score

### `game_events` node:
- ❌ **`.read: false`** - Game events are private (analytics only)
- ✅ **validated writes** - Game can log bounded analytics events

## Security Note

These client-side rules prevent malformed records and casual database spam, but they do not prove a score was earned. For a competitive leaderboard, add Firebase Authentication and server-side score validation with Cloud Functions.

Optional authentication hardening:
```json
"highscores": {
  "$scoreId": {
    ".write": "auth != null"
  }
}
```

## Testing

After updating the rules:
1. Refresh your game (Ctrl+F5)
2. Play and die (to trigger game over)
3. Check Firebase Console -> Data tab to see your high score
4. Disable network and repeat; the HUD should still preserve the local best score

## Current Database URL
```
https://boulderdash-ae84b-default-rtdb.europe-west1.firebasedatabase.app
```
