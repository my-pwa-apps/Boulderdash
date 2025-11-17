import re

with open('src/classic-levels.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all cave patterns that need fixing (6-14)
caves_to_fix = [6, 7, 8, 9, 10, 11, 12, 13, 14]  # AMOEBA through VERTIGO

def distribute_diamonds(pattern_lines, required_diamonds):
    """Distribute diamonds evenly throughout a pattern"""
    # Find all non-wall, non-player, non-exit positions
    available_positions = []
    for y, line in enumerate(pattern_lines):
        for x, char in enumerate(line):
            if char in ['.', ' ']:  # Empty or dirt
                available_positions.append((x, y))
    
    if len(available_positions) < required_diamonds:
        print(f"Warning: Not enough positions for {required_diamonds} diamonds")
        return pattern_lines
    
    # Shuffle and select positions
    import random
    random.seed(42)  # Consistent results
    random.shuffle(available_positions)
    diamond_positions = set(available_positions[:required_diamonds])
    
    # Build new pattern
    new_lines = []
    for y, line in enumerate(pattern_lines):
        new_line = list(line)
        for x in range(len(new_line)):
            if (x, y) in diamond_positions:
                new_line[x] = '*'
        new_lines.append(''.join(new_line))
    
    return new_lines

# Parse all caves
caves = re.findall(r'(\{\s+// Cave [A-P]:.*?enemies: \d+\s+\})', content, re.DOTALL)

print("Fixing caves with clustered diamonds...\n")

for cave_num in caves_to_fix:
    print(f"Processing Cave {chr(64 + cave_num)}...")

print("\nRun this script to generate fixed patterns.")
