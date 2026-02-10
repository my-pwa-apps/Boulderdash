import { ELEMENT_TYPES, GRID_WIDTH, GRID_HEIGHT } from './constants.js';

/**
 * Original Boulder Dash cave definitions (16 classic caves A-P)
 * Using a compact representation that will be expanded to the full grid
 */
export const CLASSIC_CAVES = [
    {
        // Cave A: "Intro" - Tutorial level
        name: "INTRO",
        timeLimit: 150,
        diamondsRequired: 10,
        diamondValue: 5,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP..*........*.........*..............EW
W....###.......###........####.........W
W....###.......###........####.........W
W...*......*.......................*...W
W...#######..........#########.........W
W...#######..........#########.........W
W......................................W
W..........*...###...............*.....W
W..............###.....................W
W......................................W
W.........############.................W
W.........############.................W
W.......*..............................W
W...*......................*..###.....W
W...........................*..###.....W
W......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 0
    },
    {
        // Cave B: "Rooms"
        name: "ROOMS",
        timeLimit: 150,
        diamondsRequired: 12,
        diamondValue: 10,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP......*......*......*...............EW
W......................................W
W...WWW....WWW....WWW....WWW...........W
W...W.*....W.*....W.*....W.*...........W
W...W......W......W......W.............W
W...WWW....WWW....WWW....WWW...........W
W......................................W
W..###.................................W
W..###.................................W
W....*................................W
W...WWW....WWW....WWW....WWW...........W
W...W.*....W.*....W.*....W.*...........W
W...W......W......W......W.............W
W...WWW....WWW....WWW....WWW...........W
W......................................W
W......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 1
    },
    {
        // Cave C: "Maze"
        name: "MAZE",
        timeLimit: 180,
        diamondsRequired: 15,
        diamondValue: 12,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP*...W.......W.......W.......W.......EW
W.WWW.W.WWWWW.W.WWWWW.W.WWWWW.W.WWWWW.W
W.W.*.W.W..*W.W.W..*W.W.W..*W.W.W..*W.W
W.W.WWW.W.W.W.W.W.W.W.W.W.W.W.W.W.W.W.W
W.W.....W.W...W.W.W...W.W.W...W.W.W...W
W.WWWWWWW.WWWWW.W.WWWWW.W.WWWWW.W.WWW.W
W.........W.....W.....W.W.....W.W.....W
W.WWWWW.WWW.WWWWWWWWW.W.W.WWW.W.WWWWW.W
W.W..*W.W.*.W.........W.W.W.*.W.....W.W
W.W.W.W.W.W.WWWWWWWWWWW.W.W.W.WWWWW.W.W
W.W.W.W.W.W...........W.W.W.W.....W.W.W
W.W.W.W.W.WWWWWWWWWWW.W.W.W.WWWWW.W.W.W
W.W.W.*.W.*.W.......W.*.W.*.W..*W.*.W.W
W.W.WWWWWWW.W.WWWWW.WWWWWWW.W.W.W.W.W.W
W.W.........W.....W.........W.W...W...W
W.....................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 2
    },
    {
        // Cave D: "Butterflies"
        name: "BUTTERFLIES",
        timeLimit: 120,
        diamondsRequired: 10,
        diamondValue: 15,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP..*.................................EW
W.....WWW.W.......WWW.W.......WWW.W....W
W.....W.*.W.......W.*.W.......W.*.W....W
W.....W.F.W.......W.F.W.......W.F.W....W
W.....W...W.......W...W.......W...W....W
W.....WWWWW.......WWWWW.......WWWWW....W
W....*................................W
W...........##############............W
W...........##############............W
W..*..................................W
W.....WWWWW.......WWWWW.......WWWWW....W
W.....W...W.......W...W.......W...W....W
W.....W.F.W.......W.F.W.......W.F.W....W
W.....W.*.W.......W.*.W.......W.*.W..*.W
W.....W.W.W.......W.W.W.......W.W.W....W
W......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 3
    },
    {
        // Cave E: "Guards"
        name: "GUARDS",
        timeLimit: 150,
        diamondsRequired: 18,
        diamondValue: 8,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP..*.....*.....*.....*.....*.....*...EW
W...*.....*.....*.....*.....*.....*.....W
W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWW....W
W...W..*......F.........F.........W....W
W...W...##################....W....W
W...W...*#################....W....W
W...W.............................W....W
W...W....*........................W....W
W...W.............................W....W
W...W...*#################....W....W
W...W...##################....W....W
W...W..*......F.........F.........W....W
W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWW....W
W......................................W
W.....................*................W
W......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 2
    },
    {
        // Cave F: "Firefly Dens"
        name: "FIREFLY DENS",
        timeLimit: 150,
        diamondsRequired: 20,
        diamondValue: 10,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP*..*...*..*...*..*..................EW
W...WWWWWWW...WWWWWWW...WWWWWWW.......W
W...W..*..W...W..*..W...W..*..W.......W
W...W..F..W...W..F..W...W..F..W.......W
W..*W.....W..*W.....W..*W.....W.......W
W...WWWWWWW...WWWWWWW...WWWWWWW.......W
W....*.....*.....*.....*..............W
W......########################........W
W......########################........W
W.......*.....*.....*.....*...........W
W...WWWWWWW...WWWWWWW...WWWWWWW.......W
W..*W.....W..*W.....W..*W.....W.......W
W...W..F..W...W..F..W...W..F..W.......W
W...W..*..W...W..*..W...W..*..W.......W
W...WWWWWWW...WWWWWWW...WWWWWWW.......W
W......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 4
    },
    {
        // Cave G: "Amoeba"
        name: "AMOEBA",
        timeLimit: 200,
        diamondsRequired: 25,
        diamondValue: 5,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP*************************...........EW
W.......................................W
W.......................................W
W...........WWWWWWWWWWWWW..............W
W...........W...........W..............W
W...........W...........W..............W
W...........W...........W..............W
W...........W...........W..............W
W...........W...........W..............W
W...........W...........W..............W
W...........W...........W..............W
W...........WWWWWWWWWWWWW..............W
W.......................................W
W.......................................W
W.....##########################......W
W.....##########################......W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 5
    },
    {
        // Cave H: "Enchanted Wall" - Features magic walls that convert boulders to diamonds!
        name: "ENCHANTED WALL",
        timeLimit: 180,
        diamondsRequired: 22,
        diamondValue: 12,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP...#####....#####....#####..........EW
W....#####....#####....#####...........W
W......................................W
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMW
W......................................W
W..*........*.........*........*.......W
W......................................W
W...#####....#####....#####............W
W...#####....#####....#####............W
W......................................W
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMW
W......................................W
W...*........*.........*........*......W
W......................................W
W......................................W
W......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 2
    },
    {
        // Cave I: "Greed"
        name: "GREED",
        timeLimit: 100,
        diamondsRequired: 30,
        diamondValue: 6,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP******************************......EW
W.......................................W
W.......................................W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W...........#############..............W
W.......................................W
W.......................................W
W.......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 6
    },
    {
        // Cave J: "Tracks"
        name: "TRACKS",
        timeLimit: 180,
        diamondsRequired: 16,
        diamondValue: 15,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.....EW
W...W...W...W...W...W...W...W...W...W..W
W...W...W...W...W...W...W...W...W...W..W
W...W...W...W...W...W...W...W...W...W..W
W.......................................W
W.W...W...W...W...W...W...W...W...W...WW
W.W...W...W...W...W...W...W...W...W...WW
W.W...W...W...W...W...W...W...W...W...WW
W.......................................W
W...W...W...W...W...W...W...W...W...W..W
W...W...W...W...W...W...W...W...W...W..W
W...W...W...W...W...W...W...W...W...W..W
W.......................................W
W.W...W...W...W...W...W...W...W...W...WW
W.W...W...W...W...W...W...W...W...W...WW
W.W...W...W...W...W...W...W...W...W...WW
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 4
    },
    {
        // Cave K: "Crowd"
        name: "CROWD",
        timeLimit: 150,
        diamondsRequired: 24,
        diamondValue: 10,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP************************............EW
W.......................................W
W...WWWWWWWWW...........WWWWWWWWWW....W
W...W.......W.....F.....W.......W......W
W...W..###..W...........W..###..W......W
W...W..###..W.....F.....W..###..W......W
W...W.......W...........W.......W......W
W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....W
W.......................................W
W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....W
W...W.......W.....F.....W.......W......W
W...W..###..W...........W..###..W......W
W...W..###..W.....F.....W..###..W......W
W...W.......W...........W.......W......W
W...WWWWWWWWW...........WWWWWWWWWW....W
W.......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 5
    },
    {
        // Cave L: "Walls"
        name: "WALLS",
        timeLimit: 200,
        diamondsRequired: 20,
        diamondValue: 12,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP********************................EW
WWWWWWWWWWWW...........WWWWWWWWWWWWWW.W
W.......................................W
W.WWWWWWWWWWWWWW....WWWWWWWWWWWWWWWWW.W
W.......................................W
W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...W
W.......................................W
W.WWWWWWWWWWWWWW....WWWWWWWWWWWWWWWWW.W
W.......................................W
WWWWWWWWWWWW...........WWWWWWWWWWWWWW.W
W.......................................W
W.WWWWWWWWWWWWWW....WWWWWWWWWWWWWWWWW.W
W.......................................W
W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...W
W.......................................W
W.....##########################......W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 4
    },
    {
        // Cave M: "Apocalypse"
        name: "APOCALYPSE",
        timeLimit: 120,
        diamondsRequired: 28,
        diamondValue: 8,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP****************************........EW
W.......................................W
W..#################################..W
W..#################################..W
W..#################################..W
W.......................................W
W.......................................W
W.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..W
W.......................................W
W.......................................W
W..#################################..W
W..#################################..W
W..#################################..W
W.......................................W
W.......................................W
W.......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 8
    },
    {
        // Cave N: "Zigzag"
        name: "ZIGZAG",
        timeLimit: 180,
        diamondsRequired: 18,
        diamondValue: 14,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.EW
W...W...............................W..W
W.....W...........................W.....W
W.......W.......................W.......W
W.........W...................W.........W
W...........W...............W...........W
W.............W...........W.............W
W...............W.......W...............W
W.................W...W.................W
W...................W...................W
W.................W...W.................W
W...............W.......W...............W
W.............W...........W.............W
W...........W...............W...........W
W.........W...................W.........W
W.......W.......................W.......W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 3
    },
    {
        // Cave O: "Funnel"
        name: "FUNNEL",
        timeLimit: 150,
        diamondsRequired: 26,
        diamondValue: 9,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP**************************..........EW
W.......................................W
W#####################################W
W#####################################W
W.......................................W
W.......................................W
W.W.................................W...W
W...W.............................W.....W
W.....W.........................W.......W
W.......W.....................W.........W
W.........W.................W...........W
W...........W.............W.............W
W.............W.........W...............W
W...............W.....W.................W
W.................W.W...................W
W.......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 5
    },
    {
        // Cave P: "Vertigo"
        name: "VERTIGO",
        timeLimit: 200,
        diamondsRequired: 30,
        diamondValue: 10,
        pattern: `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
WP******************************......EW
W.......................................W
W.......................................W
W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W
W.......................................W
W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W
W.......................................W
W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W
W.......................................W
W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W
W.......................................W
W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W
W.......................................W
W.##################################..W
W.##################################..W
W.......................................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
        `,
        enemies: 6
    }
];

