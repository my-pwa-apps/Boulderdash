import re

with open('src/classic-levels.js', 'r', encoding='utf-8') as f:
    content = f.read()

caves = re.findall(r'name: "(\w+)",.*?pattern: `([^`]+)`', content, re.DOTALL)

print('Checking for sealed rooms with diamonds:\n')
print(f"{'Cave':<3} {'Name':<20} {'Status'}")
print('-' * 60)

def check_sealed_diamonds(pattern_text, cave_name):
    """Check if any diamonds are in completely sealed boxes"""
    lines = pattern_text.strip().split('\n')
    if not lines:
        return []
    
    issues = []
    
    for y, line in enumerate(lines):
        for x, char in enumerate(line):
            if char == '*':  # Found a diamond
                # Check if it's completely surrounded by walls
                if y > 0 and y < len(lines) - 1:
                    above = lines[y-1][x] if x < len(lines[y-1]) else 'W'
                    below = lines[y+1][x] if x < len(lines[y+1]) else 'W'
                    left = line[x-1] if x > 0 else 'W'
                    right = line[x+1] if x < len(line) - 1 else 'W'
                    
                    # If all 4 sides are walls, it's sealed
                    if above == 'W' and below == 'W' and left == 'W' and right == 'W':
                        issues.append(f"Diamond at ({x},{y}) completely sealed by walls")
                    
                    # Check if inside a closed room (5x5 area all walls)
                    sealed_count = 0
                    for dy in [-1, 0, 1]:
                        for dx in [-1, 0, 1]:
                            if dy == 0 and dx == 0:
                                continue
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < len(lines) and 0 <= nx < len(lines[ny]):
                                if lines[ny][nx] == 'W':
                                    sealed_count += 1
                    
                    if sealed_count >= 7:  # Mostly surrounded
                        issues.append(f"Diamond at ({x},{y}) in heavily walled area")
    
    return issues

for i, (name, pattern) in enumerate(caves, 1):
    issues = check_sealed_diamonds(pattern, name)
    if issues:
        print(f'{i:<3} {name:<20} ⚠️  {len(issues)} potential sealed diamond(s)')
        for issue in issues[:2]:  # Show first 2 issues
            print(f'     {issue}')
    else:
        print(f'{i:<3} {name:<20} ✓ OK')

print('\nNote: Some "sealed" diamonds might be accessible through other paths.')
print('Manual verification recommended for flagged caves.')
