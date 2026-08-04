import {
    Mission, MissionBonus, ObjectiveType, Position, TileData, Unit, MapNode, UnitType
} from '../types';
import { COIN_NO_BRAIN_LOST } from '../constants';

/**
 * Mission objectives (see types.ts for the reasoning).
 *
 * Every battle still runs for the same number of turns; the objective is an *extra* condition
 * layered on top of surviving. That keeps the pacing predictable while making each node ask a
 * different question — which was the real problem with the map, not its shape.
 *
 * KILL_ALL is the one exception: it can end early, because "the board is clear" is a state the
 * player can actually reach.
 */

const BONUS_POOL: MissionBonus[] = [
    { type: 'NO_BRAIN_LOST', description: 'Finish without losing a brain', coins: COIN_NO_BRAIN_LOST },
    { type: 'NO_HERO_DOWN', description: 'Finish with every hero standing', coins: 25 },
    { type: 'KILL_COUNT', description: 'Destroy 6 zombies', coins: 25, count: 6 },
];

const pickOne = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const pickN = <T,>(items: T[], n: number): T[] => {
    const pool = [...items];
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
        out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
};

/** Objectives available per node type. Boss fights stay simple — the boss is the complication. */
const objectivesFor = (nodeType: MapNode['type']): ObjectiveType[] => {
    if (nodeType === 'BOSS') return ['SURVIVE_TURNS'];
    if (nodeType === 'ELITE') return ['PROTECT_HOUSE', 'KILL_ALL', 'HOLD_TILE'];
    return ['SURVIVE_TURNS', 'PROTECT_HOUSE', 'KILL_ALL', 'BLOCK_SPAWNS', 'HOLD_TILE'];
};

export const buildMission = (nodeType: MapNode['type'], board: TileData[], isFirstLevel = false): Mission => {
    // The opening level always teaches the base rule before layering anything on top.
    const objective: ObjectiveType = isFirstLevel ? 'SURVIVE_TURNS' : pickOne(objectivesFor(nodeType));

    const houses = board.filter(t => t.isHouse && t.hasBrain);
    const spawns = board.filter(t => t.isSpawnZone);
    // Somewhere in the middle of the board — a tile worth fighting over, not a safe corner.
    const contested = board.filter(t => !t.isHouse && !t.isDeployZone && !t.isSpawnZone && t.terrain === 'GRASS');

    const base = {
        bonuses: pickN(BONUS_POOL, 2),
        zombiesKilled: 0,
        failed: false,
    };

    switch (objective) {
        case 'PROTECT_HOUSE': {
            const house = houses.length ? pickOne(houses) : null;
            if (!house) break;
            return {
                ...base,
                objective,
                target: { x: house.x, y: house.y },
                description: 'Protect the marked house — losing its brain ends the mission.',
            };
        }
        case 'KILL_ALL':
            return { ...base, objective, description: 'Destroy every zombie on the board.' };

        case 'BLOCK_SPAWNS': {
            const targets = pickN(spawns, 2).map(t => ({ x: t.x, y: t.y }));
            if (targets.length === 0) break;
            return {
                ...base,
                objective,
                targets,
                description: 'Stand on the marked spawn holes when the clock runs out.',
            };
        }
        case 'HOLD_TILE': {
            const tile = contested.length ? pickOne(contested) : null;
            if (!tile) break;
            return {
                ...base,
                objective,
                target: { x: tile.x, y: tile.y },
                description: 'Hold the marked tile when the clock runs out.',
            };
        }
        default:
            break;
    }

    // Fallback whenever the chosen objective had no valid target on this map.
    return { ...base, objective: 'SURVIVE_TURNS', description: 'Survive until the timer runs out.' };
};

const playerUnits = (units: Unit[]) =>
    units.filter(u => !u.isEnemy && u.type === UnitType.PLANT && u.position.x >= 0);

const someoneOn = (pos: Position, units: Unit[]) =>
    playerUnits(units).some(u => u.position.x === pos.x && u.position.y === pos.y);

/** Has the objective become impossible? Checked every turn, ends the level immediately. */
export const isMissionFailed = (mission: Mission | null, board: TileData[]): boolean => {
    if (!mission || mission.failed) return !!mission?.failed;
    if (mission.objective === 'PROTECT_HOUSE' && mission.target) {
        const house = board.find(t => t.x === mission.target!.x && t.y === mission.target!.y);
        return !!house && !house.hasBrain;
    }
    return false;
};

/** Can the level end right now in success, before the timer? Only KILL_ALL qualifies. */
export const isMissionCompleteEarly = (mission: Mission | null, units: Unit[]): boolean => {
    if (!mission || mission.objective !== 'KILL_ALL') return false;
    return !units.some(u => u.isEnemy && u.hp > 0);
};

/** Evaluated when the clock runs out: did the player also satisfy the objective? */
export const isMissionSatisfied = (mission: Mission | null, units: Unit[]): boolean => {
    if (!mission) return true;
    switch (mission.objective) {
        case 'BLOCK_SPAWNS':
            return (mission.targets || []).every(t => someoneOn(t, units));
        case 'HOLD_TILE':
            return !!mission.target && someoneOn(mission.target, units);
        case 'KILL_ALL':
            return !units.some(u => u.isEnemy && u.hp > 0);
        default:
            return true;
    }
};

/** Which bonuses were earned. Called once, when the level is being scored. */
export const earnedBonuses = (
    mission: Mission | null,
    brainsLost: number,
    heroesDown: number
): MissionBonus[] => {
    if (!mission) return [];
    return mission.bonuses.filter(b => {
        if (b.type === 'NO_BRAIN_LOST') return brainsLost === 0;
        if (b.type === 'NO_HERO_DOWN') return heroesDown === 0;
        if (b.type === 'KILL_COUNT') return mission.zombiesKilled >= (b.count || 0);
        return false;
    });
};

/** Tiles the objective wants highlighted on the board. */
export const missionMarkers = (mission: Mission | null): Position[] => {
    if (!mission) return [];
    if (mission.targets) return mission.targets;
    return mission.target ? [mission.target] : [];
};
