# 💎 Boulder Dash - Retro Arcade Game

A C64-inspired cave-digging Progressive Web App with original layouts, procedural continuation, and full mobile support. It is an independent homage to the style and mechanics popularized by Boulder Dash.

![Boulder Dash](https://img.shields.io/badge/Game-Boulder%20Dash-00ffff?style=for-the-badge)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff00ff?style=for-the-badge)
![Mobile Optimized](https://img.shields.io/badge/Mobile-Optimized-ffff00?style=for-the-badge)

## 🎮 Play Now

Serve the repository root locally or publish it with a static host such as GitHub Pages, then install it as a PWA on your device.

## ✨ Features

### 🎯 Gameplay
- **Classic Boulder Dash Mechanics** - Dig through dirt, collect diamonds, avoid falling rocks
- **16 Hand-Authored Caves + Procedural Continuation** - Original C64-style layouts followed by generated challenges
- **Classic Enemy Movement** - Fireflies and butterflies follow Boulder Dash-style wall-following rules
- **Physics Engine** - Realistic boulder rolling and falling mechanics
- **Grab Mechanic** - Hold SPACE + direction to grab without moving
- **Three-Life Runs** - Retry the current cave after a mistake without losing the whole run

### 📱 Mobile First
- **Touch Controls** - Virtual D-pad for mobile devices
- **Responsive Design** - Adapts to any screen size
- **Safe Area Support** - Works with notched devices (iPhone X+)
- **Optimized Performance** - Smooth 60 FPS gameplay on mobile

### 💾 Progressive Web App
- **Offline Play** - Full functionality without internet
- **Install to Home Screen** - Native app experience
- **Service Worker Caching** - Fast loading and offline support
- **Auto-Updates** - Seamless updates when available

### 🎨 Retro Aesthetics
- **80s Arcade Style** - Neon colors, scanlines, CRT effects
- **Procedural Graphics** - All assets generated from code
- **Retro Sound Effects** - Procedural audio generation
- **Arcade Font & Effects** - C64-inspired retro feel

### 🔥 Modern Features
- **Firebase Integration** - High score tracking (optional)
- **Analytics Events** - Game progress tracking
- **Manifest & Icons** - Full PWA compliance
- **Accessibility** - Keyboard, gamepad, and touch support

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/boulderdash.git
   cd boulderdash
   ```

2. **No build step required!** This is a pure HTML/CSS/JavaScript game.

3. **Serve the game**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Using Node.js (http-server):
   ```bash
   npm install -g http-server
   http-server -p 8000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:8000
   ```

4. **Open in browser**
   ```
   http://localhost:8000
   ```

### Install as PWA

1. Open the game in a modern browser (Chrome, Edge, Safari, Firefox)
2. Look for the "Install" button in the address bar
3. Click to install and enjoy native app experience!

## 🎯 How to Play

### Controls

#### Desktop
- **Arrow Keys** or **WASD** - Move player
- **SPACE + Direction** - Grab dirt/diamonds without moving
- **ESC** - Pause game

#### Mobile
- **Two-Thumb Controls** - Movement on the left, grab and pause on the right
- **Player-Centered Camera** - Portrait screens keep hazards readable instead of shrinking the entire cave
- **GRAB Button** - Hold to grab items without moving

### Objectives

1. 💎 **Collect Diamonds** - Gather 70% of diamonds to open the exit
2. 🚪 **Find the Exit** - Located in the bottom-right area
3. ⏱️ **Beat the Clock** - Complete before time runs out
4. 🪨 **Avoid Hazards** - Falling boulders can crush you!
5. 👹 **Evade Enemies** - They hunt you relentlessly

### Game Elements

| Element | Description |
|---------|-------------|
| 💎 Diamond | Collect these to open the exit |
| 🪨 Boulder | Can be pushed horizontally, falls when unsupported |
| 🟫 Dirt | Dig through by moving into it |
| 🟪 Wall | Solid barrier, cannot be destroyed |
| 🟣 Exit | Escape route (opens when enough diamonds collected) |
| 😊 Player | That's you! Avoid getting crushed |
| 👹 Enemy | Chases player, avoid contact |

## 🛠️ Project Structure

```
Boulderdash/
├── index.html             # Main HTML file with PWA meta tags
├── style.css              # Complete styling with mobile support
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker for offline support
├── public/
│   └── icon*.svg          # PWA and browser icons
├── src/
│   ├── game.js            # Main game loop and logic
│   ├── physics.js         # Physics engine for falling objects
│   ├── assets.js          # Procedural sprite generation
│   ├── level-generator.js # Dynamic level creation
│   ├── sound.js           # Procedural audio generation
│   ├── constants.js       # Game constants and configuration
│   ├── utils.js           # Utility functions
│   ├── touch-controls.js  # Mobile touch controls
│   └── firebase-config.js # Firebase integration (optional)
└── README.md              # This file
```

## 🔧 Configuration

### Game Settings

Edit `src/constants.js` to customize:

```javascript
export const GAME_SETTINGS = {
    DIAMOND_VALUE: 10,              // Points per diamond
    REQUIRED_DIAMONDS_PERCENT: 0.7, // Percentage needed to open exit
    INITIAL_TIME: 180,              // Starting time in seconds
    ENEMY_SPEED: 0.4,               // Enemy movement speed
    BOULDER_FALL_SPEED: 4,          // Falling object speed
    LEVEL_COUNT: 16                 // Total classic levels before procedural continuation
};
```

### Grid Size

```javascript
export const TILE_SIZE = 24;
export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 22;
```

### Colors

Customize the retro arcade palette:

```javascript
export const COLORS = {
    WALL: C64.LIGHT_BLUE,
    DIRT: C64.BROWN,
    BOULDER: C64.LIGHT_GREY,
    DIAMOND: C64.WHITE,
    EXIT: C64.GREY,
    PLAYER: C64.WHITE,
    ENEMY: C64.RED
};
```

## 🔥 Firebase Integration (Optional)

To enable high score tracking:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Realtime Database
3. Update `src/firebase-config.js` with your credentials
4. High scores will be automatically tracked

## 🎨 Customization

### Adding New Levels

Levels are procedurally generated but follow patterns. Edit `src/level-generator.js`:

```javascript
export function generateLevel(level) {
    const difficulty = Math.min(5, Math.max(1, level));
    const diamondCount = 20 + (difficulty * 5);
    const boulderCount = 30 + (difficulty * 7);
    const enemyCount = level === 1 ? 0 : Math.floor(difficulty * 1.5);
    // ... your customizations
}
```

### Custom Sprites

All sprites are procedurally generated in `src/assets.js`. Modify drawing functions:

```javascript
function drawPlayer(ctx, color) {
    // Your custom player sprite code
}
```

## 📊 Performance Optimizations

- ✅ Sprite caching to avoid regenerating assets
- ✅ Optimized physics updates (bottom-to-top scan)
- ✅ RequestAnimationFrame for smooth rendering
- ✅ Efficient particle system
- ✅ Minimal DOM manipulations
- ✅ Service worker caching strategy
- ✅ Lazy loading of Firebase SDK
- ✅ CSS hardware acceleration

## 🌐 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Opera | ✅ | ✅ |

PWA features require modern browsers with service worker support.

## 📱 PWA Features Checklist

- ✅ Web App Manifest
- ✅ Service Worker
- ✅ Offline functionality
- ✅ Install prompt
- ✅ App icons (multiple sizes)
- ✅ Theme colors
- ✅ Splash screen
- ✅ Responsive design
- ✅ Safe area support
- ✅ Shortcuts
- ✅ Screenshots

## 🐛 Known Issues

- Service worker cache needs manual clearing for major updates
- Some older browsers may not support all PWA features
- Touch controls may overlap content on very small screens (<320px)

## 🧪 Testing

```bash
npm test          # Headless rules, cave invariants, manifest, and service worker
npm run test:e2e  # Browser progression through Cave A-P and into level 17
npm run test:all  # Both suites
```

The Playwright progression test uses a localhost-only fixture to satisfy each cave's diamond quota and place Rockford beside its exit. It then enters every exit through real keyboard input and verifies the production completion, HUD, canvas, and next-level lifecycle. This proves full browser progression; it does not claim that an automated player solved each cave's puzzles.

## 🚧 Future Enhancements

- [ ] Level editor
- [ ] More enemy types
- [ ] Power-ups and special items
- [ ] Multiplayer mode
- [ ] Daily challenges
- [ ] Achievement system
- [ ] Leaderboards
- [ ] Custom themes
- [ ] Sound effects toggle per sound
- [ ] Replay system

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Original Boulder Dash game by Peter Liepa (1984)
- Inspired by classic arcade games: Dig Dug, Mr. Do!, Pac-Man
- Modern web technologies: HTML5 Canvas, Service Workers, Web Audio API

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

Project Link: [https://github.com/your-username/boulderdash](https://github.com/your-username/boulderdash)

---

**Made with 💎 and ⚡ by Boulder Dash Team**

*Enjoy the retro arcade experience!*
