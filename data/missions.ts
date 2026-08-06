import {
    BossId, MaterialId, Mission, MissionBonus, ObjectiveType, Position, TerrainType, TileData, Unit,
    MapNode, UnitClass, UnitType,
} from '../types';
import { MATERIAL_DEFINITIONS } from './materials';
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
    { type: 'NO_BRAIN_LOST', description: 'Finish without losing a sprout', coins: COIN_NO_BRAIN_LOST },
    { type: 'NO_HERO_DOWN', description: 'Finish with every hero standing', coins: 25 },
    { type: 'KILL_COUNT', description: 'Destroy 6 zombies', coins: 25, count: 6 },
];

/** Ground a squad can be asked to stand on for several turns. */
const HOLDABLE_TERRAIN: TerrainType[] = ['GRASS', 'CONCRETE', 'SAND', 'ICE', 'BRIDGE', 'RAIL'];

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
    if (nodeType === 'BOSS') return ['SLAY_BOSS'];
    if (nodeType === 'ELITE') return ['PROTECT_HOUSE', 'KILL_ALL', 'HOLD_TILE', 'ESCORT_GEAR'];
    return ['SURVIVE_TURNS', 'PROTECT_HOUSE', 'KILL_ALL', 'BLOCK_SPAWNS', 'HOLD_TILE', 'ESCORT_GEAR'];
};

/**
 * @param enemies The wave this battle opens with. Only SLAY_BOSS reads it, and it has to:
 *                the objective is unwinnable if no boss was placed, and — worse — a check for
 *                "no boss alive" would be satisfied on turn one and hand out an instant win.
 *                An encounter with no boss in it simply cannot be given this objective.
 */
export const buildMission = (
    nodeType: MapNode['type'],
    board: TileData[],
    isFirstLevel = false,
    enemies: Unit[] = [],
): Mission => {
    // The opening level always teaches the base rule before layering anything on top.
    const available = objectivesFor(nodeType)
        .filter(o => o !== 'SLAY_BOSS' || enemies.some(e => e.bossId));
    const objective: ObjectiveType = isFirstLevel || available.length === 0
        ? 'SURVIVE_TURNS'
        : pickOne(available);

    const Greenspires = board.filter(t => t.isHouse && t.hasBrain);
    const spawns = board.filter(t => t.isSpawnZone);
    // Somewhere in the middle of the board — a tile worth fighting over, not a safe corner.
    //
    // "Somewhere standable", not "grass". The GRASS test was written when every board was a
    // lawn, and it silently deletes this objective on any sector paved with something else:
    // the city boards are CONCRETE, Frostgate is ICE, and on those the filter comes back empty
    // and buildMission drops through to SURVIVE_TURNS without saying so. A tile you can stand
    // and fight on is the actual requirement — LAVA is the one walkable exception, because
    // "hold this tile" should not mean "stand in fire for four turns".
    const contested = board.filter(t =>
        !t.isHouse && !t.isDeployZone && !t.isSpawnZone
        && t.y >= 2 && t.y <= 4
        && HOLDABLE_TERRAIN.includes(t.terrain));

    const base = {
        bonuses: pickN(BONUS_POOL, 2),
        zombiesKilled: 0,
        failed: false,
    };

    switch (objective) {
        case 'PROTECT_HOUSE': {
            const Greenspire = Greenspires.length ? pickOne(Greenspires) : null;
            if (!Greenspire) break;
            return {
                ...base,
                objective,
                target: { x: Greenspire.x, y: Greenspire.y },
                description: 'Protect the marked Greenspire — losing its sprout ends the mission.',
            };
        }
        case 'KILL_ALL':
            return { ...base, objective, description: 'Destroy every zombie on the board.' };

        case 'ESCORT_GEAR': {
            /**
             * The crate goes on contested ground — the same pool HOLD_TILE draws from, and for
             * the same reason. Dropped in a safe corner it would be a free objective; dropped
             * on a doorstep it would be indistinguishable from PROTECT_HOUSE. In the middle it
             * is a second front, which is the fight this objective exists to create.
             */
            const tile = contested.length ? pickOne(contested) : null;
            if (!tile) break;
            const cargo = pickOne(Object.keys(MATERIAL_DEFINITIONS) as MaterialId[]);
            return {
                ...base,
                objective,
                target: { x: tile.x, y: tile.y },
                gearMaterial: cargo,
                description: 'Keep the gear crate standing — the horde is coming for it too.',
            };
        }

        case 'SLAY_BOSS': {
            const boss = enemies.find(e => e.bossId);
            if (!boss) break;
            return {
                ...base, objective, bossId: boss.bossId,
                description: 'Bring it down. No Greenspires to hold and no clock — this one ends when one side stops standing.',
            };
        }

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
        const Greenspire = board.find(t => t.x === mission.target!.x && t.y === mission.target!.y);
        return !!Greenspire && !Greenspire.hasBrain;
    }
    return false;
};

/**
 * Can the level end right now in success, before the timer?
 *
 * Two objectives qualify, and both for the same reason: they name a state the player can
 * actually reach and see. Everything else is measured when the clock stops.
 */
export const isMissionCompleteEarly = (mission: Mission | null, units: Unit[]): boolean => {
    if (!mission) return false;
    if (mission.objective === 'KILL_ALL') return !units.some(u => u.isEnemy && u.hp > 0);
    // Asked against the mission's OWN record of which boss this is, not against a headcount.
    //
    // The first version counted live bosses and required at least one to exist, so that a wave
    // with no boss could not read as "already won". It could not work: the engine hands this
    // function `remainingUnits`, corpses already filtered out, so the moment the boss died the
    // count hit zero and the guard turned a victory into "nothing happened" — and, at the
    // timer, into a defeat for a fight the player had won. `mission.bossId` is the memory that
    // makes the two states distinguishable, and buildMission refuses the objective without it.
    if (mission.objective === 'SLAY_BOSS') {
        if (!mission.bossId) return false;
        return !units.some(u => u.isEnemy && u.hp > 0 && u.bossId === mission.bossId);
    }
    return false;
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
        case 'ESCORT_GEAR':
            // Asked of the unit list, not of the board: the crate is a body, and a body that
            // is gone is simply not in it. Nothing has to remember where it stood.
            return units.some(u => !u.isEnemy && u.hp > 0 && u.class === UnitClass.GEAR_CRATE);
        case 'SLAY_BOSS':
            // Same reading as isMissionCompleteEarly — see the note there on why this cannot
            // be a headcount.
            return !!mission.bossId
                && !units.some(u => u.isEnemy && u.hp > 0 && u.bossId === mission.bossId);
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
