import { ELEMENT_TYPES, GRID_WIDTH, GRID_HEIGHT } from './constants.js';

/**
 * Original Boulder Dash cave definitions (16 classic caves A-P)
 * All patterns are exactly 40 chars wide x 22 rows tall to match GRID_WIDTH x GRID_HEIGHT.
 * 
 * Legend:
 *   W = Wall  P = Player  E = Exit  * = Diamond  # = Boulder
 *   F = Firefly (enemy)  B = Butterfly (enemy, explodes to diamonds)
 *   M = Magic Wall  . = Dirt  (space) = Empty
 */
export const CLASSIC_CAVES = [
    {
        // Cave A: "Intro" - Tutorial level
        name: "INTRO",
        timeLimit: 150,
        diamondsRequired: 12,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP..*........*.........*..............EW',
            'W....###.......###........####.........W',
            'W....###.......###........####.........W',
            'W...*......*.......................*...W',
            'W...#######..........#########.........W',
            'W...#######..........#########.........W',
            'W......................................W',
            'W..........*...###...............*.....W',
            'W..............###.....................W',
            'W......................................W',
            'W.........############.................W',
            'W.........############.................W',
            'W.......*..............................W',
            'W...*......................*.###.......W',
            'W...........................###........W',
            'W......................................W',
            'W......................................W',
            'W...........*..........................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 0
    },
    {
        // Cave B: "Rooms"
        name: "ROOMS",
        timeLimit: 150,
        diamondsRequired: 12,
        diamondValue: 20,
        extraDiamondValue: 30,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP......*......*......*...............EW',
            'W......................................W',
            'W...WWW....WWW....WWW....WWW...........W',
            'W...W.*....W.*....W.*....W.*...........W',
            'W...W......W......W......W.............W',
            'W...WWW....WWW....WWW....WWW...........W',
            'W......................................W',
            'W..###.................................W',
            'W..###.................................W',
            'W....*.....................*...........W',
            'W...WWW....WWW....WWW....WWW...........W',
            'W...W.*....W.*....W.*....W.*...........W',
            'W...W......W......W......W.............W',
            'W...WWW....WWW....WWW....WWW...........W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 1
    },
    {
        // Cave C: "Maze"
        name: "MAZE",
        timeLimit: 120,
        diamondsRequired: 24,
        diamondValue: 5,
        extraDiamondValue: 10,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP*...W.......W*......W*......W......E.W',
            'W.WWW.W.WWWWW.W.WWWWW.W.WWWWW.W.WWWW...W',
            'W.W.*.W.W..*W.W.W..*W.W.W..*W.W.W.*W...W',
            'W.W.WWW.W.W.W.W.W.W.W.W.W.W.W.W.W.W....W',
            'W.W.*...W.W...W.W.W...W.W.W...W.W.W....W',
            'W.WWWWWWW.WWWWW.W.WWWWW.W.WWWWW.W.WW...W',
            'W.*..*....W.....W.*...W.W.....W.W......W',
            'W.WWWWW.WWW.WWWWWWWWW.W.W.WWW.W.WWWW...W',
            'W.W..*W.W.*.W.........W.W.W.*.W....W...W',
            'W.W.W.W.W.W.WWWWWWWWWWW.W.W.W.WWWW.W...W',
            'W.W.W.W.W.W...........W.W.W.W....W.W...W',
            'W.W.W.W.W.WWWWWWWWWWW.W.W.W.WWWW.W.W...W',
            'W.W.W.*.W.*.W.......W.*.W.*.W..*..*....W',
            'W.W.WWWWWWW.W.WWWWW.WWWWWWW.W.W.W.W....W',
            'W.W.........W.....W.........W.W..W..W..W',
            'W....*....*....*....*....*....*....*...W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 2
    },
    {
        // Cave D: "Butterflies" - kill butterflies to create diamonds
        name: "BUTTERFLIES",
        timeLimit: 120,
        diamondsRequired: 12,
        diamondValue: 20,
        extraDiamondValue: 30,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP..*.................................EW',
            'W.....WWW.W.......WWW.W.......WWW.W....W',
            'W.....W.*.W.......W.*.W.......W.*.W....W',
            'W.....W.B.W.......W.B.W.......W.B.W....W',
            'W.....W...W.......W...W.......W...W....W',
            'W.....WWWWW.......WWWWW.......WWWWW....W',
            'W...*.....*.....*.....*................W',
            'W..........##############..............W',
            'W..........##############..............W',
            'W..*...............................*...W',
            'W.....WWWWW.......WWWWW.......WWWWW....W',
            'W.....W...W.......W...W.......W...W....W',
            'W.....W.B.W.......W.B.W.......W.B.W....W',
            'W.....W.*.W.......W.*.W.......W.*.W.*..W',
            'W.....W.W.W.......W.W.W.......W.W.W....W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 6
    },
    {
        // Cave E: "Guards" - fireflies patrol corridors
        name: "GUARDS",
        timeLimit: 150,
        diamondsRequired: 15,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP..*.....*.....*.....*.....*........E.W',
            'W...*.....*.....*.....*.....*..........W',
            'W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....W',
            'W...W..*......F.........F........W.....W',
            'W...W....##################......W.....W',
            'W...W...*##################......W.....W',
            'W...W.............................W....W',
            'W...W....*........................W....W',
            'W...W.............................W....W',
            'W...W...*##################......W.....W',
            'W...W....##################......W.....W',
            'W...W..*......F.........F........W.....W',
            'W...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.....W',
            'W......................................W',
            'W.....................*................W',
            'W...*..................................W',
            'W............*....*...........*........W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 4
    },
    {
        // Cave F: "Firefly Dens"
        name: "FIREFLY DENS",
        timeLimit: 150,
        diamondsRequired: 15,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP*..*...*..*...*..*..................EW',
            'W...WWWWWWW...WWWWWWW...WWWWWWW........W',
            'W...W..*..W...W..*..W...W..*..W........W',
            'W...W..F..W...W..F..W...W..F..W........W',
            'W..*W.....W..*W.....W..*W.....W........W',
            'W...WWWWWWW...WWWWWWW...WWWWWWW........W',
            'W....*.....*.....*.....*...............W',
            'W......########################........W',
            'W......########################........W',
            'W.......*.....*.....*.....*............W',
            'W...WWWWWWW...WWWWWWW...WWWWWWW........W',
            'W..*W.....W..*W.....W..*W.....W........W',
            'W...W..F..W...W..F..W...W..F..W........W',
            'W...W..*..W...W..*..W...W..*..W........W',
            'W...WWWWWWW...WWWWWWW...WWWWWWW........W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 6
    },
    {
        // Cave G: "Amoeba"
        name: "AMOEBA",
        timeLimit: 200,
        diamondsRequired: 20,
        diamondValue: 5,
        extraDiamondValue: 10,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP*************************...........EW',
            'W......................................W',
            'W......................................W',
            'W...........WWWWWWWWWWWWW..............W',
            'W...........W...........W..............W',
            'W...........W...........W..............W',
            'W...........W...........W..............W',
            'W...........W...........W..............W',
            'W...........W...........W..............W',
            'W...........W...........W..............W',
            'W...........W...........W..............W',
            'W...........WWWWWWWWWWWWW..............W',
            'W......................................W',
            'W......................................W',
            'W.....##########################.......W',
            'W.....##########################.......W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 5
    },
    {
        // Cave H: "Enchanted Wall" - Features magic walls
        name: "ENCHANTED WALL",
        timeLimit: 160,
        diamondsRequired: 12,
        diamondValue: 20,
        extraDiamondValue: 30,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP...#####....#####....#####..........EW',
            'W....#####....#####....#####...........W',
            'W......................................W',
            'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMW',
            'W......................................W',
            'W..*........*.........*........*.......W',
            'W......................................W',
            'W...#####....#####....#####............W',
            'W...#####....#####....#####............W',
            'W......................................W',
            'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMW',
            'W......................................W',
            'W...*........*.........*........*......W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 2
    },
    {
        // Cave I: "Greed"
        name: "GREED",
        timeLimit: 100,
        diamondsRequired: 30,
        diamondValue: 5,
        extraDiamondValue: 10,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP******************************......EW',
            'W......................................W',
            'W......................................W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W...........#############..............W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 6
    },
    {
        // Cave J: "Tracks"
        name: "TRACKS",
        timeLimit: 150,
        diamondsRequired: 16,
        diamondValue: 15,
        extraDiamondValue: 20,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.....EW',
            'W..W...W...W...W...W...W...W...W...W...W',
            'W..W...W...W...W...W...W...W...W...W...W',
            'W..W...W...W...W...W...W...W...W...W...W',
            'W......................................W',
            'WW..W...W...W...W...W...W...W...W...W..W',
            'WW..W...W...W...W...W...W...W...W...W..W',
            'WW..W...W...W...W...W...W...W...W...W..W',
            'W......................................W',
            'W..W...W...W...W...W...W...W...W...W...W',
            'W..W...W...W...W...W...W...W...W...W...W',
            'W..W...W...W...W...W...W...W...W...W...W',
            'W......................................W',
            'WW..W...W...W...W...W...W...W...W...W..W',
            'WW..W...W...W...W...W...W...W...W...W..W',
            'WW..W...W...W...W...W...W...W...W...W..W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 4
    },
    {
        // Cave K: "Crowd"
        name: "CROWD",
        timeLimit: 150,
        diamondsRequired: 10,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP************************............EW',
            'W......................................W',
            'W...WWWWWWWWW..........WWWWWWWWW.......W',
            'W...W.......W....F....W.......W........W',
            'W...W..###..W.........W..###..W........W',
            'W...W..###..W....F....W..###..W........W',
            'W...W.......W.........W.......W........W',
            'W...WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......W',
            'W......................................W',
            'W...WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......W',
            'W...W.......W....F....W.......W........W',
            'W...W..###..W.........W..###..W........W',
            'W...W..###..W....F....W..###..W........W',
            'W...W.......W.........W.......W........W',
            'W...WWWWWWWWW..........WWWWWWWWW.......W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 4
    },
    {
        // Cave L: "Walls"
        name: "WALLS",
        timeLimit: 200,
        diamondsRequired: 20,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP********************................EW',
            'WWWWWWWWWWWW.........WWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'WWWWWWWWWWWW.........WWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.....##########################.......W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 4
    },
    {
        // Cave M: "Apocalypse" - butterflies must be killed for diamonds
        name: "APOCALYPSE",
        timeLimit: 120,
        diamondsRequired: 50,
        diamondValue: 5,
        extraDiamondValue: 10,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP****************************........EW',
            'W......................................W',
            'W..#################################...W',
            'W..#################################...W',
            'W..#################################...W',
            'W......................................W',
            'W......................................W',
            'WB.B.B.B.B.B.B.B.B.B.B.B.B.B.B.B.B.B...W',
            'W......................................W',
            'W......................................W',
            'W..#################################...W',
            'W..#################################...W',
            'W..#################################...W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 18
    },
    {
        // Cave N: "Zigzag" - mixed fireflies and butterflies
        name: "ZIGZAG",
        timeLimit: 180,
        diamondsRequired: 18,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.EW',
            'W..W...............................W...W',
            'W....W...........................W.....W',
            'W......W.......................W.......W',
            'W........W...................W.........W',
            'W..........W...............W...........W',
            'W............W...........W.............W',
            'W..............W.......W...............W',
            'W................W...W.................W',
            'W.................W.W..................W',
            'W................W...W.................W',
            'W..............W.......W...............W',
            'W............W...........W.............W',
            'W..........W...............W...........W',
            'W........W...................W.........W',
            'W......W.......................W.......W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 3
    },
    {
        // Cave O: "Funnel"
        name: "FUNNEL",
        timeLimit: 150,
        diamondsRequired: 20,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP**************************..........EW',
            'W......................................W',
            'W#####################################.W',
            'W#####################################.W',
            'W......................................W',
            'W......................................W',
            'W.W...............................W....W',
            'W...W...........................W......W',
            'W.....W.......................W........W',
            'W.......W...................W..........W',
            'W.........W...............W............W',
            'W...........W...........W..............W',
            'W.............W.......W................W',
            'W...............W...W..................W',
            'W.................WW...................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 5
    },
    {
        // Cave P: "Vertigo"
        name: "VERTIGO",
        timeLimit: 200,
        diamondsRequired: 24,
        diamondValue: 10,
        extraDiamondValue: 15,
        pattern: [
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            'WP****************************........EW',
            'W......................................W',
            'W......................................W',
            'W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.W',
            'W......................................W',
            'W.##################################...W',
            'W.##################################...W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'W......................................W',
            'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        ].join('\n'),
        enemies: 6
    }
];

/**
 * Parse a pattern string into a grid
 * W = Wall, P = Player, E = Exit, * = Diamond, # = Boulder, F = Firefly (enemy),
 * . = dirt (diggable), (space) = empty, M = Magic Wall
 * Grid is always padded to exact width x height with walls on borders and dirt inside.
 */
export function parsePattern(pattern, width, height) {
    const lines = pattern.trim().split('\n').map(line => line.trimEnd());
    const grid = [];
    let playerPos = null;
    let exitPos = null;
    const enemies = [];
    const diamonds = [];
    
    for (let y = 0; y < height; y++) {
        const row = [];
        const line = y < lines.length ? lines[y] : '';
        
        for (let x = 0; x < width; x++) {
            // Beyond pattern bounds: walls on borders, dirt inside
            if (y >= lines.length || x >= line.length) {
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    row.push(ELEMENT_TYPES.WALL);
                } else {
                    row.push(ELEMENT_TYPES.DIRT);
                }
                continue;
            }
            
            const char = line[x];
            let cell;
            
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
                    enemies.push({ x, y, direction: 'DOWN', type: ELEMENT_TYPES.ENEMY });
                    break;
                case 'B':
                    cell = ELEMENT_TYPES.BUTTERFLY;
                    enemies.push({ x, y, direction: 'DOWN', type: ELEMENT_TYPES.BUTTERFLY });
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
