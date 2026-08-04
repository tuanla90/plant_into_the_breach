
import { Unit, Intent, Position, TileData, TerrainDefinition, UnitClass } from '../types';
import { findPath } from './gameLogic';

const manhattan = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Zombies want brains, not plants (DESIGN.md section 1). The goal is the nearest house that
 * still holds one; plants only matter when they stand in the way.
 */
const findGoal = (enemy: Unit, board: TileData[]): Position => {
    let goal: Position | null = null;
    let minDist = 999;

    for (const t of board) {
        if (!t.isHouse || !t.hasBrain) continue;
        const dist = manhattan(t, enemy.position);
        if (dist < minDist) {
            minDist = dist;
            goal = { x: t.x, y: t.y };
        }
    }

    // Every brain is gone. Head for the nearest house anyway (maps are hand-authored, so
    // houses are wherever the author put them), otherwise just keep walking left.
    if (goal) return goal;

    let fallback: Position | null = null;
    let fallbackDist = 999;
    for (const t of board) {
        if (!t.isHouse) continue;
        const dist = manhattan(t, enemy.position);
        if (dist < fallbackDist) {
            fallbackDist = dist;
            fallback = { x: t.x, y: t.y };
        }
    }
    return fallback || { x: enemy.position.x, y: 0 };
};

export const planEnemyIntent = (
    enemy: Unit,
    playerUnits: Unit[],
    board: TileData[] = [],
    terrainDefs: Record<string, TerrainDefinition> = {},
    collisionUnits: Unit[] = playerUnits
): Intent => {
    const goal = findGoal(enemy, board);
    // A Flag Zombie on the board hands every other zombie +1 damage (turnManager PHASE 1.5).
    const damage = enemy.damage + (enemy.statusEffects.includes('ENRAGED') ? 1 : 0);

    // Route with the board empty of units, and the route it can actually walk today.
    const idealRoute = board.length > 0 ? findPath(enemy, goal, [], board, terrainDefs) : [];
    const realRoute = board.length > 0 ? findPath(enemy, goal, collisionUnits, board, terrainDefs) : [];
    const distToGoal = manhattan(enemy.position, goal);

    /**
     * Priority ladder:
     *   1. brain within reach this turn  -> take it, ignore everything else
     *   2. a plant in the way            -> bite it
     *   3. otherwise                     -> walk to whatever tile gets closest to a brain
     *
     * The previous version weighed "is chewing faster than walking around?" and the answer was
     * almost always no: a 1-damage zombie needs eight bites to clear an 8 HP wall, so it always
     * walked round. Measured over six turns, six zombies were adjacent to a plant twice in the
     * entire fight — they simply strolled past the squad to the brains. Reaching a brain is the
     * only thing that beats eating what is in front of you.
     */
    // "In reach" means attack range — standing next to the house — not movement range.
    // Using movement range instead made rule 1 fire almost every turn on an open board (a
    // brain is nearly always within 3 steps), so nothing was ever bitten. Adjacency is the
    // reading that keeps rule 2 alive.
    const brainWithinReach = distToGoal <= 1;

    // Melee bites at 1. Catapult Zombie shells from 3 and never has to close.
    const reach = Math.max(1, enemy.attackRange ?? 1);

    let blocker: Unit | null = null;
    if (!brainWithinReach) {
        for (const p of playerUnits) {
            if (manhattan(p.position, enemy.position) > reach) continue;
            // A melee zombie must not turn around to eat something behind it — the bite has to
            // be on the way to a brain. A shooter has no such constraint: firing costs it no
            // ground, so anything inside its arc is fair game.
            //
            // `>=` and `>` are equivalent here and always will be: an adjacent tile's distance
            // to the goal differs from the zombie's by exactly one, never zero (one step of
            // Manhattan distance flips parity), so no adjacent plant is ever "level" with it.
            if (reach === 1 && manhattan(p.position, goal) >= distToGoal) continue;
            // Lowest HP first: chew through the wall it can actually break.
            if (!blocker || p.hp < blocker.hp) blocker = p;
        }
    }

    // --- GARGANTUAR SPECIAL AI ---
    if (enemy.class === UnitClass.GARGANTUAR) {
        // If something is in melee range, ALWAYS Smash
        if (blocker) {
            return { type: 'ATTACK', target: blocker.position, damage };
        }

        // Otherwise try to throw an Imp behind the lines, next to the closest plant
        let closest: Unit | null = null;
        let minDist = 999;
        for (const p of playerUnits) {
            const dist = manhattan(p.position, enemy.position);
            if (dist < minDist) {
                minDist = dist;
                closest = p;
            }
        }

        if (closest) {
            const neighbors = [
                { x: closest.position.x + 1, y: closest.position.y },
                { x: closest.position.x - 1, y: closest.position.y },
                { x: closest.position.x, y: closest.position.y + 1 },
                { x: closest.position.x, y: closest.position.y - 1 }
            ];

            // Find an empty spot (loose check, turnManager does the strict one)
            let landingSpot: Position | null = null;
            for (const n of neighbors) {
                if (n.x < 0 || n.x >= 8 || n.y < 0 || n.y >= 8) continue;
                const tile = board.find(t => t.x === n.x && t.y === n.y);
                if (tile?.isHouse) continue;
                const isOccupied = playerUnits.some(u => u.position.x === n.x && u.position.y === n.y);
                if (!isOccupied) {
                    landingSpot = n;
                    break;
                }
            }

            // Was `Math.random() < 0.3 || minDist > 4`. The coin flip made the same board
            // play differently on every attempt, which a scripted tutorial cannot tolerate —
            // and outside the tutorial it only ever produced "why did it do that this time?".
            // Distance alone is both deterministic and better reasoning: throw when too far
            // to swing, walk in and swing when close.
            const shouldThrow = minDist > 4;
            if (shouldThrow && landingSpot) {
                return { type: 'SPAWN', target: landingSpot, description: 'Throwing Imp!' };
            }
        }
    }

    // --- STANDARD AI ---

    // Something is blocking the way to the brain: eat it first.
    // This runs AFTER movement, so a zombie that walked up to a plant telegraphs the hit here.
    if (blocker) {
        return { type: 'ATTACK', target: blocker.position, damage };
    }

    // Otherwise walk. moveTo / movePath drive the movement telegraph, so they must always be set.
    const route = findPath(enemy, goal, collisionUnits, board, terrainDefs);
    let walk = (route.length > 0 ? route : idealRoute).slice(0, Math.max(1, enemy.moveRange));

    if (walk.length === 0) {
        // Walled in, or called without board data: still telegraph a straight march at the brain.
        const straight: Position[] = [];
        let cur = enemy.position;
        for (let i = 0; i < Math.max(1, enemy.moveRange); i++) {
            if (cur.y > goal.y) cur = { x: cur.x, y: cur.y - 1 };
            else if (cur.y < goal.y) cur = { x: cur.x, y: cur.y + 1 };
            else if (cur.x > goal.x) cur = { x: cur.x - 1, y: cur.y };
            else if (cur.x < goal.x) cur = { x: cur.x + 1, y: cur.y };
            else break;
            straight.push(cur);
        }
        walk = straight;
    }

    if (walk.length === 0) {
        return { type: 'MOVE', description: 'Blocked...' };
    }

    return {
        type: 'MOVE',
        description: 'Smells brains...',
        moveTo: walk[walk.length - 1],
        movePath: walk
    };
};
