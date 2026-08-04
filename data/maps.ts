import { TileData, TerrainType, WorldType } from '../types';

/**
 * Hand-authored battle maps.
 *
 * Into the Breach ships ~100 hand-drawn 8x8 maps rather than a generator: at that size
 * authoring is cheaper than building procedural systems, and it guarantees no map is
 * unfun to play. Randomness lives *inside* a chosen map (which zombies, which spawn tile),
 * never in the terrain itself.
 *
 * The previous generator rolled random water and mountains and then needed a repair pass
 * to fix the boards it had just broken — and it produced the unwinnable 8-house front.
 * Geometry is a design decision, so it is written down here.
 *
 * LEGEND (one character per tile, 8 rows of 8):
 *   H  house holding a brain — what the zombies are walking toward
 *   #  wall, impassable, used to carve choke points
 *   .  grass
 *   ~  water (blocks walkers, passable for AMPHIBIOUS/FLYING)
 *   ^  mountain
 *   =  bridge over a water lane
 *   T  minecart rail (Wild West)
 *   L  lava (walkable, but it burns whatever stands in it)
 *   *  power tile (+1 damage to whoever stands on it)
 *   D  grass, player deploy zone
 *   S  grass, zombie spawn zone
 *
 * Row index = x (screen row). Column index = y (screen column).
 * Player is on the left (low y), zombies march in from the right (high y).
 */

export interface MapTemplate {
    id: string;
    name: string;
    world: WorldType;
    /** One-line note on the tactical idea, so future maps stay distinct. */
    concept: string;
    rows: string[];
}

const CHAR_TO_TERRAIN: Record<string, TerrainType> = {
    'H': 'CONCRETE',
    '#': 'WALL',
    '.': 'GRASS',
    '~': 'WATER',
    '^': 'MOUNTAIN',
    'L': 'LAVA',
    '=': 'BRIDGE',
    'T': 'RAIL',
    '*': 'GRASS',
    'D': 'GRASS',
    'S': 'GRASS',
};

export const MAP_TEMPLATES: MapTemplate[] = [
    {
        id: 'front_lawn',
        name: 'Front Lawn',
        world: 'GRASS',
        concept: 'Teaching map. No terrain at all — just an uneven row of houses to learn the march on.',
        rows: [
            'H.DD....',
            'H.DD...S',
            '..DD..SS',
            '..DD...S',
            'H.DD..SS',
            '..DD...S',
            '..DD..SS',
            '.HDD...S',
        ],
    },
    {
        id: 'the_pinch',
        name: 'The Pinch',
        world: 'GRASS',
        concept: 'One wall bar cuts the left side in half. The top approach is short, the bottom is long.',
        rows: [
            '.HDD...S',
            '..DD..SS',
            'H.DD...S',
            '###...SS',
            '..DD...S',
            '..DD..SS',
            'H.DD...S',
            '..DD..SS',
        ],
    },
    {
        id: 'fen_crossing',
        name: 'Fen Crossing',
        world: 'GRASS',
        concept: 'A ragged marsh with two crossings at uneven heights — walkers must commit to one.',
        rows: [
            '..DD~...',
            '.HDD~..S',
            '..DD=.SS',
            '..D~~..S',
            'H..~~.SS',
            '..D.=..S',
            '..DD~.SS',
            'H.DD~..S',
        ],
    },
    {
        id: 'quarry',
        name: 'Quarry',
        world: 'VOLCANO',
        concept: 'Mountains in clumps, not a line. Sight lines break in patches, so lobs earn their keep.',
        rows: [
            '.HDD^...',
            '..DD^^.S',
            '..DD..SS',
            'H.DD.^.S',
            '..DD..SS',
            '.HDD^..S',
            '..DD^^SS',
            'H.DD...S',
        ],
    },
    {
        id: 'rail_yard',
        name: 'Rail Yard',
        world: 'DESERT',
        concept: 'Two track runs of different length plus a wall stub — the carts drag along uneven lines.',
        rows: [
            '..DDTTTS',
            '..DD...S',
            'H.DDTTSS',
            'H.DD...S',
            '..D#...S',
            '..D#..SS',
            '.HDDTTTS',
            '..DD...S',
        ],
    },
    {
        id: 'cul_de_sac',
        name: 'Cul-de-sac',
        world: 'GRASS',
        concept: 'Three houses crammed in one corner and one stranded far away — attention has to split.',
        rows: [
            'HHHDD..S',
            '..DD...S',
            '..DD..SS',
            '..DD...S',
            '..DD*.SS',
            '..DD...S',
            '..DD..SS',
            'H.DD...S',
        ],
    },
    {
        id: 'broken_fence',
        name: 'Broken Fence',
        world: 'GRASS',
        concept: 'A fence with two gaps at uneven heights. Everything has to funnel through one of them.',
        rows: [
            'H.D#...S',
            '..D#..SS',
            '..DD...S',
            '.HD#..SS',
            '..D#...S',
            '..DD..SS',
            'H.D#...S',
            '..D#..SS',
        ],
    },
    {
        id: 'sunken_road',
        name: 'Sunken Road',
        world: 'GRASS',
        concept: 'Water swallows both corners. Only two houses, and one dry road between them.',
        rows: [
            '~~DD...S',
            '~.DD..SS',
            'H.DD...S',
            '..DD..SS',
            '..DD...S',
            'H.DD..SS',
            '~.DD...S',
            '~~DD..SS',
        ],
    },
    {
        id: 'dust_bowl',
        name: 'Dust Bowl',
        world: 'DESERT',
        concept: 'Track runs slant across the open desert and the rocks pile up at the bottom.',
        rows: [
            '.HDD..TS',
            '..DD.TTS',
            '..DD.T.S',
            '..DDT..S',
            '.HDDT.SS',
            '..DD^..S',
            'H.DD^^SS',
            '..DD...S',
        ],
    },
    {
        id: 'canyon_run',
        name: 'Canyon Run',
        world: 'DESERT',
        concept: 'Two rock ridges squeeze the middle; the rails thread the gaps between them.',
        rows: [
            '..DD^^.S',
            'H.DD...S',
            '..DDTTSS',
            '..DD...S',
            '.HDD^^.S',
            '..DD...S',
            '..DDTTSS',
            'H.DD^..S',
        ],
    },
    {
        id: 'ash_fields',
        name: 'Ash Fields',
        world: 'VOLCANO',
        concept: 'Lava in scattered pools. Walkable, but standing in one costs blood every turn.',
        rows: [
            '..DD...S',
            '.HDDLL.S',
            '..DDL.SS',
            '..DD...S',
            'H.DD..SS',
            '..DD.LLS',
            '..DDLL.S',
            '.HDD..SS',
        ],
    },
    {
        id: 'caldera',
        name: 'Caldera',
        world: 'VOLCANO',
        concept: 'A rock ring around a lava basin. Going through it hurts; going around it takes turns.',
        rows: [
            '.HDD...S',
            '..DD^^.S',
            '..D^LL.S',
            '..D^LL^S',
            'H.D^LL.S',
            '..DD^^.S',
            '..DD..SS',
            '.HDD..SS',
        ],
    },
];

