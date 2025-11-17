import re
import random

# Read the file
with open('src/classic-levels.js', 'r', encoding='utf-8') as f:
    content = f.read()

def redistribute_cave_diamonds(pattern_text, required):
    """Redistribute diamonds throughout the pattern"""
    lines = pattern_text.strip().split('\n')
    
    # Remove existing diamonds
    cleaned_lines = []
    for line in lines:
        cleaned_lines.append(line.replace('*', '.'))
    
    # Find valid positions (not W, P, E, F, #, M)
    valid_positions = []
    for y, line in enumerate(cleaned_lines):
        for x, char in enumerate(line):
            if char in ['.', ' ']:
                valid_positions.append((x, y))
    
    if len(valid_positions) < required:
        print(f"ERROR: Only {len(valid_positions)} positions for {required} diamonds!")
        return pattern_text
    
    # Distribute evenly
    step = len(valid_positions) / required
    selected = []
    for i in range(required):
        idx = int(i * step)
        selected.append(valid_positions[idx])
    
    # Apply diamonds
    result_lines = []
    for y, line in enumerate(cleaned_lines):
        chars = list(line)
        for x, ch in enumerate(chars):
            if (x, y) in selected:
                chars[x] = '*'
        result_lines.append(''.join(chars))
    
    return '\n'.join(result_lines)

# Fix each problematic cave
fixes = [
    ("GUARDS", 18),  # Cave E
    ("AMOEBA", 25),  # Cave G
    ("GREED", 30),
    ("TRACKS", 16),
    ("CROWD", 24),
    ("WALLS", 20),
    ("APOCALYPSE", 28),
    ("ZIGZAG", 18),
    ("FUNNEL", 26),
    ("VERTIGO", 30)
]

for cave_name, required_diamonds in fixes:
    pattern = re.search(rf'name: "{cave_name}".*?pattern: `([^`]+)`', content, re.DOTALL)
    if pattern:
        old_pattern = pattern.group(1)
        new_pattern = redistribute_cave_diamonds(old_pattern, required_diamonds)
        content = content.replace(pattern.group(1), new_pattern)
        print(f"Fixed {cave_name} ({required_diamonds} diamonds)")

# Write back
with open('src/classic-levels.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✓ All caves fixed with distributed diamonds!")
