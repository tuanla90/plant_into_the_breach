import { HazardType, HazardTelegraph, Position, TerrainType, TileData, WorldType } from '../types';

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
    DESERT: 'RAIL_SLIDE', // Wild West: runaway carts drag whatever stands on the track.
    VOLCANO: 'LAVA_FLOW', // Jurassic: fissures open and turn tiles to lava.

    COAST: 'TIDE',        // Windward: the sea comes up over the shore, then goes back out.
    THORN: 'DUST_VEIL',   // Thornwaste: dust in the air, and nothing in it can aim.
    ICE: 'WIND_GUST',     // Frostbite Caves: gusts shove everything one tile.

    NEON: 'SPOTLIGHT',    // Neon Rose: the lights still work, and they are looking for you.
    RUIN: 'COLLAPSE',     // Old Quarter: the roof comes down, and stays down.
    GRID: 'SURGE',        // The Grid: the tile that pays you is the tile that bites you.
};

export const HAZARD_NAME: Record<HazardType, string> = {
    NONE: '',
    WIND_GUST: 'Wind Gust',
    LAVA_FLOW: 'Lava Flow',
    RAIL_SLIDE: 'Runaway Cart',
    COLLAPSE: 'Collapse',
    SPOTLIGHT: 'Searchlight',
    SURGE: 'Power Surge',
    TIDE: 'High Tide',
    DUST_VEIL: 'Dust Veil',
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

const IMPASSABLE: TerrainType[] = ['WATER', 'MOUNTAIN', 'WALL'];

/**
 * Would sealing these tiles leave a Greenspire no walker can reach?
 *
 * Only COLLAPSE needs this, and it needs it absolutely: every other hazard is temporary or
 * walkable, so the worst it can do is hurt. Rubble is permanent, and two pieces of it in the
 * wrong place turn a solvable board into one where the zombies mill about in a pocket and the
 * mission can no longer be lost OR won on its own terms.
 *
 * Same flood fill as `findUnreachableHouses` in utils/mapGenerator.ts, run against the board
 * as it WOULD be. Duplicated rather than shared because that one reports authoring mistakes
 * and this one vetoes a die roll — they answer to different callers and should be free to
 * drift apart.
 */
const wouldSeverBoard = (board: TileData[], sealed: Position[]): boolean => {
    const blocked = new Set(sealed.map(p => `${p.x},${p.y}`));
    const at = new Map(board.map(t => [`${t.x},${t.y}`, t]));
    const walkable = (t: TileData | undefined) =>
        !!t && !IMPASSABLE.includes(t.terrain) && !blocked.has(`${t.x},${t.y}`);

    const seen = new Set<string>();
    const queue: TileData[] = [];
    board.forEach(t => {
        if (t.isSpawnZone && walkable(t)) { seen.add(`${t.x},${t.y}`); queue.push(t); }
    });
    if (queue.length === 0) return true;

    while (queue.length > 0) {
        const cur = queue.shift()!;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            const key = `${cur.x + dx},${cur.y + dy}`;
            if (seen.has(key)) return;
            const next = at.get(key);
            if (!next) return;
            // A Greenspire is the goal, so reaching its tile counts even though the walk stops there.
            if (!next.isHouse && !walkable(next)) return;
            seen.add(key);
            if (!next.isHouse) queue.push(next);
        });
    }

    return board.some(t => t.isHouse && t.hasBrain && !seen.has(`${t.x},${t.y}`));
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
            // Blows along the battle axis. Toward the Greenspires is the cruel direction, so it
            // alternates — the player has to read which way before committing a position.
            const towardHouses = Math.random() < 0.5;
            const dy = towardHouses ? -1 : 1;
            return {
                type,
                dx: 0,
                dy,
                tiles: board.filter(t => !t.isHouse).map(t => ({ x: t.x, y: t.y })),
                description: towardHouses
                    ? 'Wind Gust: everything is blown one tile toward the Greenspires.'
                    : 'Wind Gust: everything is blown one tile away from the Greenspires.',
            };
        }

        case 'LAVA_FLOW': {
            // Only ordinary ground cracks — never a Greenspire, never an existing hazard tile.
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

        case 'SPOTLIGHT': {
            /**
             * A whole ROW or COLUMN, not a scatter. A searchlight sweeps, and the shape is the
             * warning: the player is not asked "is my hero on one of three unlucky squares" but
             * "is my line lying along the beam" — which is a question about formation, the one
             * this sector spends its whole act asking.
             *
             * No damage and no terrain change. Everything caught is PROVOKED toward the light
             * next turn, so the crowd redirects onto whoever failed to step out. That is why it
             * had to wait for PROVOKE rather than being faked with damage: the hazard's whole
             * payload is ATTENTION, and attention already has a status.
             */
            const vertical = Math.random() < 0.5;
            const lane = Math.floor(Math.random() * 8);
            const tiles = board
                .filter(t => (vertical ? t.y === lane : t.x === lane) && !t.isHouse)
                .map(t => ({ x: t.x, y: t.y }));
            if (tiles.length === 0) return null;
            return {
                type,
                tiles,
                description: 'Searchlight: whatever it catches, the horde comes for next turn.',
            };
        }

        case 'SURGE': {
            /**
             * Every live tile at once, and one tile out from each.
             *
             * Not a chosen set of squares like the other hazards: the player already knows
             * exactly where these are, because they are the bright ones they have been standing
             * on for the +1 damage. That is the entire joke of the sector — the reward tile and
             * the hazard tile are the same square, and the telegraph for it has been on the
             * board since the map loaded.
             *
             * Returns null with no grid at all, so a GRID board with no power tiles simply has
             * no weather rather than a hazard that fires into nothing.
             */
            const live = board.filter(t => t.environment === 'POWER_TILE');
            if (live.length === 0) return null;
            const seen = new Set<string>();
            const tiles: Position[] = [];
            live.forEach(t => {
                [{ x: t.x, y: t.y },
                 { x: t.x + 1, y: t.y }, { x: t.x - 1, y: t.y },
                 { x: t.x, y: t.y + 1 }, { x: t.x, y: t.y - 1 }].forEach(p => {
                    if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return;
                    const key = `${p.x},${p.y}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    tiles.push(p);
                });
            });
            return {
                type,
                tiles,
                description: 'Power Surge: every live tile discharges, and the arc reaches one further.',
            };
        }

        case 'TIDE': {
            /**
             * THE SHORE, not a scatter of squares.
             *
             * Every candidate is a walkable tile that already TOUCHES water, which makes the
             * hazard readable before it is ever telegraphed: the player can see which band of
             * the board the sea can reach on turn one, and position against it for the whole
             * fight. A random three tiles would have been the same code and none of the
             * lesson — the sector's question is "how far from the water do I dare stand",
             * and a hazard that can strike inland is not asking it.
             *
             * Returns null on a board with no sea at all, so a COAST map authored dry simply
             * has no weather rather than a tide arriving from nowhere.
             */
            const water = new Set(
                board.filter(t => t.terrain === 'WATER').map(t => `${t.x},${t.y}`));
            if (water.size === 0) return null;
            const shore = board.filter(t =>
                !t.isHouse
                && t.terrain !== 'WATER'
                && t.terrain !== 'WALL'
                && t.terrain !== 'MOUNTAIN'
                && [[1, 0], [-1, 0], [0, 1], [0, -1]]
                    .some(([dx, dy]) => water.has(`${t.x + dx},${t.y + dy}`)));
            const tiles = pickN(shore, 3).map(t => ({ x: t.x, y: t.y }));
            if (tiles.length === 0) return null;
            return {
                type,
                tiles,
                description: 'High Tide: the sea comes over these tiles. Anything that cannot swim drowns.',
            };
        }

        case 'DUST_VEIL': {
            /**
             * A PATCH, not three separate squares: a seed tile plus its four neighbours, so
             * the dust arrives as one object the player can plan a line of sight around.
             * Scattered tiles would read as noise, and the whole value of this hazard is that
             * it is a shape you can push a boss into.
             *
             * Greenspires are excluded from the seed only. A veil that laps onto a doorstep is
             * fine and often the point — it is the one hazard a defender WANTS on their own
             * ground, because a zombie standing on the step cannot take the sprout either.
             */
            const seeds = board.filter(t =>
                !t.isHouse && t.terrain !== 'WALL' && t.terrain !== 'MOUNTAIN');
            const seed = pickN(seeds, 1)[0];
            if (!seed) return null;
            const tiles = [{ x: seed.x, y: seed.y },
                           { x: seed.x + 1, y: seed.y }, { x: seed.x - 1, y: seed.y },
                           { x: seed.x, y: seed.y + 1 }, { x: seed.x, y: seed.y - 1 }]
                .filter(p => board.some(t => t.x === p.x && t.y === p.y));
            return {
                type,
                tiles,
                description: 'Dust Veil: nothing that ends its turn in the dust can attack.',
            };
        }

        case 'COLLAPSE': {
            /**
             * Not on a board with no Greenspires.
             *
             * `wouldSeverBoard` below is the only thing standing between this hazard and an
             * unwinnable position, and its whole test is "can a walker still reach a Greenspire" —
             * on a Greenspire-less board that question is vacuously true and the veto silently
             * stops working. The one such board is the Breach arena, whose plan gives it no
             * weather anyway (PLAN-boards-bosses.md section 1), so refusing here satisfies
             * the design and closes the hole in the same line.
             */
            if (!board.some(t => t.isHouse)) return null;

            // Two tiles, not three. LAVA_FLOW takes three because lava is walkable — it prices
            // a tile, it does not delete it. Rubble is a wall, and three walls a turn closes a
            // board faster than seven turns can absorb.
            //
            // Greenspires and existing walls are excluded for the obvious reason; so is any tile
            // that is the ONLY link between two halves of the board, because a hazard that can
            // seal the last corridor can author an unwinnable position on its own. That check
            // lives in `wouldSeverBoard` below and is the reason this case is longer than the
            // others.
            // Rubble belongs where the fight is. Any walkable tile qualified at first, and a
            // sampled run put a fair share of it in the back rows behind the line — legal,
            // harmless, and dull: a hazard nobody has to answer is set dressing. The contested
            // band is everything that is not a deploy tile and not on a doorstep, and the
            // wider pool is kept only as a fallback for boards too cramped to offer one.
            const standable = board.filter(t =>
                !t.isHouse
                && t.terrain !== 'WALL'
                && t.terrain !== 'WATER'
                && t.terrain !== 'MOUNTAIN');
            const onDoorstep = (t: TileData) => board.some(h =>
                h.isHouse && Math.abs(h.x - t.x) + Math.abs(h.y - t.y) <= 1);
            const contested = standable.filter(t => !t.isDeployZone && !onDoorstep(t));
            const candidates = contested.length >= 4 ? contested : standable;
            const tiles: Position[] = [];
            for (const t of pickN(candidates, 6)) {
                if (tiles.length >= 2) break;
                if (wouldSeverBoard(board, [...tiles, { x: t.x, y: t.y }])) continue;
                tiles.push({ x: t.x, y: t.y });
            }
            if (tiles.length === 0) return null;
            return {
                type,
                tiles,
                description: 'Collapse: these tiles are crushed, then blocked for good.',
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
                description: 'Runaway Cart: anything on the track is dragged one tile toward the Greenspires.',
            };
        }

        default:
            return null;
    }
};

export const hazardTargets = (hazard: HazardTelegraph | null): Position[] =>
    hazard ? hazard.tiles : [];
