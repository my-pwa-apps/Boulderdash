import re

with open('src/classic-levels.js', 'r', encoding='utf-8') as f:
    content = f.read()

caves = re.findall(r'name: "(\w+)",\s+timeLimit: \d+,\s+diamondsRequired: (\d+),.*?pattern: `([^`]+)`', content, re.DOTALL)

print('Cave Quality Check:\n')
print(f"{'Cave':<3} {'Name':<20} {'Req':<5} {'Avail':<5} {'Line Clustering Check'}")
print('-' * 80)

for i, (name, req, pattern) in enumerate(caves, 1):
    lines = pattern.strip().split('\n')
    available = pattern.count('*')
    required = int(req)
    
    # Check if diamonds are clustered in just 1-2 lines
    diamond_lines = []
    for idx, line in enumerate(lines):
        count = line.count('*')
        if count > 0:
            diamond_lines.append((idx, count))
    
    # Flag if more than 50% of diamonds are in just 1-2 lines
    if diamond_lines:
        top_two = sorted(diamond_lines, key=lambda x: x[1], reverse=True)[:2]
        top_two_count = sum(count for _, count in top_two)
        percentage = (top_two_count / available * 100) if available > 0 else 0
        
        if percentage > 60:
            clustering = f'⚠️  {percentage:.0f}% in {len(top_two)} line(s)'
        else:
            clustering = f'✓ Well distributed'
    else:
        clustering = '✗ NO DIAMONDS'
    
    diamond_status = '✓' if available >= required else '✗'
    print(f'{i:<3} {name:<20} {required:<5} {available:<5} {clustering}')

print('\n' + '='*80)
print('Checking procedural generation...\n')
