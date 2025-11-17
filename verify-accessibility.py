import re
from collections import deque

with open('src/classic-levels.js', 'r', encoding='utf-8') as f:
    content = f.read()

caves = re.findall(r'name: "(\w+)",\s+timeLimit: \d+,\s+diamondsRequired: (\d+),.*?pattern: `([^`]+)`', content, re.DOTALL)

def flood_fill_check(pattern_text):
    """Use flood fill to check if all diamonds are reachable from player spawn"""
    lines = [line for line in pattern_text.strip().split('\n') if line]
    if not lines:
        return True, 0, 0
    
    # Find player position
    player_pos = None
    diamond_positions = set()
    
    for y, line in enumerate(lines):
        for x, char in enumerate(line):
            if char == 'P':
                player_pos = (x, y)
            elif char == '*':
                diamond_positions.add((x, y))
    
    if not player_pos:
        return False, 0, len(diamond_positions)
    
    # Flood fill from player position
    visited = set()
    queue = deque([player_pos])
    visited.add(player_pos)
    reachable_diamonds = set()
    
    while queue:
        x, y = queue.popleft()
        
        # Check if this position has a diamond
        if (x, y) in diamond_positions:
            reachable_diamonds.add((x, y))
        
        # Check all 4 directions
        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            nx, ny = x + dx, y + dy
            
            if 0 <= ny < len(lines) and 0 <= nx < len(lines[ny]):
                if (nx, ny) not in visited:
                    char = lines[ny][nx]
                    # Can walk through: empty, dirt, diamonds, exit, enemies
                    if char in [' ', '.', '*', 'E', 'F', 'P']:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
    
    unreachable = len(diamond_positions) - len(reachable_diamonds)
    return unreachable == 0, len(reachable_diamonds), unreachable

print('Thorough Diamond Accessibility Check:\n')
print(f"{'Cave':<3} {'Name':<20} {'Required':<8} {'Reachable':<10} {'Unreachable':<12} {'Status'}")
print('-' * 80)

all_ok = True
for i, (name, req, pattern) in enumerate(caves, 1):
    all_accessible, reachable, unreachable = flood_fill_check(pattern)
    required = int(req)
    
    if not all_accessible:
        status = f'✗ {unreachable} UNREACHABLE'
        all_ok = False
    elif reachable < required:
        status = f'✗ NEED {required - reachable} MORE'
        all_ok = False
    else:
        status = '✓ OK'
    
    print(f'{i:<3} {name:<20} {required:<8} {reachable:<10} {unreachable:<12} {status}')

if all_ok:
    print('\n✓ All caves have all required diamonds accessible!')
else:
    print('\n⚠️  Some caves have accessibility issues!')
