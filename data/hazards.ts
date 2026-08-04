import { HazardType, HazardTelegraph, Position, TileData, WorldType } from '../types';

/**
 * One environmental threat per sector, in the Into the Breach mould: the island's weather
 * is a second opponent you plan around. PvZ supplies the vocabulary — Frostbite Caves wind,
 * Jurassic lava, Wild West minecarts.
 *
 * The rule that matters: a hazard is ALWAYS telegraphed one full turn before it fires.
 * `planHazard` decides what will happen; `turnManager` resolves it at the start of the next
 * turn. The player sees the marked tiles in between and can move out — or move an enemy in.
 */

export const SECTOR_HAZARD: Record<WorldType, HazardType> = {
    GRASS: 'NONE',        // The teaching sector stays clean.
    ICE: 'WIND_GUST',     // Frostbite Caves: gusts shove everything one tile.
    VOLCANO: 'LAVA_FLOW', // Jurassic: fissures open and turn tiles to lava.
    DESERT: 'RAIL_SLIDE', // Wild West: runaway carts drag whatever stands on the track.
};

export const HAZARD_NAME: Record<HazardType, string> = {
    NONE: '',
    WIND_GUST: 'Wind Gust',
    LAVA_FLOW: 'Lava Flow',
    RAIL_SLIDE: 'Runaway Cart',
};

/** How often the hazard fires, in turns. Every turn would be noise, never would be forgettable. */
const HAZARD_PERIOD = 3;

const pickN = <T,>(items: T[], n: number): T[] => {
    const pool = [...items];
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
        out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
};

/**
 * Decide what the sector will do next turn. Returns null when nothing is queued, which is
 * the normal case on the off-beat turns and always in GRASS.
 */
export const planHazard = (
    world: WorldType,
    turn: number,
    board: TileData[]
): HazardTelegraph | null => {
    const type = SECTOR_HAZARD[world] ?? 'NONE';
    if (type === 'NONE') return null;
    // Fire on the turn *after* this one, so only plan on the right beat.
    if ((turn + 1) % HAZARD_PERIOD !== 0) return null;

    switch (type) {
        case 'WIND_GUST': {
            // Blows along the battle axis. Toward the houses is the cruel direction, so it
            // alternates — the player has to read which way before committing a position.
            const towardHouses = Math.random() < 0.5;
            const dy = towardHouses ? -1 : 1;
            return {
                type,
                dx: 0,
                dy,
                tiles: board.filter(t => !t.isHouse).map(t => ({ x: t.x, y: t.y })),
                description: towardHouses
                    ? 'Wind Gust: everything is blown one tile toward the houses.'
                    : 'Wind Gust: everything is blown one tile away from the houses.',
            };
        }

        case 'LAVA_FLOW': {
            // Only ordinary ground cracks — never a house, never an existing hazard tile.
            const candidates = board
                .filter(t => !t.isHouse && (t.terrain === 'GRASS' || t.terrain === 'SAND'))
                .map(t => ({ x: t.x, y: t.y }));
            const tiles = pickN(candidates, 3);
            if (tiles.length === 0) return null;
            return {
                type,
                tiles,
                description: 'Lava Flow: these tiles turn to lava.',
            };
        }

        case 'RAIL_SLIDE': {
            const tiles = board.filter(t => t.terrain === 'RAIL').map(t => ({ x: t.x, y: t.y }));
            if (tiles.length === 0) return null;
            return {
                type,
                dx: 0,
                dy: -1,
                tiles,
                description: 'Runaway Cart: anything on the track is dragged one tile toward the houses.',
            };
        }

        default:
            return null;
    }
};

export const hazardTargets = (hazard: HazardTelegraph | null): Position[] =>
    hazard ? hazard.tiles : [];
