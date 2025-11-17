# Contributing to Boulder Dash

Thank you for your interest in contributing to Boulder Dash! 🎮💎

## How to Contribute

### Reporting Bugs 🐛

1. Check if the bug has already been reported in [Issues](https://github.com/your-username/boulderdash/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos if applicable
   - Browser/device information

### Suggesting Features ✨

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Why it would be useful
   - Possible implementation approach

### Pull Requests 🔧

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on desktop and mobile
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request with:
   - Description of changes
   - Screenshots/videos of new features
   - Testing performed

### Code Style 📝

- Use ES6+ features
- Follow existing code formatting
- Add comments for complex logic
- Use meaningful variable names
- Keep functions focused and small

### Testing Checklist ✅

Before submitting:
- [ ] Tested on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Tested on mobile devices (iOS and Android)
- [ ] No console errors
- [ ] Game mechanics work correctly
- [ ] PWA features functional
- [ ] Performance is acceptable (60 FPS)
- [ ] Code is documented

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/boulderdash.git
cd boulderdash

# Start local server
cd public
python -m http.server 8000

# Open browser
open http://localhost:8000
```

## Code Areas

### Game Logic (`src/game.js`)
- Main game loop
- State management
- Event handling

### Physics (`src/physics.js`)
- Falling object mechanics
- Collision detection
- Player movement

### Graphics (`src/assets.js`)
- Procedural sprite generation
- Canvas rendering

### Levels (`src/level-generator.js`)
- Procedural level generation
- Difficulty scaling

### Audio (`src/sound.js`)
- Procedural sound effects
- Audio management

## Questions?

Feel free to ask questions in [Discussions](https://github.com/your-username/boulderdash/discussions) or open an issue!

---

**Happy coding! 💎⚡**