/** Thrown at module load if a map is malformed — better to fail loudly in dev than ship a broken board. */
const assertTemplate = (t: MapTemplate) => {
    if (t.rows.length !== 8) throw new Error(`Map ${t.id}: expected 8 rows, got ${t.rows.length}`);
    t.rows.forEach((row, x) => {
        if (row.length !== 8) throw new Error(`Map ${t.id} row ${x}: expected 8 chars, got ${row.length}`);
        [...row].forEach(ch => {
            if (!(ch in CHAR_TO_TERRAIN)) throw new Error(`Map ${t.id}: unknown tile '${ch}'`);
        });
    });
    const flat = t.rows.join('');
    if (!flat.includes('H')) throw new Error(`Map ${t.id}: no houses`);
    if (!flat.includes('D')) throw new Error(`Map ${t.id}: no deploy zone`);
    if (!flat.includes('S')) throw new Error(`Map ${t.id}: no spawn zone`);

    // Into the Breach's authoring rule: two buildings placed diagonally form a nook that a
    // unit can sit in and attack from, with almost no way to answer it. Orthogonally adjacent
    // houses are fine — it is specifically the diagonal that is unplayable.
    const houses: Array<[number, number]> = [];
    t.rows.forEach((row, x) => [...row].forEach((ch, y) => { if (ch === 'H') houses.push([x, y]); }));
    for (let i = 0; i < houses.length; i++) {
        for (let j = i + 1; j < houses.length; j++) {
            const [ax, ay] = houses[i];
            const [bx, by] = houses[j];
            if (Math.abs(ax - bx) === 1 && Math.abs(ay - by) === 1) {
                throw new Error(
                    `Map ${t.id}: houses at ${ax},${ay} and ${bx},${by} sit diagonally — that nook is indefensible.`
                );
            }
        }
    }
};

MAP_TEMPLATES.forEach(assertTemplate);

/** Turn a template into the board the game actually plays on. */
export const materializeTemplate = (t: MapTemplate): TileData[] => {
    const board: TileData[] = [];
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const ch = t.rows[x][y];
            board.push({
                x, y,
                terrain: CHAR_TO_TERRAIN[ch],
                environment: ch === '*' ? 'POWER_TILE' : 'NONE',
                isHouse: ch === 'H',
                hasBrain: ch === 'H' || undefined,
                isDeployZone: ch === 'D' || undefined,
                isSpawnZone: ch === 'S' || undefined,
            });
        }
    }
    return board;
};

export const pickTemplate = (world: WorldType = 'GRASS'): MapTemplate => {
    const pool = MAP_TEMPLATES.filter(t => t.world === world);
    const from = pool.length > 0 ? pool : MAP_TEMPLATES;
    return from[Math.floor(Math.random() * from.length)];
};
