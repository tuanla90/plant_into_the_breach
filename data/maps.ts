import { BossId, TileData, TerrainType, WorldType } from '../types';

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
 *   :  ice sheet
 *   c  concrete street
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
    /**
     * Set when this board exists only for one boss fight.
     *
     * A boss's mechanic is only a mechanic on the right ground — Ironcart needs rail to ride,
     * The Armada needs sea to fall into, Voltmaw needs a grid to conduct through. Rolling a
     * random board of the right sector gives you the boss without the fight it was designed
     * for. Arenas are held out of the ordinary pool for the same reason: a Voltmaw grid with
     * no Voltmaw on it is just a board with free damage lying around.
     */
    arenaFor?: BossId;
    /**
     * This board has no houses, and that is on purpose rather than an authoring slip.
     *
     * Exactly one map wants it: the Breach. There is nothing left to defend by then, and the
     * horde's fallback target — the nearest plant — is already in turnManager for the case
     * where every brain has been taken. So a house-less board costs the engine nothing and
     * changes the fight completely: no doorstep to hold, no brain to trade, nowhere to be
     * except in front of the thing.
     */
    noHouses?: boolean;
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
    ':': 'ICE',
    'c': 'CONCRETE',
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
    {
        id: 'tide_line',
        name: 'Tide Line',
        world: 'COAST',
        concept: 'A water lane splits the bay, crossed at two uneven heights — a shove is worth a kill on either side of it.',
        rows: [
            'H.DD~..S',
            '..DD~.SS',
            '..DD=..S',
            'H.DD~.SS',
            '..DD~..S',
            '..DD=.SS',
            'H.DD~..S',
            '..DD~.SS',
        ],
    },
    {
        id: 'broken_pier',
        name: 'Broken Pier',
        world: 'COAST',
        concept: 'The water breaks into pools instead of a lane — there is no corridor to hold, only single bodies to throw.',
        rows: [
            '.HDD.~.S',
            '..DD.~SS',
            '..DD=..S',
            '..DD.~.S',
            '.HDD.~SS',
            '..DD...S',
            '..DD~~SS',
            '.HDD~..S',
        ],
    },
    {
        id: 'the_causeway',
        name: 'The Causeway',
        world: 'COAST',
        concept: 'One strip of dry land crosses the bay, two tiles wide — everything on both sides has to walk it.',
        rows: [
            'H.DD~~.S',
            '..DD~~SS',
            '.HDD~~.S',
            '..DD...S',
            '..DD..SS',
            'H.DD~~.S',
            '..DD~~SS',
            '.HDD~~.S',
        ],
    },
    {
        id: 'lee_shore',
        name: 'Lee Shore',
        world: 'COAST',
        concept: 'The sea sits behind the houses. The only drowning shove is the one that sends them the way they wanted to go.',
        rows: [
            '~.DD...S',
            '~.DD..SS',
            '~HDD.~.S',
            '~.DD.~.S',
            '~.DD..SS',
            '~HDD...S',
            '~.DD..SS',
            '~HDD...S',
        ],
    },
    {
        id: 'estuary_mouth',
        name: 'Estuary Mouth',
        world: 'COAST',
        concept: 'A river mouth fans wide at the spawn and pinches to nothing inland — the sea is worth a whole kill on turn one and nothing on turn seven.',
        rows: [
            'H.DD..SS',
            '..DD..~S',
            '..DD.~~S',
            '.HDD~~~S',
            '..DD.~~S',
            'H.DD..~S',
            '..DD..SS',
            '.HDD..SS',
        ],
    },
    {
        id: 'spine_flats',
        name: 'Spine Flats',
        world: 'THORN',
        concept: 'Rock scattered evenly, no clump wider than two tiles — cover on one side always costs a way out on the other.',
        rows: [
            'H.DD..^S',
            '..DD.^SS',
            '..DD...S',
            '.HDD^..S',
            '..DD..SS',
            '..DD^^.S',
            'H.DD...S',
            '..DD.^SS',
        ],
    },
    {
        id: 'the_sinks',
        name: 'The Sinks',
        world: 'THORN',
        concept: 'Two heavy rock clumps top and bottom, nothing at all between them.',
        rows: [
            '.HDD...S',
            '..DD^..S',
            '..DD^.SS',
            'H.DD...S',
            '..DD.^^S',
            '..DD...S',
            '.HDD^..S',
            '..DD..SS',
        ],
    },
    {
        id: 'stone_pens',
        name: 'Stone Pens',
        world: 'THORN',
        concept: 'Rock alcoves with one mouth each — cover for everybody, and nobody left able to cover anybody.',
        rows: [
            'H.DD...S',
            '..DD^.^S',
            '..DD.^.S',
            'H.DD...S',
            '..DD.^.S',
            '..DD^.^S',
            'H.DD..^S',
            '..DD^.^S',
        ],
    },
    {
        id: 'leeward_shelf',
        name: 'Leeward Shelf',
        world: 'THORN',
        concept: 'The only rock sits a step from the spawn line — stand safe, or stand between the zombies and the brains.',
        rows: [
            '.HDD...S',
            '..DD..^S',
            'H.DD.^^S',
            '..DD...S',
            '..DD...S',
            'H.DD.^^S',
            '..DD..^S',
            '.HDD...S',
        ],
    },
    {
        id: 'lone_shade',
        name: 'Lone Shade',
        world: 'THORN',
        concept: 'One nook of rock in the whole waste, and it shades the top house only.',
        rows: [
            'H.DD.^.S',
            '..DD..^S',
            '..DD.^.S',
            'H.DD...S',
            '..DD...S',
            '.HDD...S',
            '..DD...S',
            'H.DD...S',
        ],
    },
    {
        id: 'glacier_steps',
        name: 'Glacier Steps',
        world: 'ICE',
        concept: 'Ice in offset steps, so one gust carries a body across two of them.',
        rows: [
            'H.DD::.S',
            '..DD:.SS',
            '..DD...S',
            '.HDD::.S',
            '..DD:.SS',
            '..DD...S',
            'H.DD::.S',
            '..DD..SS',
        ],
    },
    {
        id: 'frozen_lake',
        name: 'Frozen Lake',
        world: 'ICE',
        concept: 'Ice pressed up against open water — the gust that saves you from one is what feeds you to the other.',
        rows: [
            '.HDD:~.S',
            '..DD:~SS',
            '..DD::.S',
            'H.DD:~.S',
            '..DD:~SS',
            '..DD::.S',
            '.HDD:~.S',
            '..DD..SS',
        ],
    },
    {
        id: 'frost_teeth',
        name: 'Frost Teeth',
        world: 'ICE',
        concept: 'Rock teeth stud the ice at uneven heights — a gust that would move a body slams it into stone instead.',
        rows: [
            'H.DD:^.S',
            '..DD::SS',
            '..DD.^.S',
            '.HDD::.S',
            '..DD:^SS',
            '..DD::.S',
            'H.DD.^.S',
            '..DD::SS',
        ],
    },
    {
        id: 'serac_lanes',
        name: 'Serac Lanes',
        world: 'ICE',
        concept: 'Ice seracs cut the field into long lanes; the wind runs their length with nothing to stop it.',
        rows: [
            '.HDD::.S',
            '..DD::SS',
            '..DD###S',
            'H.DD::.S',
            '..DD::SS',
            '..DD###S',
            '.HDD::.S',
            '..DD::SS',
        ],
    },
    {
        id: 'doorstep',
        name: 'Doorstep',
        world: 'ICE',
        concept: 'Open ice runs straight to two doorsteps; the middle door has a rock against it, the others have only you.',
        rows: [
            'HcDD:::S',
            '.cDD::SS',
            '..DD:::S',
            'H^DD:::S',
            '.^DD::SS',
            '..DD:::S',
            'HcDD:::S',
            '.cDD::SS',
        ],
    },
    {
        id: 'neon_strip',
        name: 'Neon Strip',
        world: 'NEON',
        concept: 'Three short blocks make three alleys, and the crowd walks them in single file.',
        rows: [
            'H.DD.#.S',
            '..DD.#SS',
            '..DD...S',
            '.HDD.#.S',
            '..DD.#SS',
            '..DD...S',
            'H.DD.#.S',
            '..DD..SS',
        ],
    },
    {
        id: 'boulevard',
        name: 'Boulevard',
        world: 'NEON',
        concept: 'One concrete artery runs the length of the board with the blocks stacked behind it.',
        rows: [
            'H.DDc#.S',
            '..DDc#SS',
            '..DDc..S',
            '.HDDc#.S',
            '..DDc#SS',
            '..DDc..S',
            'H.DDc#.S',
            '..DDc.SS',
        ],
    },
    {
        id: 'marquee',
        name: 'Marquee',
        world: 'NEON',
        concept: 'Three lit signs sit on the artery itself: the tiles worth standing on are the tiles worth watching.',
        rows: [
            '.HDDc*.S',
            '..DDc#SS',
            '..DDc..S',
            'H.DDc*.S',
            '..DDc#SS',
            '..DDc..S',
            '.HDDc*.S',
            '..DDc.SS',
        ],
    },
    {
        id: 'city_block',
        name: 'City Block',
        world: 'NEON',
        concept: 'Two intact blocks with a ring street around them — every way in runs through one of four lit mouths.',
        rows: [
            'H.DDc#cS',
            '..DDc#cS',
            '..DD*c*S',
            '.HDD#c#S',
            '..DD#c#S',
            '..DD*c*S',
            'H.DDc#cS',
            '..DDc#cS',
        ],
    },
    {
        id: 'rose_plaza',
        name: 'Rose Plaza',
        world: 'NEON',
        concept: 'A walled square where the crowd collects, and two clean streets down the edges where it does not.',
        rows: [
            'H.DDcccS',
            '..DD###S',
            '..DDc*cS',
            '.HDD..cS',
            '..DDc..S',
            'H.DDc*cS',
            '..DD###S',
            'H.DDcccS',
        ],
    },
    {
        id: 'colonnade',
        name: 'The Colonnade',
        world: 'NEON',
        concept: 'One pillar per row, evenly spaced — nothing is ever closed off, and no line ever runs the whole way.',
        rows: [
            'H.DD#ccS',
            '..DD*#cS',
            '.HDDcc#S',
            '..DD#c*S',
            'H.DDc#cS',
            '..DD*c#S',
            '.HDD#ccS',
            '..DDc#*S',
        ],
    },
    {
        id: 'collapsed_row',
        name: 'Collapsed Row',
        world: 'RUIN',
        concept: 'What is left of a terrace: every second house is rubble, and the gaps do not line up.',
        rows: [
            'H.DD#c.S',
            '..DDc.SS',
            '..DD#c.S',
            '.HDDc..S',
            '..DD#c.S',
            '..DDc.SS',
            'H.DD#c.S',
            '..DDc..S',
        ],
    },
    {
        id: 'ash_yard',
        name: 'Ash Yard',
        world: 'RUIN',
        concept: 'Two heavy falls of masonry with an open yard between them — the only place to fight is the only place the roof still comes down.',
        rows: [
            '.HDDc..S',
            '..DD##.S',
            '..DDc.SS',
            'H.DDc..S',
            '..DD##.S',
            '..DDc.SS',
            '.HDDc..S',
            '..DDc.SS',
        ],
    },
    {
        id: 'fault_line',
        name: 'Fault Line',
        world: 'RUIN',
        concept: 'A rubble seam slants down the board with breaks at uneven heights — no two approaches cross at the same place.',
        rows: [
            '.HDDc.#S',
            '..DDc.#S',
            '..DD.c.S',
            'H.DD.#cS',
            '..DD.#.S',
            '..DDc..S',
            'H.DD#c.S',
            '..DDc.SS',
        ],
    },
    {
        id: 'stagger',
        name: 'The Stagger',
        world: 'RUIN',
        concept: 'The rubble piles up against the spawn side in offset clumps, so the march arrives in ragged waves instead of one line.',
        rows: [
            '..DDc#.S',
            '.HDD..#S',
            '..DDc#.S',
            '..DD..cS',
            'H.DD.c.S',
            '..DDc.#S',
            '..DD.#.S',
            '.HDDc..S',
        ],
    },
    {
        id: 'last_tenement',
        name: 'Last Tenement',
        world: 'RUIN',
        concept: 'One house still standing out in the debris field, rubble on its shoulder — the first thing the march walks into.',
        rows: [
            '..DDc.SS',
            '.HDD.#.S',
            '..DD#c.S',
            '..DDH..S',
            '..DD.c#S',
            'H.DD#..S',
            '..DDc.#S',
            '.HDD.c.S',
        ],
    },
    {
        id: 'substation',
        name: 'Substation',
        world: 'GRID',
        concept: 'Live tiles scattered so none touches another: the reward is real, and it moves every few turns.',
        rows: [
            'H.DD*..S',
            '..DD..SS',
            '..DD*..S',
            '.HDD..*S',
            '..DD...S',
            '..DD*.SS',
            'H.DD...S',
            '..DD*.SS',
        ],
    },
    {
        id: 'live_rails',
        name: 'Live Rails',
        world: 'GRID',
        concept: 'Two unbroken columns of live tile, and a pylon in the middle forcing a choice between them.',
        rows: [
            '.HDD.*.S',
            '..DD.*SS',
            '..DD.*.S',
            'H.DD#..S',
            '..DD#.SS',
            '..DD.*.S',
            '.HDD.*.S',
            '..DD.*SS',
        ],
    },
    {
        id: 'meter_row',
        name: 'Meter Row',
        world: 'GRID',
        concept: 'One live tile on every doorstep — the best firing line on the board is the one square the grid never lets go of.',
        rows: [
            'H*DD...S',
            '..DD.#SS',
            '..DD...S',
            'H*DD..SS',
            '..DD.#.S',
            '..DD..SS',
            'H*DD...S',
            '..DD.#SS',
        ],
    },
    {
        id: 'stepdown',
        name: 'Stepdown',
        world: 'GRID',
        concept: 'Two staircases of live tiles. No two touch — but every square beside a step is wired to two of them.',
        rows: [
            'H.DD*..S',
            '..DD.*.S',
            '.HDD..*S',
            '..DD..SS',
            '..DD..*S',
            'H.DD.*.S',
            '..DD*..S',
            '.HDD..SS',
        ],
    },
    {
        id: 'ring_main',
        name: 'Ring Main',
        world: 'GRID',
        concept: 'A closed ring of live tiles around one dry square — the quietest tile on the board is wired on all four sides.',
        rows: [
            '.HDD...S',
            '..DD.#SS',
            'H.DD***S',
            '..DD*.*S',
            '..DD***S',
            'H.DD..SS',
            '..DD.#.S',
            '.HDD..SS',
        ],
    },
    // --- ADDITIONAL WORLD MAP TEMPLATES WITH VARIED HOUSE POSITIONS ---
    {
        id: 'garden_maze',
        name: 'Garden Maze',
        world: 'GRASS',
        concept: 'Zigzag wall hedges with houses tucked deep inside protective inner pockets.',
        rows: [
            '..DD...S',
            '.HD###.S',
            '..DD...S',
            '.HD###.S',
            '..DD...S',
            '..D###.S',
            'H.DD...S',
            'H.DD...S',
        ],
    },
    {
        id: 'lawn_divide',
        name: 'Lawn Divide',
        world: 'GRASS',
        concept: 'Houses are split across both sides of a central brook; one house sits on a forward river island.',
        rows: [
            'H.DD~..S',
            'H.DD=..S',
            '..HD~.SS',
            '..DD~..S',
            'H.DD=.SS',
            '...D~..S',
            '..DD~.SS',
            '..DD~..S',
        ],
    },
    {
        id: 'junction_box',
        name: 'Junction Box',
        world: 'DESERT',
        concept: 'A forward telegraph house sits right between two cart tracks, requiring active protection.',
        rows: [
            'H.DDTTTS',
            '...D.T.S',
            'H.DDTTTS',
            '..DD.T.S',
            '..HDTTTS',
            '..DD.T.S',
            '.HDDTTTS',
            '..DD...S',
        ],
    },
    {
        id: 'canyon_rails',
        name: 'Canyon Rails',
        world: 'DESERT',
        concept: 'Houses are staggered diagonally behind mountain ridges and cart funnel lanes.',
        rows: [
            '^^DD...S',
            'H.DDTTTS',
            '..DDTTTS',
            '^^HD...S',
            '^^DD...S',
            'H.DDTTTS',
            '..DDTTTS',
            '^^HD...S',
        ],
    },
    {
        id: 'magma_chasm',
        name: 'Magma Chasm',
        world: 'VOLCANO',
        concept: 'One house is an isolated lava research outpost sitting in the middle of the magma chasm.',
        rows: [
            'H.DDL..S',
            'H.DD=..S',
            '..HDL.SS',
            '..DDL..S',
            'H.DD=.SS',
            '...DL..S',
            '..DDL.SS',
            '..DDL..S',
        ],
    },
    {
        id: 'basalt_peaks',
        name: 'Basalt Peaks',
        world: 'VOLCANO',
        concept: 'Houses cluster behind basalt peak barriers, with one forward house on a power tile lane.',
        rows: [
            '^.DD...S',
            'H.DD^^.S',
            '..DD*.SS',
            '..HD^^.S',
            '..DD...S',
            'H.DD^^.S',
            'H.DD...S',
            '^.DD...S',
        ],
    },
    {
        id: 'tidal_spit',
        name: 'Tidal Spit',
        world: 'COAST',
        concept: 'Houses are arrayed along a narrow coastal ridge; high tide threatens the outer flank.',
        rows: [
            '~~DD~~~S',
            'H.DD...S',
            'H.DD~.SS',
            '..HD...S',
            '..DD...S',
            'H.DD~.SS',
            '..DD...S',
            '~~DD~~~S',
        ],
    },
    {
        id: 'broken_dike',
        name: 'Broken Dike',
        world: 'COAST',
        concept: 'Houses sit behind concrete seawalls with a forward lighthouse house on the pier.',
        rows: [
            'c.DDcc.S',
            'H.DD~~.S',
            '..DD~~SS',
            'c.HDcc.S',
            '..DD~~.S',
            'H.DD~~SS',
            'c.DDcc.S',
            '..HD...S',
        ],
    },
    {
        id: 'bramble_maze',
        name: 'Bramble Maze',
        world: 'THORN',
        concept: 'Houses are scattered deep in thorny mountain alcoves.',
        rows: [
            'H.DD^..S',
            '..DD..SS',
            '..HD^..S',
            '..DD..SS',
            'H.DD^..S',
            '...D..SS',
            'H.DD^..S',
            '..DD...S',
        ],
    },
    {
        id: 'ice_crevasse',
        name: 'Ice Crevasse',
        world: 'ICE',
        concept: 'A forward ice station sits right at the edge of slippery ice sheets and chasms.',
        rows: [
            '^:DD::.S',
            'H.DD::SS',
            '.:HD::.S',
            '^:DD::.S',
            'H.DD::SS',
            '.:HD::.S',
            '^:DD::.S',
            '..DD...S',
        ],
    },
    {
        id: 'frost_bridge',
        name: 'Frost Bridge',
        world: 'ICE',
        concept: 'Houses sit on opposite sides of a frozen river channel.',
        rows: [
            '~~DD~~~S',
            'H.DD:::S',
            '..DD=..S',
            '..HD~~~S',
            '..DD:::S',
            'H.DD=..S',
            '..DD~~~S',
            '.HDD...S',
        ],
    },
    {
        id: 'neon_alley',
        name: 'Neon Alley',
        world: 'NEON',
        concept: 'Stores and apartments (houses) are staggered along both sides of a narrow neon street.',
        rows: [
            'c.DD...S',
            'H.DD#..S',
            '..DD#..S',
            'c.HD...S',
            '..DD#..S',
            'H.DD#..S',
            'c.DD...S',
            '.HDD...S',
        ],
    },
    {
        id: 'collapsed_tunnel',
        name: 'Collapsed Tunnel',
        world: 'RUIN',
        concept: 'One house is trapped inside a collapsed rubble pocket.',
        rows: [
            '#.DD...S',
            'H.DD###S',
            '..HD###S',
            '#.DD###S',
            'H.DD...S',
            '..HD###S',
            '#.DD...S',
            '..DD...S',
        ],
    },
    {
        id: 'capacitor_row',
        name: 'Capacitor Row',
        world: 'GRID',
        concept: 'Houses sit staggered between high-voltage power lines.',
        rows: [
            'H.DD***S',
            '..DD...S',
            '..HD***S',
            '..DD...S',
            'H.DD***S',
            '..DD...S',
            '..HD***S',
            '..DD...S',
        ],
    },
    {
        id: 'arena_gargantuar',
        name: 'Verdant Reach',
        world: 'GRASS',
        arenaFor: 'GARGANTUAR',
        concept: 'Bare ground. Nothing to hide behind and nothing to hide it behind — only the damage.',
        rows: [
            'H.DD...S',
            '..DD...S',
            '..DD..SS',
            '.HDD...S',
            '..DD...S',
            '..DD..SS',
            'H.DD...S',
            '..DD...S',
        ],
    },
    {
        id: 'arena_ironcart',
        name: 'Goldacre Yard',
        world: 'DESERT',
        arenaFor: 'CATAPULT_LORD',
        concept: 'Three rail runs cross the whole board: it can be anywhere it likes, and you cannot.',
        // The runs reach back to the deploy columns on purpose. As three-tile stubs out in the
        // spawn half they were unreachable scenery: a cart with move 3 never spent a full turn
        // on them, "reverse down the line" had nowhere to reverse to, and cutting the track
        // cost the player nothing because they could not stand on it. Now blocking a rail is a
        // real decision about position. The runs still stop short of the house column, so the
        // cart can never ride up to a doorstep.
        rows: [
            'H.TTTTTS',
            '..DD...S',
            '..DD..SS',
            '.HTTTTTS',
            '..DD...S',
            '..DD..SS',
            'H.TTTTTS',
            '..DD...S',
        ],
    },
    {
        id: 'arena_cinder',
        name: 'Kiln Row',
        world: 'VOLCANO',
        arenaFor: 'CINDER_COLOSSUS',
        concept: 'Lava already pooled in the gaps — it only has to join them up.',
        rows: [
            'H.DD.L.S',
            '..DDL..S',
            '..DD..SS',
            '.HDD.L.S',
            '..DDL..S',
            '..DD..SS',
            'H.DD.L.S',
            '..DD...S',
        ],
    },
    {
        id: 'arena_armada',
        name: 'Windward Sound',
        world: 'COAST',
        arenaFor: 'BALLOON_ARMADA',
        concept: 'Sea down both flanks — where the wreck goes once you have shot it down.',
        rows: [
            'H.DD~~.S',
            '..DD~..S',
            '..DD..SS',
            '.HDD~~.S',
            '..DD~..S',
            '..DD..SS',
            'H.DD~~.S',
            '..DD...S',
        ],
    },
    {
        id: 'arena_sandreaver',
        name: 'Thornwaste Basin',
        world: 'THORN',
        arenaFor: 'SANDREAVER',
        concept: 'Three slabs of rock, and three heroes. The arithmetic is the fight.',
        rows: [
            'H.DD^..S',
            '..DD...S',
            '..DD.^SS',
            '.HDD...S',
            '..DD^..S',
            '..DD..SS',
            'H.DD.^.S',
            '..DD...S',
        ],
    },
    {
        id: 'arena_yeti',
        name: 'Frostgate',
        world: 'ICE',
        arenaFor: 'YETI',
        concept: 'Ice wall to wall: there is no tile that does not slide.',
        rows: [
            'H.DD::.S',
            '..DD::.S',
            '..DD::SS',
            '.HDD::.S',
            '..DD::.S',
            '..DD::SS',
            'H.DD::.S',
            '..DD::.S',
        ],
    },
    {
        id: 'arena_headliner',
        name: 'Neon Rose',
        world: 'NEON',
        arenaFor: 'DISCO_ZOMBOSS',
        concept: 'A boulevard with two solid columns of spawn either side — the crowd is the boss.',
        rows: [
            'H.DDc.SS',
            '..DDc.SS',
            '..DD*.SS',
            '.HDDc.SS',
            '..DDc.SS',
            '..DD*.SS',
            'H.DDc.SS',
            '..DDc.SS',
        ],
    },
    {
        id: 'arena_clockjaw',
        name: 'Old Quarter',
        world: 'RUIN',
        arenaFor: 'CLOCKJAW',
        concept: 'Rubble alleys, already tight before the roof starts coming down.',
        rows: [
            'H.DD#c.S',
            '..DDc..S',
            '..DD#cSS',
            '.HDDc..S',
            '..DD#c.S',
            '..DDc..S',
            'H.DD#cSS',
            '..DDc..S',
        ],
    },
    {
        id: 'arena_voltmaw',
        name: 'The Grid',
        world: 'GRID',
        arenaFor: 'VOLTMAW',
        concept: 'Four pairs of live tile — the board is its circuit, and standing together completes it.',
        rows: [
            'H.DD*.*S',
            '..DD...S',
            '..DD*.*S',
            '.HDD...S',
            '..DD*.*S',
            '..DD...S',
            'H.DD*.*S',
            '..DD...S',
        ],
    },
    {
        id: 'arena_breach',
        name: 'The Breach',
        world: 'RUIN',
        arenaFor: 'BLIGHTLORD',
        noHouses: true,
        concept: 'A walled 6x6 pit with nothing to defend — the only board where the squad is the objective.',
        /**
         * The ring of WALL is the board. Eight columns of authored rows are what every other
         * map in this file is, and GRID_SIZE is 8 everywhere in the engine — so the 6x6 the
         * final act was designed on is drawn rather than declared, and the outer ring is
         * simply not playable. Every rule that reads the board (pathing, pushes, hazards,
         * spawn holes) already refuses a WALL tile, so nothing had to learn a second size.
         *
         * No houses. Two rubble pillars in the middle so the pit is not a bare square, and
         * they are the only cover in the last fight in the game.
         */
        rows: [
            '########',
            '#DD..cS#',
            '#DD.#.S#',
            '#DD..cS#',
            '#DDc..S#',
            '#DD.#.S#',
            '#DD..cS#',
            '########',
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
    if (!flat.includes('H') && !t.noHouses) throw new Error(`Map ${t.id}: no houses`);
    if (t.noHouses && flat.includes('H')) throw new Error(`Map ${t.id}: noHouses is set but the rows draw one`);
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

/** Ordinary battles never roll a boss arena. */
const ORDINARY = MAP_TEMPLATES.filter(t => !t.arenaFor);

export const pickTemplate = (world: WorldType = 'GRASS'): MapTemplate => {
    const pool = ORDINARY.filter(t => t.world === world);
    const from = pool.length > 0 ? pool : ORDINARY;
    return from[Math.floor(Math.random() * from.length)];
};

/**
 * The board a named boss is fought on. Falls back to the sector's ordinary pool for a boss
 * that has no arena authored yet, so adding a BossId never breaks a run — it just means that
 * fight happens somewhere generic until its ground is drawn.
 */
export const pickArena = (boss: BossId | undefined, world: WorldType = 'GRASS'): MapTemplate => {
    const arena = boss ? MAP_TEMPLATES.find(t => t.arenaFor === boss) : undefined;
    return arena ?? pickTemplate(world);
};