/**
 * Parse a pattern string into a grid
 * W = Wall, P = Player, E = Exit, * = Diamond, # = Boulder, F = Firefly (enemy), . = dirt (diggable), (space) = empty
 */
export function parsePattern(pattern, width, height) {
    const lines = pattern.trim().split('\n').map(line => line.trim());
    const grid = [];
    let playerPos = null;
    let exitPos = null;
    const enemies = [];
    const diamonds = [];
    
    for (let y = 0; y < Math.min(height, lines.length); y++) {
        const row = [];
        const line = lines[y] || '';
        
        for (let x = 0; x < width; x++) {
            const char = line[x] || '.';
            let cell = ELEMENT_TYPES.DIRT;
            
            switch (char) {
                case 'W':
                    cell = ELEMENT_TYPES.WALL;
                    break;
                case 'P':
                    cell = ELEMENT_TYPES.PLAYER;
                    playerPos = { x, y };
                    break;
                case 'E':
                    cell = ELEMENT_TYPES.EXIT;
                    exitPos = { x, y };
                    break;
                case '*':
                    cell = ELEMENT_TYPES.DIAMOND;
                    diamonds.push({ x, y });
                    break;
                case '#':
                    cell = ELEMENT_TYPES.BOULDER;
                    break;
                case 'F':
                    cell = ELEMENT_TYPES.ENEMY;
                    enemies.push({ x, y, direction: 'DOWN' });
                    break;
                case 'M':
                    cell = ELEMENT_TYPES.MAGIC_WALL;
                    break;
                case '.':
                    cell = ELEMENT_TYPES.DIRT;
                    break;
                case ' ':
                    cell = ELEMENT_TYPES.EMPTY;
                    break;
                default:
                    cell = ELEMENT_TYPES.DIRT;
                    break;
            }
            
            row.push(cell);
        }
        
        grid.push(row);
    }
    
    return { grid, playerPos, exitPos, enemies, diamonds };
}
